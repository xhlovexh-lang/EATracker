import { asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { builds, games, gameStatus, newsItems, slugHistory } from "../db/schema";
import type { StatusReason } from "../db/schema";
import { evaluateGameStatus } from "./status-engine";
import type {
  GameAnnouncement,
  GameRecord,
  GlobalCatalogStats,
  MonthlyActivityBin,
} from "./catalog";
import {
  buildCatalogStatsFromGames,
  buildGenreCategoriesFromGames,
  getJsonFallbackGames,
  withFreshVerdict,
} from "./catalog";

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}

function dateOnly(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function generate36MonthTimeline(
  announcements: GameAnnouncement[],
  refDate = new Date()
): MonthlyActivityBin[] {
  const bins: MonthlyActivityBin[] = [];
  const map = new Map<string, MonthlyActivityBin>();

  for (let i = 35; i >= 0; i--) {
    const d = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth() - i, 1));
    const ym = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    });
    const bin: MonthlyActivityBin = { month: ym, label, patches: 0, posts: 0 };
    bins.push(bin);
    map.set(ym, bin);
  }

  for (const a of announcements) {
    const ym = a.date.slice(0, 7);
    const bin = map.get(ym);
    if (!bin) continue;
    if (a.isPatch || a.isPatchHeuristic) bin.patches += 1;
    else bin.posts += 1;
  }

  return bins;
}

function mapDbRowToGameRecord(params: {
  game: typeof games.$inferSelect;
  status: typeof gameStatus.$inferSelect | null;
  announcements: GameAnnouncement[];
}): GameRecord {
  const { game, status, announcements } = params;
  const totalReviews = game.totalReviews ?? 0;
  const evaluated = evaluateGameStatus({
    isEarlyAccessNow: game.isEarlyAccess,
    wasTrackedInEarlyAccess: true,
    eaStartDate: dateOnly(game.eaStartDate),
    leftEarlyAccessAt: dateOnly(game.leftEaAt),
    lastPatchAt: status?.lastPatchAt ?? null,
    lastDevPostAt: status?.lastDevPostAt ?? null,
    lastBuildAt: status?.lastBuildAt ?? null,
    posts12m: status?.posts12m ?? 0,
    patches12m: status?.patches12m ?? 0,
    post10Patches: status?.post10Patches ?? 0,
    totalReviews,
    totalPosts: Math.max(announcements.length, status?.posts12m ?? 0, 0),
    adult: game.adult ?? false,
    delisted: game.delisted ?? false,
    externalUpdatesUrl: game.externalUpdatesUrl,
  });

  return {
    appid: game.appid,
    name: game.name,
    slug: game.slug,
    developers: game.developers ?? [],
    publishers: game.publishers ?? [],
    genres: game.genres ?? [],
    tags: game.tags ?? [],
    isFree: game.isFree ?? false,
    priceCents: game.priceCents ?? null,
    currency: game.currency ?? "USD",
    headerImage:
      game.headerImage ??
      `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`,
    shortDescription: game.shortDescription ?? "",
    isEarlyAccess: game.isEarlyAccess,
    eaStartDate: dateOnly(game.eaStartDate),
    leftEaAt: dateOnly(game.leftEaAt),
    reviewScoreDesc: game.reviewScoreDesc ?? "No user reviews",
    totalPositive: game.totalPositive ?? 0,
    totalNegative: game.totalNegative ?? 0,
    totalReviews,
    adult: game.adult ?? false,
    delisted: game.delisted ?? false,
    externalUpdatesUrl: game.externalUpdatesUrl ?? null,
    currentPlayers: game.currentPlayers ?? null,
    plannedEaEndDate: dateOnly(game.plannedEaEndDate),
    plannedEaDurationText: game.plannedEaDurationText ?? null,
    planned10TimingText: game.planned10TimingText ?? null,
    status: status?.status ?? evaluated.status,
    activityScore: status?.activityScore ?? evaluated.activityScore,
    lastPatchAt: iso(status?.lastPatchAt),
    lastDevPostAt: iso(status?.lastDevPostAt),
    lastBuildAt: iso(status?.lastBuildAt),
    lastActivityAt: iso(status?.lastActivityAt) ?? evaluated.lastActivityAt?.toISOString() ?? null,
    lastShipAt: iso(status?.lastShipAt) ?? evaluated.lastShipAt?.toISOString() ?? null,
    posts12m: status?.posts12m ?? 0,
    patches12m: status?.patches12m ?? 0,
    post10Patches: status?.post10Patches ?? 0,
    eaDurationDays: status?.eaDurationDays ?? evaluated.eaDurationDays,
    reasons: (status?.reasons as StatusReason[] | undefined) ?? evaluated.reasons,
    indexable: status?.indexable ?? evaluated.indexable,
    verdictSummary: evaluated.verdictSummary,
    statusChangedAt: iso(status?.statusChangedAt) ?? new Date().toISOString(),
    announcements,
    monthlyTimeline: generate36MonthTimeline(announcements),
  };
}

async function loadGamesFromDb(): Promise<GameRecord[] | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const rows = await db
      .select({
        game: games,
        status: gameStatus,
      })
      .from(games)
      .leftJoin(gameStatus, eq(games.appid, gameStatus.appid))
      .orderBy(desc(games.totalReviews));

    if (rows.length === 0) return null;

    const news = await db
      .select()
      .from(newsItems)
      .orderBy(desc(newsItems.date));

    const newsByApp = new Map<number, GameAnnouncement[]>();
    for (const item of news) {
      const list = newsByApp.get(item.appid) ?? [];
      if (list.length >= 12) continue;
      list.push({
        gid: item.gid,
        title: item.title,
        url: item.url,
        date: item.date.toISOString(),
        tags: item.tags ?? [],
        isPatch: item.isPatch,
        isPatchHeuristic: item.isPatchHeuristic,
        excerpt: item.excerpt ?? "",
      });
      newsByApp.set(item.appid, list);
    }

    return rows.map(({ game, status }) =>
      mapDbRowToGameRecord({
        game,
        status,
        announcements: newsByApp.get(game.appid) ?? [],
      })
    );
  } catch (err) {
    console.warn("[repository] DB load failed, will fall back to JSON:", err);
    return null;
  }
}

export type CatalogSource = "database" | "json-fallback";

export interface CatalogSnapshot {
  source: CatalogSource;
  games: GameRecord[];
  stats: GlobalCatalogStats;
  genres: ReturnType<typeof buildGenreCategoriesFromGames>;
  gameCount: number;
}

let catalogCache: { expiresAt: number; value: CatalogSnapshot } | null = null;
const CATALOG_CACHE_MS = 60_000;

/**
 * Primary site data loader: Neon when available and non-empty, otherwise
 * data/imported-games.json so the site never breaks.
 */
export async function loadCatalog(options?: {
  bypassCache?: boolean;
}): Promise<CatalogSnapshot> {
  const now = Date.now();
  if (!options?.bypassCache && catalogCache && catalogCache.expiresAt > now) {
    return catalogCache.value;
  }

  const fromDb = await loadGamesFromDb();
  let source: CatalogSource = "json-fallback";
  let games: GameRecord[];

  if (fromDb && fromDb.length > 0) {
    source = "database";
    games = fromDb;
  } else {
    games = getJsonFallbackGames().map(withFreshVerdict);
  }

  const value: CatalogSnapshot = {
    source,
    games,
    stats: buildCatalogStatsFromGames(games),
    genres: buildGenreCategoriesFromGames(games),
    gameCount: games.length,
  };

  catalogCache = { expiresAt: now + CATALOG_CACHE_MS, value };
  return value;
}

export async function getGameCountFromDb(): Promise<{
  ok: boolean;
  count: number | null;
  source: CatalogSource | "unavailable";
  error?: string;
}> {
  const db = getDb();
  if (!db) {
    return { ok: false, count: null, source: "unavailable", error: "DATABASE_URL not set" };
  }
  try {
    const result = await db.select({ count: sql<number>`count(*)::int` }).from(games);
    const count = Number(result[0]?.count ?? 0);
    return { ok: true, count, source: count > 0 ? "database" : "database" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, count: null, source: "unavailable", error: message };
  }
}

export async function findGameBySlug(
  slug: string
): Promise<{ game: GameRecord | null; redirectToSlug?: string; source: CatalogSource }> {
  const catalog = await loadCatalog();
  const direct = catalog.games.find((g) => g.slug === slug);
  if (direct) return { game: direct, source: catalog.source };

  const match = slug.match(/-(\d+)$/);
  if (match) {
    const id = Number.parseInt(match[1], 10);
    const byId = catalog.games.find((g) => g.appid === id);
    if (byId) return { game: byId, redirectToSlug: byId.slug, source: catalog.source };
  }

  // Check slug history in DB when available
  const db = getDb();
  if (db) {
    try {
      const hist = await db.query.slugHistory.findFirst({
        where: eq(slugHistory.oldSlug, slug),
      });
      if (hist) {
        const byId = catalog.games.find((g) => g.appid === hist.appid);
        if (byId) {
          return { game: byId, redirectToSlug: byId.slug, source: catalog.source };
        }
      }
    } catch {
      // ignore — fall through to not found
    }
  }

  return { game: null, source: catalog.source };
}

export async function listIndexableGamesForSitemap(): Promise<GameRecord[]> {
  const catalog = await loadCatalog();
  return catalog.games
    .filter((g) => g.indexable && !g.delisted && !g.adult)
    .sort((a, b) => a.appid - b.appid);
}

export async function getTopGamesForStaticParams(limit: number): Promise<GameRecord[]> {
  // Prefer JSON at build time for stable, fast params; enrich order by reviews.
  const catalog = await loadCatalog();
  return [...catalog.games]
    .sort((a, b) => b.totalReviews - a.totalReviews || b.activityScore - a.activityScore)
    .slice(0, limit);
}

/** Oldest-checked games for rolling store refresh. */
export async function pickGamesForStoreRefresh(limit: number): Promise<number[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({ appid: games.appid })
    .from(games)
    .orderBy(sql`${games.storeCheckedAt} ASC NULLS FIRST`)
    .limit(limit);
  return rows.map((r) => r.appid);
}

export async function pickHotGameIds(limit: number): Promise<number[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({ appid: games.appid })
    .from(games)
    .innerJoin(gameStatus, eq(games.appid, gameStatus.appid))
    .where(sql`${gameStatus.status} IN ('active', 'slowing')`)
    .orderBy(desc(gameStatus.activityScore))
    .limit(limit);
  return rows.map((r) => r.appid);
}

export async function countTrackedGames(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)::int` }).from(games);
  return Number(result[0]?.count ?? 0);
}

export async function listAllAppIdsOrdered(limit?: number): Promise<number[]> {
  const db = getDb();
  if (!db) return [];
  const q = db
    .select({ appid: games.appid })
    .from(games)
    .orderBy(asc(games.appid));
  const rows = limit ? await q.limit(limit) : await q;
  return rows.map((r) => r.appid);
}

export { builds };
