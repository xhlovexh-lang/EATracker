import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { classifyNewsItem, isValidUnixTimestamp } from "../crawler/schemas";
import { evaluateGameStatus } from "../src/lib/status-engine";
import { slugifyGameName } from "../src/lib/slug";

const UA = "EATrackerBot/1.0 (+https://eatrackers.vercel.app/methodology)";
/** Gradual expansion target (~8k real EA games). Local JSON seed stays smaller. */
const TARGET = Number.parseInt(process.env.IMPORT_TARGET ?? "240", 10);
const NOW = new Date("2026-10-21T08:00:00Z");
const OUT = fileURLToPath(new URL("../data/imported-games.json", import.meta.url));

const SEED_APPIDS = new Set([
  1363080, 2694490, 1149460, 892970, 108600, 251570, 1203620, 548430, 954850,
  1426210, 1621690, 1987420, 387990, 296070, 519860, 2489100,
]);

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

const PATCH_TITLE = /\b(patch|hotfix|update|v?\d+\.\d+(\.\d+)?|changelog|build)\b/i;

/** Prefer refreshing the existing catalog; pass --discover to search for new titles. */
const REFRESH_EXISTING = !process.argv.includes("--discover");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  if (res.status === 429) {
    console.warn("429, backing off 60s", url);
    await sleep(60_000);
    return getJson(url);
  }
  if (res.status === 403) {
    console.warn("403, backing off 5m", url);
    await sleep(300_000);
    return getJson(url);
  }
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function decode(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
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

/** Load Steam's public popular-tags list (id → display name) and map to URL slugs. */
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
  console.log(`loaded ${map.size} Steam store tag names`);
  return map;
}

interface SearchHit {
  appid: number;
  name: string;
  released: string;
  priceCents: number | null;
  isFree: boolean;
  reviewDesc: string;
  totalReviews: number;
  positivePct: number;
}

interface ExistingGame {
  appid: number;
  name: string;
  slug: string;
  isFree?: boolean;
  priceCents?: number | null;
  reviewScoreDesc?: string;
  totalReviews?: number;
  totalPositive?: number;
  totalNegative?: number;
  leftEaAt?: string | null;
  eaStartDate?: string | null;
}

function parseSearch(html: string): SearchHit[] {
  const hits: SearchHit[] = [];
  for (const part of html.split("<a ").slice(1)) {
    if (!part.includes("search_result_row")) continue;
    const hrefId = Number(part.match(/\/app\/(\d+)/)?.[1] ?? "");
    const id = Number(part.match(/data-ds-appid="(\d+)"/)?.[1] ?? "");
    const name = decode(part.match(/<span class="title">([^<]*)<\/span>/)?.[1] ?? "");
    if (!id || !name || hrefId !== id) continue;
    const released = decode(
      part.match(/class="search_released[^"]*"[^>]*>\s*([^<]*?)\s*</)?.[1] ?? ""
    );
    const priceRaw = part.match(/data-price-final="(\d+)"/)?.[1];
    const isFree = /Free( To Play)?/i.test(part.slice(0, 1800));
    const tooltip = decode(part.match(/data-tooltip-html="([^"]*)"/)?.[1] ?? "");
    const reviewDesc = tooltip.split("<br>")[0]?.trim() || "No user reviews";
    const totalReviews = Number(
      tooltip.match(/of the ([\d,]+) user reviews/i)?.[1]?.replace(/,/g, "") ?? "0"
    );
    const positivePct = Number(tooltip.match(/(\d+)%/)?.[1] ?? "0");
    hits.push({
      appid: id,
      name,
      released,
      priceCents: priceRaw ? Number(priceRaw) : isFree ? 0 : null,
      isFree,
      reviewDesc,
      totalReviews: Number.isFinite(totalReviews) ? totalReviews : 0,
      positivePct: Number.isFinite(positivePct) ? positivePct : 0,
    });
  }
  return hits;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function valuesOf(value: unknown): string[] {
  return Object.values(asRecord(value)).map((item) => String(item));
}

function monthBins(dates: Array<{ date: string; patch: boolean }>) {
  const ref = NOW;
  const bins = [];
  for (let i = 35; i >= 0; i--) {
    const d = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - i, 1));
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

function loadExistingGames(): ExistingGame[] {
  if (!existsSync(OUT)) return [];
  try {
    const raw = JSON.parse(readFileSync(OUT, "utf8")) as ExistingGame[];
    return Array.isArray(raw) ? raw.filter((g) => g?.appid && g?.name) : [];
  } catch {
    return [];
  }
}

function existingToHit(game: ExistingGame): SearchHit {
  const totalReviews = game.totalReviews ?? 0;
  const totalPositive = game.totalPositive ?? 0;
  const positivePct =
    totalReviews > 0 ? Math.round((totalPositive / totalReviews) * 100) : 0;
  return {
    appid: game.appid,
    name: game.name,
    released: "",
    priceCents: game.priceCents ?? null,
    isFree: Boolean(game.isFree),
    reviewDesc: game.reviewScoreDesc || "No user reviews",
    totalReviews,
    positivePct,
  };
}

async function fetchShortDescription(appid: number): Promise<string | null> {
  try {
    const payload = (await getJson(
      `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=us&l=english`
    )) as Record<string, { success?: boolean; data?: { short_description?: string } }>;
    const entry = payload[String(appid)];
    if (!entry?.success || !entry.data) return null;
    const text = entry.data.short_description;
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } catch (error) {
    console.warn("appdetails skip", appid, error);
    return null;
  }
}

async function discoverHits(): Promise<SearchHit[]> {
  const hits: SearchHit[] = [];
  const seen = new Set<number>();
  for (let page = 0; page < 18 && hits.length < 1400; page++) {
    const start = page * 100;
    const url = `https://store.steampowered.com/search/results/?query&start=${start}&count=100&infinite=1&tags=493&category1=998&cc=us&l=english`;
    const payload = (await getJson(url)) as { results_html?: string; total_count?: number };
    const pageHits = parseSearch(payload.results_html ?? "");
    for (const hit of pageHits) {
      if (seen.has(hit.appid) || SEED_APPIDS.has(hit.appid)) continue;
      seen.add(hit.appid);
      hits.push(hit);
    }
    console.log(`search page ${page + 1}: candidates ${hits.length}, steam total ${payload.total_count}`);
    await sleep(2100);
  }
  return hits;
}

async function main() {
  const tagSlugs = await loadSteamTagSlugs();
  await sleep(2100);

  const existing = loadExistingGames();
  const existingById = new Map(existing.map((g) => [g.appid, g]));

  let hits: SearchHit[];
  if (REFRESH_EXISTING && existing.length > 0) {
    console.log(`refresh mode: re-importing ${existing.length} existing games (no new discovery)`);
    hits = existing.map(existingToHit);
  } else {
    console.log("discover mode: searching Steam Early Access catalog");
    hits = await discoverHits();
  }

  const imported = [];
  const usedSlugs = new Set<string>([
    "manor-lords",
    "path-of-exile-2",
    "icarus-first-cohort",
    "valheim",
    "project-zomboid",
    "7-days-survival-sandbox",
    "enshrouded",
    "deep-rock-galactic-rogue-core",
    "starsector-frontier-protocol",
    "dead-matter-quarantine-zone",
    "subterranean-tactics",
    "echoes-of-new-fortune",
    "scrap-mechanic-lost-colony",
    "outpost-zero-colonization",
    "void-salvage-protocol",
    "chrono-forged-aether-realms",
  ]);

  for (const hit of hits) {
    if (!REFRESH_EXISTING && imported.length >= TARGET) break;

    let info: unknown;
    try {
      info = await getJson(`https://api.steamcmd.net/v1/info/${hit.appid}`);
    } catch (error) {
      console.warn("steamcmd skip", hit.appid, error);
      await sleep(1100);
      continue;
    }
    await sleep(1100);

    const app = asRecord(asRecord(info).data)[String(hit.appid)];
    const common = asRecord(asRecord(app).common);
    const genres = asRecord(common.genres);
    const genreIds = Object.values(genres).map(String);
    // Refresh keeps previously tracked titles even if they left Early Access.
    if (String(common.type).toLowerCase() !== "game") continue;
    if (!REFRESH_EXISTING && !genreIds.includes("70")) continue;

    const release = isValidUnixTimestamp(common.steam_release_date as string | number);
    if (!release || release.getTime() > NOW.getTime()) continue;

    let newsJson: unknown = null;
    try {
      newsJson = await getJson(
        `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${hit.appid}&count=100&maxlength=300&feeds=steam_community_announcements`
      );
    } catch (error) {
      console.warn("news skip", hit.appid, error);
    }
    await sleep(250);

    // Store host: ~1 req / 2s (shared with search when discovering).
    const shortDescriptionFromSteam = await fetchShortDescription(hit.appid);
    await sleep(2100);

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
        appid: hit.appid,
        tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
      });
      if (!classified.isOfficialDevAnnouncement) continue;
      const date = isValidUnixTimestamp(item.date as number);
      if (!date) continue;
      const tags = Array.isArray(item.tags) ? item.tags.map(String) : [];
      const isPatch = tags.some((tag) => tag.toLowerCase() === "patchnotes");
      const isPatchHeuristic = !isPatch && PATCH_TITLE.test(String(item.title ?? ""));
      announcements.push({
        gid: String(item.gid),
        title: String(item.title ?? "Update"),
        url: String(item.url ?? `https://store.steampowered.com/news/app/${hit.appid}`),
        date: date.toISOString(),
        tags,
        isPatch,
        isPatchHeuristic,
        excerpt: classified.cleanExcerpt,
      });
    }
    announcements.sort((a, b) => b.date.localeCompare(a.date));

    const yearAgo = NOW.getTime() - 365 * 86400 * 1000;
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

    // Map every steamcmd store_tags id through Steam's public tag-name list.
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

    const positive = Math.round((hit.totalReviews * hit.positivePct) / 100);
    const stillInEa = genreIds.includes("70");
    const prior = existingById.get(hit.appid);
    const eaStartDate = prior?.eaStartDate || release.toISOString().slice(0, 10);
    const leftEaAt = stillInEa
      ? null
      : prior?.leftEaAt || NOW.toISOString().slice(0, 10);
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
      totalReviews: hit.totalReviews,
      totalPosts: announcements.length,
      adult: false,
      delisted: false,
      now: NOW,
    });

    let slug = prior?.slug || slugifyGameName(hit.name);
    if (!prior && usedSlugs.has(slug)) slug = `${slug}-${hit.appid}`;
    usedSlugs.add(slug);

    const reviewScore = REVIEW_LABELS[String(common.review_score ?? "")] || hit.reviewDesc;
    const fallbackDescription = `${hit.name} is a Steam Early Access ${
      genreNames.filter((genre) => genre !== "Early Access").slice(0, 2).join(" / ") || "game"
    } by ${(developers[0] ?? "an independent studio")}.`;

    imported.push({
      appid: hit.appid,
      name: hit.name,
      slug,
      developers: developers.length ? developers : ["Unknown"],
      publishers: publishers.length ? publishers : developers,
      genres: genreNames,
      tags,
      isFree: hit.isFree,
      priceCents: hit.priceCents,
      currency: "USD",
      headerImage: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${hit.appid}/header.jpg`,
      shortDescription: shortDescriptionFromSteam || fallbackDescription,
      isEarlyAccess: stillInEa,
      eaStartDate,
      leftEaAt,
      reviewScoreDesc: reviewScore || "No user reviews",
      totalPositive: positive,
      totalNegative: Math.max(0, hit.totalReviews - positive),
      totalReviews: hit.totalReviews,
      adult: false,
      delisted: false,
      externalUpdatesUrl: null,
      status: evaluated.status,
      activityScore: evaluated.activityScore,
      lastPatchAt: lastPatch ?? lastHeuristic,
      lastDevPostAt: lastPost,
      lastBuildAt: lastBuild?.toISOString() ?? null,
      lastActivityAt: evaluated.lastActivityAt?.toISOString() ?? null,
      lastShipAt: evaluated.lastShipAt?.toISOString() ?? null,
      posts12m,
      patches12m,
      post10Patches: 0,
      eaDurationDays: evaluated.eaDurationDays,
      reasons: evaluated.reasons,
      indexable: evaluated.indexable,
      verdictSummary: evaluated.verdictSummary,
      statusChangedAt: evaluated.lastActivityAt?.toISOString() ?? NOW.toISOString(),
      announcements: announcements.slice(0, 8),
      monthlyTimeline: monthBins(
        announcements.map((item) => ({
          date: item.date,
          patch: item.isPatch || item.isPatchHeuristic,
        }))
      ),
    });
    console.log(
      `${imported.length}/${REFRESH_EXISTING ? hits.length : TARGET} ${hit.name} (${hit.appid}) tags=${tags.length} desc=${shortDescriptionFromSteam ? "steam" : "fallback"} ${evaluated.status}`
    );
    if (imported.length % 10 === 0) {
      mkdirSync(fileURLToPath(new URL("../data/", import.meta.url)), { recursive: true });
      writeFileSync(OUT, JSON.stringify(imported));
    }
  }

  mkdirSync(fileURLToPath(new URL("../data/", import.meta.url)), { recursive: true });
  writeFileSync(OUT, JSON.stringify(imported));
  console.log(`wrote ${imported.length} games`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
