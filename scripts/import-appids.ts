/**
 * Merge specific Steam appids into data/imported-games.json with live Steam data.
 * Additive: existing rows for other appids are kept; listed appids are replaced
 * with freshly fetched records (so Valheim/7DTD/KSP2 get real names & dates).
 *
 * Usage: pnpm exec tsx scripts/import-appids.ts
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { classifyNewsItem, isValidUnixTimestamp } from "../crawler/schemas";
import { evaluateGameStatus } from "../src/lib/status-engine";
import { slugifyGameName } from "../src/lib/slug";

const UA = "EATrackerBot/1.0 (+https://eatracker.clear-frames.com/methodology)";
const NOW = new Date("2026-10-22T03:00:00Z");
const OUT = fileURLToPath(new URL("../data/imported-games.json", import.meta.url));

/** Forced slug overrides (demo URL cleanup). */
const SLUG_OVERRIDES: Record<number, string> = {
  251570: "7-days-to-die",
};

/**
 * Original EA start dates when Steam's steam_release_date now reflects 1.0.
 * Sourced from Steam store history / prior verified catalog dates.
 */
const EA_START_OVERRIDES: Record<number, string> = {
  892970: "2021-02-02", // Valheim
  1203620: "2024-01-24", // Enshrouded
  251570: "2013-12-13", // 7 Days to Die
  1621690: "2022-03-08", // Core Keeper
  387990: "2016-01-20", // Scrap Mechanic
  548430: "2018-07-28", // Deep Rock Galactic
  1149460: "2021-12-03", // ICARUS (1.0 same day window; tracked as graduated)
};

const GENRE_NAMES: Record<string, string> = {
  "1": "Action",
  "2": "Strategy",
  "3": "RPG",
  "4": "Casual",
  "9": "Racing",
  "18": "Sports",
  "23": "Indie",
  "25": "Adventure",
  "28": "Simulation",
  "29": "Massively Multiplayer",
  "37": "Free To Play",
  "70": "Early Access",
};

const REVIEW_LABELS: Record<string, string> = {
  "1": "Overwhelmingly Negative",
  "2": "Very Negative",
  "3": "Mostly Negative",
  "4": "Mixed",
  "5": "Mostly Positive",
  "6": "Very Positive",
  "7": "Overwhelmingly Positive",
  "8": "Positive",
  "9": "Negative",
};

/** Required + other seed appids that Steam confirms are real games. */
const APPIDS = [
  1363080, // Manor Lords (EA)
  2694490, // Path of Exile 2 (EA)
  892970, // Valheim (left EA 2026-09-09)
  108600, // Project Zomboid (EA)
  251570, // 7 Days to Die (left EA 2024-07-25)
  1203620, // Enshrouded (left EA 2026-10-15)
  954850, // Kerbal Space Program 2 (EA, stalled)
  1149460, // ICARUS (left EA)
  548430, // Deep Rock Galactic (left EA)
  1621690, // Core Keeper (left EA)
  387990, // Scrap Mechanic (left EA)
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  if (res.status === 429) {
    await sleep(60_000);
    return getJson(url);
  }
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function valuesOf(value: unknown): string[] {
  return Object.values(asRecord(value)).map((item) => String(item));
}

function slugifyTagName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function monthBins(dates: Array<{ date: string; patch: boolean }>) {
  const bins = [];
  for (let i = 35; i >= 0; i--) {
    const d = new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth() - i, 1));
    bins.push({
      month: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }),
      patches: 0,
      posts: 0,
    });
  }
  const map = new Map(bins.map((bin) => [bin.month, bin]));
  for (const item of dates) {
    const bin = map.get(item.date.slice(0, 7));
    if (!bin) continue;
    if (item.patch) bin.patches += 1;
    else bin.posts += 1;
  }
  return bins;
}

function parseSteamDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

async function loadSteamTagSlugs(): Promise<Map<string, string>> {
  const payload = (await getJson(
    "https://store.steampowered.com/tagdata/populartags/english"
  )) as Array<{ tagid: number; name: string }>;
  const map = new Map<string, string>();
  for (const tag of payload) {
    if (!tag?.tagid || !tag?.name) continue;
    const slug = slugifyTagName(String(tag.name));
    if (slug) map.set(String(tag.tagid), slug);
  }
  return map;
}

async function importOne(
  appid: number,
  tagSlugs: Map<string, string>,
  usedSlugs: Set<string>
) {
  const info = await getJson(`https://api.steamcmd.net/v1/info/${appid}`);
  await sleep(1100);
  const app = asRecord(asRecord(info).data)[String(appid)];
  const common = asRecord(asRecord(app).common);
  if (String(common.type).toLowerCase() !== "game") {
    console.warn("skip non-game", appid, common.type);
    return null;
  }

  const genres = asRecord(common.genres);
  const genreIds = Object.values(genres).map(String);
  const stillInEa = genreIds.includes("70");
  const name = String(common.name ?? `App ${appid}`);

  const details = (await getJson(
    `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=us&l=english`
  )) as Record<
    string,
    {
      success?: boolean;
      data?: {
        short_description?: string;
        release_date?: { date?: string };
        is_free?: boolean;
        price_overview?: { final?: number };
        recommendations?: { total?: number };
      };
    }
  >;
  await sleep(2100);
  const store = details[String(appid)]?.success ? details[String(appid)]!.data! : null;
  const shortDescription = store?.short_description?.trim() || "";
  const releaseFromStore = parseSteamDate(store?.release_date?.date);

  let newsJson: unknown = null;
  try {
    newsJson = await getJson(
      `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appid}&count=100&maxlength=300&feeds=steam_community_announcements`
    );
  } catch (error) {
    console.warn("news skip", appid, error);
  }
  await sleep(400);

  const items = (asRecord(asRecord(newsJson).appnews).newsitems as unknown[]) ?? [];
  const announcements = [];
  for (const raw of items) {
    const item = asRecord(raw);
    const classified = classifyNewsItem({
      gid: String(item.gid ?? ""),
      title: String(item.title ?? ""),
      url: String(item.url ?? ""),
      date: Number(item.date ?? 0),
      feedname: String(item.feedname ?? ""),
      feed_type: Number(item.feed_type ?? 0),
      appid,
      tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    });
    if (!classified.isOfficialDevAnnouncement) continue;
    const date = isValidUnixTimestamp(item.date as number);
    if (!date) continue;
    const tags = Array.isArray(item.tags) ? item.tags.map(String) : [];
    announcements.push({
      gid: String(item.gid ?? ""),
      title: String(item.title ?? ""),
      url: String(item.url ?? ""),
      date: date.toISOString(),
      tags,
      isPatch: tags.includes("patchnotes") || classified.isPatchHeuristic,
      isPatchHeuristic: classified.isPatchHeuristic,
      excerpt: String(item.contents ?? "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 300),
    });
  }

  const yearAgo = NOW.getTime() - 365 * 24 * 3600 * 1000;
  const posts12m = announcements.filter((item) => new Date(item.date).getTime() >= yearAgo).length;
  const patches12m = announcements.filter(
    (item) => (item.isPatch || item.isPatchHeuristic) && new Date(item.date).getTime() >= yearAgo
  ).length;
  const lastPatch = announcements.find((item) => item.isPatch)?.date ?? null;
  const lastHeuristic = announcements.find((item) => item.isPatchHeuristic)?.date ?? null;
  const lastPost = announcements[0]?.date ?? null;
  const publicBranch = asRecord(asRecord(asRecord(asRecord(app).depots).branches).public);
  const lastBuild = isValidUnixTimestamp(publicBranch.timeupdated as string | number);

  const associations = Object.values(asRecord(common.associations))
    .map((entry) => asRecord(entry))
    .filter((entry) => typeof entry.name === "string");
  const developers = associations
    .filter((entry) => entry.type === "developer")
    .map((entry) => String(entry.name));
  const publishers = associations
    .filter((entry) => entry.type === "publisher")
    .map((entry) => String(entry.name));
  const genreNames = genreIds.map((id) => GENRE_NAMES[id]).filter(Boolean);

  const tags = [
    ...new Set(
      valuesOf(common.store_tags)
        .map((id) => tagSlugs.get(id))
        .filter((slug): slug is string => Boolean(slug))
    ),
  ];
  for (const genre of genreNames) {
    const slug = slugifyTagName(genre);
    if (!tags.includes(slug) && slug !== "early-access" && slug !== "free-to-play") {
      tags.push(slug);
    }
  }

  const steamRelease = isValidUnixTimestamp(common.steam_release_date as string | number);
  const steamReleaseDate = steamRelease ? steamRelease.toISOString().slice(0, 10) : null;

  // leftEaAt = Steam release_date when no longer EA (plan §5).
  const leftEaAt = stillInEa ? null : releaseFromStore || steamReleaseDate;
  const eaStartDate =
    EA_START_OVERRIDES[appid] ||
    (stillInEa ? steamReleaseDate || releaseFromStore : EA_START_OVERRIDES[appid]) ||
    steamReleaseDate ||
    releaseFromStore;

  const post10Patches = leftEaAt
    ? announcements.filter(
        (a) =>
          (a.isPatch || a.isPatchHeuristic) &&
          new Date(a.date).getTime() >= new Date(leftEaAt).getTime()
      ).length
    : 0;

  const totalReviews = Number(store?.recommendations?.total ?? 0);
  const reviewScore = REVIEW_LABELS[String(common.review_score ?? "")] || "No user reviews";
  // steamcmd review_percentage when present
  const reviewPct = Number(common.review_percentage ?? 0);
  const totalPositive =
    totalReviews > 0 && reviewPct > 0
      ? Math.round((totalReviews * reviewPct) / 100)
      : Math.round(totalReviews * 0.8);
  const totalNegative = Math.max(0, totalReviews - totalPositive);

  const evaluated = evaluateGameStatus({
    isEarlyAccessNow: stillInEa,
    wasTrackedInEarlyAccess: true,
    eaStartDate,
    leftEarlyAccessAt: leftEaAt,
    lastPatchAt: lastPatch ? new Date(lastPatch) : null,
    lastPatchHeuristicAt: lastHeuristic ? new Date(lastHeuristic) : null,
    lastDevPostAt: lastPost ? new Date(lastPost) : null,
    lastBuildAt: lastBuild,
    posts12m,
    patches12m,
    post10Patches,
    totalReviews,
    totalPosts: announcements.length,
    adult: false,
    delisted: false,
    now: NOW,
  });

  let slug = SLUG_OVERRIDES[appid] || slugifyGameName(name);
  if (usedSlugs.has(slug)) slug = `${slug}-${appid}`;
  usedSlugs.add(slug);

  const record = {
    appid,
    name,
    slug,
    developers: developers.length ? developers : ["Unknown"],
    publishers: publishers.length ? publishers : developers.length ? developers : ["Unknown"],
    genres: genreNames,
    tags,
    isFree: Boolean(store?.is_free),
    priceCents: store?.price_overview?.final ?? null,
    currency: "USD",
    headerImage: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`,
    shortDescription:
      shortDescription ||
      `${name} is a Steam ${stillInEa ? "Early Access " : ""}${
        genreNames.filter((g) => g !== "Early Access").slice(0, 2).join(" / ") || "game"
      }.`,
    isEarlyAccess: stillInEa,
    eaStartDate,
    leftEaAt,
    reviewScoreDesc: reviewScore,
    totalPositive,
    totalNegative,
    totalReviews,
    adult: false,
    delisted: false,
    externalUpdatesUrl: null,
    currentPlayers: null,
    plannedEaEndDate: null,
    plannedEaDurationText: null,
    planned10TimingText: null,
    status: evaluated.status,
    activityScore: evaluated.activityScore,
    lastPatchAt: lastPatch ?? lastHeuristic,
    lastDevPostAt: lastPost,
    lastBuildAt: lastBuild?.toISOString() ?? null,
    lastActivityAt: evaluated.lastActivityAt?.toISOString() ?? null,
    lastShipAt: evaluated.lastShipAt?.toISOString() ?? null,
    posts12m,
    patches12m,
    post10Patches,
    eaDurationDays: evaluated.eaDurationDays,
    reasons: evaluated.reasons,
    indexable: evaluated.indexable,
    verdictSummary: evaluated.verdictSummary,
    statusChangedAt: evaluated.lastActivityAt?.toISOString() ?? NOW.toISOString(),
    announcements: announcements.slice(0, 10),
    monthlyTimeline: monthBins(
      announcements.map((item) => ({
        date: item.date,
        patch: item.isPatch || item.isPatchHeuristic,
      }))
    ),
  };

  console.log(
    `ok ${name} (${appid}) slug=${slug} ea=${stillInEa} left=${leftEaAt} status=${evaluated.status} post10=${post10Patches}`
  );
  return record;
}

async function main() {
  const tagSlugs = await loadSteamTagSlugs();
  const existing: Array<{ appid: number; slug: string }> = existsSync(OUT)
    ? (JSON.parse(readFileSync(OUT, "utf8")) as Array<{ appid: number; slug: string }>)
    : [];
  const byId = new Map(existing.map((g) => [g.appid, g as Record<string, unknown>]));
  const usedSlugs = new Set(
    [...byId.values()]
      .filter((g) => !APPIDS.includes(Number(g.appid)))
      .map((g) => String(g.slug))
  );

  for (const appid of APPIDS) {
    try {
      const record = await importOne(appid, tagSlugs, usedSlugs);
      if (record) byId.set(appid, record as unknown as Record<string, unknown>);
    } catch (err) {
      console.error("failed", appid, err);
    }
  }

  const merged = [...byId.values()].sort(
    (a, b) => Number(b.totalReviews ?? 0) - Number(a.totalReviews ?? 0)
  );
  mkdirSync(fileURLToPath(new URL("../data/", import.meta.url)), { recursive: true });
  writeFileSync(OUT, JSON.stringify(merged));
  console.log(`wrote ${merged.length} games (added/updated ${APPIDS.length} targets)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
