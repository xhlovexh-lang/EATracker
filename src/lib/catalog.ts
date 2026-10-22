import type { GameStatusType } from "../config/status";
import {
  MIN_GAMES_FOR_GENRE_INDEX,
  MIN_GAMES_FOR_GENRE_PAGE,
} from "../config/discovery";
import type { StatusReason } from "../db/schema";
import { evaluateGameStatus } from "./status-engine";
import { GENRE_PAGE_INTROS } from "./genre-intros";
import importedGames from "../../data/imported-games.json";

export { MIN_GAMES_FOR_GENRE_INDEX, MIN_GAMES_FOR_GENRE_PAGE };

export interface MonthlyActivityBin {
  month: string; // YYYY-MM
  label: string; // e.g., "Oct 26"
  patches: number;
  posts: number;
}

export interface GameAnnouncement {
  gid: string;
  title: string;
  url: string;
  date: string; // ISO string
  tags: string[];
  isPatch: boolean;
  isPatchHeuristic: boolean;
  excerpt: string;
}

export interface GameRecord {
  appid: number;
  name: string;
  slug: string;
  developers: string[];
  publishers: string[];
  genres: string[];
  tags: string[];
  isFree: boolean;
  priceCents: number | null;
  currency: string;
  headerImage: string;
  shortDescription: string;
  isEarlyAccess: boolean;
  eaStartDate: string | null;
  leftEaAt: string | null;
  reviewScoreDesc: string;
  totalPositive: number;
  totalNegative: number;
  totalReviews: number;
  adult: boolean;
  delisted: boolean;
  externalUpdatesUrl: string | null;
  /** Concurrent players (ISteamUserStats GetNumberOfCurrentPlayers); null if unknown. */
  currentPlayers: number | null;
  /** Parsed developer-planned EA end date (YYYY-MM-DD), if any. */
  plannedEaEndDate: string | null;
  /** Raw duration phrase from the Steam Early Access section. */
  plannedEaDurationText: string | null;
  /** Raw 1.0 / full-release timing phrase from the Steam Early Access section. */
  planned10TimingText: string | null;
  status: GameStatusType;
  activityScore: number;
  lastPatchAt: string | null;
  lastDevPostAt: string | null;
  lastBuildAt: string | null;
  lastActivityAt: string | null;
  lastShipAt: string | null;
  posts12m: number;
  patches12m: number;
  post10Patches: number;
  eaDurationDays: number | null;
  reasons: StatusReason[];
  indexable: boolean;
  verdictSummary: string;
  statusChangedAt: string;
  announcements: GameAnnouncement[];
  monthlyTimeline: MonthlyActivityBin[];
}

export interface GlobalCatalogStats {
  totalTracked: number;
  activeCount: number;
  slowingCount: number;
  stalledCount: number;
  abandonedCount: number;
  leftEaCount: number;
  overOneYearNoUpdate: number;
  medianEaMonths: number;
  lastGlobalSyncUtc: string;
  yearlyCohortStats: Array<{
    year: number;
    enteredEa: number;
    graduated10: number;
    stalledOrAbandoned: number;
    activeOrSlowing: number;
  }>;
}

/** Refresh verdict copy from the live status engine so wording stays consistent with dates. */
export function withFreshVerdict(game: GameRecord): GameRecord {
  const evalResult = evaluateGameStatus({
    isEarlyAccessNow: game.isEarlyAccess,
    wasTrackedInEarlyAccess: true,
    eaStartDate: game.eaStartDate,
    leftEarlyAccessAt: game.leftEaAt,
    lastPatchAt: game.lastPatchAt ? new Date(game.lastPatchAt) : null,
    lastDevPostAt: game.lastDevPostAt ? new Date(game.lastDevPostAt) : null,
    lastBuildAt: game.lastBuildAt ? new Date(game.lastBuildAt) : null,
    posts12m: game.posts12m,
    patches12m: game.patches12m,
    post10Patches: game.post10Patches,
    totalReviews: game.totalReviews,
    totalPosts: Math.max(game.announcements.length, game.posts12m, 4),
    adult: game.adult,
    delisted: game.delisted,
    externalUpdatesUrl: game.externalUpdatesUrl,
    now: new Date("2026-10-19T12:00:00Z"),
  });
  return {
    ...game,
    currentPlayers: game.currentPlayers ?? null,
    plannedEaEndDate: game.plannedEaEndDate ?? null,
    plannedEaDurationText: game.plannedEaDurationText ?? null,
    planned10TimingText: game.planned10TimingText ?? null,
    lastActivityAt: evalResult.lastActivityAt?.toISOString() ?? game.lastActivityAt,
    lastShipAt: evalResult.lastShipAt?.toISOString() ?? game.lastShipAt,
    eaDurationDays: evalResult.eaDurationDays ?? game.eaDurationDays,
    verdictSummary: evalResult.verdictSummary,
  };
}

function normalizeImportedGame(raw: GameRecord): GameRecord {
  return withFreshVerdict({
    ...raw,
    currentPlayers: raw.currentPlayers ?? null,
    plannedEaEndDate: raw.plannedEaEndDate ?? null,
    plannedEaDurationText: raw.plannedEaDurationText ?? null,
    planned10TimingText: raw.planned10TimingText ?? null,
  });
}

const ALL_GAMES: GameRecord[] = (() => {
  const byId = new Map<number, GameRecord>();
  for (const game of importedGames as GameRecord[]) {
    byId.set(game.appid, normalizeImportedGame(game));
  }
  return [...byId.values()];
})();

/**
 * Synchronous catalog from data/imported-games.json only.
 * Used when Neon is empty or unavailable — never merges demo/fake seed rows.
 */
export function getJsonFallbackGames(): GameRecord[] {
  return ALL_GAMES;
}

/** Row count for /api/health/db — imported JSON only, never demo seed rows. */
export function getImportedGamesJsonCount(): number {
  return (importedGames as GameRecord[]).length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
  return Math.round(value);
}

export function buildCatalogStatsFromGames(games: GameRecord[]): GlobalCatalogStats {
  const count = (status: GameRecord["status"]) => games.filter((game) => game.status === status).length;
  const activeCount = count("active");
  const slowingCount = count("slowing");
  const stalledCount = count("stalled");
  const abandonedCount = count("likely_abandoned");
  const leftEaCount = count("left_early_access");
  const years = new Map<number, GlobalCatalogStats["yearlyCohortStats"][number]>();
  for (const game of games) {
    const year = game.eaStartDate ? Number(game.eaStartDate.slice(0, 4)) : 0;
    if (!year) continue;
    const row = years.get(year) ?? {
      year,
      enteredEa: 0,
      graduated10: 0,
      stalledOrAbandoned: 0,
      activeOrSlowing: 0,
    };
    row.enteredEa += 1;
    if (game.status === "left_early_access") row.graduated10 += 1;
    if (game.status === "stalled" || game.status === "likely_abandoned") row.stalledOrAbandoned += 1;
    if (game.status === "active" || game.status === "slowing") row.activeOrSlowing += 1;
    years.set(year, row);
  }
  return {
    totalTracked: games.length,
    activeCount,
    slowingCount,
    stalledCount,
    abandonedCount,
    leftEaCount,
    overOneYearNoUpdate: stalledCount + abandonedCount,
    medianEaMonths: median(
      games
        .map((game) => game.eaDurationDays)
        .filter((days): days is number => days !== null)
        .map((days) => Math.round(days / 30))
    ),
    lastGlobalSyncUtc: new Date().toISOString(),
    yearlyCohortStats: [...years.values()].sort((a, b) => a.year - b.year),
  };
}

export const GLOBAL_CATALOG_STATS = buildCatalogStatsFromGames(ALL_GAMES);

export function catalogShare(count: number, totalTracked = GLOBAL_CATALOG_STATS.totalTracked): string {
  if (!totalTracked) return "0% of catalog";
  const share = Math.round((count / totalTracked) * 1000) / 10;
  return `${share}% of catalog`;
}

/** Prefer these as breadcrumb / primary genre resolution order. */
const PREFERRED_GENRE_ORDER = [
  "survival",
  "strategy",
  "rpg",
  "simulation",
  "action",
  "space",
  "adventure",
  "indie",
  "horror",
  "open-world",
  "co-op",
  "multiplayer",
] as const;

function countGamesByTag(games: GameRecord[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const game of games) {
    const seen = new Set<string>();
    for (const tag of game.tags) {
      const slug = tag.toLowerCase();
      if (seen.has(slug)) continue;
      seen.add(slug);
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  return counts;
}

export function buildGenreCategoriesFromGames(
  games: GameRecord[]
): Array<{ slug: string; name: string; description: string; gameCount: number }> {
  const counts = countGamesByTag(games);
  const eligible = [...counts.entries()]
    .filter(([slug, count]) => count >= MIN_GAMES_FOR_GENRE_PAGE && GENRE_PAGE_INTROS[slug])
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const bySlug = new Map(
    eligible.map(([slug, gameCount]) => {
      const intro = GENRE_PAGE_INTROS[slug]!;
      return [slug, { slug, name: intro.name, description: intro.description, gameCount }] as const;
    })
  );

  const ordered: Array<{ slug: string; name: string; description: string; gameCount: number }> = [];
  for (const slug of PREFERRED_GENRE_ORDER) {
    const entry = bySlug.get(slug);
    if (entry) {
      ordered.push(entry);
      bySlug.delete(slug);
    }
  }
  for (const entry of bySlug.values()) ordered.push(entry);
  return ordered;
}

export const GENRE_CATEGORIES = buildGenreCategoriesFromGames(ALL_GAMES);

/** Whether a genre page should be indexed (thin pages stay noindex). */
export function isGenreIndexable(gameCount: number): boolean {
  return gameCount >= MIN_GAMES_FOR_GENRE_INDEX;
}

/** Compact footer/nav list — preferred genres only (full set lives on the home page). */
export const FOOTER_GENRE_CATEGORIES = GENRE_CATEGORIES.filter((c) =>
  (PREFERRED_GENRE_ORDER as readonly string[]).includes(c.slug)
);

export function getGenreGameCount(slug: string): number {
  const cat = GENRE_CATEGORIES.find((c) => c.slug === slug.toLowerCase());
  return cat?.gameCount ?? getGamesByGenreSlug(slug).length;
}

export function getAllGames(): GameRecord[] {
  return ALL_GAMES;
}

export function getGameBySlug(slug: string): {
  game: GameRecord | null;
  redirectToSlug?: string;
} {
  const direct = ALL_GAMES.find((g) => g.slug === slug);
  if (direct) return { game: direct };

  const match = slug.match(/-(\d+)$/);
  if (match) {
    const id = Number.parseInt(match[1], 10);
    const byId = ALL_GAMES.find((g) => g.appid === id);
    if (byId) {
      return { game: byId, redirectToSlug: byId.slug };
    }
  }
  return { game: null };
}

export function getGameByAppId(appid: number): GameRecord | null {
  return ALL_GAMES.find((g) => g.appid === appid) ?? null;
}

export function getSimilarActiveGames(
  game: GameRecord,
  limit = 6,
  pool: GameRecord[] = ALL_GAMES
): GameRecord[] {
  return pool
    .filter(
      (g) =>
        g.appid !== game.appid &&
        g.status === "active" &&
        (g.genres.some((genre) => game.genres.includes(genre)) ||
          g.tags.some((tag) => game.tags.includes(tag)))
    )
    .sort((a, b) => b.activityScore - a.activityScore)
    .slice(0, limit);
}

export function getGamesByGenreSlug(
  genreSlug: string,
  pool: GameRecord[] = ALL_GAMES
): GameRecord[] {
  const normalized = genreSlug.toLowerCase();
  return pool.filter(
    (g) =>
      g.tags.some((t) => t.toLowerCase() === normalized) ||
      g.genres.some((gen) => gen.toLowerCase().includes(normalized))
  );
}

/** Resolve a game to one of the sitemap genre categories (name + slug stay paired). */
export function resolvePrimaryGenre(
  game: Pick<GameRecord, "genres" | "tags">
): { slug: string; name: string } | null {
  const tagSet = new Set(game.tags.map((t) => t.toLowerCase()));
  const genreText = game.genres.map((g) => g.toLowerCase());
  // Prefer specific tags over the universal early-access bucket for breadcrumbs.
  const candidates = GENRE_CATEGORIES.filter((c) => c.slug !== "early-access");

  for (const cat of candidates) {
    if (tagSet.has(cat.slug)) return { slug: cat.slug, name: cat.name };
  }
  for (const cat of candidates) {
    if (genreText.some((g) => g.includes(cat.slug) || cat.name.toLowerCase().includes(g))) {
      return { slug: cat.slug, name: cat.name };
    }
  }
  const ea = GENRE_CATEGORIES.find((c) => c.slug === "early-access");
  if (ea && tagSet.has("early-access")) return { slug: ea.slug, name: ea.name };
  return null;
}

export function isKnownGenreSlug(slug: string): boolean {
  const normalized = slug.toLowerCase();
  return GENRE_CATEGORIES.some((c) => c.slug === normalized);
}

export interface DeveloperStatement {
  title: string;
  date: string;
  url: string;
  summary: string;
}

/** Manual /report-confirmed developer statements keyed by Steam AppID. */
const DEVELOPER_STATEMENT_OVERRIDES: Record<number, DeveloperStatement> = {
  // The Long Drive — Steam post "Game Abandoned?" (2025-07-03) denies abandonment.
  1017180: {
    title: "Game Abandoned?",
    date: "2025-07-03T18:36:41.000Z",
    url: "https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1803527891744263",
    summary:
      "Developer says the game is not abandoned and continues work (including an engine rewrite).",
  },
};

/**
 * Returns a developer abandonment statement when one exists (override or announcement title).
 */
export function getDeveloperStatement(game: GameRecord): DeveloperStatement | null {
  const override = DEVELOPER_STATEMENT_OVERRIDES[game.appid];
  if (override) return override;

  const match = game.announcements.find(
    (a) => !a.isPatch && !a.isPatchHeuristic && /abandon/i.test(a.title)
  );
  if (!match) return null;

  const combined = `${match.title} ${match.excerpt}`;
  const denies =
    /not\s+abandon|isn['’]t\s+abandon|abandon(?:ed)?\?\s*no\b|still\s+(?:in\s+)?(?:active\s+)?development/i.test(
      combined
    );

  return {
    title: match.title,
    date: match.date,
    url: match.url,
    summary: denies
      ? `Developer says ${game.name} is not abandoned.`
      : `Developer published a statement about abandonment status: "${match.title}".`,
  };
}
