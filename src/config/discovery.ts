/**
 * Gradual catalog expansion toward ~8,000 real Early Access games
 * (Steam genre 70, excluding unreleased / never-EA titles).
 *
 * Free-tier constraint: Vercel Hobby crons run at most once per day and
 * functions cap at 300s, so discovery progresses in small batches via
 * crawl_state cursors rather than a single full sweep.
 */
export const DISCOVERY_TARGET_GAMES = 8_000;

/** Games pre-rendered at build time; the rest are on-demand ISR. */
export const PREBUILD_GAME_LIMIT = 500;

/** Indexable genre pages need at least this many tracked games. */
export const MIN_GAMES_FOR_GENRE_INDEX = 20;

/** Soft floor for shipping a /genre page at all (still noindex if under INDEX). */
export const MIN_GAMES_FOR_GENRE_PAGE = 10;

/**
 * `/left-early-access` stays noindex,follow until it lists at least this many
 * graduated titles (same thin-page style as genre indexability).
 */
export const MIN_GAMES_FOR_LEFT_EA_INDEX = 10;

/** Max games processed per Vercel Cron invocation (Steam ~200 store req / 5 min). */
export const CRON_BATCH_SIZE = 8;

/** Sitemap shard size (Spec §9.4). */
export const SITEMAP_SHARD_SIZE = 5_000;
