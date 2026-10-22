import { neon } from "@neondatabase/serverless";
import { getDb } from "./index";
import { games, gameStatus, newsItems } from "./schema";
import type { GameRecord } from "../lib/catalog";
import importedGames from "../../data/imported-games.json";

function toDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

function toTimestamp(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

type SeedResult = {
  seeded: boolean;
  count: number;
  inserted?: number;
  skippedExisting?: number;
  error?: string;
};

async function insertGameIfMissing(
  db: NonNullable<ReturnType<typeof getDb>>,
  game: GameRecord
): Promise<"inserted" | "skipped"> {
  const inserted = await db
    .insert(games)
    .values({
      appid: game.appid,
      name: game.name,
      slug: game.slug,
      type: "game",
      isFree: game.isFree,
      priceCents: game.priceCents,
      currency: game.currency || "USD",
      developers: game.developers ?? [],
      publishers: game.publishers ?? [],
      genres: game.genres ?? [],
      tags: game.tags ?? [],
      headerImage: game.headerImage,
      shortDescription: game.shortDescription,
      isEarlyAccess: game.isEarlyAccess,
      eaStartDate: toDateOnly(game.eaStartDate),
      leftEaAt: toDateOnly(game.leftEaAt),
      reviewScoreDesc: game.reviewScoreDesc,
      totalPositive: game.totalPositive,
      totalNegative: game.totalNegative,
      totalReviews: game.totalReviews,
      adult: game.adult,
      delisted: game.delisted,
      externalUpdatesUrl: game.externalUpdatesUrl,
      currentPlayers: game.currentPlayers ?? null,
      plannedEaEndDate: toDateOnly(game.plannedEaEndDate ?? null),
      plannedEaDurationText: game.plannedEaDurationText ?? null,
      planned10TimingText: game.planned10TimingText ?? null,
      storeCheckedAt: new Date(),
      newsCheckedAt: new Date(),
    })
    .onConflictDoNothing({ target: games.appid })
    .returning({ appid: games.appid });

  if (inserted.length === 0) {
    return "skipped";
  }

  await db
    .insert(gameStatus)
    .values({
      appid: game.appid,
      status: game.status,
      activityScore: game.activityScore,
      lastPatchAt: toTimestamp(game.lastPatchAt),
      lastDevPostAt: toTimestamp(game.lastDevPostAt),
      lastBuildAt: toTimestamp(game.lastBuildAt),
      lastActivityAt: toTimestamp(game.lastActivityAt),
      lastShipAt: toTimestamp(game.lastShipAt),
      posts12m: game.posts12m,
      patches12m: game.patches12m,
      post10Patches: game.post10Patches,
      eaDurationDays: game.eaDurationDays,
      reasons: game.reasons ?? [],
      indexable: game.indexable,
      statusChangedAt: toTimestamp(game.statusChangedAt) ?? new Date(),
      computedAt: new Date(),
    })
    .onConflictDoNothing({ target: gameStatus.appid });

  for (const a of game.announcements ?? []) {
    await db
      .insert(newsItems)
      .values({
        gid: a.gid,
        appid: game.appid,
        title: a.title,
        url: a.url,
        date: toTimestamp(a.date) ?? new Date(),
        feedname: "steam_community_announcements",
        feedType: 1,
        tags: a.tags ?? [],
        isPatch: a.isPatch,
        isPatchHeuristic: a.isPatchHeuristic,
        excerpt: a.excerpt ?? "",
      })
      .onConflictDoNothing();
  }

  return "inserted";
}

/**
 * Additive seed: INSERT JSON rows whose appids are missing in Neon.
 * Never updates, deletes, or truncates existing rows.
 */
export async function seedMissingFromImportedJson(options?: {
  databaseUrl?: string;
}): Promise<SeedResult> {
  const url = options?.databaseUrl ?? process.env.DATABASE_URL;
  if (!url) {
    return { seeded: false, count: 0, error: "DATABASE_URL is not set" };
  }

  try {
    const db = getDb();
    if (!db) {
      return { seeded: false, count: 0, error: "Failed to open Drizzle client" };
    }

    const records = importedGames as GameRecord[];
    let inserted = 0;
    let skippedExisting = 0;

    for (const game of records) {
      const result = await insertGameIfMissing(db, game);
      if (result === "inserted") inserted += 1;
      else skippedExisting += 1;
    }

    return {
      seeded: inserted > 0,
      count: inserted,
      inserted,
      skippedExisting,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[seed-missing] failed:", message);
    return { seeded: false, count: 0, error: message };
  }
}

/**
 * Seed Neon from data/imported-games.json when the games table is empty.
 * If rows already exist, runs the additive missing-appid path only (no overwrites).
 */
export async function seedFromImportedJson(options?: {
  force?: boolean;
  databaseUrl?: string;
}): Promise<SeedResult> {
  const url = options?.databaseUrl ?? process.env.DATABASE_URL;
  if (!url) {
    return { seeded: false, count: 0, error: "DATABASE_URL is not set" };
  }

  const sql = neon(url);
  try {
    const existing = await sql`SELECT count(*)::int AS count FROM games`;
    const count = Number(existing[0]?.count ?? 0);

    // Table already has data: only insert missing appids (never overwrite).
    if (count > 0 && !options?.force) {
      return seedMissingFromImportedJson({ databaseUrl: url });
    }

    const db = getDb();
    if (!db) {
      return { seeded: false, count: 0, error: "Failed to open Drizzle client" };
    }

    const records = importedGames as GameRecord[];
    let inserted = 0;
    let skippedExisting = 0;

    for (const game of records) {
      const result = await insertGameIfMissing(db, game);
      if (result === "inserted") inserted += 1;
      else skippedExisting += 1;
    }

    return {
      seeded: inserted > 0,
      count: inserted,
      inserted,
      skippedExisting,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[seed] failed:", message);
    return { seeded: false, count: 0, error: message };
  }
}

/** Pure helper for unit tests — decide insert vs skip without touching the DB. */
export function planAdditiveSeedInserts(
  jsonAppids: number[],
  existingAppids: Iterable<number>
): { toInsert: number[]; toSkip: number[] } {
  const existing = new Set(existingAppids);
  const toInsert: number[] = [];
  const toSkip: number[] = [];
  for (const id of jsonAppids) {
    if (existing.has(id)) toSkip.push(id);
    else toInsert.push(id);
  }
  return { toInsert, toSkip };
}
