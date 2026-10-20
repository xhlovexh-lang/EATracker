import { z } from "zod";

export const SteamAppDetailsDataSchema = z.object({
  type: z.string(),
  name: z.string(),
  steam_appid: z.number(),
  required_age: z.union([z.number(), z.string()]).optional(),
  is_free: z.boolean().optional(),
  short_description: z.string().optional(),
  header_image: z.string().nullable().optional(),
  capsule_image: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  developers: z.array(z.string()).optional(),
  publishers: z.array(z.string()).optional(),
  price_overview: z
    .object({
      currency: z.string(),
      initial: z.number(),
      final: z.number(),
      discount_percent: z.number(),
    })
    .optional(),
  genres: z
    .array(
      z.object({
        id: z.string(),
        description: z.string(),
      })
    )
    .optional(),
  release_date: z
    .object({
      coming_soon: z.boolean(),
      date: z.string(),
    })
    .optional(),
  content_descriptors: z
    .object({
      ids: z.array(z.number()).optional(),
      notes: z.string().nullable().optional(),
    })
    .optional(),
});

export const SteamAppDetailsEnvelopeSchema = z.record(
  z.string(),
  z.object({
    success: z.boolean(),
    data: SteamAppDetailsDataSchema.optional(),
  })
);

export const SteamNewsItemSchema = z.object({
  gid: z.string(),
  title: z.string(),
  url: z.string(),
  is_external_url: z.boolean().optional(),
  author: z.string().optional(),
  contents: z.string().optional(),
  feedlabel: z.string().optional(),
  date: z.number(),
  feedname: z.string(),
  feed_type: z.number(),
  appid: z.number(),
  tags: z.array(z.string()).optional(),
});

export const SteamNewsResponseSchema = z.object({
  appnews: z.object({
    appid: z.number(),
    count: z.number().optional(),
    newsitems: z.array(SteamNewsItemSchema),
  }),
});

export const SteamAppReviewsSchema = z.object({
  success: z.number(),
  query_summary: z
    .object({
      num_reviews: z.number().optional(),
      review_score: z.number().optional(),
      review_score_desc: z.string().optional(),
      total_positive: z.number().optional(),
      total_negative: z.number().optional(),
      total_reviews: z.number().optional(),
    })
    .optional(),
});

export const SteamCmdInfoSchema = z.object({
  status: z.string().optional(),
  data: z
    .record(
      z.string(),
      z.object({
        common: z
          .object({
            name: z.string().optional(),
            type: z.string().optional(),
            steam_release_date: z.union([z.string(), z.number()]).optional(),
            genres: z.record(z.string(), z.string()).optional(),
          })
          .optional(),
        depots: z
          .object({
            branches: z
              .object({
                public: z
                  .object({
                    buildid: z.union([z.string(), z.number()]).optional(),
                    timeupdated: z.union([z.string(), z.number()]).optional(),
                  })
                  .optional(),
              })
              .optional(),
          })
          .optional(),
      })
    )
    .optional(),
});

export const PATCH_TITLE_REGEX =
  /\b(patch|hotfix|update|v?\d+\.\d+(\.\d+)?|changelog|build)\b/i;

export function classifyNewsItem(item: z.infer<typeof SteamNewsItemSchema>) {
  // Section 6.2: Only feedname === "steam_community_announcements" (feed_type === 1) are official dev announcements
  const isOfficialDevAnnouncement =
    item.feed_type === 1 || item.feedname === "steam_community_announcements";

  const tags = item.tags ?? [];
  const isPatch = tags.some((t) => t.toLowerCase() === "patchnotes");
  const isPatchHeuristic = !isPatch && PATCH_TITLE_REGEX.test(item.title);

  // Strip BBCode/HTML tags cleanly for safe excerpt display
  const rawContents = item.contents ?? "";
  const cleanExcerpt = rawContents
    .replace(/\[\/?[a-z0-9=*_ -]+\]/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);

  return {
    isOfficialDevAnnouncement,
    isPatch,
    isPatchHeuristic,
    cleanExcerpt,
  };
}

export function isValidUnixTimestamp(ts: number | string | undefined | null): Date | null {
  if (ts === undefined || ts === null) return null;
  const sec = typeof ts === "string" ? Number.parseInt(ts, 10) : ts;
  if (!Number.isFinite(sec) || sec <= 0) return null;
  const nowSec = Math.floor(Date.now() / 1000) + 86400; // allow +24h clock skew max
  if (sec > nowSec) {
    console.warn(`[Timestamp Discard] Future timestamp ignored: ${sec}`);
    return null;
  }
  return new Date(sec * 1000);
}
