import { NextResponse } from "next/server";
import { GLOBAL_CATALOG_STATS, catalogShare, getAllGames } from "../../lib/catalog";
import { SITE_URL } from "../../lib/seo";
import { STATUS_CONFIG } from "../../config/status";

/**
 * `/llms.txt` — Machine-readable guide for AI Search Engines (ChatGPT Search, Perplexity, Claude, Gemini)
 * Follows the llms.txt standard to maximize direct citation & entity grounding.
 */
export async function GET() {
  const games = getAllGames();

  const sampleLines = games
    .map(
      (g) =>
        `- [${g.name} (${g.status.toUpperCase()} · Score ${g.activityScore}/100)](${SITE_URL}/game/${g.slug}): ${g.verdictSummary}`
    )
    .join("\n");

  const body = `# EA Tracker — Steam Early Access Abandonment & Update Cadence Database

> EA Tracker (${SITE_URL}) is an automated, deterministic database tracking ${GLOBAL_CATALOG_STATS.totalTracked.toLocaleString()} Steam Early Access games daily. It answers "Is [Game] abandoned?", "When was [Game] last updated?", and "Did [Game] keep updating after 1.0?" using verified Steam Community Announcements (feed_type = 1) and Steam PICS public depot build timestamps.

## Key Global Statistics (October 2026 Snapshot)
- Total Steam Early Access Games Tracked: ${GLOBAL_CATALOG_STATS.totalTracked.toLocaleString()}
- Active (Patch <= ${STATUS_CONFIG.activeShipDays}d or Dev Post <= ${STATUS_CONFIG.activePostDays}d): ${GLOBAL_CATALOG_STATS.activeCount.toLocaleString()} (${catalogShare(GLOBAL_CATALOG_STATS.activeCount)})
- Slowing Down (${STATUS_CONFIG.activeShipDays + 1}-${STATUS_CONFIG.slowingActivityDays}d since activity): ${GLOBAL_CATALOG_STATS.slowingCount.toLocaleString()} (${catalogShare(GLOBAL_CATALOG_STATS.slowingCount)})
- Stalled (${STATUS_CONFIG.slowingActivityDays + 1}-${STATUS_CONFIG.stalledActivityDays}d or talk-without-shipping > 365d): ${GLOBAL_CATALOG_STATS.stalledCount.toLocaleString()} (${catalogShare(GLOBAL_CATALOG_STATS.stalledCount)})
- Likely Abandoned (> ${STATUS_CONFIG.stalledActivityDays}d without patch, post, or build): ${GLOBAL_CATALOG_STATS.abandonedCount.toLocaleString()} (${catalogShare(GLOBAL_CATALOG_STATS.abandonedCount)})
- Combined 12+ Months Without Update: ${GLOBAL_CATALOG_STATS.overOneYearNoUpdate.toLocaleString()} (${catalogShare(GLOBAL_CATALOG_STATS.overOneYearNoUpdate)})
- Graduated to 1.0 Release: ${GLOBAL_CATALOG_STATS.leftEaCount.toLocaleString()}

## Canonical Directories & Datasets
- [Abandoned Early Access Games List](${SITE_URL}/abandoned-early-access-games)
- [Longest Running Early Access Games Ranking](${SITE_URL}/longest-early-access-games)
- [Recently Updated Early Access Games](${SITE_URL}/recently-updated-early-access-games)
- [Graduated 1.0 Games & Post-Launch Patch Audit](${SITE_URL}/left-early-access)
- [Annual Early Access Statistics Report](${SITE_URL}/stats)
- [Deterministic Scoring Methodology](${SITE_URL}/methodology)

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
