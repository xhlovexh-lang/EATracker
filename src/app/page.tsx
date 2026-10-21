import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import {
  GENRE_CATEGORIES,
  GLOBAL_CATALOG_STATS,
  getAllGames,
} from "../lib/catalog";
import { formatUtcDate } from "../lib/status-engine";
import { GameSearchAutocomplete } from "../components/game-search";
import { GameCard } from "../components/game-card";
import { SITE_URL } from "../lib/seo";

export const revalidate = 86400; // ISR 1 day per Spec Section 7

export default function HomePage() {
  const games = getAllGames();
  const searchItems = games.map((g) => ({
    appid: g.appid,
    name: g.name,
    slug: g.slug,
    status: g.status,
    activityScore: g.activityScore,
    lastUpdateLabel: formatUtcDate(g.lastActivityAt),
    headerImage: g.headerImage,
  }));

  const activeHighlights = games
    .filter((g) => g.status === "active")
    .sort((a, b) => b.activityScore - a.activityScore)
    .slice(0, 4);

  const stalledOrAbandonedHighlights = games
    .filter((g) => g.status === "likely_abandoned" || g.status === "stalled")
    .slice(0, 4);

  const graduatedHighlights = games
    .filter((g) => g.status === "left_early_access")
    .slice(0, 2);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "EA Tracker",
    url: SITE_URL,
    description:
      "We track every Steam Early Access game's updates, patch notes, and developer announcements daily.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/abandoned-early-access-games?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* Hero Section (Spec Section 4 & 7) */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-900/70 via-slate-950 to-slate-950 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-300 mb-6">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>
              {GLOBAL_CATALOG_STATS.totalTracked.toLocaleString()} Early Access games tracked ·{" "}
              {GLOBAL_CATALOG_STATS.overOneYearNoUpdate.toLocaleString()} with no update in 12+ months
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-50 mb-4">
            Is That Early Access Game Abandoned?
          </h1>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-300 mb-8">
            We track every Steam Early Access game&apos;s updates and developer posts, daily.
            Get an instant, evidence-backed verdict before you buy.
          </p>

          <div className="mx-auto max-w-2xl text-left">
            <GameSearchAutocomplete items={searchItems} />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
              <span>Popular checks:</span>
              {games.slice(0, 5).map((g) => (
                <Link
                  key={g.appid}
                  href={`/game/${g.slug}`}
                  className="rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors"
                >
                  {g.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Global Snapshot Strip */}
      <section className="border-b border-slate-800/80 bg-slate-900/30 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-4">
              <p className="text-xs text-slate-400">Total EA Tracked</p>
              <p className="mt-1 text-2xl font-bold font-mono text-slate-100">
                {GLOBAL_CATALOG_STATS.totalTracked.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">Genre ID 70 verified</p>
            </div>
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/15 p-4">
              <p className="text-xs text-emerald-300">Active (&le;90d)</p>
              <p className="mt-1 text-2xl font-bold font-mono text-emerald-400">
                {GLOBAL_CATALOG_STATS.activeCount.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">20.5% of catalog</p>
            </div>
            <div className="rounded-xl border border-amber-500/25 bg-amber-950/15 p-4">
              <p className="text-xs text-amber-300">Slowing (91–180d)</p>
              <p className="mt-1 text-2xl font-bold font-mono text-amber-400">
                {GLOBAL_CATALOG_STATS.slowingCount.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">8.5% of catalog</p>
            </div>
            <div className="rounded-xl border border-orange-500/25 bg-orange-950/15 p-4">
              <p className="text-xs text-orange-300">Stalled (6–12m)</p>
              <p className="mt-1 text-2xl font-bold font-mono text-orange-400">
                {GLOBAL_CATALOG_STATS.stalledCount.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">10.7% of catalog</p>
            </div>
            <div className="rounded-xl border border-rose-500/25 bg-rose-950/15 p-4">
              <p className="text-xs text-rose-300">Likely Abandoned (&gt;1y)</p>
              <p className="mt-1 text-2xl font-bold font-mono text-rose-400">
                {GLOBAL_CATALOG_STATS.abandonedCount.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">55.3% of catalog</p>
            </div>
            <div className="rounded-xl border border-sky-500/25 bg-sky-950/15 p-4">
              <p className="text-xs text-sky-300">Left EA (1.0)</p>
              <p className="mt-1 text-2xl font-bold font-mono text-sky-400">
                {GLOBAL_CATALOG_STATS.leftEaCount.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">Post-1.0 tracked</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Directory & List Entry Cards */}
      <div className="mx-auto max-w-6xl px-4 py-12 space-y-14">
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-100">
                Explore Early Access Directories & Rankings
              </h2>
              <p className="text-xs text-slate-400">
                Programmatic rankings updated daily from official Steam announcements and depot build logs
              </p>
            </div>
            <Link
              href="/methodology"
              className="text-xs font-medium text-emerald-400 hover:underline"
            >
              How status is calculated →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/abandoned-early-access-games"
              className="group rounded-xl border border-rose-500/30 bg-rose-950/10 p-5 hover:border-rose-500/60 transition-all"
            >
              <AlertTriangle className="h-6 w-6 text-rose-400 mb-3" />
              <h3 className="text-base font-bold text-slate-100 group-hover:text-rose-300">
                Abandoned Early Access Games
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Games with zero developer announcements, patch notes, or build updates for over 12 months.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-rose-300">
                Browse list <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            <Link
              href="/longest-early-access-games"
              className="group rounded-xl border border-amber-500/30 bg-amber-950/10 p-5 hover:border-amber-500/60 transition-all"
            >
              <Clock className="h-6 w-6 text-amber-400 mb-3" />
              <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-300">
                Longest in Early Access
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Ranked by total days spent in Steam Early Access—distinguishing active veterans from stalled projects.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
                View ranking <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            <Link
              href="/recently-updated-early-access-games"
              className="group rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-5 hover:border-emerald-500/60 transition-all"
            >
              <Sparkles className="h-6 w-6 text-emerald-400 mb-3" />
              <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-300">
                Recently Updated Games
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Early Access games shipping verified patches and community devlogs within the past 30–90 days.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
                See active games <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            <Link
              href="/left-early-access"
              className="group rounded-xl border border-sky-500/30 bg-sky-950/10 p-5 hover:border-sky-500/60 transition-all"
            >
              <ShieldCheck className="h-6 w-6 text-sky-400 mb-3" />
              <h3 className="text-base font-bold text-slate-100 group-hover:text-sky-300">
                Graduated to 1.0 Release
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Did the developer keep updating after 1.0, or slap a 1.0 label on an unfinished product?
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-sky-300">
                Audit 1.0 releases <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </section>

        {/* Stalled & Abandoned Spotlight */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Stalled & Likely Abandoned Watchlist
              </h2>
              <p className="text-xs text-slate-400">
                Games with prolonged silence on Steam or announcements without shipped builds for 12+ months
              </p>
            </div>
            <Link
              href="/abandoned-early-access-games"
              className="text-xs font-semibold text-rose-400 hover:underline"
            >
              View all abandoned games →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {stalledOrAbandonedHighlights.map((game) => (
              <GameCard key={game.appid} game={game} />
            ))}
          </div>
        </section>

        {/* Highly Active Early Access Games */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Most Active Early Access Games
              </h2>
              <p className="text-xs text-slate-400">
                Consistent patch cadence, high Activity Score, and recent depot build updates
              </p>
            </div>
            <Link
              href="/recently-updated-early-access-games"
              className="text-xs font-semibold text-emerald-400 hover:underline"
            >
              View all recently updated →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {activeHighlights.map((game) => (
              <GameCard key={game.appid} game={game} />
            ))}
          </div>
        </section>

        {/* Graduated 1.0 Audit */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Recently Left Early Access (Post-1.0 Update Audit)
              </h2>
              <p className="text-xs text-slate-400">
                Tracking whether games continue receiving patches after removing the Early Access tag
              </p>
            </div>
            <Link
              href="/left-early-access"
              className="text-xs font-semibold text-sky-400 hover:underline"
            >
              View all 1.0 graduations →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {graduatedHighlights.map((game) => (
              <GameCard key={game.appid} game={game} />
            ))}
          </div>
        </section>

        {/* Browse by Genre */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-100">
              Browse Early Access Status by Genre
            </h2>
            <Link
              href="/stats"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-emerald-400"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Annual Early Access Report
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GENRE_CATEGORIES.map((genre) => (
              <Link
                key={genre.slug}
                href={`/genre/${genre.slug}`}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-emerald-500/40 hover:bg-slate-900 transition-colors"
              >
                <p className="font-semibold text-slate-100 text-sm">
                  {genre.name}
                </p>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                  {genre.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
