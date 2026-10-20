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

export async function discoverEarlyAccessCandidateAppIds(maxPages = 5): Promise<number[]> {
  const appIds = new Set<number>();

  // 1. Steam Store Search with tags=493 (Early Access) & category1=998 (Games only)
  for (let page = 0; page < maxPages; page++) {
    const start = page * 100;
    const url = `https://store.steampowered.com/search/results/?query&start=${start}&count=100&infinite=1&tags=493&category1=998&cc=us&l=english`;
    const raw = await rateLimitedGetJson<{ results_html?: string }>(
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
  }

  return Array.from(appIds);
}
