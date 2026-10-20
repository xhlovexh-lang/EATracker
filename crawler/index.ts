import { eq, sql } from "drizzle-orm";
import { getDb } from "../src/db";
import {
  games,
  newsItems,
  builds,
  gameStatus,
  slugHistory,
  crawlRuns,
} from "../src/db/schema";
import {
  fetchSteamAppDetails,
  fetchSteamDeveloperNews,
  fetchSteamReviewSummary,
  fetchSteamCmdBuildInfo,
  discoverEarlyAccessCandidateAppIds,
} from "./fetchers";
import { evaluateGameStatus, maxDate } from "../src/lib/status-engine";
import { createUniqueGameSlug } from "../src/lib/slug";

async function syncSingleApp(appid: number): Promise<boolean> {
  const db = getDb();
  if (!db) {
    throw new Error("DATABASE_URL is required to run crawler jobs against Postgres.");
  }

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

  // Only include actual games (exclude dlc, demo, music, playtest) and exclude unreleased coming_soon
  if (store.type !== "game" || store.comingSoon) {
    return true;
  }

  // Only track if currently in Early Access OR was already tracked in Early Access
  if (!store.isEarlyAccess && !existing) {
    return true;
  }

  const reviews = await fetchSteamReviewSummary(appid);
  const buildInfo = await fetchSteamCmdBuildInfo(appid);

  // Preserve EA start date from first capture (Section 6.1)
  const eaStartDate =
    existing?.eaStartDate ??
    store.parsedReleaseDate ??
    (buildInfo?.steamReleaseDate
      ? buildInfo.steamReleaseDate.toISOString().slice(0, 10)
      : null);

  // Detect 1.0 graduation (had genre 70 previously, no longer has genre 70)
  const leftEaAt =
    existing?.isEarlyAccess && !store.isEarlyAccess
      ? existing.leftEaAt ?? new Date().toISOString().slice(0, 10)
      : existing?.leftEaAt ?? null;

  // Handle slug & 301 history if game renamed (Section 8.5)
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
        isEarlyAccess: store.isEarlyAccess ?? false,
        leftEaAt,
        reviewScoreDesc: reviews?.reviewScoreDesc ?? existing?.reviewScoreDesc,
        totalPositive: reviews?.totalPositive ?? existing?.totalPositive ?? 0,
        totalNegative: reviews?.totalNegative ?? existing?.totalNegative ?? 0,
        totalReviews: reviews?.totalReviews ?? existing?.totalReviews ?? 0,
        adult: store.adult ?? false,
        delisted: false,
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

  // Trigger on-demand ISR revalidation if status or lastActivityAt changed (Section 6.6)
  if ((statusChanged || activityChanged) && process.env.NEXT_PUBLIC_SITE_URL && process.env.REVALIDATE_SECRET) {
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

async function main() {
  const [, , command, arg] = process.argv;
  const db = getDb();

  if (command === "app" && arg) {
    const appid = Number.parseInt(arg, 10);
    console.log(`[Crawler] Syncing single appid=${appid}...`);
    await syncSingleApp(appid);
    console.log(`[Crawler] Done syncing appid=${appid}.`);
    return;
  }

  if (!db) {
    console.log("[Crawler] No DATABASE_URL configured. Exiting gracefully.");
    return;
  }

  const [run] = await db
    .insert(crawlRuns)
    .values({ job: command || "unknown" })
    .returning();

  let ok = 0;
  let failed = 0;

  try {
    if (command === "discover") {
      const candidates = await discoverEarlyAccessCandidateAppIds(5);
      console.log(`[Discover] Found ${candidates.length} candidate Early Access appids.`);
      for (const id of candidates) {
        const success = await syncSingleApp(id);
        if (success) ok++;
        else failed++;
      }
    } else if (command === "rescore") {
      const allGames = await db.select({ appid: games.appid }).from(games);
      for (const g of allGames) {
        await rescoreSingleGame(g.appid);
        ok++;
      }
    } else {
      // refresh-hot, refresh-store, refresh-all-news
      const targetGames = await db
        .select({ appid: games.appid })
        .from(games)
        .orderBy(sql`${games.storeCheckedAt} ASC NULLS FIRST`)
        .limit(200);

      for (const g of targetGames) {
        const success = await syncSingleApp(g.appid);
        if (success) ok++;
        else failed++;
      }
    }
  } finally {
    await db
      .update(crawlRuns)
      .set({ finishedAt: new Date(), ok, failed })
      .where(eq(crawlRuns.id, run.id));

    const total = ok + failed;
    if (total > 10 && failed / total > 0.1) {
      console.error(`[Crawler Alert] Failure rate exceeded 10% (${failed}/${total})`);
      process.exit(1);
    }
  }
}

if (require.main === module || process.argv[1]?.endsWith("crawler/index.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
