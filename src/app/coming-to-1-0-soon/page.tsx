import type { Metadata } from "next";
import { loadCatalog } from "../../lib/repository";
import { buildItemListJsonLd, SITE_URL } from "../../lib/seo";
import { GameCard } from "../../components/game-card";
import { formatUtcDate } from "../../lib/status-engine";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Coming to 1.0 Soon — Planned Early Access Graduations",
  description:
    "Steam Early Access games whose store pages mention a planned 1.0 date or Early Access duration, sorted by soonest stated timing.",
  alternates: {
    canonical: `${SITE_URL}/coming-to-1-0-soon`,
  },
};

export default async function ComingTo10SoonPage() {
  const catalog = await loadCatalog();
  const now = Date.now();

  const comingSoon = catalog.games
    .filter(
      (g) =>
        g.isEarlyAccess &&
        !g.delisted &&
        (g.plannedEaEndDate || g.planned10TimingText || g.plannedEaDurationText)
    )
    .sort((a, b) => {
      const aTime = a.plannedEaEndDate ? new Date(a.plannedEaEndDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.plannedEaEndDate ? new Date(b.plannedEaEndDate).getTime() : Number.MAX_SAFE_INTEGER;
      if (aTime !== bTime) return aTime - bTime;
      return (b.currentPlayers ?? 0) - (a.currentPlayers ?? 0);
    });

  const schema = buildItemListJsonLd({
    title: "Coming to 1.0 Soon — Planned Early Access Graduations",
    description:
      "Games still in Early Access with a developer-stated 1.0 / EA duration note on Steam.",
    url: `${SITE_URL}/coming-to-1-0-soon`,
    games: comingSoon,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-wider text-sky-400 mb-2">
          Developer-Stated 1.0 Timing
        </p>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-50 mb-3">
          Coming to 1.0 Soon
        </h1>
        <p className="max-w-3xl text-sm sm:text-base text-slate-300 leading-relaxed">
          Early Access titles where we parsed a planned duration or 1.0 timing from the
          Steam store &ldquo;Early Access&rdquo; section. Dates are best-effort extractions
          from public store copy — not a guarantee from Valve or the developer.
        </p>
        <p className="mt-2 font-mono text-xs text-slate-400">
          {comingSoon.length} game{comingSoon.length === 1 ? "" : "s"} with a parsed plan · as of{" "}
          {formatUtcDate(new Date(now).toISOString())}
        </p>
      </div>

      {comingSoon.length === 0 ? (
        <p className="text-sm text-slate-400">
          No planned 1.0 timings parsed yet. The daily Vercel Cron{" "}
          <code className="text-slate-300">refresh-players</code> /{" "}
          <code className="text-slate-300">refresh-store</code> jobs fill this list over time.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {comingSoon.map((game) => (
            <div key={game.appid} className="space-y-1">
              <GameCard game={game} />
              <p className="px-1 text-[11px] text-sky-300/90">
                Plan:{" "}
                {game.planned10TimingText ??
                  (game.plannedEaEndDate
                    ? formatUtcDate(game.plannedEaEndDate)
                    : null) ??
                  (game.plannedEaDurationText
                    ? `~${game.plannedEaDurationText}`
                    : "—")}
                {game.currentPlayers != null
                  ? ` · ${game.currentPlayers.toLocaleString()} playing now`
                  : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
