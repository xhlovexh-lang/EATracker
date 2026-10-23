import type { Metadata } from "next";
import Link from "next/link";
import {
  getAdjustedStatusLabel,
  getDeveloperStatement,
  type GameRecord,
} from "../../lib/catalog";
import {
  LEFT_AFTER_LONG_STAY_TOP_N,
  listLeftAfterLongStay,
  listStillInEaByDuration,
  STILL_IN_EA_TOP_N,
} from "../../lib/longest-early-access";
import { loadCatalog } from "../../lib/repository";
import { buildItemListJsonLd, SITE_NAME, SITE_URL } from "../../lib/seo";
import {
  formatDurationDays,
  formatUtcDate,
  formatUtcMonthYear,
} from "../../lib/status-engine";
import { StatusBadge } from "../../components/status-badge";
import { GameCover } from "../../components/game-cover";

export const revalidate = 86400;

const PAGE_PATH = "/longest-early-access-games";
const PAGE_TITLE = "Longest Steam Early Access Games (Updated Ranking)";
const PAGE_DESCRIPTION =
  "Steam Early Access games ranked by days since EA launch — still-in-EA leaders, active long-runners like Project Zomboid, plus status and activity score. Of the games we track.";
const H1 = "Longest Steam Early Access Games — By Days in Early Access";

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
  return {
    title: { absolute: PAGE_TITLE },
    description: PAGE_DESCRIPTION,
    alternates: {
      canonical: `${SITE_URL}${PAGE_PATH}`,
    },
    openGraph: {
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: `${SITE_URL}${PAGE_PATH}`,
      type: "website",
      siteName: SITE_NAME,
    },
  };
}

function StillInEaRow({ game, rank }: { game: GameRecord; rank: number }) {
  const adjusted = getAdjustedStatusLabel(game);
  const statement =
    game.status === "likely_abandoned" ? getDeveloperStatement(game) : null;

  return (
    <tr className="hover:bg-slate-800/40 transition-colors align-top">
      <td className="py-3.5 px-4 font-mono text-slate-400">{rank}</td>
      <td className="py-3.5 px-4 font-semibold text-slate-100">
        <Link
          href={`/game/${game.slug}`}
          className="flex items-center gap-3 hover:text-emerald-400"
        >
          <GameCover
            src={game.headerImage}
            alt=""
            width={92}
            height={43}
            className="hidden h-10 w-[86px] shrink-0 rounded-md object-cover sm:block"
          />
          <span>
            <span className="block">{game.name}</span>
            <span className="block text-[11px] font-normal text-slate-400">
              {game.developers.join(", ")}
            </span>
          </span>
        </Link>
        {statement && (
          <p className="mt-2 max-w-md text-[11px] font-normal leading-relaxed text-sky-200/90">
            Dev says &ldquo;{statement.quote}&rdquo; (
            {formatUtcDate(statement.date)},{" "}
            <a
              href={statement.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-sky-100"
            >
              source
            </a>
            )
          </p>
        )}
      </td>
      <td className="py-3.5 px-4 font-mono text-slate-300">
        {formatUtcDate(game.eaStartDate)}
      </td>
      <td className="py-3.5 px-4 font-semibold text-amber-300">
        {formatDurationDays(game.eaDurationDays)}{" "}
        <span className="text-xs font-normal text-slate-400">
          ({game.eaDurationDays?.toLocaleString()}d)
        </span>
      </td>
      <td className="py-3.5 px-4 text-slate-300">
        {formatUtcDate(game.lastPatchAt)}
      </td>
      <td className="py-3.5 px-4">
        <StatusBadge status={game.status} size="sm" label={adjusted.shortLabel} />
      </td>
      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-200">
        {game.activityScore}/100
      </td>
    </tr>
  );
}

function LeftEaRow({ game, rank }: { game: GameRecord; rank: number }) {
  return (
    <tr className="hover:bg-slate-800/40 transition-colors">
      <td className="py-3.5 px-4 font-mono text-slate-400">{rank}</td>
      <td className="py-3.5 px-4 font-semibold text-slate-100">
        <Link
          href={`/game/${game.slug}`}
          className="flex items-center gap-3 hover:text-emerald-400"
        >
          <GameCover
            src={game.headerImage}
            alt=""
            width={92}
            height={43}
            className="hidden h-10 w-[86px] shrink-0 rounded-md object-cover sm:block"
          />
          <span>
            <span className="block">{game.name}</span>
            <span className="block text-[11px] font-normal text-slate-400">
              {game.developers.join(", ")}
            </span>
          </span>
        </Link>
      </td>
      <td className="py-3.5 px-4 font-mono text-slate-300">
        {formatUtcDate(game.eaStartDate)}
      </td>
      <td className="py-3.5 px-4 font-mono text-slate-300">
        {formatUtcDate(game.leftEaAt)}
      </td>
      <td className="py-3.5 px-4 font-semibold text-sky-300">
        {formatDurationDays(game.eaDurationDays)}{" "}
        <span className="text-xs font-normal text-slate-400">
          ({game.eaDurationDays?.toLocaleString()}d until 1.0)
        </span>
      </td>
    </tr>
  );
}

export default async function LongestEarlyAccessPage() {
  const catalog = await loadCatalog();
  const stillInEa = listStillInEaByDuration(catalog.games);
  const leftAfterLongStay = listLeftAfterLongStay(catalog.games);
  const stillTop = stillInEa.slice(0, STILL_IN_EA_TOP_N);
  const stillRest = stillInEa.slice(STILL_IN_EA_TOP_N);
  const leftTop = leftAfterLongStay.slice(0, LEFT_AFTER_LONG_STAY_TOP_N);

  const monthYear = formatUtcMonthYear(catalog.stats.lastGlobalSyncUtc);
  const crawlDate = formatUtcDate(catalog.stats.lastGlobalSyncUtc);
  const trackedCount = catalog.gameCount;
  const famousLongRunner =
    stillInEa.find((g) => /project zomboid/i.test(g.name)) ?? stillInEa[0] ?? null;

  const answerBox = `We measure Early Access duration from each game's Steam EA start date to today (still in EA) or to its leave/1.0 date (Left EA). Of the ${trackedCount.toLocaleString()} games we track, leaders below are sorted by days in Early Access. Last catalog sync: ${crawlDate}. A long Early Access stay is not the same as abandoned.`;

  const faqs: Array<{ question: string; answer: string }> = [
    {
      question: "What counts as time in Early Access?",
      answer: `Time in Early Access is the number of days from the game's Steam Early Access start date to today if it is still tagged Early Access, or to the date it left Early Access (usually a 1.0 release) if it has graduated. Durations on this page come from the ${trackedCount.toLocaleString()} games in our tracked catalog.`,
    },
    {
      question: "Does a long Early Access mean the game is abandoned?",
      answer:
        "No. Many long-running Early Access games still ship patches regularly. Our status labels (Active, Slowing, Stalled, Likely Abandoned) come from public Steam patch, build, and developer-post activity — not from how many years a title has been in Early Access.",
    },
    {
      question: famousLongRunner
        ? `Why is ${famousLongRunner.name} ranked here?`
        : "Why are famous long Early Access games ranked here?",
      answer: famousLongRunner
        ? `${famousLongRunner.name} entered Steam Early Access on ${formatUtcDate(famousLongRunner.eaStartDate)} and has been in Early Access for ${formatDurationDays(famousLongRunner.eaDurationDays)} (${famousLongRunner.eaDurationDays?.toLocaleString()} days). It appears high on this list because of that duration; its Activity Score (${famousLongRunner.activityScore}/100) and status reflect recent Steam activity, not time alone.`
        : "Games appear here when their tracked Steam Early Access start date yields a long duration. Status and Activity Score are calculated separately from duration.",
    },
    {
      question: "Why isn't every Steam Early Access game listed?",
      answer: `This ranking only includes titles in EA Tracker's tracked catalog (currently ${trackedCount.toLocaleString()} games), not every Early Access listing on Steam. If a game is missing, you can suggest it via our report form at ${SITE_URL}/report.`,
    },
    {
      question: "How often is this updated?",
      answer: `We re-check tracked games' public Steam announcements and build timestamps on a daily cadence. This page's catalog snapshot last synced on ${crawlDate} (${monthYear}).`,
    },
  ];

  const itemListSchema = buildItemListJsonLd({
    title: H1,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}${PAGE_PATH}`,
    games: stillTop,
  });
  const faqSchema = buildFaqJsonLd(faqs);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-wider text-amber-400 mb-2">
          Duration Leaderboard · {monthYear} · Verified EA Entry Dates
        </p>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-50 mb-3">
          {H1}
        </h1>
        <p className="max-w-3xl text-sm sm:text-base text-slate-300 leading-relaxed rounded-xl border border-amber-500/20 bg-amber-950/20 px-4 py-3">
          {answerBox}
        </p>
      </div>

      <section className="mb-10">
        <h2 className="text-lg sm:text-xl font-bold text-slate-50 mb-2">
          Still in Early Access — Top {STILL_IN_EA_TOP_N}
        </h2>
        <p className="mb-4 max-w-3xl text-sm text-slate-400 leading-relaxed">
          Ranked by days since Steam Early Access launch among titles that are
          still tagged Early Access. Active long-runners can sit next to stalled
          projects; check Score and Status, not duration alone.
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-400">
              <tr>
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Game</th>
                <th className="py-3.5 px-4">EA Start</th>
                <th className="py-3.5 px-4">Time in EA</th>
                <th className="py-3.5 px-4">Last Patch</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {stillTop.map((g, idx) => (
                <StillInEaRow key={g.appid} game={g} rank={idx + 1} />
              ))}
              {stillTop.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No still-in-Early-Access titles in the current catalog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {stillRest.length > 0 && (
          <details className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-200 hover:text-emerald-300">
              Show all tracked still-in-EA ({stillInEa.length.toLocaleString()}{" "}
              games)
            </summary>
            <div className="overflow-x-auto border-t border-slate-800">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="py-3.5 px-4">#</th>
                    <th className="py-3.5 px-4">Game</th>
                    <th className="py-3.5 px-4">EA Start</th>
                    <th className="py-3.5 px-4">Time in EA</th>
                    <th className="py-3.5 px-4">Last Patch</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {stillRest.map((g, idx) => (
                    <StillInEaRow
                      key={g.appid}
                      game={g}
                      rank={STILL_IN_EA_TOP_N + idx + 1}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-lg sm:text-xl font-bold text-slate-50 mb-2">
          Left Early Access after a long stay
        </h2>
        <p className="mb-4 max-w-3xl text-sm text-slate-400 leading-relaxed">
          These titles already left Early Access (usually at 1.0). Duration here
          is EA start → leave date — not “still stuck.” See also{" "}
          <Link href="/left-early-access" className="text-sky-300 hover:underline">
            games that left Early Access in 2026
          </Link>
          .
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-400">
              <tr>
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Game</th>
                <th className="py-3.5 px-4">EA Start</th>
                <th className="py-3.5 px-4">Left EA</th>
                <th className="py-3.5 px-4">Time in EA (until 1.0)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {leftTop.map((g, idx) => (
                <LeftEaRow key={g.appid} game={g} rank={idx + 1} />
              ))}
              {leftTop.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No long-stay graduations in the current catalog yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-100 mb-3">
          How to read Status vs long Early Access
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          <strong className="text-slate-100">Active</strong> long-runners keep
          shipping; <strong className="text-slate-100">Slowing</strong> and{" "}
          <strong className="text-slate-100">Stalled</strong> mean quieter public
          Steam activity; <strong className="text-slate-100">Likely Abandoned</strong>{" "}
          means over a year without a public patch, build, or developer post on
          Steam. Full rules are on our{" "}
          <Link href="/methodology" className="text-emerald-300 hover:underline">
            methodology
          </Link>{" "}
          page. Status is a heuristic from public Steam signals, not a legal claim
          about a studio or product.
        </p>
        <p className="text-sm text-slate-400 leading-relaxed">
          When a row is labeled Likely Abandoned and we have a developer
          statement on record, we show “Dev says …” with the date and source link
          (for example The Long Drive). We do not invent abandonment accusations
          beyond the activity-based label.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-100 mb-4">FAQ</h2>
        <dl className="space-y-4">
          {faqs.map((item) => (
            <div key={item.question}>
              <dt className="text-sm font-semibold text-slate-100">{item.question}</dt>
              <dd className="mt-1.5 text-sm text-slate-300 leading-relaxed">
                {item.question === "Why isn't every Steam Early Access game listed?" ? (
                  <>
                    This ranking only includes titles in EA Tracker&apos;s tracked
                    catalog (currently {trackedCount.toLocaleString()} games), not
                    every Early Access listing on Steam. If a game is missing, you
                    can suggest it via our{" "}
                    <Link href="/report" className="text-emerald-300 hover:underline">
                      report form
                    </Link>
                    .
                  </>
                ) : (
                  item.answer
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <nav
        aria-label="Related EA Tracker pages"
        className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 text-sm text-slate-300"
      >
        <h2 className="text-base font-semibold text-slate-100 mb-3">
          Related pages
        </h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          <li>
            <Link href="/abandoned-early-access-games" className="text-emerald-300 hover:underline">
              Abandoned Early Access games
            </Link>
          </li>
          <li>
            <Link href="/left-early-access" className="text-emerald-300 hover:underline">
              Left Early Access (2026)
            </Link>
          </li>
          <li>
            <Link href="/methodology" className="text-emerald-300 hover:underline">
              Methodology
            </Link>
          </li>
          <li>
            <Link href="/stats" className="text-emerald-300 hover:underline">
              Stats
            </Link>
          </li>
          <li>
            <Link href="/report" className="text-emerald-300 hover:underline">
              Report a game / statement
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
