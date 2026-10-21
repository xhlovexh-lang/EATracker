import { NextResponse } from "next/server";
import { ensureSchema } from "../../../../db/migrate";
import { getGameCountFromDb } from "../../../../lib/repository";
import { getJsonFallbackGames } from "../../../../lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Preview/production check that Neon is reachable.
 * Returns game row count only — never echoes connection strings or secrets.
 */
export async function GET() {
  const jsonFallbackCount = getJsonFallbackGames().length;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        ok: false,
        databaseConfigured: false,
        gameCount: null,
        jsonFallbackCount,
        message: "DATABASE_URL is not set; site will serve JSON fallback.",
      },
      { status: 503 }
    );
  }

  // Ensure tables exist (idempotent) so a fresh Neon branch reports a real count.
  const migrated = await ensureSchema();
  if (!migrated.ok) {
    return NextResponse.json(
      {
        ok: false,
        databaseConfigured: true,
        gameCount: null,
        jsonFallbackCount,
        message: "Database migrate failed",
      },
      { status: 503 }
    );
  }

  const countResult = await getGameCountFromDb();
  if (!countResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        databaseConfigured: true,
        gameCount: null,
        jsonFallbackCount,
        message: "Database query failed",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    databaseConfigured: true,
    gameCount: countResult.count,
    jsonFallbackCount,
    usingFallback: (countResult.count ?? 0) === 0,
    message:
      (countResult.count ?? 0) === 0
        ? "Database reachable but empty; site serves JSON fallback until seed/cron runs."
        : "Database reachable",
  });
}
