import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  GENRE_CATEGORIES,
  getGamesByGenreSlug,
  isKnownGenreSlug,
} from "../../../lib/catalog";
import { buildGenrePageStats } from "../../../lib/genre-stats";
import { buildItemListJsonLd, SITE_URL } from "../../../lib/seo";
import { GameCard } from "../../../components/game-card";
import { StatusBadge } from "../../../components/status-badge";
import { STATUS_META } from "../../../config/status";

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

  const games = getGamesByGenreSlug(cat.slug);
  const stats = buildGenrePageStats(games, cat.name);

  return {
    title: `${cat.name} Early Access Games on Steam — Active vs. Abandoned`,
    description: cat.description,
    alternates: {
      canonical: `${SITE_URL}/genre/${cat.slug}`,
    },
    robots: stats.indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

function HighlightList({
  title,
  empty,
  games,
}: {
  title: string;
  empty: string;
  games: ReturnType<typeof buildGenrePageStats>["recentlyUpdated"];
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-3">
        {title}
      </h2>
      {games.length === 0 ? (
        <p className="text-sm text-slate-400">{empty}</p>
      ) : (
        <ol className="space-y-3">
          {games.map((game, idx) => (
            <li key={game.appid} className="flex items-start gap-3 text-sm">
              <span className="font-mono text-xs text-slate-500 w-4 shrink-0 pt-0.5">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/game/${game.slug}`}
                  className="font-medium text-slate-100 hover:text-emerald-400 transition-colors"
                >
                  {game.name}
                </Link>
                <p className="mt-0.5 text-xs text-slate-400">
                  Last activity {game.lastActivityLabel}
                  {game.daysSinceActivity !== null
                    ? ` · ${game.daysSinceActivity.toLocaleString()}d ago`
                    : ""}
                </p>
              </div>
              <StatusBadge status={game.status} size="sm" />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
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
  const stats = buildGenrePageStats(games, cat.name);

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
        <p className="mb-3 font-mono text-xs text-emerald-400/90">
          {stats.total.toLocaleString()} tracked game
          {stats.total === 1 ? "" : "s"}
          {stats.medianEaDurationDays !== null
            ? ` · median EA ${stats.medianEaDurationLabel}`
            : ""}
        </p>
        <p className="max-w-3xl text-sm sm:text-base text-slate-300 mb-4">
          {cat.description}
        </p>
        <p className="max-w-3xl text-sm sm:text-base text-slate-300 leading-relaxed">
          {stats.summary}
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

      {stats.total > 0 && (
        <>
          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-100 mb-3">
              Status breakdown
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Games</th>
                    <th className="py-3 px-4">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {stats.statusCounts.map((row) => {
                    const meta = STATUS_META[row.status];
                    return (
                      <tr key={row.status} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${meta.dotColor}`}
                            />
                            <span className="font-medium text-slate-100">
                              {meta.label}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-200">
                          {row.count.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {row.sharePercent}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Median Early Access duration:{" "}
              <span className="font-medium text-slate-200">
                {stats.medianEaDurationLabel}
              </span>
              {stats.medianEaDurationDays !== null
                ? ` (${stats.medianEaDurationDays.toLocaleString()} days)`
                : ""}
              .
            </p>
          </section>

          <div className="mb-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <HighlightList
              title="Most recently updated"
              empty="No recent Steam activity timestamps in this genre."
              games={stats.recentlyUpdated}
            />
            <HighlightList
              title="Longest gap since an update"
              empty="No games available to rank by update gap."
              games={stats.longestGap}
            />
          </div>
        </>
      )}

      <h2 className="text-lg font-bold text-slate-100 mb-4">
        All {cat.name} games
      </h2>

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
