import { NextResponse } from "next/server";
import { getAllGames } from "../../../lib/catalog";
import { SITE_URL } from "../../../lib/seo";

/**
 * Segmented Game Sitemap (`/sitemaps/games-1.xml`, <= 5,000 indexable URLs per shard)
 * Spec Section 9.4:
 * - Only includes `indexable = true` games
 * - `lastmod = max(lastActivityAt, statusChangedAt)` (never set all pages to today!)
 */
export async function GET() {
  const indexableGames = getAllGames()
    .filter((g) => g.indexable && !g.delisted && !g.adult)
    .slice(0, 5000);

  const urlsXml = indexableGames
    .map((g) => {
      const actTime = g.lastActivityAt ? new Date(g.lastActivityAt).getTime() : 0;
      const chgTime = g.statusChangedAt ? new Date(g.statusChangedAt).getTime() : 0;
      const maxTs = Math.max(actTime, chgTime);
      const lastmod = maxTs > 0 ? new Date(maxTs).toISOString().slice(0, 10) : "2026-10-01";

      return `  <url>
    <loc>${SITE_URL}/game/${g.slug}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
