import type { Metadata } from "next";
import Link from "next/link";
import { GENRE_CATEGORIES, GLOBAL_CATALOG_STATS, getAllGames } from "../../lib/catalog";
import { buildItemListJsonLd, SITE_URL } from "../../lib/seo";
import { GameCard } from "../../components/game-card";
import { formatUtcMonthYear } from "../../lib/status-engine";

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const monthYear = formatUtcMonthYear(new Date("2026-10-19T00:00:00Z"));
  const title = `${GLOBAL_CATALOG_STATS.abandonedCount.toLocaleString()} Abandoned Early Access Games on Steam (${monthYear})`;
  const description = `Verified directory of ${GLOBAL_CATALOG_STATS.abandonedCount.toLocaleString()} Steam Early Access games with no patch notes, developer announcements, or public branch build updates in over 12 months.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/abandoned-early-access-games`,
    },
  };
}

export default async function AbandonedEarlyAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; maxPrice?: string }>;
}) {
  const params = await searchParams;
  const genreFilter = params.genre?.toLowerCase() || "";
  const maxPriceFilter = params.maxPrice ? Number.parseInt(params.maxPrice, 10) : null;

  const allAbandonedOrStalled = getAllGames().filter(
    (g) => g.status === "likely_abandoned" || g.status === "stalled"
  );

  const filtered = allAbandonedOrStalled.filter((g) => {
    if (genreFilter && !g.tags.includes(genreFilter)) return false;
    if (maxPriceFilter !== null && (g.priceCents ?? 0) > maxPriceFilter) return false;
    return true;
  });

  const monthYear = formatUtcMonthYear(new Date("2026-10-19T00:00:00Z"));
  const listTitle = `${GLOBAL_CATALOG_STATS.abandonedCount.toLocaleString()} Abandoned Early Access Games on Steam (${monthYear})`;

  const itemListSchema = buildItemListJsonLd({
    title: listTitle,
    description:
      "Steam Early Access games with prolonged developer silence or over 365 days without a shipped patch.",
    url: `${SITE_URL}/abandoned-early-access-games`,
    games: filtered,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-wider text-rose-400 mb-2">
          Programmatic Abandonment Index · Updated Daily
        </p>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-50 mb-3">
          {listTitle}
        </h1>
        <p className="max-w-3xl text-sm sm:text-base text-slate-300 leading-relaxed">
          Based on our automated audit of {GLOBAL_CATALOG_STATS.totalTracked.toLocaleString()} Steam Early Access titles,{" "}
          <strong>{GLOBAL_CATALOG_STATS.abandonedCount.toLocaleString()} games</strong> have gone more than 365 days without a patch note, developer announcement, or public depot build update, and another{" "}
          <strong>{GLOBAL_CATALOG_STATS.stalledCount.toLocaleString()} games</strong> are currently classified as Stalled (6–12 months inactive).
        </p>
      </div>

      {/* Genre & Price Filter Bar (Spec Section 7) */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-medium mr-1">Filter by Genre:</span>
          <Link
            href="/abandoned-early-access-games"
            className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
              !genreFilter
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            All Genres
          </Link>
          {GENRE_CATEGORIES.map((g) => (
            <Link
              key={g.slug}
              href={`/abandoned-early-access-games?genre=${g.slug}`}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                genreFilter === g.slug
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {g.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Price:</span>
          <Link
            href="/abandoned-early-access-games?maxPrice=2000"
            className={`rounded-lg px-2.5 py-1 ${
              maxPriceFilter === 2000
                ? "bg-emerald-500 text-slate-950 font-medium"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Under $20
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((game) => (
          <GameCard key={game.appid} game={game} />
        ))}
      </div>
    </div>
  );
}
