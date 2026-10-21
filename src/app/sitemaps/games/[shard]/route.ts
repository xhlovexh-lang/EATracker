import { NextResponse } from "next/server";
import { listIndexableGamesForSitemap } from "../../../../lib/repository";
import { SITE_URL } from "../../../../lib/seo";
import { SITEMAP_SHARD_SIZE } from "../../../../config/discovery";

export const dynamic = "force-dynamic";

/**
 * Segmented Game Sitemap (`/sitemaps/games/N`, ≤ 5,000 indexable URLs per shard)
 * Spec Section 9.4 — reads from Neon when available, else JSON fallback.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ shard: string }> }
) {
  const { shard: shardRaw } = await ctx.params;
  const shard = Number.parseInt(shardRaw, 10);
  if (!Number.isFinite(shard) || shard < 1) {
    return new NextResponse("Not found", { status: 404 });
  }

  const indexableGames = await listIndexableGamesForSitemap();
  const start = (shard - 1) * SITEMAP_SHARD_SIZE;
  if (start >= indexableGames.length && shard > 1) {
    return new NextResponse("Not found", { status: 404 });
  }

  const slice = indexableGames.slice(start, start + SITEMAP_SHARD_SIZE);

  const urlsXml = slice
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
