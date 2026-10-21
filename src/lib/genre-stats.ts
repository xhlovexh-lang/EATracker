import { STATUS_META, type GameStatusType } from "../config/status";
import type { GameRecord } from "./catalog";
import {
  daysBetweenUtc,
  formatDurationDays,
  formatUtcDate,
} from "./status-engine";

/** Genre directory pages below this game count are noindex,follow and omit from sitemaps. */
export const MIN_GAMES_FOR_GENRE_INDEX = 20;

/** Snapshot date aligned with status evaluation in the catalog. */
const GENRE_STATS_NOW = new Date("2026-10-19T12:00:00Z");

export const GENRE_STATUS_ORDER = [
  "active",
  "slowing",
  "stalled",
  "likely_abandoned",
  "left_early_access",
] as const satisfies readonly GameStatusType[];

export type GenreStatusKey = (typeof GENRE_STATUS_ORDER)[number];

export interface GenreStatusCount {
  status: GenreStatusKey;
  label: string;
  count: number;
  sharePercent: number;
}

export interface GenreHighlightGame {
  appid: number;
  name: string;
  slug: string;
  status: GameStatusType;
  lastActivityAt: string | null;
  lastActivityLabel: string;
  daysSinceActivity: number | null;
}

export interface GenrePageStats {
  genreName: string;
  total: number;
  indexable: boolean;
  statusCounts: GenreStatusCount[];
  notEnoughDataCount: number;
  medianEaDurationDays: number | null;
  medianEaDurationLabel: string;
  recentlyUpdated: GenreHighlightGame[];
  longestGap: GenreHighlightGame[];
  summary: string;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
  }
  return sorted[mid]!;
}

function sharePercent(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function toHighlight(game: GameRecord): GenreHighlightGame {
  const lastActivityAt = game.lastActivityAt;
  const daysSinceActivity = lastActivityAt
    ? daysBetweenUtc(new Date(lastActivityAt), GENRE_STATS_NOW)
    : null;
  return {
    appid: game.appid,
    name: game.name,
    slug: game.slug,
    status: game.status,
    lastActivityAt,
    lastActivityLabel: formatUtcDate(lastActivityAt),
    daysSinceActivity,
  };
}

function activityTimestamp(game: GameRecord): number {
  return game.lastActivityAt ? new Date(game.lastActivityAt).getTime() : Number.NaN;
}

/**
 * Build deterministic genre-page stats from the tracked game list.
 * Summary copy only restates computed numbers — no invented claims.
 */
export function buildGenrePageStats(
  games: GameRecord[],
  genreName: string
): GenrePageStats {
  const total = games.length;
  const countByStatus = (status: GameStatusType) =>
    games.filter((g) => g.status === status).length;

  const statusCounts: GenreStatusCount[] = GENRE_STATUS_ORDER.map((status) => {
    const count = countByStatus(status);
    return {
      status,
      label: STATUS_META[status].shortLabel,
      count,
      sharePercent: sharePercent(count, total),
    };
  });

  const notEnoughDataCount = countByStatus("not_enough_data");
  const medianEaDurationDays = median(
    games
      .map((g) => g.eaDurationDays)
      .filter((days): days is number => days !== null && days >= 0)
  );

  const withActivity = games.filter((g) => g.lastActivityAt);
  const recentlyUpdated = [...withActivity]
    .sort((a, b) => activityTimestamp(b) - activityTimestamp(a))
    .slice(0, 5)
    .map(toHighlight);

  const longestGap = [...games]
    .sort((a, b) => {
      const ta = activityTimestamp(a);
      const tb = activityTimestamp(b);
      const aMissing = Number.isNaN(ta);
      const bMissing = Number.isNaN(tb);
      if (aMissing && bMissing) return a.name.localeCompare(b.name);
      if (aMissing) return -1;
      if (bMissing) return 1;
      return ta - tb;
    })
    .slice(0, 5)
    .map(toHighlight);

  const stats: Omit<GenrePageStats, "summary"> = {
    genreName,
    total,
    indexable: isGenrePageIndexable(total),
    statusCounts,
    notEnoughDataCount,
    medianEaDurationDays,
    medianEaDurationLabel: formatDurationDays(medianEaDurationDays),
    recentlyUpdated,
    longestGap,
  };

  return {
    ...stats,
    summary: buildGenreSummaryParagraph(stats),
  };
}

function formatStatusClause(row: GenreStatusCount): string {
  return `${row.count.toLocaleString()} (${row.sharePercent}%) ${row.label}`;
}

/**
 * Data-only summary paragraph. Wording branches on real status mix so pages
 * do not share an identical template while never inventing facts.
 */
export function buildGenreSummaryParagraph(
  stats: Omit<GenrePageStats, "summary">
): string {
  const { genreName, total, statusCounts, medianEaDurationLabel, recentlyUpdated, longestGap } =
    stats;

  if (total === 0) {
    return `We do not currently track any Steam Early Access games tagged ${genreName}.`;
  }

  const byStatus = Object.fromEntries(
    statusCounts.map((row) => [row.status, row])
  ) as Record<GenreStatusKey, GenreStatusCount>;

  const breakdown = GENRE_STATUS_ORDER.map((key) =>
    formatStatusClause(byStatus[key])
  ).join(", ");

  const recent = recentlyUpdated[0];
  const stale = longestGap[0];

  const recentClause = recent
    ? `The most recently updated title is ${recent.name} (last Steam activity ${recent.lastActivityLabel}).`
    : "None of these titles have a recorded Steam activity timestamp yet.";

  const staleClause = stale
    ? stale.lastActivityAt
      ? `The longest gap since an update belongs to ${stale.name} (last Steam activity ${stale.lastActivityLabel}${
          stale.daysSinceActivity !== null
            ? `, ${stale.daysSinceActivity.toLocaleString()} days ago`
            : ""
        }).`
      : `${stale.name} has no recorded Steam activity timestamp in our catalog.`
    : "";

  const activeShare = byStatus.active.sharePercent;
  const abandonedShare = byStatus.likely_abandoned.sharePercent;
  const stalledShare = byStatus.stalled.sharePercent;
  const leftShare = byStatus.left_early_access.sharePercent;
  const slowingShare = byStatus.slowing.sharePercent;

  let lead: string;
  if (activeShare >= 70) {
    lead = `Of the ${total.toLocaleString()} ${genreName} Early Access games we track, most still look active on Steam: ${breakdown}.`;
  } else if (abandonedShare + stalledShare >= 40) {
    lead = `Among ${total.toLocaleString()} tracked ${genreName} Early Access games, inactivity is common — ${breakdown}.`;
  } else if (leftShare >= 15) {
    lead = `We track ${total.toLocaleString()} ${genreName} Early Access games, including a notable share that already graduated to 1.0: ${breakdown}.`;
  } else if (slowingShare >= 15) {
    lead = `Across ${total.toLocaleString()} ${genreName} Early Access games, a sizable slice is slowing down: ${breakdown}.`;
  } else {
    lead = `We currently track ${total.toLocaleString()} ${genreName} Early Access games with this status mix: ${breakdown}.`;
  }

  const medianClause =
    stats.medianEaDurationDays !== null
      ? `Median Early Access duration is ${medianEaDurationLabel}.`
      : "Median Early Access duration is unavailable because entry dates are missing.";

  return [lead, medianClause, recentClause, staleClause].filter(Boolean).join(" ");
}

export function isGenrePageIndexable(gameCount: number): boolean {
  return gameCount >= MIN_GAMES_FOR_GENRE_INDEX;
}

export function genreIndexabilityCounts(
  categories: Array<{ slug: string }>,
  gamesForSlug: (slug: string) => GameRecord[]
): { indexed: number; noindexed: number; total: number } {
  let indexed = 0;
  let noindexed = 0;
  for (const cat of categories) {
    if (isGenrePageIndexable(gamesForSlug(cat.slug).length)) indexed += 1;
    else noindexed += 1;
  }
  return { indexed, noindexed, total: categories.length };
}
