import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "../../../lib/seo";

export const revalidate = 86400;

const PAGE_PATH = "/guides/steam-early-access-not-updated-warning";
const PAGE_TITLE =
  'Steam\'s "Not Updated in 12 Months" EA Note, Explained';
const PAGE_DESCRIPTION =
  'What Steam\'s Early Access "not updated" note means, Valve\'s exact two triggers, why it misses some active games, and how to check a game yourself.';
const H1 = 'What Steam\'s "Not Updated" Early Access Warning Actually Means';

const STEAMWORKS_EA_DOC =
  "https://partner.steamgames.com/doc/store/earlyaccess";
const PC_GAMER_URL =
  "https://www.pcgamer.com/software/platforms/steam-now-warns-you-if-that-early-access-game-youre-eyeing-up-has-been-abandoned-by-its-devs/";
const OVERBAKED_URL =
  "https://overbaked.studio/blog/steam-early-access-when-it-works/";
const GAMER_OF_PASSION_URL =
  "https://www.blogarama.com/gambling-and-games-blogs/1365828-gamer-passion-blog/81170086-steam-flags-nearly-7000-early-access-not-updated-year-yet-six-ten-reviewed-reach-full-release";

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

export default function SteamNotUpdatedWarningGuidePage() {
  const shortAnswer =
    "Steam adds a store-page note when more than 12 months pass since a build on the default Steamworks branch, or since an “update”-type event (Major Update, Regular Update, or Patch Notes). Per Valve (via PC Gamer, 2025-02-06), either trigger alone is enough. The note is about Steam-visible inactivity — not a formal abandonment verdict.";

  const faqs: Array<{ question: string; answer: string }> = [
    {
      question: "Does the Steam note mean the game is abandoned?",
      answer:
        "No. It means no qualifying default-branch build or update-type event has been recorded on Steam for over 12 months. A game can show the note while still being worked on off-Steam or on a beta branch, and a game without the note can still be effectively stalled. Treat it as one signal, not a final verdict.",
    },
    {
      question: "Do beta branch updates count?",
      answer:
        "No. Per Valve’s criteria as published by PC Gamer (2025-02-06) and Steamworks Early Access docs, only builds assigned to the default branch count. Beta or other non-default branch builds do not clear the note.",
    },
    {
      question: "Can developers remove the note?",
      answer:
        "Yes, by shipping a build to the default Steamworks branch or by posting an update-type event (Major Update, Regular Update, or Patch Notes). Once a qualifying update lands, the 12-month clock resets.",
    },
    {
      question: "How many Early Access games have the note?",
      answer:
        "Per a Gamer of Passion study (as of 2026-09-26), 6,989 of 12,320 Early Access games carried the note. That is a third-party snapshot of the Steam store universe they measured, not EA Tracker’s tracked catalog.",
    },
    {
      question: "When did Steam add it?",
      answer:
        "PC Gamer reported the store-page note on 2025-02-05, with Valve’s exact two-trigger wording published in a 2025-02-06 update. Steamworks Early Access documentation now includes the same “Store page notice about last update” section.",
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
          Buyer Guide · Steam Early Access Signal
        </p>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-50 mb-3">
          {H1}
        </h1>
        <p className="max-w-3xl text-sm sm:text-base text-slate-300 leading-relaxed rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-4 py-3">
          {shortAnswer}
        </p>
      </div>

      <section className="space-y-3 text-sm text-slate-300 leading-relaxed">
        <h2 className="text-lg font-bold text-slate-100">
          Where the note appears
        </h2>
        <p>
          On Early Access store pages that meet Valve&apos;s criteria, Steam
          places a highlighted note{" "}
          <strong className="font-semibold text-slate-200">
            just above the Developer Questionnaire
          </strong>{" "}
          inside the Early Access info box. Typical copy states that the last
          update was over N months ago and that the developer&apos;s timeline
          may no longer be up to date (as reported by{" "}
          <a
            href={PC_GAMER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 hover:underline"
          >
            PC Gamer, 2025-02-05
          </a>
          ).
        </p>
        <p className="text-xs text-slate-400">
          We describe placement from reporting and Steamworks docs only — this
          page does not reproduce Steam UI assets.
        </p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h2 className="text-lg font-bold text-slate-100">
          The two triggers (Valve&apos;s wording)
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Per{" "}
          <a
            href={STEAMWORKS_EA_DOC}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 hover:underline"
          >
            Steamworks Early Access documentation
          </a>{" "}
          and Valve&apos;s reply quoted by{" "}
          <a
            href={PC_GAMER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 hover:underline"
          >
            PC Gamer (2025-02-06)
          </a>
          , the notice appears when{" "}
          <em>either</em> criterion is met:
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2.5 font-medium">Trigger</th>
                <th className="px-3 py-2.5 font-medium">What counts</th>
                <th className="px-3 py-2.5 font-medium">What doesn&apos;t</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="px-3 py-3 font-medium text-slate-100 align-top">
                  Default-branch build
                </td>
                <td className="px-3 py-3 align-top">
                  A build assigned to the{" "}
                  <code className="font-mono text-emerald-300 text-xs">
                    default
                  </code>{" "}
                  branch in Steamworks within the last 12 months.
                </td>
                <td className="px-3 py-3 align-top">
                  Builds pushed only to beta / non-default branches.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 font-medium text-slate-100 align-top">
                  Update-type event
                </td>
                <td className="px-3 py-3 align-top">
                  Major Update, Regular Update, or Patch Notes event posted
                  within the last 12 months.
                </td>
                <td className="px-3 py-3 align-top">
                  Discord posts, external blogs, non-update Steam events, or
                  sales-only announcements.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 text-sm text-slate-300 leading-relaxed">
        <h2 className="text-lg font-bold text-slate-100">
          False alarms: active games that still show the note
        </h2>
        <p>
          PC Gamer&apos;s Heartbound example (2025-02-05, corrected): a recent
          beta-branch patch does not clear the note if the default branch has
          been quiet for 12+ months. Developers who communicate only on Discord
          or a studio blog can also leave the Steam note in place even while
          posting elsewhere.
        </p>
        <p>
          For a developer-oriented take on when Early Access communication
          works, see{" "}
          <a
            href={OVERBAKED_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 hover:underline"
          >
            Overbaked Studio&apos;s Early Access write-up
          </a>
          .
        </p>
      </section>

      <section className="space-y-3 text-sm text-slate-300 leading-relaxed">
        <h2 className="text-lg font-bold text-slate-100">
          Missed cases: quiet Steam activity that isn&apos;t the same as
          progress
        </h2>
        <p>
          The inverse also happens. A game may avoid (or later clear) the note
          with minimal Steam-visible activity while development is effectively
          stalled, or a developer may deny abandonment while public shipping
          remains sparse.{" "}
          <Link
            href="/game/the-long-drive"
            className="text-emerald-300 hover:underline"
          >
            The Long Drive
          </Link>{" "}
          is a neutral example in our catalog: Steam activity still shows a long
          gap on the shipping side, and on 2025-07-03 the developer posted{" "}
          <em>&ldquo;Game Abandoned? No.&rdquo;</em> on Steam. That statement is
          a developer claim, not proof of cadence — see the game page for dated
          evidence.
        </p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 text-sm text-slate-300 leading-relaxed">
        <h2 className="text-lg font-bold text-slate-100">
          How common is the note?
        </h2>
        <p>
          Per a Gamer of Passion study, as of{" "}
          <strong className="font-semibold text-slate-200">2026-09-26</strong>,{" "}
          <strong className="font-semibold text-slate-200">
            6,989 of 12,320
          </strong>{" "}
          Early Access games carried the note (
          <a
            href={GAMER_OF_PASSION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 hover:underline"
          >
            study summary
          </a>
          ). That figure is their Steam-wide sample, not EA Tracker&apos;s
          tracked catalog. For our narrower tracked rates, see{" "}
          <Link href="/stats" className="text-emerald-300 hover:underline">
            /stats
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3 text-sm text-slate-300 leading-relaxed">
        <h2 className="text-lg font-bold text-slate-100">
          How EA Tracker differs from Steam&apos;s note
        </h2>
        <p>
          Steam&apos;s note is a binary 12-month flag on default-branch builds
          and update-type events. EA Tracker combines patch notes, developer
          community announcements, and public depot builds into five statuses
          (Active, Slowing Down, Stalled, Likely Abandoned, Left Early Access)
          plus Not enough data when signals are missing. Exact thresholds live
          on{" "}
          <Link
            href="/methodology"
            className="text-emerald-300 hover:underline"
          >
            /methodology
          </Link>
          . Browse titles already classified as stalled or likely abandoned on{" "}
          <Link
            href="/abandoned-early-access-games"
            className="text-emerald-300 hover:underline"
          >
            /abandoned-early-access-games
          </Link>
          .
        </p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h2 className="text-lg font-bold text-slate-100">
          5-step self-check before you buy
        </h2>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-300 leading-relaxed">
          <li>
            Look for Steam&apos;s 12-month note above the Developer
            Questionnaire (this page).
          </li>
          <li>Check the latest patch notes / update event on the Steam news hub.</li>
          <li>
            Compare default-branch vs beta activity (SteamDB is a useful
            third-party view of public depots).
          </li>
          <li>
            Skim recent developer replies in Steam discussions and any linked
            Discord / socials.
          </li>
          <li>
            Cross-check roadmap dates vs reality — full checklist:{" "}
            <Link
              href="/guides/how-to-tell-if-early-access-game-is-abandoned"
              className="text-emerald-300 hover:underline"
            >
              How to tell if an Early Access game is abandoned
            </Link>
            .
          </li>
        </ol>
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
              href="/guides/how-to-tell-if-early-access-game-is-abandoned"
              className="text-emerald-300 hover:underline"
            >
              7-check abandoned checklist
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
            <Link
              href="/game/the-long-drive"
              className="text-emerald-300 hover:underline"
            >
              The Long Drive
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
              Steamworks: Early Access (store page notice)
            </a>
          </li>
          <li>
            <a
              href={PC_GAMER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 hover:underline"
            >
              PC Gamer, 2025-02-05 / Valve reply 2025-02-06
            </a>
          </li>
          <li>
            <a
              href={OVERBAKED_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 hover:underline"
            >
              Overbaked Studio — Steam Early Access when it works
            </a>
          </li>
          <li>
            <a
              href={GAMER_OF_PASSION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 hover:underline"
            >
              Gamer of Passion study summary, as of 2026-09-26
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
