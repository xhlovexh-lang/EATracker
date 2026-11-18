import { NextResponse } from "next/server";
import { loadCatalog } from "../../../lib/repository";
import { buildSearchIndex } from "../../../lib/search-index";

export const runtime = "nodejs";
/** Match ranking-page ISR cadence; search index is catalog-derived. */
export const revalidate = 86400;

/**
 * Autocomplete catalog for the site header / search UI.
 * Served on demand so full game lists are not inlined into every page's RSC HTML.
 */
export async function GET() {
  const catalog = await loadCatalog();
  const items = buildSearchIndex(catalog.games);
  return NextResponse.json(
    { items },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
      },
    }
  );
}
