import { STATUS_META } from "../config/status";
import {
  getDeveloperStatement,
  resolvePrimaryGenre,
  type GameRecord,
} from "./catalog";
import {
  formatDurationDays,
  formatUtcDate,
  formatUtcMonthYear,
} from "./status-engine";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://eatrackers.vercel.app";
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
 * - Game Title: `Is {Game} Abandoned? Last Update {Mon YYYY} ({Status})` (<= 60 chars; drop parenthetical if >60)
 * - Game Meta: `{Game} has been in Early Access for {duration}. Last patch: {date}. Last developer post: {date}. Updated {n} times in the past year. Status: {Status}.`
 *
 * "Last Update" prefers a shipped patch/build date so a developer post is never presented as the latest patch.
 */
export function buildGameSeoMeta(game: GameRecord) {
  const lastUpdateMonthYear = formatUtcMonthYear(
    game.lastShipAt ?? game.lastPatchAt ?? game.lastBuildAt ?? game.lastActivityAt
  );
  const statusShort = STATUS_META[game.status].shortLabel;

  const fullTitle = `Is ${game.name} Abandoned? Last Update ${lastUpdateMonthYear} (${statusShort})`;
  const compactTitle = `Is ${game.name} Abandoned? Last Update ${lastUpdateMonthYear}`;
  const minimalTitle = `Is ${game.name} Abandoned? (${statusShort})`;

  let title = fullTitle;
  if (fullTitle.length > 60) {
    title =
      compactTitle.length <= 60
        ? compactTitle
        : truncateTitleAtWord(minimalTitle, 60);
  }

  const durationStr = formatDurationDays(game.eaDurationDays);
  const lastPatchStr = formatUtcDate(game.lastPatchAt);
  const lastPostStr = formatUtcDate(game.lastDevPostAt);

  const description = `${game.name} has been in Early Access for ${durationStr}. Last patch: ${lastPatchStr}. Last developer post: ${lastPostStr}. Updated ${game.patches12m} times in the past year. Status: ${STATUS_META[game.status].label}.`;

  return {
    title,
    description,
    canonical: `${SITE_URL}/game/${game.slug}`,
  };
}

/**
 * Generates deterministic FAQ items for both UI display and FAQPage JSON-LD (Spec Section 8.1 & 9.3)
 */
export function buildGameFaqItems(game: GameRecord): Array<{
  question: string;
  answer: string;
}> {
  const statusLabel = STATUS_META[game.status].label;
  const lastPatchDate = formatUtcDate(game.lastPatchAt);
  const lastPostDate = formatUtcDate(game.lastDevPostAt);
  const lastBuildDate = formatUtcDate(game.lastBuildAt);
  const duration = formatDurationDays(game.eaDurationDays);
  const eaStart = formatUtcDate(game.eaStartDate);
  const developerStatement = getDeveloperStatement(game);

  let isAbandonedAnswer =
    game.status === "likely_abandoned"
      ? `Based on public Steam records, ${game.name} is currently classified as Likely Abandoned (Activity Score: ${game.activityScore}/100). The last recorded developer activity on Steam was on ${formatUtcDate(game.lastActivityAt)}, with ${game.patches12m} patches and ${game.posts12m} developer announcements in the past 12 months.`
      : game.status === "left_early_access"
        ? `No. ${game.name} graduated from Steam Early Access to full 1.0 release on ${formatUtcDate(game.leftEaAt)} and has shipped ${game.post10Patches} update(s) since leaving Early Access.`
        : `${game.name} is currently classified as ${statusLabel} with an Activity Score of ${game.activityScore}/100. In the past 12 months, the developer shipped ${game.patches12m} patch(es) and posted ${game.posts12m} community announcement(s) on Steam.`;

  if (developerStatement) {
    isAbandonedAnswer += ` Developer statement (${formatUtcDate(developerStatement.date)}): ${developerStatement.summary}`;
  }

  const lastUpdatedAnswer = `The last official patch note for ${game.name} on Steam was published on ${lastPatchDate}, and the most recent developer announcement was posted on ${lastPostDate}.${game.lastBuildAt ? ` Public branch depot data indicates a build update on ${lastBuildDate}.` : ""}`;

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

  return [
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
    dateModified: game.lastActivityAt ?? game.statusChangedAt,
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
