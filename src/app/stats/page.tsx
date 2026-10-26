import type { Metadata } from "next";
import Link from "next/link";
import { catalogShare } from "../../lib/catalog";
import { loadCatalog } from "../../lib/repository";
import { SITE_NAME, SITE_URL } from "../../lib/seo";
import { formatUtcDate, formatUtcMonthYear } from "../../lib/status-engine";

export const revalidate = 86400;

const PAGE_PATH = "/stats";
const PAGE_TITLE = "Steam Early Access Abandonment Stats (2026)";
const PAGE_DESCRIPTION =
  "What % of Steam Early Access games go idle? Industry figures (~56.7% idle 1+ year; ~59.9% idle 180+ days) vs our tracked catalog rate — definitions and sources dated.";
const H1 =
  "Steam Early Access Statistics — Abandonment & Update Cadence (2026)";

const HAPPYGAMER_URL =
  "https://happygamer.com/steam-early-access-games-year-without-update-168705/";
const ACTIVE_GAMES_URL =
  "https://active.games/reports/state-of-early-access-2026";

function catalogPercent(count: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((count / total) * 1000) / 10}%`;
}

function buildFaqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const catalog = await loadCatalog();
  const { totalTracked, overOneYearNoUpdate, lastGlobalSyncUtc } = catalog.stats;
  const pct = catalogPercent(overOneYearNoUpdate, totalTracked);
  const crawlDate = formatUtcDate(lastGlobalSyncUtc);

  const ogDescription = `Of the ${totalTracked.toLocaleString()} Steam Early Access games EA Tracker tracks, ${overOneYearNoUpdate.toLocaleString()} (${pct}) have 12+ months without a Steam announcement or public build (as of ${crawlDate}). Industry-wide cites: ~56.7% idle 1+ year; ~59.9% idle 180+ days — different universes and windows.`;

  return {
    title: { absolute: PAGE_TITLE },
    description: PAGE_DESCRIPTION,
    alternates: {
      canonical: `${SITE_URL}${PAGE_PATH}`,
    },
    openGraph: {
      title: PAGE_TITLE,
      description: ogDescription,
      url: `${SITE_URL}${PAGE_PATH}`,
      type: "website",
      siteName: SITE_NAME,
    },
  };
}

export default async function StatsPage() {
  const catalog = await loadCatalog();
  const stats = catalog.stats;
  const totalTracked = stats.totalTracked;
  const idleCount = stats.overOneYearNoUpdate;
  const idlePct = catalogPercent(idleCount, totalTracked);
  const idleShareLabel = catalogShare(idleCount, totalTracked);
  const monthYear = formatUtcMonthYear(stats.lastGlobalSyncUtc);
  const crawlDate = formatUtcDate(stats.lastGlobalSyncUtc);

  const watchlistSamples = catalog.games
    .filter((g) => g.status === "likely_abandoned")
    .slice(0, 3);

  const answerBox = `There is no official Steam “abandoned” label. Industry analyses put ~56.7% idle 1+ year (HappyGamer as of 2026-09-26 across 12,320 EA games) and ~59.9% idle 180+ days (active.games as of 2026-10-24 across 11,116 still-in-EA games). Of the ${totalTracked.toLocaleString()} games EA Tracker tracks, ${idleCount.toLocaleString()} (${idlePct}) have gone 12+ months without a Steam announcement or public build.`;

  const faqs: Array<{ question: string; answer: string }> = [
    {
      question: "What percentage of Steam Early Access games get abandoned?",
      answer: `Steam does not publish an official “abandoned” label. Industry-wide, HappyGamer reported 56.7% (6,989 of 12,320) idle for ≥1 year with no new build, patch notes, or update announcement as of 2026-09-26; active.games reported 59.9% of 11,116 still-in-EA games idle >180 days without a public/beta build or patch note as of 2026-10-24. Of the ${totalTracked.toLocaleString()} games EA Tracker tracks, ${idleCount.toLocaleString()} (${idlePct}) have gone 12+ months without a Steam announcement (feed_type=1) or public depot build. These figures use different universes and idle windows and should not be averaged.`,
    },
    {
      question: "Why is EA Tracker’s rate (~6–7%) so much lower than 56–60%?",
      answer: `Our rate is of the ${totalTracked.toLocaleString()} popular / verified Genre ID 70 games in our tracked catalog, not a census of every Steam Early Access listing. Industry reports cover much larger EA universes (12,320 and 11,116). Idle windows also differ: we use 12+ months of Steam silence; HappyGamer uses ≥1 year; active.games uses >180 days. A curated popular sample tends to stay more active than the full store.`,
    },
    {
      question: "What counts as abandoned / idle here vs in those reports?",
      answer:
        "EA Tracker: 12+ months without a Steam community announcement (feed_type=1) or public depot build. HappyGamer: ≥1 year with no new build, patch notes, or update announcement (as of 2026-09-26). active.games: >180 days without an update counted as a public build, beta build, or patch note (as of 2026-10-24). Discord/Patreon-only updates still count as inactive on Steam in our catalog until corrected via /report.",
    },
    {
      question: "Does a long Early Access mean a game is abandoned?",
      answer: `No. Duration in Early Access is separate from update cadence. Many long-running titles still ship regularly. See our longest Early Access ranking at ${SITE_URL}/longest-early-access-games for duration leaders with status and activity score.`,
    },
    {
      question: "How often is this page updated?",
      answer: `Our tracked-catalog figures refresh from a daily crawl of Steam announcements and public build timestamps. This page’s catalog snapshot last synced on ${crawlDate} (${monthYear}). The HappyGamer (2026-09-26) and active.games (2026-10-24) industry percentages are dated third-party snapshots; we cite them as published and do not auto-update their rates.`,
    },
    {
      question: "Why isn’t every Steam Early Access game in these tables?",
      answer: `Cohort tables and catalog percentages cover only EA Tracker’s tracked sample (currently ${totalTracked.toLocaleString()} popular / verified Genre ID 70 games), not every Early Access title on Steam. To request a missing game, use ${SITE_URL}/report.`,
    },
  ];

  const datasetJsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Steam Early Access Abandonment & Graduation Statistics (2026)",
    description: `Quantitative dataset measuring update cadence and 12+ month inactivity across ${totalTracked.toLocaleString()} tracked Steam Early Access games in the EA Tracker catalog (not a Steam-wide census).`,
    url: `${SITE_URL}${PAGE_PATH}`,
    dateModified: stats.lastGlobalSyncUtc,
    creator: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  const faqSchema = buildFaqJsonLd(faqs);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2">
          Press &amp; Research Data Report · Citable Dataset · {monthYear}
        </p>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-50 mb-3">
          {H1}
        </h1>
        <p className="max-w-3xl text-sm sm:text-base text-slate-300 leading-relaxed rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-4 py-3">
          {answerBox}{" "}
          <Link
            href="/methodology"
            className="text-emerald-300 hover:underline font-medium"
          >
            See methodology
          </Link>
          .
        </p>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-100 mb-2">
          Methodology contrast
        </h2>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Our catalog is a popular / verified Genre ID 70 sample —{" "}
          <strong className="text-slate-300">not</strong> a census of all Steam
          Early Access games. Industry figures below cover larger Steam EA
          universes with different idle windows.
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Universe</th>
                <th className="py-3 px-4">Idle window</th>
                <th className="py-3 px-4">What counts as an update</th>
                <th className="py-3 px-4">As-of</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-100">
                  Industry-wide ·{" "}
                  <a
                    href={HAPPYGAMER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-300 hover:underline font-normal"
                  >
                    HappyGamer
                  </a>
                </td>
                <td className="py-3 px-4 font-mono">12,320 Steam EA</td>
                <td className="py-3 px-4">≥1 year</td>
                <td className="py-3 px-4">
                  New build, patch notes, or update announcement
                </td>
                <td className="py-3 px-4 font-mono">2026-09-26</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-100">
                  Industry-wide ·{" "}
                  <a
                    href={ACTIVE_GAMES_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-300 hover:underline font-normal"
                  >
                    active.games
                  </a>
                </td>
                <td className="py-3 px-4 font-mono">11,116 still in EA</td>
                <td className="py-3 px-4">&gt;180 days</td>
                <td className="py-3 px-4">
                  Public build, beta build, or patch note
                </td>
                <td className="py-3 px-4 font-mono">2026-10-24</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-100">
                  EATracker catalog
                </td>
                <td className="py-3 px-4 font-mono">
                  {totalTracked.toLocaleString()} tracked
                </td>
                <td className="py-3 px-4">12+ months</td>
                <td className="py-3 px-4">
                  Steam announcement (feed_type=1) or public depot build
                </td>
                <td className="py-3 px-4 font-mono">{crawlDate}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-100 mb-3">
          Key Findings ({monthYear} Snapshot)
        </h2>
        <ul className="space-y-2 text-sm text-slate-300 list-disc pl-5">
          <li>
            <strong>Industry-wide (cited):</strong> 56.7% idle ≥1 year (
            <a
              href={HAPPYGAMER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 hover:underline"
            >
              HappyGamer
            </a>
            , data 2026-09-26); 59.9% idle &gt;180 days (
            <a
              href={ACTIVE_GAMES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 hover:underline"
            >
              active.games
            </a>
            , data 2026-10-24). Different universes and windows — not one
            Steam-wide rate.
          </li>
          <li>
            <strong>In our tracked catalog — Total Tracked:</strong>{" "}
            {totalTracked.toLocaleString()} Steam games (verified{" "}
            <code className="text-slate-400">type = &quot;game&quot;</code> with
            Genre ID 70).
          </li>
          <li>
            <strong>
              In our tracked catalog — 12+ Months Without Steam Activity:
            </strong>{" "}
            {idleCount.toLocaleString()} games ({idleShareLabel}) combine Likely
            Abandoned ({stats.abandonedCount.toLocaleString()}) and long-term
            Stalled projects ({stats.stalledCount.toLocaleString()}).
          </li>
          <li>
            <strong>In our tracked catalog — Actively Maintained:</strong>{" "}
            {stats.activeCount.toLocaleString()} games (
            {catalogShare(stats.activeCount, totalTracked)}) shipped a
            patch/build within 90 days or posted a developer update within 60
            days.
          </li>
          <li>
            <strong>In our tracked catalog — Median Time in Early Access:</strong>{" "}
            {stats.medianEaMonths} months across active titles.
          </li>
          <li>
            <strong>Data source:</strong>{" "}
            {catalog.source === "database" ? "Neon Postgres" : "JSON fallback"}{" "}
            ({catalog.gameCount.toLocaleString()} rows · synced {crawlDate}).
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-100 mb-2">
          Tracked catalog — outcomes by Early Access entry year
        </h2>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Graduation and stalled/abandoned percentages are{" "}
          <strong className="text-slate-300">within this sample</strong>, not
          Steam-wide Early Access entry rates.
        </p>
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
                  <td className="py-3 px-4 font-bold text-slate-100">
                    {row.year}
                  </td>
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
                    {Math.round((row.stalledOrAbandoned / row.enteredEa) * 100)}
                    %)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-100 mb-3">
          Industry context (dated third-party studies)
        </h2>
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            Two market-wide looks at Steam Early Access idle rates circulated in
            October 2026.{" "}
            <a
              href={HAPPYGAMER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 hover:underline"
            >
              HappyGamer
            </a>{" "}
            (article 2026-10-18; data as of 2026-09-26) counted{" "}
            <strong>6,989 of 12,320</strong> Steam Early Access games (56.7%)
            with no new build, patch notes, or update announcement for at least
            one year. Separately,{" "}
            <a
              href={ACTIVE_GAMES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 hover:underline"
            >
              active.games&apos; State of Early Access 2026
            </a>{" "}
            (data 2026-10-24) reported that among{" "}
            <strong>11,116</strong> titles still in Early Access,{" "}
            <strong>59.9%</strong> had gone more than 180 days without a public
            build, beta build, or patch note, and <strong>38.9%</strong> had
            been idle for more than two years.
          </p>
          <p>
            Those two headline percentages are not interchangeable: 56.7% uses a
            ~365-day silence threshold across a 12,320-game EA universe, while
            59.9% uses a 180-day threshold across 11,116 still-in-EA games. We do
            not average or reconcile them into a single “Steam abandonment rate,”
            and Valve has not published an official abandoned-game rate. Our
            live catalog rate (
            {idleCount.toLocaleString()} / {totalTracked.toLocaleString()},{" "}
            {idlePct}) answers a narrower question — how many{" "}
            <em>tracked</em> popular EA titles show 12+ months without Steam
            activity — and should not be quoted as Steam-wide.
          </p>
          <p>
            Before buying, check the last Steam patch or build date and recent
            developer announcements, then compare status on our{" "}
            <Link
              href="/abandoned-early-access-games"
              className="text-emerald-300 hover:underline"
            >
              abandoned Early Access list
            </Link>
            ,{" "}
            <Link
              href="/guides/how-to-tell-if-early-access-game-is-abandoned"
              className="text-emerald-300 hover:underline"
            >
              how to tell if an Early Access game is abandoned
            </Link>
            , and{" "}
            <Link
              href="/guides/steam-early-access-not-updated-warning"
              className="text-emerald-300 hover:underline"
            >
              Steam Early Access not-updated warning
            </Link>{" "}
            guides.
          </p>
        </div>
      </section>

      {watchlistSamples.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-100 mb-2">
            Examples from our Likely Abandoned watchlist
          </h2>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Sample titles already classified Likely Abandoned in the tracked
            catalog (12+ months without public Steam activity). Status reflects
            Steam signals only — see each game page for evidence.
          </p>
          <ul className="flex flex-wrap gap-2 text-sm">
            {watchlistSamples.map((game) => (
              <li key={game.appid}>
                <Link
                  href={`/game/${game.slug}`}
                  className="inline-flex rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-slate-200 hover:border-rose-500/40 hover:text-rose-200 transition-colors"
                >
                  {game.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/abandoned-early-access-games"
                className="inline-flex rounded-md border border-rose-500/30 bg-rose-950/20 px-3 py-1.5 text-rose-300 hover:underline"
              >
                View full abandoned list →
              </Link>
            </li>
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 mb-8">
        <h2 className="text-base font-semibold text-slate-100 mb-4">FAQ</h2>
        <dl className="space-y-4">
          {faqs.map((item) => (
            <div key={item.question}>
              <dt className="text-sm font-semibold text-slate-100">
                {item.question}
              </dt>
              <dd className="mt-1.5 text-sm text-slate-300 leading-relaxed">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <nav
        aria-label="Related EA Tracker pages"
        className="mb-8 rounded-xl border border-slate-800 bg-slate-950/50 p-5"
      >
        <h2 className="text-sm font-semibold text-slate-100 mb-3">
          Related pages
        </h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-300">
          <li>
            <Link
              href="/abandoned-early-access-games"
              className="text-emerald-300 hover:underline"
            >
              Abandoned Early Access games
            </Link>
          </li>
          <li>
            <Link
              href="/longest-early-access-games"
              className="text-emerald-300 hover:underline"
            >
              Longest Early Access games
            </Link>
          </li>
          <li>
            <Link
              href="/left-early-access"
              className="text-emerald-300 hover:underline"
            >
              Left Early Access (1.0)
            </Link>
          </li>
          <li>
            <Link
              href="/methodology"
              className="text-emerald-300 hover:underline"
            >
              Methodology
            </Link>
          </li>
          <li>
            <Link
              href="/guides/how-to-tell-if-early-access-game-is-abandoned"
              className="text-emerald-300 hover:underline"
            >
              How to tell if EA is abandoned
            </Link>
          </li>
          <li>
            <Link
              href="/guides/steam-early-access-not-updated-warning"
              className="text-emerald-300 hover:underline"
            >
              Not-updated warning guide
            </Link>
          </li>
        </ul>
      </nav>

      <section className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-xs text-slate-400 leading-relaxed">
        <p className="font-semibold text-slate-200 mb-1">
          Statistical Accounting Note:
        </p>
        <p>
          Catalog figures measure public Steam activity only: official developer
          announcements in the{" "}
          <code className="text-slate-500">steam_community_announcements</code>{" "}
          feed (<code className="text-slate-500">feed_type = 1</code>) and
          public depot branch timestamps via Steam PICS (
          <code className="text-slate-500">steamcmd.net</code>). Games whose
          developers post only on Discord, Patreon, or standalone blogs without
          pushing Steam builds or announcements are counted as inactive on Steam
          until verified via our{" "}
          <Link href="/report" className="text-emerald-300 hover:underline">
            Developer Correction Portal
          </Link>
          . Industry percentages cited above are third-party dated snapshots, not
          Valve-published rates, and are not derived from this catalog sample.
        </p>
      </section>
    </div>
  );
}
