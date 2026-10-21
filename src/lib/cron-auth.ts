import { NextResponse } from "next/server";

/**
 * Authorize cron/API invocations.
 * Accepts either:
 * - Vercel Cron header `x-vercel-cron: 1` (automatic on scheduled invokes)
 * - `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is configured
 * - `x-cron-secret: <CRON_SECRET>` for manual triggers
 *
 * COST NOTE: Setting CRON_SECRET is free (Vercel env var). Prefer configuring
 * it in the Vercel project so manual/preview triggers stay locked down.
 */
export function authorizeCronRequest(req: Request): NextResponse | null {
  const vercelCron = req.headers.get("x-vercel-cron");
  if (vercelCron === "1") return null;

  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    const headerSecret = req.headers.get("x-cron-secret");
    if (auth === `Bearer ${secret}` || headerSecret === secret) {
      return null;
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // No CRON_SECRET configured: allow only Vercel Cron header (already checked).
  // Reject other callers so the endpoint is not a public crawl trigger.
  return NextResponse.json(
    {
      error: "Unauthorized",
      hint: "Invoke via Vercel Cron, or set CRON_SECRET and pass Authorization: Bearer <secret>.",
    },
    { status: 401 }
  );
}
