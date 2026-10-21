import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getGamesByGenreSlug,
  isGenreIndexable,
  isKnownGenreSlug,
} from "../../../lib/catalog";
import { loadCatalog } from "../../../lib/repository";
import { buildItemListJsonLd, SITE_URL } from "../../../lib/seo";
import { GameCard } from "../../../components/game-card";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  const catalog = await loadCatalog();
  return catalog.genres.map((g) => ({ genre: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ genre: string }>;
}): Promise<Metadata> {
  const { genre } = await params;
  const normalized = genre.toLowerCase();
  const catalog = await loadCatalog();
  const cat = catalog.genres.find((c) => c.slug === normalized);

  if (!cat) {
    return {
      title: "Genre Not Found",
      robots: { index: false, follow: false },
    };
  }

  const indexable = isGenreIndexable(cat.gameCount);

  return {
    title: `${cat.name} Early Access Games on Steam — Active vs. Abandoned`,
    description: cat.description,
    alternates: {
      canonical: `${SITE_URL}/genre/${cat.slug}`,
    },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default async function GenreDirectoryPage({
  params,
}: {
  params: Promise<{ genre: string }>;
}) {
  const { genre } = await params;
  const normalized = genre.toLowerCase();
  const catalog = await loadCatalog();

  if (!catalog.genres.some((c) => c.slug === normalized) && !isKnownGenreSlug(normalized)) {
    notFound();
  }

  const cat =
    catalog.genres.find((c) => c.slug === normalized) ??
    ({
      slug: normalized,
      name: normalized,
      description: "",
      gameCount: 0,
    } as const);

  if (!cat.description && !isKnownGenreSlug(normalized)) {
    notFound();
  }

  const games = getGamesByGenreSlug(cat.slug, catalog.games);
  const resolved = catalog.genres.find((c) => c.slug === normalized) ?? {
    ...cat,
    gameCount: games.length,
    description:
      cat.description ||
      `${cat.name} Steam Early Access games tracked for update cadence.`,
    name: cat.name.replace(/(^|\s)\S/g, (t) => t.toUpperCase()),
  };

  const schema = buildItemListJsonLd({
    title: `${resolved.name} Steam Early Access Games`,
    description: `Update status and abandonment audit for ${resolved.name} Early Access games.`,
    url: `${SITE_URL}/genre/${resolved.slug}`,
    games,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2">
          Genre Audit Directory
        </p>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-50 mb-3">
          {resolved.name} Early Access Games on Steam
        </h1>
        <p className="mb-2 font-mono text-xs text-emerald-400/90">
          {games.length} tracked game{games.length === 1 ? "" : "s"}
          {!isGenreIndexable(games.length) ? " · noindex (under 20 games)" : ""}
        </p>
        <p className="max-w-3xl text-sm sm:text-base text-slate-300">
          {resolved.description}
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2 text-xs">
        {catalog.genres.slice(0, 40).map((c) => (
          <Link
            key={c.slug}
            href={`/genre/${c.slug}`}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              c.slug === resolved.slug
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {games.length === 0 ? (
        <p className="text-sm text-slate-400">
          No tracked games matched genre &ldquo;{resolved.name}&rdquo;.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {games.map((game) => (
            <GameCard key={game.appid} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
