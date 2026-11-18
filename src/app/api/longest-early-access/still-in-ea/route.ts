import { NextResponse } from "next/server";
import {
  listStillInEaByDuration,
  STILL_IN_EA_TOP_N,
  toStillInEaListItem,
} from "../../../../lib/longest-early-access";
import { loadCatalog } from "../../../../lib/repository";

export const runtime = "nodejs";
export const revalidate = 86400;

/**
 * Rows beyond the SSR Top-N for /longest-early-access-games “Show all”.
 * Kept off the first HTML response so the ranking page stays crawlable for Top 25
 * without inlining the full still-in-EA table + RSC flight copies.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawOffset = Number.parseInt(url.searchParams.get("offset") ?? "", 10);
  const offset =
    Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : STILL_IN_EA_TOP_N;

  const catalog = await loadCatalog();
  const stillInEa = listStillInEaByDuration(catalog.games);
  const games = stillInEa.slice(offset).map(toStillInEaListItem);

  return NextResponse.json(
    {
      total: stillInEa.length,
      offset,
      games,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
      },
    }
  );
}
