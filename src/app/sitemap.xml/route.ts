import { NextResponse } from "next/server";
import { SITE_URL } from "../../lib/seo";
import { listIndexableGamesForSitemap, loadCatalog } from "../../lib/repository";
import { SITEMAP_SHARD_SIZE } from "../../config/discovery";

/**
 * Sitemap Index (`/sitemap.xml`) pointing to `/sitemaps/lists.xml` and
 * sharded `/sitemaps/games-N.xml` files (≤ 5,000 URLs each).
 */
export async function GET() {
  const catalog = await loadCatalog();
  const lastmod = catalog.stats.lastGlobalSyncUtc.slice(0, 10);
  const indexable = await listIndexableGamesForSitemap();
  const shardCount = Math.max(1, Math.ceil(indexable.length / SITEMAP_SHARD_SIZE));

  const gameSitemaps = Array.from({ length: shardCount }, (_, i) => `  <sitemap>
    <loc>${SITE_URL}/sitemaps/games/${i + 1}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemaps/lists.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
${gameSitemaps}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
