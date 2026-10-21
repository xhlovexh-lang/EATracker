import type { Metadata } from "next";
import { catalogShare } from "../../lib/catalog";
import { loadCatalog } from "../../lib/repository";
import { SITE_URL } from "../../lib/seo";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Steam Early Access Statistics & Abandonment Rate Report (2026)",
  description:
    "Annual data report on Steam Early Access games: how many games enter Early Access each year, 1.0 graduation rates, and how many titles go 12+ months without updates.",
  alternates: {
    canonical: `${SITE_URL}/stats`,
  },
};

export default async function StatsPage() {
  const catalog = await loadCatalog();
  const stats = catalog.stats;

  const datasetJsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Steam Early Access Abandonment & Graduation Statistics (2026)",
    description:
      `Quantitative dataset measuring update cadence and 12+ month inactivity across ${stats.totalTracked.toLocaleString()} tracked Steam Early Access games.`,
    url: `${SITE_URL}/stats`,
    dateModified: stats.lastGlobalSyncUtc,
    creator: {
      "@type": "Organization",
      name: "EA Tracker",
      url: SITE_URL,
    },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
      />

      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2">
          Press & Research Data Report · Citable Dataset
        </p>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-50 mb-3">
          Steam Early Access in 2026: Update Cadence &amp; Abandonment Statistics
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          As of October 2026, our automated crawler tracks{" "}
          <strong>{stats.totalTracked.toLocaleString()}</strong> games currently or recently in Steam Early Access (Genre ID 70).{" "}
          <strong>
            {stats.overOneYearNoUpdate.toLocaleString()} games (
            {catalogShare(stats.overOneYearNoUpdate, stats.totalTracked)})
          </strong>{" "}
          have gone more than 12 months without a shipped patch note or developer community announcement on Steam.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-100 mb-3">
          Key Findings (October 2026 Snapshot)
        </h2>
        <ul className="space-y-2 text-sm text-slate-300 list-disc pl-5">
          <li>
            <strong>Total Tracked Catalog:</strong>{" "}
            {stats.totalTracked.toLocaleString()} Steam games (verified `type = &quot;game&quot;` with Genre ID 70).
          </li>
          <li>
            <strong>12+ Months Without Steam Activity:</strong>{" "}
            {stats.overOneYearNoUpdate.toLocaleString()} games combine Likely Abandoned ({stats.abandonedCount.toLocaleString()}) and long-term Stalled projects ({stats.stalledCount.toLocaleString()}).
          </li>
          <li>
            <strong>Actively Maintained:</strong>{" "}
            {stats.activeCount.toLocaleString()} games ({catalogShare(stats.activeCount, stats.totalTracked)}) shipped a patch/build within 90 days or posted a developer update within 60 days.
          </li>
          <li>
            <strong>Median Time in Early Access:</strong>{" "}
            {stats.medianEaMonths} months across active titles.
          </li>
          <li>
            <strong>Data source:</strong>{" "}
            {catalog.source === "database" ? "Neon Postgres" : "JSON fallback"} ({catalog.gameCount.toLocaleString()} rows).
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-100 mb-4">
          Early Access Cohort Outcomes by Entry Year
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Entry Year</th>
                <th className="py-3 px-4">Entered Early Access</th>
                <th className="py-3 px-4">Graduated to 1.0</th>
                <th className="py-3 px-4">Active / Slowing</th>
                <th className="py-3 px-4">Stalled / Abandoned (&gt;6m)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {stats.yearlyCohortStats.map((row) => (
                <tr key={row.year} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-100">{row.year}</td>
                  <td className="py-3 px-4 text-slate-300">
                    {row.enteredEa.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sky-400">
                    {row.graduated10.toLocaleString()} (
                    {Math.round((row.graduated10 / row.enteredEa) * 100)}%)
                  </td>
                  <td className="py-3 px-4 text-emerald-400">
                    {row.activeOrSlowing.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-rose-400">
                    {row.stalledOrAbandoned.toLocaleString()} (
                    {Math.round((row.stalledOrAbandoned / row.enteredEa) * 100)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-xs text-slate-400 leading-relaxed">
        <p className="font-semibold text-slate-200 mb-1">
          Statistical Accounting Note:
        </p>
        <p>
          All figures above measure public Steam activity only: official developer announcements in the `steam_community_announcements` feed (`feed_type = 1`) and public depot branch timestamps via Steam PICS (`steamcmd.net`). Games whose developers post updates exclusively on external Discord servers, Patreon, or standalone blogs without pushing Steam builds or announcements are counted as inactive on Steam until verified via our Developer Correction Portal.
        </p>
      </section>
    </div>
  );
}
