import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  GENRE_CATEGORIES,
  getGamesByGenreSlug,
  isKnownGenreSlug,
} from "../../../lib/catalog";
import { buildItemListJsonLd, SITE_URL } from "../../../lib/seo";
import { GameCard } from "../../../components/game-card";

export const revalidate = 86400;
export const dynamicParams = false;

export async function generateStaticParams() {
  return GENRE_CATEGORIES.map((g) => ({ genre: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ genre: string }>;
}): Promise<Metadata> {
  const { genre } = await params;
  const normalized = genre.toLowerCase();
  const cat = GENRE_CATEGORIES.find((c) => c.slug === normalized);

  if (!cat) {
    return {
      title: "Genre Not Found",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${cat.name} Early Access Games on Steam — Active vs. Abandoned`,
    description: cat.description,
    alternates: {
      canonical: `${SITE_URL}/genre/${cat.slug}`,
    },
  };
}

export default async function GenreDirectoryPage({
  params,
}: {
  params: Promise<{ genre: string }>;
}) {
  const { genre } = await params;
  const normalized = genre.toLowerCase();

  if (!isKnownGenreSlug(normalized)) {
    notFound();
  }

  const cat = GENRE_CATEGORIES.find((c) => c.slug === normalized)!;
  const games = getGamesByGenreSlug(cat.slug);

  const schema = buildItemListJsonLd({
    title: `${cat.name} Steam Early Access Games`,
    description: `Update status and abandonment audit for ${cat.name} Early Access games.`,
    url: `${SITE_URL}/genre/${cat.slug}`,
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
          {cat.name} Early Access Games on Steam
        </h1>
        <p className="max-w-3xl text-sm sm:text-base text-slate-300">
          {cat.description}
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2 text-xs">
        {GENRE_CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/genre/${c.slug}`}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              c.slug === cat.slug
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
          No tracked games matched genre &ldquo;{cat.name}&rdquo;.
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
