import { STATUS_META } from "../config/status";
import {
  GAME_INTRO_OVERRIDES,
  getAdjustedStatusLabel,
  getDeveloperStatement,
  getLastUpdateAt,
  resolvePrimaryGenre,
  type GameRecord,
} from "./catalog";
import {
  formatDurationDays,
  formatUtcDate,
  formatUtcMonthYear,
} from "./status-engine";

const DEFAULT_SITE_URL = "https://eatracker.clear-frames.com";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  DEFAULT_SITE_URL
).replace(/\/$/, "");
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "EA Tracker";

/** Truncate SEO titles on a word boundary instead of mid-word. */
export function truncateTitleAtWord(title: string, max = 60): string {
  if (title.length <= max) return title;
  const sliced = title.slice(0, max);
  const lastSpace = sliced.lastIndexOf(" ");
  if (lastSpace > Math.floor(max * 0.5)) {
    return sliced.slice(0, lastSpace).replace(/[.,:;!?–—-]+$/u, "").trimEnd();
  }
  return sliced.trimEnd();
}

/**
 * Title & Meta Generator per Spec Section 9.2:
 * - Game Title: `Is {Game} Abandoned? Last Update {Mon YYYY} ({Status})` (<= 60 chars)
 * - "Last Update" is always lastShipAt (patch/build), never a bare developer post.
 */
export function buildGameSeoMeta(game: GameRecord) {
  const lastUpdateAt = getLastUpdateAt(game);
  const lastUpdateMonthYear = formatUtcMonthYear(lastUpdateAt);
  const adjusted = getAdjustedStatusLabel(game);
  const statusShort = adjusted.shortLabel;

  const fullTitle = `Is ${game.name} Abandoned? Last Update ${lastUpdateMonthYear} (${statusShort})`;
  const compactTitle = `Is ${game.name} Abandoned? Last Update ${lastUpdateMonthYear}`;
  const minimalTitle = `Is ${game.name} Abandoned? (${STATUS_META[game.status].shortLabel})`;

  let title = fullTitle;
  if (fullTitle.length > 60) {
    title =
      compactTitle.length <= 60
        ? compactTitle
        : truncateTitleAtWord(minimalTitle, 60);
  }

  const durationStr = formatDurationDays(game.eaDurationDays);
  const lastUpdateStr = formatUtcDate(lastUpdateAt);
  const lastPostStr = formatUtcDate(game.lastDevPostAt);

  const description = `${game.name} has been in Early Access for ${durationStr}. Last update: ${lastUpdateStr}. Last developer post: ${lastPostStr}. Updated ${game.patches12m} times in the past year. Status: ${adjusted.label}.`;

  return {
    title,
    description,
    canonical: `${SITE_URL}/game/${game.slug}`,
  };
}

const KSP2_EXTRA_FAQS: Array<{ question: string; answer: string }> = [
  {
    question: "Is Kerbal Space Program 2 still being developed?",
    answer:
      "The last public Steam update was v0.2.2.0 on June 11, 2024, and its studio Intercept Games has been closed. We have found no newer update on Steam; this page re-checks Steam daily.",
  },
  {
    question: "Should I buy KSP2 or KSP1?",
    answer:
      "We don't make buying recommendations. Kerbal Space Program 2 is still Early Access with no Steam update since June 2024; compare that with the update history on each game's Steam page.",
  },
];

/**
 * Generates deterministic FAQ items for both UI display and FAQPage JSON-LD.
 * FAQ answer 1 and the FAQPage JSON-LD must stay identical.
 */
export function buildGameFaqItems(game: GameRecord): Array<{
  question: string;
  answer: string;
}> {
  const lastUpdateAt = getLastUpdateAt(game);
  const lastUpdateDate = formatUtcDate(lastUpdateAt);
  const lastPostDate = formatUtcDate(game.lastDevPostAt);
  const duration = formatDurationDays(game.eaDurationDays);
  const eaStart = formatUtcDate(game.eaStartDate);
  const developerStatement = getDeveloperStatement(game);

  let isAbandonedAnswer = `Based on public Steam records, ${game.name}'s last default-branch update was ${lastUpdateDate}.`;
  if (developerStatement) {
    isAbandonedAnswer += ` On ${formatUtcDate(developerStatement.date)} the developer said "${developerStatement.quote}" (source: Steam announcement).`;
  }
  isAbandonedAnswer +=
    " Our status only measures public Steam activity, not private development.";

  const lastUpdatedAnswer = `The last update for ${game.name} on Steam (patch note or public build) was on ${lastUpdateDate}. The most recent developer announcement was posted on ${lastPostDate}.`;

  const durationAnswer = game.isEarlyAccess
    ? `${game.name} entered Steam Early Access on ${eaStart} and has been in Early Access for ${duration} (${game.eaDurationDays ?? 0} days).`
    : `${game.name} entered Steam Early Access on ${eaStart} and left Early Access for 1.0 on ${formatUtcDate(game.leftEaAt)}, spending ${duration} in Early Access.`;

  const leaveEaAnswer = !game.isEarlyAccess
    ? `${game.name} already left Steam Early Access on ${formatUtcDate(game.leftEaAt)}.`
    : game.planned10TimingText || game.plannedEaDurationText || game.plannedEaEndDate
      ? `Based on the Steam store Early Access section, the developer has mentioned ${
          game.planned10TimingText
            ? `a 1.0 timing of "${game.planned10TimingText}"`
            : game.plannedEaDurationText
              ? `an Early Access duration of about ${game.plannedEaDurationText}`
              : `a planned end around ${formatUtcDate(game.plannedEaEndDate)}`
        }. This is parsed public store copy, not a contractual commitment.`
      : `The developer (${game.developers.join(", ") || "Unknown"}) hasn't announced a confirmed 1.0 graduation date via structured Steam store metadata. Check the latest community announcements below for roadmap milestones.`;

  const faqs = [
    {
      question: `Is ${game.name} abandoned?`,
      answer: isAbandonedAnswer,
    },
    {
      question: `When was ${game.name} last updated on Steam?`,
      answer: lastUpdatedAnswer,
    },
    {
      question: `How long has ${game.name} been in Early Access?`,
      answer: durationAnswer,
    },
    {
      question: `Will ${game.name} leave Early Access?`,
      answer: leaveEaAnswer,
    },
  ];

  if (game.appid === 954850) {
    faqs.push(...KSP2_EXTRA_FAQS);
  }

  return faqs;
}

/**
 * Generates VideoGame + FAQPage + BreadcrumbList JSON-LD (Spec Section 9.3)
 * Strictly omits `aggregateRating` to comply with Google Rich Results guidelines.
 */
export function buildGameJsonLd(game: GameRecord) {
  const faqs = buildGameFaqItems(game);
  const gameUrl = `${SITE_URL}/game/${game.slug}`;
  const primaryGenre = resolvePrimaryGenre(game);
  const genreCrumb = primaryGenre
    ? {
        name: primaryGenre.name,
        item: `${SITE_URL}/genre/${primaryGenre.slug}`,
      }
    : {
        name: "Abandoned Early Access Games",
        item: `${SITE_URL}/abandoned-early-access-games`,
      };

  const videoGameSchema = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.name,
    description: game.shortDescription,
    url: gameUrl,
    image: game.headerImage,
    gamePlatform: ["PC", "Steam"],
    applicationCategory: "Game",
    datePublished: game.eaStartDate ?? undefined,
    dateModified: getLastUpdateAt(game) ?? game.lastActivityAt ?? game.statusChangedAt,
    author: game.developers.map((dev) => ({
      "@type": "Organization",
      name: dev,
    })),
    publisher: game.publishers.map((pub) => ({
      "@type": "Organization",
      name: pub,
    })),
    genre: game.genres,
    sameAs: [`https://store.steampowered.com/app/${game.appid}/`],
  };

  const faqSchema = {
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
        name: genreCrumb.name,
        item: genreCrumb.item,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: game.name,
        item: gameUrl,
      },
    ],
  };

  return [videoGameSchema, faqSchema, breadcrumbSchema];
}

export function buildItemListJsonLd(params: {
  title: string;
  description: string;
  url: string;
  games: GameRecord[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: params.title,
    description: params.description,
    url: params.url,
    numberOfItems: params.games.length,
    itemListElement: params.games.slice(0, 50).map((g, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${SITE_URL}/game/${g.slug}`,
      name: g.name,
    })),
  };
}

export function getGameIntroOverride(appid: number) {
  return GAME_INTRO_OVERRIDES[appid] ?? null;
}
