import { NextResponse } from "next/server";
import { SITE_URL } from "../../lib/seo";
import { GLOBAL_CATALOG_STATS } from "../../lib/catalog";

/**
 * Sitemap Index (`/sitemap.xml`) pointing to `/sitemaps/lists.xml` and `/sitemaps/games-1.xml`
 * per Spec Section 9.4.
 */
export async function GET() {
  const lastmod = GLOBAL_CATALOG_STATS.lastGlobalSyncUtc.slice(0, 10);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemaps/lists.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemaps/games-1.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
