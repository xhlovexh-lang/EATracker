import type { Metadata } from "next";
import { getAllGames } from "../../lib/catalog";
import { buildItemListJsonLd, SITE_URL } from "../../lib/seo";
import { formatDurationDays, formatUtcDate, formatUtcMonthYear } from "../../lib/status-engine";
import { StatusBadge } from "../../components/status-badge";
import Link from "next/link";

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const monthYear = formatUtcMonthYear(new Date("2026-10-19T00:00:00Z"));
  return {
    title: `Longest Early Access Games on Steam (${monthYear} Ranking)`,
    description:
      "Ranked list of the longest-running Steam Early Access games by total days in Early Access, comparing active long-term projects like Project Zomboid against stalled titles.",
    alternates: {
      canonical: `${SITE_URL}/longest-early-access-games`,
    },
  };
}

export default function LongestEarlyAccessPage() {
  const games = [...getAllGames()].sort(
    (a, b) => (b.eaDurationDays ?? 0) - (a.eaDurationDays ?? 0)
  );

  const schema = buildItemListJsonLd({
    title: "Longest Early Access Games on Steam",
    description: "Steam games ranked by total time spent in Early Access.",
    url: `${SITE_URL}/longest-early-access-games`,
    games,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-wider text-amber-400 mb-2">
          Duration Leaderboard · Verified EA Entry Dates
        </p>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-50 mb-3">
          Longest Early Access Games on Steam
        </h1>
        <p className="max-w-3xl text-sm sm:text-base text-slate-300 leading-relaxed">
          Being in Early Access for over 5 or 10 years does not automatically mean a game is dead. Below we rank games by total duration since their initial Steam Early Access release date alongside their current 0–100 Activity Score.
        </p>
      </div>

      {/* Structured Comparison Table for Featured Snippets & AI Engines */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-400">
            <tr>
              <th className="py-3.5 px-4">#</th>
              <th className="py-3.5 px-4">Game</th>
              <th className="py-3.5 px-4">EA Start Date</th>
              <th className="py-3.5 px-4">Time in Early Access</th>
              <th className="py-3.5 px-4">Last Patch</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {games.map((g, idx) => (
              <tr key={g.appid} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                <td className="py-3.5 px-4 font-semibold text-slate-100">
                  <Link href={`/game/${g.slug}`} className="hover:text-emerald-400">
                    {g.name}
                  </Link>
                  <p className="text-[11px] font-normal text-slate-400">
                    {g.developers.join(", ")}
                  </p>
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-300">
                  {formatUtcDate(g.eaStartDate)}
                </td>
                <td className="py-3.5 px-4 font-semibold text-amber-300">
                  {formatDurationDays(g.eaDurationDays)}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    ({g.eaDurationDays?.toLocaleString()}d)
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-300">
                  {formatUtcDate(g.lastPatchAt)}
                </td>
                <td className="py-3.5 px-4">
                  <StatusBadge status={g.status} size="sm" />
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-200">
                  {g.activityScore}/100
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
