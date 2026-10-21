import {
  SteamAppDetailsEnvelopeSchema,
  SteamNewsResponseSchema,
  SteamAppReviewsSchema,
  SteamCmdInfoSchema,
  classifyNewsItem,
  isValidUnixTimestamp,
} from "./schemas";
import { rateLimitedGetJson } from "./http-client";

export interface FetchedAppStoreData {
  appid: number;
  delisted: boolean;
  type?: string;
  name?: string;
  isFree?: boolean;
  priceCents?: number | null;
  currency?: string;
  developers?: string[];
  publishers?: string[];
  genres?: string[];
  isEarlyAccess?: boolean;
  comingSoon?: boolean;
  releaseDateRaw?: string;
  parsedReleaseDate?: string | null;
  headerImage?: string | null;
  shortDescription?: string;
  adult?: boolean;
}

export async function fetchSteamAppDetails(appid: number): Promise<FetchedAppStoreData | null> {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=us&l=english`;
  const raw = await rateLimitedGetJson<unknown>("store.steampowered.com", url);
  if (!raw) return null;

  const parsed = SteamAppDetailsEnvelopeSchema.safeParse(raw);
  if (!parsed.success) return null;

  const entry = parsed.data[String(appid)];
  if (!entry || !entry.success || !entry.data) {
    return { appid, delisted: true };
  }

  const d = entry.data;
  const genres = d.genres ?? [];
  const isEarlyAccess = genres.some((g) => g.id === "70");
  const descriptorIds = d.content_descriptors?.ids ?? [];
  // Content descriptor IDs 3 (Adult Only Sexual Content) or 4 (Frequent Nudity or Sexual Content)
  const adult = descriptorIds.includes(3) || descriptorIds.includes(4);

  let parsedReleaseDate: string | null = null;
  if (d.release_date?.date && !d.release_date.coming_soon) {
    const dt = new Date(d.release_date.date);
    if (!Number.isNaN(dt.getTime()) && dt.getUTCFullYear() >= 2010 && dt.getTime() <= Date.now() + 86400000) {
      parsedReleaseDate = dt.toISOString().slice(0, 10);
    }
  }

  return {
    appid,
    delisted: false,
    type: d.type,
    name: d.name,
    isFree: d.is_free ?? false,
    priceCents: d.price_overview?.final ?? (d.is_free ? 0 : null),
    currency: d.price_overview?.currency ?? "USD",
    developers: d.developers ?? [],
    publishers: d.publishers ?? [],
    genres: genres.map((g) => g.description),
    isEarlyAccess,
    comingSoon: d.release_date?.coming_soon ?? false,
    releaseDateRaw: d.release_date?.date ?? "",
    parsedReleaseDate,
    headerImage: d.header_image ?? null,
    shortDescription: d.short_description ?? "",
    adult,
  };
}

export interface FetchedNewsRecord {
  gid: string;
  appid: number;
  title: string;
  url: string;
  date: Date;
  feedname: string;
  feedType: number;
  tags: string[];
  isPatch: boolean;
  isPatchHeuristic: boolean;
  excerpt: string;
}

export async function fetchSteamDeveloperNews(
  appid: number,
  earliestDate?: Date | null
): Promise<FetchedNewsRecord[]> {
  const results: FetchedNewsRecord[] = [];
  const threeYearsAgoSec = Math.floor((Date.now() - 3 * 365 * 86400 * 1000) / 1000);
  const minUnixSec = earliestDate
    ? Math.min(Math.floor(earliestDate.getTime() / 1000), threeYearsAgoSec)
    : threeYearsAgoSec;

  let enddate: number | undefined;
  const maxPages = 5;

  for (let page = 0; page < maxPages; page++) {
    const endParam = enddate ? `&enddate=${enddate}` : "";
    const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appid}&count=100&maxlength=300&feeds=steam_community_announcements${endParam}`;
    const raw = await rateLimitedGetJson<unknown>("api.steampowered.com", url);
    if (!raw) break;

    const parsed = SteamNewsResponseSchema.safeParse(raw);
    if (!parsed.success) break;

    const items = parsed.data.appnews.newsitems;
    if (items.length === 0) break;

    for (const item of items) {
      const classified = classifyNewsItem(item);
      if (!classified.isOfficialDevAnnouncement) continue;

      const validDate = isValidUnixTimestamp(item.date);
      if (!validDate) continue;

      results.push({
        gid: item.gid,
        appid,
        title: item.title,
        url: item.url,
        date: validDate,
        feedname: item.feedname,
        feedType: item.feed_type,
        tags: item.tags ?? [],
        isPatch: classified.isPatch,
        isPatchHeuristic: classified.isPatchHeuristic,
        excerpt: classified.cleanExcerpt,
      });
    }

    const oldestInBatch = items[items.length - 1]?.date;
    if (!oldestInBatch || oldestInBatch <= minUnixSec || items.length < 100) {
      break;
    }
    enddate = oldestInBatch - 1;
  }

  return results;
}

export async function fetchSteamReviewSummary(appid: number) {
  const url = `https://store.steampowered.com/appreviews/${appid}?json=1&language=all&purchase_type=all&num_per_page=0`;
  const raw = await rateLimitedGetJson<unknown>("store.steampowered.com", url);
  if (!raw) return null;

  const parsed = SteamAppReviewsSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.query_summary) return null;

  const q = parsed.data.query_summary;
  return {
    reviewScoreDesc: q.review_score_desc ?? "No user reviews",
    totalPositive: q.total_positive ?? 0,
    totalNegative: q.total_negative ?? 0,
    totalReviews: q.total_reviews ?? 0,
  };
}

export async function fetchSteamCmdBuildInfo(appid: number) {
  const url = `https://api.steamcmd.net/v1/info/${appid}`;
  const raw = await rateLimitedGetJson<unknown>("api.steamcmd.net", url, { maxRetries: 1 });
  if (!raw) return null;

  const parsed = SteamCmdInfoSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.data) return null;

  const appNode = parsed.data.data[String(appid)];
  if (!appNode) return null;

  const publicBranch = appNode.depots?.branches?.public;
  const buildid = publicBranch?.buildid ? String(publicBranch.buildid) : null;
  const timeUpdated = isValidUnixTimestamp(publicBranch?.timeupdated);
  const steamReleaseDate = isValidUnixTimestamp(appNode.common?.steam_release_date);

  return {
    buildid,
    timeUpdated,
    steamReleaseDate,
  };
}

export async function discoverEarlyAccessCandidateAppIds(
  maxPages = 5,
  startOffset = 0
): Promise<number[]> {
  const appIds = new Set<number>();

  // Steam Store Search with tags=493 (Early Access) & category1=998 (Games only).
  // Note: results include graduated titles — genre 70 must be confirmed via appdetails.
  for (let page = 0; page < maxPages; page++) {
    const start = startOffset + page * 100;
    const url = `https://store.steampowered.com/search/results/?query&start=${start}&count=100&infinite=1&tags=493&category1=998&cc=us&l=english`;
    const raw = await rateLimitedGetJson<{ results_html?: string; total_count?: number }>(
      "store.steampowered.com",
      url
    );
    if (!raw?.results_html) break;

    const regex = /data-ds-appid="(\d+)"/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(raw.results_html)) !== null) {
      const id = Number.parseInt(match[1], 10);
      if (Number.isFinite(id)) appIds.add(id);
    }

    if (raw.total_count != null && start + 100 >= raw.total_count) break;
  }

  return Array.from(appIds);
}

/**
 * ISteamUserStats/GetNumberOfCurrentPlayers — no Web API key required.
 * https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=
 */
export async function fetchCurrentPlayerCount(appid: number): Promise<number | null> {
  const url = `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appid}`;
  const raw = await rateLimitedGetJson<{
    response?: { result?: number; player_count?: number };
  }>("api.steampowered.com", url);
  if (!raw?.response || raw.response.result !== 1) return null;
  const count = raw.response.player_count;
  return typeof count === "number" && Number.isFinite(count) ? count : null;
}

export interface ParsedEarlyAccessPlan {
  plannedEaEndDate: string | null;
  plannedEaDurationText: string | null;
  planned10TimingText: string | null;
}

/**
 * Best-effort parse of the Steam store page "Early Access Game" notice for
 * developer-stated duration / 1.0 timing. Shares the store host rate limit.
 */
export async function fetchEarlyAccessPlanFromStorePage(
  appid: number
): Promise<ParsedEarlyAccessPlan | null> {
  const url = `https://store.steampowered.com/app/${appid}/?l=english&cc=us`;
  // Reuse rate-limited JSON client path via a small HTML fetch helper.
  const html = await rateLimitedGetText("store.steampowered.com", url);
  if (!html) return null;
  return parseEarlyAccessPlanFromHtml(html);
}

/** Exported for unit tests. */
export function parseEarlyAccessPlanFromHtml(html: string): ParsedEarlyAccessPlan {
  const noticeMatch =
    html.match(
      /id="game_area_comingsoon"[^>]*>[\s\S]*?<p[^>]*class="[^"]*game_area_comingsoon_description[^"]*"[^>]*>([\s\S]*?)<\/p>/i
    ) ||
    html.match(
      /<h2[^>]*>\s*Early Access Game\s*<\/h2>([\s\S]*?)(?:<h2|<\/div>\s*<div[^>]*game_area_description)/i
    ) ||
    html.match(/Early Access Game([\s\S]{0,2500}?Get updates)/i);

  const block = (noticeMatch?.[1] ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  if (!block) {
    return {
      plannedEaEndDate: null,
      plannedEaDurationText: null,
      planned10TimingText: null,
    };
  }

  const durationMatch = block.match(
    /(?:approximately|about|around|roughly)?\s*(\d+)\s*(weeks?|months?|years?)/i
  );
  const plannedEaDurationText = durationMatch
    ? `${durationMatch[1]} ${durationMatch[2].toLowerCase()}`
    : null;

  const timingPatterns: RegExp[] = [
    /(?:full\s+release|version\s*1\.0|1\.0|leave Early Access|leaving Early Access|graduate)[^.?!]{0,80}?(?:in|by|during|around)\s+(Q[1-4]\s*20\d{2}|[A-Z][a-z]+\s+20\d{2}|20\d{2})/i,
    /(?:expect(?:ed)?|plan(?:ned)?|aim(?:ing)?|target(?:ing)?)\s+(?:to\s+)?(?:release|launch|ship|graduate|leave Early Access)[^.?!]{0,60}?(Q[1-4]\s*20\d{2}|[A-Z][a-z]+\s+20\d{2}|20\d{2})/i,
    /(Q[1-4]\s*20\d{2}|[A-Z][a-z]+\s+20\d{2})/,
  ];

  let planned10TimingText: string | null = null;
  for (const re of timingPatterns) {
    const m = block.match(re);
    if (m) {
      planned10TimingText = (m[1] || m[0]).replace(/\s+/g, " ").trim();
      break;
    }
  }

  let plannedEaEndDate: string | null = null;
  if (planned10TimingText) {
    plannedEaEndDate = coerceTimingToDate(planned10TimingText);
  } else if (durationMatch) {
    const n = Number.parseInt(durationMatch[1], 10);
    const unit = durationMatch[2].toLowerCase();
    const days =
      unit.startsWith("year") ? n * 365 : unit.startsWith("month") ? n * 30 : n * 7;
    const end = new Date(Date.now() + days * 86400_000);
    plannedEaEndDate = end.toISOString().slice(0, 10);
  }

  return {
    plannedEaEndDate,
    plannedEaDurationText,
    planned10TimingText,
  };
}

function coerceTimingToDate(text: string): string | null {
  const q = text.match(/Q([1-4])\s*(20\d{2})/i);
  if (q) {
    const quarter = Number.parseInt(q[1], 10);
    const year = Number.parseInt(q[2], 10);
    const month = (quarter - 1) * 3; // start of quarter (0-indexed)
    return new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  }
  const monthYear = text.match(
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/i
  );
  if (monthYear) {
    const d = new Date(`${monthYear[1]} 1, ${monthYear[2]} UTC`);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const yearOnly = text.match(/\b(20\d{2})\b/);
  if (yearOnly) {
    return `${yearOnly[1]}-01-01`;
  }
  return null;
}

async function rateLimitedGetText(
  host: "store.steampowered.com",
  url: string
): Promise<string | null> {
  // Local import avoids circular init; mirrors JSON client constraints.
  const { rateLimitedGetRawText } = await import("./http-client");
  return rateLimitedGetRawText(host, url);
}
