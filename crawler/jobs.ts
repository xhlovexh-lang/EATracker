import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "../src/db";
import {
  builds,
  crawlRuns,
  crawlState,
  games,
  gameStatus,
  newsItems,
  slugHistory,
} from "../src/db/schema";
import {
  CRON_BATCH_SIZE,
  DISCOVERY_TARGET_GAMES,
} from "../src/config/discovery";
import { evaluateGameStatus, maxDate } from "../src/lib/status-engine";
import { createUniqueGameSlug } from "../src/lib/slug";
import {
  discoverEarlyAccessCandidateAppIds,
  fetchCurrentPlayerCount,
  fetchEarlyAccessPlanFromStorePage,
  fetchSteamAppDetails,
  fetchSteamCmdBuildInfo,
  fetchSteamDeveloperNews,
  fetchSteamReviewSummary,
} from "./fetchers";

export type CrawlJobName =
  | "discover"
  | "refresh-hot"
  | "refresh-store"
  | "refresh-news"
  | "refresh-players"
  | "rescore"
  | "seed-migrate";

async function getCrawlCursor(job: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const row = await db.query.crawlState.findFirst({ where: eq(crawlState.job, job) });
  return row?.cursor ?? null;
}

async function setCrawlCursor(job: string, cursor: string | null) {
  const db = getDb();
  if (!db) return;
  await db
    .insert(crawlState)
    .values({ job, cursor, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: crawlState.job,
      set: { cursor, updatedAt: new Date() },
    });
}

export async function syncSingleApp(
  appid: number,
  options?: { includePlayers?: boolean; includeEaPlan?: boolean }
): Promise<boolean> {
  const db = getDb();
  if (!db) {
    throw new Error("DATABASE_URL is required to run crawler jobs against Postgres.");
  }

  const includePlayers = options?.includePlayers ?? true;
  const includeEaPlan = options?.includeEaPlan ?? true;

  const existing = await db.query.games.findFirst({
    where: eq(games.appid, appid),
  });

  const store = await fetchSteamAppDetails(appid);
  if (!store) return false;

  if (store.delisted) {
    if (existing) {
      await db
        .update(games)
        .set({ delisted: true, storeCheckedAt: new Date() })
        .where(eq(games.appid, appid));
    }
    return true;
  }

  if (store.type !== "game" || store.comingSoon) {
    return true;
  }

  // Only track if currently in Early Access OR was already tracked
  if (!store.isEarlyAccess && !existing) {
    return true;
  }

  const reviews = await fetchSteamReviewSummary(appid);
  const buildInfo = await fetchSteamCmdBuildInfo(appid);
  const players = includePlayers ? await fetchCurrentPlayerCount(appid) : null;
  const eaPlan = includeEaPlan ? await fetchEarlyAccessPlanFromStorePage(appid) : null;

  const eaStartDate =
    existing?.eaStartDate ??
    store.parsedReleaseDate ??
    (buildInfo?.steamReleaseDate
      ? buildInfo.steamReleaseDate.toISOString().slice(0, 10)
      : null);

  // When a tracked game loses genre 70, prefer Steam release_date, else detection date.
  const leftEaAt =
    existing?.isEarlyAccess && !store.isEarlyAccess
      ? existing.leftEaAt ??
        store.parsedReleaseDate ??
        new Date().toISOString().slice(0, 10)
      : existing?.leftEaAt ?? null;

  const baseSlug = createUniqueGameSlug(store.name ?? `Game ${appid}`, appid);
  const slugConflict = await db.query.games.findFirst({
    where: eq(games.slug, baseSlug),
  });
  const finalSlug = createUniqueGameSlug(
    store.name ?? `Game ${appid}`,
    appid,
    slugConflict?.appid
  );

  if (existing && existing.slug !== finalSlug) {
    await db
      .insert(slugHistory)
      .values({ oldSlug: existing.slug, appid })
      .onConflictDoNothing();
  }

  await db
    .insert(games)
    .values({
      appid,
      name: store.name ?? `App ${appid}`,
      slug: finalSlug,
      type: store.type,
      isFree: store.isFree,
      priceCents: store.priceCents ?? null,
      currency: store.currency ?? "USD",
      developers: store.developers ?? [],
      publishers: store.publishers ?? [],
      genres: store.genres ?? [],
      headerImage: store.headerImage,
      shortDescription: store.shortDescription,
      isEarlyAccess: store.isEarlyAccess ?? false,
      eaStartDate,
      leftEaAt,
      releaseDateRaw: store.releaseDateRaw,
      comingSoon: store.comingSoon ?? false,
      reviewScoreDesc: reviews?.reviewScoreDesc ?? existing?.reviewScoreDesc,
      totalPositive: reviews?.totalPositive ?? existing?.totalPositive ?? 0,
      totalNegative: reviews?.totalNegative ?? existing?.totalNegative ?? 0,
      totalReviews: reviews?.totalReviews ?? existing?.totalReviews ?? 0,
      adult: store.adult ?? false,
      delisted: false,
      currentPlayers: players ?? existing?.currentPlayers ?? null,
      currentPlayersCheckedAt: players != null ? new Date() : existing?.currentPlayersCheckedAt,
      plannedEaEndDate: eaPlan?.plannedEaEndDate ?? existing?.plannedEaEndDate ?? null,
      plannedEaDurationText:
        eaPlan?.plannedEaDurationText ?? existing?.plannedEaDurationText ?? null,
      planned10TimingText:
        eaPlan?.planned10TimingText ?? existing?.planned10TimingText ?? null,
      storeCheckedAt: new Date(),
      newsCheckedAt: new Date(),
      buildCheckedAt: buildInfo ? new Date() : existing?.buildCheckedAt,
    })
    .onConflictDoUpdate({
      target: games.appid,
      set: {
        name: store.name ?? `App ${appid}`,
        slug: finalSlug,
        priceCents: store.priceCents ?? null,
        developers: store.developers ?? [],
        publishers: store.publishers ?? [],
        genres: store.genres ?? [],
        headerImage: store.headerImage,
        shortDescription: store.shortDescription,
        isEarlyAccess: store.isEarlyAccess ?? false,
        leftEaAt,
        reviewScoreDesc: reviews?.reviewScoreDesc ?? existing?.reviewScoreDesc,
        totalPositive: reviews?.totalPositive ?? existing?.totalPositive ?? 0,
        totalNegative: reviews?.totalNegative ?? existing?.totalNegative ?? 0,
        totalReviews: reviews?.totalReviews ?? existing?.totalReviews ?? 0,
        adult: store.adult ?? false,
        delisted: false,
        currentPlayers: players ?? existing?.currentPlayers ?? null,
        currentPlayersCheckedAt:
          players != null ? new Date() : existing?.currentPlayersCheckedAt,
        plannedEaEndDate: eaPlan?.plannedEaEndDate ?? existing?.plannedEaEndDate ?? null,
        plannedEaDurationText:
          eaPlan?.plannedEaDurationText ?? existing?.plannedEaDurationText ?? null,
        planned10TimingText:
          eaPlan?.planned10TimingText ?? existing?.planned10TimingText ?? null,
        storeCheckedAt: new Date(),
        newsCheckedAt: new Date(),
        buildCheckedAt: buildInfo ? new Date() : existing?.buildCheckedAt,
      },
    });

  if (buildInfo?.buildid && buildInfo.timeUpdated) {
    await db
      .insert(builds)
      .values({
        appid,
        buildid: buildInfo.buildid,
        timeUpdated: buildInfo.timeUpdated,
      })
      .onConflictDoNothing();
  }

  const news = await fetchSteamDeveloperNews(
    appid,
    eaStartDate ? new Date(eaStartDate) : null
  );

  for (const n of news) {
    await db
      .insert(newsItems)
      .values({
        gid: n.gid,
        appid: n.appid,
        title: n.title,
        url: n.url,
        date: n.date,
        feedname: n.feedname,
        feedType: n.feedType,
        tags: n.tags,
        isPatch: n.isPatch,
        isPatchHeuristic: n.isPatchHeuristic,
        excerpt: n.excerpt,
      })
      .onConflictDoNothing();
  }

  await rescoreSingleGame(appid);
  return true;
}

export async function rescoreSingleGame(appid: number) {
  const db = getDb();
  if (!db) return;

  const game = await db.query.games.findFirst({ where: eq(games.appid, appid) });
  if (!game) return;

  const allNews = await db.query.newsItems.findMany({
    where: eq(newsItems.appid, appid),
  });
  const allBuilds = await db.query.builds.findMany({
    where: eq(builds.appid, appid),
  });
  const prevStatus = await db.query.gameStatus.findFirst({
    where: eq(gameStatus.appid, appid),
  });

  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 86400 * 1000);

  const lastPatchAt = maxDate(
    ...allNews.filter((n) => n.isPatch).map((n) => n.date)
  );
  const lastPatchHeuristicAt = maxDate(
    ...allNews.filter((n) => n.isPatchHeuristic).map((n) => n.date)
  );
  const lastDevPostAt = maxDate(...allNews.map((n) => n.date));
  const lastBuildAt = maxDate(...allBuilds.map((b) => b.timeUpdated));

  const posts12m = allNews.filter((n) => n.date >= oneYearAgo).length;
  const patches12m = allNews.filter(
    (n) => (n.isPatch || n.isPatchHeuristic) && n.date >= oneYearAgo
  ).length;

  const leftEaDate = game.leftEaAt ? new Date(game.leftEaAt) : null;
  const post10Patches = leftEaDate
    ? allNews.filter(
        (n) => (n.isPatch || n.isPatchHeuristic) && n.date >= leftEaDate
      ).length
    : 0;

  const evaluated = evaluateGameStatus({
    isEarlyAccessNow: game.isEarlyAccess,
    wasTrackedInEarlyAccess: true,
    eaStartDate: game.eaStartDate,
    leftEarlyAccessAt: game.leftEaAt,
    lastPatchAt,
    lastPatchHeuristicAt,
    lastDevPostAt,
    lastBuildAt,
    posts12m,
    patches12m,
    post10Patches,
    totalReviews: game.totalReviews ?? 0,
    totalPosts: allNews.length,
    adult: game.adult ?? false,
    delisted: game.delisted ?? false,
    externalUpdatesUrl: game.externalUpdatesUrl,
    now,
  });

  const statusChanged = !prevStatus || prevStatus.status !== evaluated.status;
  const activityChanged =
    prevStatus?.lastActivityAt?.getTime() !== evaluated.lastActivityAt?.getTime();

  await db
    .insert(gameStatus)
    .values({
      appid,
      status: evaluated.status,
      activityScore: evaluated.activityScore,
      lastPatchAt,
      lastPatchHeuristicAt,
      lastDevPostAt,
      lastBuildAt,
      lastActivityAt: evaluated.lastActivityAt,
      lastShipAt: evaluated.lastShipAt,
      posts12m,
      patches12m,
      post10Patches,
      eaDurationDays: evaluated.eaDurationDays,
      reasons: evaluated.reasons,
      indexable: evaluated.indexable,
      statusChangedAt: statusChanged ? now : prevStatus?.statusChangedAt ?? now,
      computedAt: now,
    })
    .onConflictDoUpdate({
      target: gameStatus.appid,
      set: {
        status: evaluated.status,
        activityScore: evaluated.activityScore,
        lastPatchAt,
        lastPatchHeuristicAt,
        lastDevPostAt,
        lastBuildAt,
        lastActivityAt: evaluated.lastActivityAt,
        lastShipAt: evaluated.lastShipAt,
        posts12m,
        patches12m,
        post10Patches,
        eaDurationDays: evaluated.eaDurationDays,
        reasons: evaluated.reasons,
        indexable: evaluated.indexable,
        statusChangedAt: statusChanged ? now : prevStatus?.statusChangedAt ?? now,
        computedAt: now,
      },
    });

  if (
    (statusChanged || activityChanged) &&
    process.env.NEXT_PUBLIC_SITE_URL &&
    process.env.REVALIDATE_SECRET
  ) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-revalidate-secret": process.env.REVALIDATE_SECRET,
        },
        body: JSON.stringify({ appid, slug: game.slug }),
      });
    } catch (err) {
      console.warn(`[Revalidate Warning] Could not ping /api/revalidate for ${appid}:`, err);
    }
  }
}

export interface JobResult {
  job: CrawlJobName;
  ok: number;
  failed: number;
  notes: string;
  trackedGames?: number;
}

export async function runCrawlJob(
  job: CrawlJobName,
  batchSize = CRON_BATCH_SIZE
): Promise<JobResult> {
  const db = getDb();
  if (!db) {
    return { job, ok: 0, failed: 0, notes: "DATABASE_URL not configured" };
  }

  const [run] = await db.insert(crawlRuns).values({ job }).returning();
  let ok = 0;
  let failed = 0;
  let notes = "";

  try {
    if (job === "discover") {
      const countRow = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(games)
        .where(eq(games.isEarlyAccess, true));
      const trackedEa = Number(countRow[0]?.count ?? 0);

      if (trackedEa >= DISCOVERY_TARGET_GAMES) {
        notes = `Discovery target reached (${trackedEa}/${DISCOVERY_TARGET_GAMES}).`;
      } else {
        const cursorRaw = await getCrawlCursor("discover");
        const offset = Number.parseInt(cursorRaw ?? "0", 10) || 0;
        // 2 search pages (~200 candidates) per daily cron — stay inside Steam limits
        const candidates = await discoverEarlyAccessCandidateAppIds(2, offset);
        notes = `offset=${offset} candidates=${candidates.length} trackedEa=${trackedEa}`;

        let processed = 0;
        for (const id of candidates) {
          if (processed >= batchSize) break;
          const existing = await db.query.games.findFirst({
            where: eq(games.appid, id),
          });
          if (existing) continue;
          try {
            const success = await syncSingleApp(id, {
              includePlayers: true,
              includeEaPlan: false,
            });
            if (success) ok++;
            else failed++;
            processed++;
          } catch {
            failed++;
            processed++;
          }
        }

        const nextOffset = offset + 200;
        // Wrap search pagination after ~80 pages (8k results) to rescan
        await setCrawlCursor("discover", String(nextOffset >= 10_000 ? 0 : nextOffset));
        notes += `; syncedNewish=${ok}`;
      }
    } else if (job === "rescore") {
      const cursorRaw = await getCrawlCursor("rescore");
      const offset = Number.parseInt(cursorRaw ?? "0", 10) || 0;
      const rows = await db
        .select({ appid: games.appid })
        .from(games)
        .orderBy(asc(games.appid))
        .limit(batchSize * 4)
        .offset(offset);
      for (const g of rows) {
        await rescoreSingleGame(g.appid);
        ok++;
      }
      const next = rows.length < batchSize * 4 ? 0 : offset + rows.length;
      await setCrawlCursor("rescore", String(next));
      notes = `rescored=${ok} offset=${offset}`;
    } else if (job === "refresh-players") {
      const rows = await db
        .select({ appid: games.appid })
        .from(games)
        .orderBy(sql`${games.currentPlayersCheckedAt} ASC NULLS FIRST`)
        .limit(batchSize * 3);
      for (const g of rows) {
        try {
          const players = await fetchCurrentPlayerCount(g.appid);
          const plan = await fetchEarlyAccessPlanFromStorePage(g.appid);
          await db
            .update(games)
            .set({
              currentPlayers: players,
              currentPlayersCheckedAt: new Date(),
              ...(plan?.plannedEaEndDate
                ? { plannedEaEndDate: plan.plannedEaEndDate }
                : {}),
              ...(plan?.plannedEaDurationText
                ? { plannedEaDurationText: plan.plannedEaDurationText }
                : {}),
              ...(plan?.planned10TimingText
                ? { planned10TimingText: plan.planned10TimingText }
                : {}),
            })
            .where(eq(games.appid, g.appid));
          ok++;
        } catch {
          failed++;
        }
      }
      notes = `playerOrPlanUpdates=${ok}`;
    } else {
      // refresh-hot / refresh-store / refresh-news
      const orderSql =
        job === "refresh-hot"
          ? sql`${games.newsCheckedAt} ASC NULLS FIRST`
          : sql`${games.storeCheckedAt} ASC NULLS FIRST`;

      let targetIds: number[] = [];
      if (job === "refresh-hot") {
        const hot = await db
          .select({ appid: games.appid })
          .from(games)
          .innerJoin(gameStatus, eq(games.appid, gameStatus.appid))
          .where(sql`${gameStatus.status} IN ('active', 'slowing')`)
          .orderBy(orderSql)
          .limit(batchSize);
        targetIds = hot.map((r) => r.appid);
      } else {
        const rows = await db
          .select({ appid: games.appid })
          .from(games)
          .orderBy(orderSql)
          .limit(batchSize);
        targetIds = rows.map((r) => r.appid);
      }

      for (const id of targetIds) {
        try {
          const success = await syncSingleApp(id, {
            includePlayers: job !== "refresh-news",
            includeEaPlan: job === "refresh-store",
          });
          if (success) ok++;
          else failed++;
        } catch {
          failed++;
        }
      }
      notes = `batch=${targetIds.length}`;
    }
  } catch (err) {
    notes = `${notes} error=${err instanceof Error ? err.message : String(err)}`;
    throw err;
  } finally {
    await db
      .update(crawlRuns)
      .set({ finishedAt: new Date(), ok, failed, notes })
      .where(eq(crawlRuns.id, run.id));
  }

  const totalTracked = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(games);

  return {
    job,
    ok,
    failed,
    notes,
    trackedGames: Number(totalTracked[0]?.count ?? 0),
  };
}
