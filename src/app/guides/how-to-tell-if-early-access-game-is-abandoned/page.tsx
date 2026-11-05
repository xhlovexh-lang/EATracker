import type { Metadata } from "next";
import Link from "next/link";
import { loadCatalog } from "../../../lib/repository";
import { SITE_NAME, SITE_URL } from "../../../lib/seo";
import { formatUtcDate } from "../../../lib/status-engine";
import { GameSearchAutocomplete } from "../../../components/game-search";

export const revalidate = 86400;

const PAGE_PATH = "/guides/how-to-tell-if-early-access-game-is-abandoned";
const PAGE_TITLE =
  "How to Tell If an Early Access Game Is Abandoned (7 Checks)";
const PAGE_DESCRIPTION =
  "A 7-step check before buying a Steam Early Access game: last default-branch build, update posts, beta branches, dev replies, roadmap dates and refunds.";
const H1 = "How to Tell If an Early Access Game Is Abandoned Before You Buy";

const HOWTOGEEK_URL =
  "https://www.howtogeek.com/eyeing-an-early-access-game-how-to-tell-if-its-worth-buying-or-not/";
const PC_GAMER_URL =
  "https://www.pcgamer.com/software/platforms/steam-now-warns-you-if-that-early-access-game-youre-eyeing-up-has-been-abandoned-by-its-devs/";
const EAW_CURATOR_URL =
  "https://store.steampowered.com/curator/11307018-Early-Access-Watcher/";
const LONG_DRIVE_REDDIT_URL =
  "https://www.reddit.com/r/Thelongdrive/comments/1wbqdly/is_this_game_abandonwere/";
const STEAM_REFUNDS_URL = "https://store.steampowered.com/steam_refunds/";
const STEAMWORKS_EA_DOC =
  "https://partner.steamgames.com/doc/store/earlyaccess";

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

export function generateMetadata(): Metadata {
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
      type: "article",
      siteName: SITE_NAME,
    },
  };
}

const CHECKS: Array<{
  title: string;
  where: string;
  redFlag: string;
  falseAlarm: string;
}> = [
  {
    title: "Steam’s 12-month “not updated” note",
    where:
      "Early Access info box on the Steam store page, just above the Developer Questionnaire.",
    redFlag:
      "The note is present — Valve shows it after 12+ months without a default-branch build or an update-type event (Major Update / Regular Update / Patch Notes).",
    falseAlarm:
      "Active beta-branch work or off-Steam posts can leave the note up; absence of the note is not proof the game is healthy.",
  },
  {
    title: "Last patch notes / update event date",
    where:
      "Steam news hub for the app (filter for developer announcements and patch notes).",
    redFlag:
      "No patch notes or update-type event for many months, especially alongside a silent default branch.",
    falseAlarm:
      "A sales post or non-update event is not the same as a shipping update — read the event type, not just the date.",
  },
  {
    title: "Beta / public test branch activity",
    where:
      "Public depot / branch timestamps (SteamDB is a common third-party view of public Steam data).",
    redFlag:
      "Default branch cold for a year+ with no meaningful public test traffic either.",
    falseAlarm:
      "Busy beta branches can mean active development even when Steam’s store note still fires (default branch only).",
  },
  {
    title: "Developer replies in discussions / Discord / socials",
    where:
      "Steam Discussions for the app, plus any Discord or social links on the store page.",
    redFlag:
      "Months of player questions with no developer replies, or only automated / sales replies.",
    falseAlarm:
      "Quiet forums with occasional substantive replies can be a hiatus, not abandonment — see the table below.",
  },
  {
    title: "Roadmap dates vs reality",
    where:
      "Early Access questionnaire, pinned roadmap posts, and prior “coming soon” milestones.",
    redFlag:
      "Repeated slipped dates with no replacement plan or explanation.",
    falseAlarm:
      "One delayed milestone with a clear new date and recent shipping is common in Early Access.",
  },
  {
    title: "Price & sales pattern (opinion)",
    where: "Store price history and how often the title hits deep discounts.",
    redFlag:
      "Opinion: keeps hitting steep discounts while Steam-visible development stays silent — treat as a soft signal only.",
    falseAlarm:
      "Frequent sales also happen on healthy live-service and long-running EA titles; never use price alone.",
  },
  {
    title: "Recent reviews mentioning “abandoned”",
    where: "Steam recent reviews, sorted by date; skim for update-related complaints.",
    redFlag:
      "A sustained cluster of recent reviews calling the game abandoned or dead, especially with matching shipping silence.",
    falseAlarm:
      "A few angry reviews after a bad patch are not the same as a year of silence — weigh volume and dates.",
  },
];

export default async function HowToTellAbandonedGuidePage() {
  const catalog = await loadCatalog();
  const searchItems = catalog.games.map((g) => ({
    appid: g.appid,
    name: g.name,
    slug: g.slug,
    status: g.status,
    activityScore: g.activityScore,
    lastUpdateLabel: formatUtcDate(g.lastActivityAt),
    headerImage: g.headerImage,
  }));

  const shortAnswer =
    "Before you buy, check the last default-branch update, the last update-type Steam post, beta/public test activity, developer replies, and whether roadmap dates keep slipping. One red flag alone is not proof of abandonment — stack several signals, then compare with a neutral tracker status.";

  const faqs: Array<{ question: string; answer: string }> = [
    {
      question: "How long without updates means abandoned?",
      answer:
        "There is no official Steam “abandoned” label. Steam’s store note appears after 12 months without a default-branch build or update-type event. EA Tracker classifies Likely Abandoned after 12+ months without a Steam community announcement (feed_type=1) or public depot build. Shorter gaps may be a hiatus or slow cadence — see the comparison table on this page.",
    },
    {
      question: "Do Discord-only updates count?",
      answer:
        "Not for Steam’s note, and not for EA Tracker’s automated status. Discord, Patreon, or blog-only updates stay invisible to Steam’s 12-month criteria and to our Steam-only crawl until evidenced on Steam or corrected via /report.",
    },
    {
      question: "Can a game come back after being abandoned?",
      answer:
        "Yes in principle — a new default-branch build or update-type event can clear Steam’s note, and fresh Steam activity can move a title out of Likely Abandoned on EA Tracker. Comebacks are case-by-case; always re-check current dates rather than assuming a status is permanent.",
    },
    {
      question: "Can I refund an Early Access game that got abandoned?",
      answer:
        "Steam’s standard refund offer is within 14 days of purchase with under two hours of playtime (see store.steampowered.com/steam_refunds/). Early Access playtime counts toward that limit. Falling outside those rules does not guarantee a refund — Steam may review exceptions, but there are no promises. Consumers in some jurisdictions may have additional rights.",
    },
  ];

  const faqSchema = buildFaqJsonLd(faqs);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: PAGE_TITLE,
        item: `${SITE_URL}${PAGE_PATH}`,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2">
          Buyer Checklist · Before You Buy Early Access
        </p>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-50 mb-3">
          {H1}
        </h1>
        <p className="max-w-3xl text-sm sm:text-base text-slate-300 leading-relaxed rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-4 py-3">
          {shortAnswer}{" "}
          <Link
            href="/guides/steam-early-access-not-updated-warning"
            className="text-emerald-300 hover:underline font-medium"
          >
            Read Steam&apos;s 12-month note explained
          </Link>
          .
        </p>
      </div>

      <div className="space-y-6">
        {CHECKS.map((check, idx) => (
          <section
            key={check.title}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3"
          >
            <h2 className="text-lg font-bold text-slate-100">
              <span className="font-mono text-emerald-400 mr-2">
                {idx + 1}.
              </span>
              {check.title}
              {idx === 0 && (
                <>
                  {" "}
                  (
                  <Link
                    href="/guides/steam-early-access-not-updated-warning"
                    className="text-emerald-300 hover:underline font-semibold"
                  >
                    full guide
                  </Link>
                  )
                </>
              )}
            </h2>
            <dl className="space-y-2 text-sm text-slate-300 leading-relaxed">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Where to look
                </dt>
                <dd className="mt-0.5">{check.where}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-rose-300/90">
                  Red flag
                </dt>
                <dd className="mt-0.5">{check.redFlag}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-amber-300/90">
                  False alarm
                </dt>
                <dd className="mt-0.5">{check.falseAlarm}</dd>
              </div>
            </dl>
          </section>
        ))}
        <p className="text-xs text-slate-400 leading-relaxed">
          For a broader buying-risk framing, How-To Geek&apos;s{" "}
          <a
            href={HOWTOGEEK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 hover:underline"
          >
            Early Access worth-buying checklist
          </a>{" "}
          is a useful complementary read (general advice; not Steam&apos;s
          official policy).
        </p>
      </div>

      <section className="space-y-3 text-sm text-slate-300 leading-relaxed">
        <h2 className="text-lg font-bold text-slate-100">
          Worked example: The Long Drive (neutral)
        </h2>
        <p>
          On{" "}
          <Link
            href="/game/the-long-drive"
            className="text-emerald-300 hover:underline"
          >
            The Long Drive
          </Link>
          , public Steam shipping data still shows a long gap since the last
          default-branch-style update we record, while on{" "}
          <strong className="font-semibold text-slate-200">2025-07-03</strong>{" "}
          the developer posted{" "}
          <em>&ldquo;Game Abandoned? No.&rdquo;</em> on Steam. Community
          discussion has also reported a Godot rewrite in progress — that claim
          is{" "}
          <a
            href={LONG_DRIVE_REDDIT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 hover:underline"
          >
            community-reported
          </a>
          , not a Steamworks timestamp. Stack the Steam dates, the developer
          statement, and community reports separately; do not collapse them into
          one verdict.
        </p>
        <p>
          For contrast, check a title with fresher Steam shipping such as{" "}
          <Link
            href="/game/lethal-company"
            className="text-emerald-300 hover:underline"
          >
            Lethal Company
          </Link>{" "}
          and compare statuses side by side.
        </p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h2 className="text-lg font-bold text-slate-100">
          Abandoned vs hiatus vs slow
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Third-party curator{" "}
          <a
            href={EAW_CURATOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 hover:underline"
          >
            Early Access Watcher
          </a>{" "}
          distinguishes hiatus (updates paused, but developers still
          communicative) from abandonware. EA Tracker&apos;s labels are
          Steam-activity buckets, not legal abandonment findings:
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2.5 font-medium">Label</th>
                <th className="px-3 py-2.5 font-medium">Typical signals</th>
                <th className="px-3 py-2.5 font-medium">How we treat it</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="px-3 py-3 font-medium text-slate-100 align-top">
                  Slow / active long-runner
                </td>
                <td className="px-3 py-3 align-top">
                  Infrequent but recent patches or update posts; roadmap still
                  moving.
                </td>
                <td className="px-3 py-3 align-top">
                  Often Active or Slowing on{" "}
                  <Link
                    href="/methodology"
                    className="text-emerald-300 hover:underline"
                  >
                    /methodology
                  </Link>
                  .
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 font-medium text-slate-100 align-top">
                  Hiatus
                </td>
                <td className="px-3 py-3 align-top">
                  Shipping paused, but developers still reply and explain the
                  pause (EAW-style definition).
                </td>
                <td className="px-3 py-3 align-top">
                  May look Stalled on Steam timestamps alone — read replies
                  before calling it abandoned.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 font-medium text-slate-100 align-top">
                  Likely abandoned
                </td>
                <td className="px-3 py-3 align-top">
                  12+ months without Steam announcements or public builds;
                  little or no substantive developer reply.
                </td>
                <td className="px-3 py-3 align-top">
                  Listed on{" "}
                  <Link
                    href="/abandoned-early-access-games"
                    className="text-emerald-300 hover:underline"
                  >
                    /abandoned-early-access-games
                  </Link>
                  ; still not a legal determination.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 text-sm text-slate-300 leading-relaxed">
        <h2 className="text-lg font-bold text-slate-100">
          Already bought it?
        </h2>
        <p>
          If you are still inside Steam&apos;s refund window, review{" "}
          <a
            href={STEAM_REFUNDS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 hover:underline"
          >
            Steam&apos;s refund policy
          </a>
          : typically within 14 days of purchase and under two hours of
          playtime. Early Access playtime counts. Outside those rules, you can
          still ask Steam Support, but{" "}
          <strong className="font-semibold text-slate-200">
            there are no promises
          </strong>
          . If our page looks wrong (for example, you ship on a public branch we
          missed), use{" "}
          <Link href="/report" className="text-emerald-300 hover:underline">
            /report
          </Link>
          .
        </p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h2 className="text-lg font-bold text-slate-100">
          Check any game instantly
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Search EA Tracker&apos;s catalog for a dated status, last Steam update,
          and evidence links — or start from the{" "}
          <Link href="/" className="text-emerald-300 hover:underline">
            home page
          </Link>
          .
        </p>
        <GameSearchAutocomplete
          items={searchItems}
          placeholder="Search a Steam Early Access game..."
        />
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
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
        className="rounded-xl border border-slate-800 bg-slate-950/50 p-5"
      >
        <h2 className="text-sm font-semibold text-slate-100 mb-3">
          Related pages
        </h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-300">
          <li>
            <Link
              href="/guides/steam-early-access-not-updated-warning"
              className="text-emerald-300 hover:underline"
            >
              Steam 12-month note explained
            </Link>
          </li>
          <li>
            <Link
              href="/abandoned-early-access-games"
              className="text-emerald-300 hover:underline"
            >
              Abandoned Early Access list
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
            <Link href="/stats" className="text-emerald-300 hover:underline">
              Stats
            </Link>
          </li>
          <li>
            <Link href="/report" className="text-emerald-300 hover:underline">
              Report incorrect data
            </Link>
          </li>
          <li>
            <Link
              href="/game/the-long-drive"
              className="text-emerald-300 hover:underline"
            >
              The Long Drive
            </Link>
          </li>
          <li>
            <Link
              href="/game/lethal-company"
              className="text-emerald-300 hover:underline"
            >
              Lethal Company
            </Link>
          </li>
        </ul>
      </nav>

      <section className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-xs text-slate-400 leading-relaxed space-y-2">
        <p className="font-semibold text-slate-200">Sources</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <a
              href={STEAMWORKS_EA_DOC}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 hover:underline"
            >
              Steamworks: Early Access
            </a>
          </li>
          <li>
            <a
              href={PC_GAMER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 hover:underline"
            >
              PC Gamer on Steam&apos;s Early Access inactivity note (2025-02)
            </a>
          </li>
          <li>
            <a
              href={HOWTOGEEK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 hover:underline"
            >
              How-To Geek — is that Early Access game worth buying?
            </a>
          </li>
          <li>
            <a
              href={EAW_CURATOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 hover:underline"
            >
              Early Access Watcher curator (hiatus vs abandonware)
            </a>
          </li>
          <li>
            <a
              href={LONG_DRIVE_REDDIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 hover:underline"
            >
              r/Thelongdrive community report (label as community-reported)
            </a>
          </li>
          <li>
            <a
              href={STEAM_REFUNDS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 hover:underline"
            >
              Steam Refunds policy
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
