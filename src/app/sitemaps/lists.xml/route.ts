import { NextResponse } from "next/server";
import { isGenreIndexable } from "../../../lib/catalog";
import { loadCatalog } from "../../../lib/repository";
import { SITE_URL } from "../../../lib/seo";

export async function GET() {
  const catalog = await loadCatalog();
  const lastmod = catalog.stats.lastGlobalSyncUtc.slice(0, 10);

  const staticPaths = [
    "/",
    "/abandoned-early-access-games",
    "/longest-early-access-games",
    "/recently-updated-early-access-games",
    "/left-early-access",
    "/recently-left-early-access",
    "/coming-to-1-0-soon",
    "/stats",
    "/methodology",
    // Only indexable genre pages (≥ 20 games)
    ...catalog.genres
      .filter((g) => isGenreIndexable(g.gameCount))
      .map((g) => `/genre/${g.slug}`),
  ];

  const urlsXml = staticPaths
    .map(
      (p) => `  <url>
    <loc>${SITE_URL}${p}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
  </url>`
    )
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
