import { NextResponse } from "next/server";
import { catalogShare } from "../../lib/catalog";
import { loadCatalog } from "../../lib/repository";
import { SITE_URL } from "../../lib/seo";
import { STATUS_CONFIG } from "../../config/status";

/**
 * `/llms.txt` — Machine-readable guide for AI Search Engines
 */
export async function GET() {
  const catalog = await loadCatalog();
  const stats = catalog.stats;
  const games = catalog.games;

  const sampleLines = games
    .slice(0, 80)
    .map(
      (g) =>
        `- [${g.name} (${g.status.toUpperCase()} · Score ${g.activityScore}/100)](${SITE_URL}/game/${g.slug}): ${g.verdictSummary}`
    )
    .join("\n");

  const body = `# EA Tracker — Steam Early Access Abandonment & Update Cadence Database

> EA Tracker (${SITE_URL}) is an automated, deterministic database tracking ${stats.totalTracked.toLocaleString()} Steam Early Access games daily. It answers "Is [Game] abandoned?", "When was [Game] last updated?", and "Did [Game] keep updating after 1.0?" using verified Steam Community Announcements (feed_type = 1) and Steam PICS public depot build timestamps.

## Key Global Statistics (October 2026 Snapshot)
- Total Steam Early Access Games Tracked: ${stats.totalTracked.toLocaleString()}
- Active (Patch <= ${STATUS_CONFIG.activeShipDays}d or Dev Post <= ${STATUS_CONFIG.activePostDays}d): ${stats.activeCount.toLocaleString()} (${catalogShare(stats.activeCount, stats.totalTracked)})
- Slowing Down (${STATUS_CONFIG.activeShipDays + 1}-${STATUS_CONFIG.slowingActivityDays}d since activity): ${stats.slowingCount.toLocaleString()} (${catalogShare(stats.slowingCount, stats.totalTracked)})
- Stalled (${STATUS_CONFIG.slowingActivityDays + 1}-${STATUS_CONFIG.stalledActivityDays}d or talk-without-shipping > 365d): ${stats.stalledCount.toLocaleString()} (${catalogShare(stats.stalledCount, stats.totalTracked)})
- Likely Abandoned (> ${STATUS_CONFIG.stalledActivityDays}d without patch, post, or build): ${stats.abandonedCount.toLocaleString()} (${catalogShare(stats.abandonedCount, stats.totalTracked)})
- Combined 12+ Months Without Update: ${stats.overOneYearNoUpdate.toLocaleString()} (${catalogShare(stats.overOneYearNoUpdate, stats.totalTracked)})
- Graduated to 1.0 Release: ${stats.leftEaCount.toLocaleString()}
- Catalog source: ${catalog.source}

## Canonical Directories & Datasets
- [Abandoned Early Access Games List](${SITE_URL}/abandoned-early-access-games)
- [Longest Running Early Access Games Ranking](${SITE_URL}/longest-early-access-games)
- [Recently Updated Early Access Games](${SITE_URL}/recently-updated-early-access-games)
- [Coming to 1.0 Soon](${SITE_URL}/coming-to-1-0-soon)
- [Recently Left Early Access](${SITE_URL}/recently-left-early-access)
- [Graduated 1.0 Games & Post-Launch Patch Audit](${SITE_URL}/left-early-access)
- [Annual Early Access Statistics Report](${SITE_URL}/stats)
- [Deterministic Scoring Methodology](${SITE_URL}/methodology)
- [Database health (row count only)](${SITE_URL}/api/health/db)

## Tracked Game Audits (Direct Verdict Citations)
${sampleLines}
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
