import type { Metadata } from "next";
import { STATUS_CONFIG, STATUS_META, type GameStatusType } from "../../config/status";
import { SITE_URL } from "../../lib/seo";
import { StatusBadge } from "../../components/status-badge";

export const metadata: Metadata = {
  title: "Methodology: How We Calculate Early Access Abandonment & Activity Scores",
  description:
    "Full deterministic rules, thresholds, and data sources used to classify Steam Early Access games as Active, Slowing Down, Stalled, Likely Abandoned, or Left Early Access.",
  alternates: {
    canonical: `${SITE_URL}/methodology`,
  },
};

export default function MethodologyPage() {
  const statusOrder: GameStatusType[] = [
    "active",
    "slowing",
    "stalled",
    "likely_abandoned",
    "left_early_access",
    "not_enough_data",
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-10">
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2">
          Transparent Deterministic Algorithm · Spec v1.0
        </p>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-50 mb-3">
          Methodology &amp; Status Classification Rules
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          We never guess or use subjective editorial opinions. Every game&apos;s status on EA Tracker is computed from a deterministic rule set evaluated against public Steam timestamps. Below are the exact configuration values exported directly from <code className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-emerald-300">config/status.ts</code>.
        </p>
      </div>

      {/* Exact Status Rules Table */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-bold text-slate-100 mb-4">
          1. Deterministic Status Decision Tree (Evaluated in Order)
        </h2>
        <div className="space-y-4">
          {statusOrder.map((st, idx) => (
            <div
              key={st}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 last:border-none last:pb-0"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">#{idx + 1}</span>
                  <StatusBadge status={st} size="sm" />
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  {STATUS_META[st].description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200 leading-relaxed">
          <strong>Special Rule (Talk-Without-Shipping Cap):</strong> If a developer posts community announcements recently (&le;{STATUS_CONFIG.activePostDays} days), but has not shipped a patch note or public branch build update in over{" "}
          <strong>{STATUS_CONFIG.postOnlyMaxShipDays} days</strong>, the status is capped at{" "}
          <code className="font-mono font-bold">Stalled</code> with the explicit reason:{" "}
          <em>&ldquo;Developer posted recently, but no game update in N months.&rdquo;</em>
        </div>
      </section>

      {/* Live Thresholds from config/status.ts */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-bold text-slate-100 mb-3">
          2. Exact Thresholds (<code className="font-mono text-emerald-400">config/status.ts</code>)
        </h2>
        <pre className="overflow-x-auto rounded-lg bg-slate-950 border border-slate-800 p-4 text-xs font-mono text-slate-200">
          {JSON.stringify(STATUS_CONFIG, null, 2)}
        </pre>
      </section>

      {/* Activity Score Formula */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
        <h2 className="text-lg font-bold text-slate-100">
          3. Activity Score Formula (0–100)
        </h2>
        <p className="text-sm text-slate-300">
          Every game receives a 0–100 <code className="font-mono text-emerald-300">activityScore</code> combining update recency and 12-month shipping frequency:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-slate-950 border border-slate-800 p-4 text-xs font-mono text-emerald-300">
{`recency(date) = max(0, 1 - daysSince(date) / ${STATUS_CONFIG.scoreDecayDays})

activityScore = round(
  40 * recency(lastShipAt) +
  25 * recency(lastDevPostAt) +
  20 * min(patches12m / 12, 1) +
  15 * min(posts12m / 12, 1)
)`}
        </pre>
        <p className="text-xs text-slate-400">
          Missing signals are scored as 0 and explicitly noted in the game&apos;s &ldquo;Why This Status?&rdquo; section.
        </p>
      </section>

      {/* Data Sources & Rate Limits */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
        <h2 className="text-lg font-bold text-slate-100">
          4. Data Sources &amp; Refresh Cadence
        </h2>
        <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc pl-5">
          <li>
            <strong>Steam Store AppDetails &amp; AppReviews:</strong> Checks Genre ID <code className="font-mono">70</code> (Early Access), initial release date, pricing, and review summaries. Rate-limited strictly to 1 request per 2 seconds.
          </li>
          <li>
            <strong>Steam Official Web API (<code className="font-mono">ISteamNews/GetNewsForApp/v2</code>):</strong> Filtered strictly to <code className="font-mono">feeds=steam_community_announcements</code> (<code className="font-mono">feed_type = 1</code>) so third-party media articles are never counted as developer updates.
          </li>
          <li>
            <strong>Public Depot Build Updates (<code className="font-mono">api.steamcmd.net</code>):</strong> Captures silent patches where a developer pushes a new build to the <code className="font-mono">public</code> branch without posting an announcement.
          </li>
        </ul>
      </section>
    </div>
  );
}
