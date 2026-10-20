import type { Metadata } from "next";
import Link from "next/link";
import { GENRE_CATEGORIES, getGamesByGenreSlug } from "../../../lib/catalog";
import { buildItemListJsonLd, SITE_URL } from "../../../lib/seo";
import { GameCard } from "../../../components/game-card";

export const revalidate = 86400;

export async function generateStaticParams() {
  return GENRE_CATEGORIES.map((g) => ({ genre: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ genre: string }>;
}): Promise<Metadata> {
  const { genre } = await params;
  const cat = GENRE_CATEGORIES.find((c) => c.slug === genre.toLowerCase());
  const titleName = cat ? cat.name : genre.charAt(0).toUpperCase() + genre.slice(1);

  return {
    title: `${titleName} Early Access Games on Steam — Active vs. Abandoned`,
    description:
      cat?.description ??
      `Track update frequency, patch history, and abandonment status for ${titleName} Early Access games on Steam.`,
    alternates: {
      canonical: `${SITE_URL}/genre/${genre.toLowerCase()}`,
    },
  };
}

export default async function GenreDirectoryPage({
  params,
}: {
  params: Promise<{ genre: string }>;
}) {
  const { genre } = await params;
  const cat = GENRE_CATEGORIES.find((c) => c.slug === genre.toLowerCase());
  const titleName = cat ? cat.name : genre.charAt(0).toUpperCase() + genre.slice(1);
  const games = getGamesByGenreSlug(genre);

  const schema = buildItemListJsonLd({
    title: `${titleName} Steam Early Access Games`,
    description: `Update status and abandonment audit for ${titleName} Early Access games.`,
    url: `${SITE_URL}/genre/${genre.toLowerCase()}`,
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
          {titleName} Early Access Games on Steam
        </h1>
        <p className="max-w-3xl text-sm sm:text-base text-slate-300">
          {cat?.description ??
            `Comparing active, slowing, stalled, and abandoned ${titleName} games in Steam Early Access.`}
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2 text-xs">
        {GENRE_CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/genre/${c.slug}`}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              c.slug === genre.toLowerCase()
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
          No tracked games matched genre tag &ldquo;{genre}&rdquo;.
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
