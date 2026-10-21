import { neon } from "@neondatabase/serverless";

/**
 * Idempotent schema setup for Neon (free tier). Safe to run on every cron
 * invocation — uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS only.
 */
export async function ensureSchema(databaseUrl = process.env.DATABASE_URL): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!databaseUrl) {
    return { ok: false, error: "DATABASE_URL is not set" };
  }

  const sql = neon(databaseUrl);

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS games (
        appid integer PRIMARY KEY,
        name text NOT NULL,
        slug text NOT NULL UNIQUE,
        type text DEFAULT 'game',
        is_free boolean DEFAULT false,
        price_cents integer,
        currency text DEFAULT 'USD',
        developers text[] DEFAULT '{}',
        publishers text[] DEFAULT '{}',
        genres text[] DEFAULT '{}',
        tags text[] DEFAULT '{}',
        header_image text,
        short_description text,
        is_early_access boolean NOT NULL DEFAULT true,
        ea_start_date date,
        left_ea_at date,
        release_date_raw text,
        coming_soon boolean DEFAULT false,
        review_score_desc text,
        total_positive integer DEFAULT 0,
        total_negative integer DEFAULT 0,
        total_reviews integer DEFAULT 0,
        adult boolean DEFAULT false,
        delisted boolean DEFAULT false,
        external_updates_url text,
        ccu integer DEFAULT 0,
        current_players integer,
        current_players_checked_at timestamptz,
        planned_ea_end_date date,
        planned_ea_duration_text text,
        planned_10_timing_text text,
        first_seen_at timestamptz DEFAULT now(),
        store_checked_at timestamptz,
        news_checked_at timestamptz,
        build_checked_at timestamptz
      )
    `;

    await sql`ALTER TABLE games ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'`;
    await sql`ALTER TABLE games ADD COLUMN IF NOT EXISTS current_players integer`;
    await sql`ALTER TABLE games ADD COLUMN IF NOT EXISTS current_players_checked_at timestamptz`;
    await sql`ALTER TABLE games ADD COLUMN IF NOT EXISTS planned_ea_end_date date`;
    await sql`ALTER TABLE games ADD COLUMN IF NOT EXISTS planned_ea_duration_text text`;
    await sql`ALTER TABLE games ADD COLUMN IF NOT EXISTS planned_10_timing_text text`;

    await sql`CREATE INDEX IF NOT EXISTS games_slug_idx ON games (slug)`;
    await sql`CREATE INDEX IF NOT EXISTS games_is_ea_idx ON games (is_early_access)`;
    await sql`CREATE INDEX IF NOT EXISTS games_planned_ea_end_idx ON games (planned_ea_end_date)`;
    await sql`CREATE INDEX IF NOT EXISTS games_left_ea_idx ON games (left_ea_at)`;

    await sql`
      CREATE TABLE IF NOT EXISTS news_items (
        gid text PRIMARY KEY,
        appid integer NOT NULL REFERENCES games(appid) ON DELETE CASCADE,
        title text NOT NULL,
        url text NOT NULL,
        date timestamptz NOT NULL,
        feedname text NOT NULL,
        feed_type integer NOT NULL,
        tags text[] DEFAULT '{}',
        is_patch boolean NOT NULL DEFAULT false,
        is_patch_heuristic boolean NOT NULL DEFAULT false,
        excerpt text
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS news_appid_date_idx ON news_items (appid, date)`;

    await sql`
      CREATE TABLE IF NOT EXISTS builds (
        appid integer NOT NULL REFERENCES games(appid) ON DELETE CASCADE,
        buildid text NOT NULL,
        time_updated timestamptz NOT NULL,
        PRIMARY KEY (appid, buildid)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS builds_appid_time_idx ON builds (appid, time_updated)`;

    await sql`
      CREATE TABLE IF NOT EXISTS game_status (
        appid integer PRIMARY KEY REFERENCES games(appid) ON DELETE CASCADE,
        status text NOT NULL,
        activity_score integer NOT NULL DEFAULT 0,
        last_patch_at timestamptz,
        last_patch_heuristic_at timestamptz,
        last_dev_post_at timestamptz,
        last_build_at timestamptz,
        last_activity_at timestamptz,
        last_ship_at timestamptz,
        posts_12m integer NOT NULL DEFAULT 0,
        patches_12m integer NOT NULL DEFAULT 0,
        post_10_patches integer NOT NULL DEFAULT 0,
        ea_duration_days integer,
        reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
        indexable boolean NOT NULL DEFAULT false,
        status_changed_at timestamptz DEFAULT now(),
        computed_at timestamptz DEFAULT now()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS game_status_status_idx ON game_status (status)`;
    await sql`CREATE INDEX IF NOT EXISTS game_status_score_idx ON game_status (activity_score)`;
    await sql`CREATE INDEX IF NOT EXISTS game_status_indexable_idx ON game_status (indexable)`;

    await sql`
      CREATE TABLE IF NOT EXISTS slug_history (
        old_slug text PRIMARY KEY,
        appid integer NOT NULL REFERENCES games(appid) ON DELETE CASCADE
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS crawl_state (
        job text PRIMARY KEY,
        cursor text,
        updated_at timestamptz DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS crawl_runs (
        id serial PRIMARY KEY,
        job text NOT NULL,
        started_at timestamptz DEFAULT now(),
        finished_at timestamptz,
        ok integer NOT NULL DEFAULT 0,
        failed integer NOT NULL DEFAULT 0,
        notes text
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS reports (
        id serial PRIMARY KEY,
        appid integer NOT NULL,
        kind text NOT NULL,
        url text,
        message text NOT NULL,
        email text,
        created_at timestamptz DEFAULT now(),
        status text NOT NULL DEFAULT 'pending'
      )
    `;

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[migrate] ensureSchema failed:", message);
    return { ok: false, error: message };
  }
}
