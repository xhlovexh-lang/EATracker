import { NextResponse } from "next/server";
import {
  GENRE_CATEGORIES,
  GLOBAL_CATALOG_STATS,
  getGamesByGenreSlug,
} from "../../../lib/catalog";
import { isGenrePageIndexable } from "../../../lib/genre-stats";
import { SITE_URL } from "../../../lib/seo";

export async function GET() {
  const lastmod = GLOBAL_CATALOG_STATS.lastGlobalSyncUtc.slice(0, 10);

  const indexableGenrePaths = GENRE_CATEGORIES.filter((g) =>
    isGenrePageIndexable(getGamesByGenreSlug(g.slug).length)
  ).map((g) => `/genre/${g.slug}`);

  const staticPaths = [
    "/",
    "/abandoned-early-access-games",
    "/longest-early-access-games",
    "/recently-updated-early-access-games",
    "/left-early-access",
    "/stats",
    "/methodology",
    ...indexableGenrePaths,
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
