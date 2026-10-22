import { NextResponse } from "next/server";
import { authorizeCronRequest } from "../../../../lib/cron-auth";
import { ensureSchema } from "../../../../db/migrate";
import { seedFromImportedJson } from "../../../../db/seed";
import { CRON_BATCH_SIZE } from "../../../../config/discovery";
import { runCrawlJob, type CrawlJobName } from "../../../../../crawler/jobs";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const ALLOWED_JOBS = new Set<CrawlJobName>([
  "discover",
  "refresh-hot",
  "refresh-store",
  "refresh-news",
  "refresh-players",
  "rescore",
  "seed-migrate",
]);

/**
 * Vercel Cron entrypoint. Hobby plan: once per day per cron path, 300s max.
 * Processes a small batch and advances crawl_state cursors so discovery can
 * gradually approach DISCOVERY_TARGET_GAMES (~8,000).
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ job: string }> }
) {
  const unauthorized = authorizeCronRequest(req);
  if (unauthorized) return unauthorized;

  const { job: rawJob } = await ctx.params;
  const job = rawJob as CrawlJobName;
  if (!ALLOWED_JOBS.has(job)) {
    return NextResponse.json(
      { error: `Unknown job "${rawJob}"`, allowed: [...ALLOWED_JOBS] },
      { status: 400 }
    );
  }

  const migrated = await ensureSchema();
  if (!migrated.ok) {
    return NextResponse.json(
      { error: "Schema migrate failed", detail: migrated.error },
      { status: 500 }
    );
  }

  if (job === "seed-migrate") {
    // Empty DB → insert all JSON rows; non-empty → insert missing appids only (never overwrite).
    const seeded = await seedFromImportedJson();
    return NextResponse.json({
      job,
      migrated: true,
      seeded,
      at: new Date().toISOString(),
    });
  }

  // Auto-seed if empty; additive insert for JSON appids missing from Neon.
  const seeded = await seedFromImportedJson();
  const result = await runCrawlJob(job, CRON_BATCH_SIZE);

  return NextResponse.json({
    job,
    migrated: true,
    seeded,
    result,
    at: new Date().toISOString(),
  });
}
