import {
  pgTable,
  integer,
  text,
  boolean,
  date,
  timestamp,
  jsonb,
  serial,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import type { GameStatusType } from "../config/status";

export interface StatusReason {
  code:
    | "left_ea"
    | "no_data"
    | "recent_ship"
    | "recent_dev_post"
    | "post_only_no_ship_over_1y"
    | "activity_slowing"
    | "activity_stalled"
    | "no_activity_over_1y"
    | "external_updates_verified"
    | "missing_build_signal"
    | "post_1_0_updates";
  label: string;
  value?: number;
  date?: string;
}

export const games = pgTable(
  "games",
  {
    appid: integer("appid").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    type: text("type").default("game"),
    isFree: boolean("is_free").default(false),
    priceCents: integer("price_cents"),
    currency: text("currency").default("USD"),
    developers: text("developers").array().default([]),
    publishers: text("publishers").array().default([]),
    genres: text("genres").array().default([]),
    tags: text("tags").array().default([]),
    headerImage: text("header_image"),
    shortDescription: text("short_description"),
    isEarlyAccess: boolean("is_early_access").notNull().default(true),
    eaStartDate: date("ea_start_date"),
    leftEaAt: date("left_ea_at"),
    releaseDateRaw: text("release_date_raw"),
    comingSoon: boolean("coming_soon").default(false),
    reviewScoreDesc: text("review_score_desc"),
    totalPositive: integer("total_positive").default(0),
    totalNegative: integer("total_negative").default(0),
    totalReviews: integer("total_reviews").default(0),
    adult: boolean("adult").default(false),
    delisted: boolean("delisted").default(false),
    externalUpdatesUrl: text("external_updates_url"),
    ccu: integer("ccu").default(0),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).defaultNow(),
    storeCheckedAt: timestamp("store_checked_at", { withTimezone: true }),
    newsCheckedAt: timestamp("news_checked_at", { withTimezone: true }),
    buildCheckedAt: timestamp("build_checked_at", { withTimezone: true }),
  },
  (table) => [
    index("games_slug_idx").on(table.slug),
    index("games_is_ea_idx").on(table.isEarlyAccess),
  ]
);

export const newsItems = pgTable(
  "news_items",
  {
    gid: text("gid").primaryKey(),
    appid: integer("appid")
      .notNull()
      .references(() => games.appid, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    feedname: text("feedname").notNull(),
    feedType: integer("feed_type").notNull(),
    tags: text("tags").array().default([]),
    isPatch: boolean("is_patch").default(false).notNull(),
    isPatchHeuristic: boolean("is_patch_heuristic").default(false).notNull(),
    excerpt: text("excerpt"),
  },
  (table) => [
    index("news_appid_date_idx").on(table.appid, table.date),
  ]
);

export const builds = pgTable(
  "builds",
  {
    appid: integer("appid")
      .notNull()
      .references(() => games.appid, { onDelete: "cascade" }),
    buildid: text("buildid").notNull(),
    timeUpdated: timestamp("time_updated", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.appid, table.buildid] }),
    index("builds_appid_time_idx").on(table.appid, table.timeUpdated),
  ]
);

export const gameStatus = pgTable(
  "game_status",
  {
    appid: integer("appid")
      .primaryKey()
      .references(() => games.appid, { onDelete: "cascade" }),
    status: text("status").$type<GameStatusType>().notNull(),
    activityScore: integer("activity_score").notNull().default(0),
    lastPatchAt: timestamp("last_patch_at", { withTimezone: true }),
    lastPatchHeuristicAt: timestamp("last_patch_heuristic_at", { withTimezone: true }),
    lastDevPostAt: timestamp("last_dev_post_at", { withTimezone: true }),
    lastBuildAt: timestamp("last_build_at", { withTimezone: true }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
    lastShipAt: timestamp("last_ship_at", { withTimezone: true }),
    posts12m: integer("posts_12m").notNull().default(0),
    patches12m: integer("patches_12m").notNull().default(0),
    post10Patches: integer("post_10_patches").notNull().default(0),
    eaDurationDays: integer("ea_duration_days"),
    reasons: jsonb("reasons").$type<StatusReason[]>().notNull().default([]),
    indexable: boolean("indexable").notNull().default(false),
    statusChangedAt: timestamp("status_changed_at", { withTimezone: true }).defaultNow(),
    computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("game_status_status_idx").on(table.status),
    index("game_status_score_idx").on(table.activityScore),
    index("game_status_indexable_idx").on(table.indexable),
  ]
);

export const slugHistory = pgTable("slug_history", {
  oldSlug: text("old_slug").primaryKey(),
  appid: integer("appid")
    .notNull()
    .references(() => games.appid, { onDelete: "cascade" }),
});

export const crawlState = pgTable("crawl_state", {
  job: text("job").primaryKey(),
  cursor: text("cursor"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const crawlRuns = pgTable("crawl_runs", {
  id: serial("id").primaryKey(),
  job: text("job").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  ok: integer("ok").notNull().default(0),
  failed: integer("failed").notNull().default(0),
  notes: text("notes"),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  appid: integer("appid").notNull(),
  kind: text("kind").notNull(), // "external_roadmap" | "incorrect_date" | "left_ea" | "other"
  url: text("url"),
  message: text("message").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  status: text("status").notNull().default("pending"), // "pending" | "verified" | "dismissed"
});
