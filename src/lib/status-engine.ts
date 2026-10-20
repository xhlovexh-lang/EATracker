import { STATUS_CONFIG, type GameStatusType, type StatusThresholds } from "../config/status";
import type { StatusReason } from "../db/schema";

export interface StatusEvaluationInput {
  /** Whether the game currently has Steam genre 70 ("Early Access") */
  isEarlyAccessNow: boolean;
  /** Whether we previously tracked this game in Early Access */
  wasTrackedInEarlyAccess: boolean;
  /** Date the game entered Early Access (UTC Date or ISO string) */
  eaStartDate: Date | string | null;
  /** Date the game left Early Access (1.0 graduation) */
  leftEarlyAccessAt?: Date | string | null;
  /** Most recent official patch announcement (tagged "patchnotes") */
  lastPatchAt: Date | null;
  /** Most recent heuristic patch announcement (title regex match) */
  lastPatchHeuristicAt?: Date | null;
  /** Most recent community announcement by developer (feed_type = 1) */
  lastDevPostAt: Date | null;
  /** Most recent public branch build update from Steam PICS / steamcmd */
  lastBuildAt: Date | null;
  /** Number of developer announcements in the past 365 days */
  posts12m: number;
  /** Number of patch updates in the past 365 days */
  patches12m: number;
  /** Number of patches shipped after leaving Early Access (1.0) */
  post10Patches?: number;
  /** Total Steam user reviews */
  totalReviews: number;
  /** Total developer announcements recorded */
  totalPosts: number;
  /** Whether the game is marked adult-only (content_descriptors 3 or 4) */
  adult: boolean;
  /** Whether the game was delisted from Steam store */
  delisted: boolean;
  /** Verified external developer update URL (e.g. external devblog) */
  externalUpdatesUrl?: string | null;
  /** Reference timestamp for deterministic testing (defaults to now UTC) */
  now?: Date;
}

export interface StatusEvaluationResult {
  status: GameStatusType;
  activityScore: number;
  lastActivityAt: Date | null;
  lastShipAt: Date | null;
  eaDurationDays: number | null;
  reasons: StatusReason[];
  indexable: boolean;
  verdictSummary: string;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function toUtcDate(val: Date | string | null | undefined): Date | null {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatUtcDate(date: Date | string | null | undefined): string {
  const d = toUtcDate(date);
  if (!d) return "Never";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatUtcMonthYear(date: Date | string | null | undefined): string {
  const d = toUtcDate(date);
  if (!d) return "Unknown";
  return d.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function daysBetweenUtc(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY));
}

export function formatDurationDays(days: number | null | undefined): string {
  if (days === null || days === undefined || days < 0) return "Unknown duration";
  if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years === 0) {
    return `${months} month${months === 1 ? "" : "s"}`;
  }
  if (months === 0) {
    return `${years} year${years === 1 ? "" : "s"}`;
  }
  return `${years} year${years === 1 ? "" : "s"} ${months} month${months === 1 ? "" : "s"}`;
}

export function maxDate(...dates: (Date | null | undefined)[]): Date | null {
  let latest: Date | null = null;
  for (const d of dates) {
    if (d && !Number.isNaN(d.getTime())) {
      if (!latest || d.getTime() > latest.getTime()) {
        latest = d;
      }
    }
  }
  return latest;
}

/**
 * Deterministic Status & Activity Score Evaluator (Spec Section 8.2 & 8.3)
 */
export function evaluateGameStatus(
  input: StatusEvaluationInput,
  thresholds: StatusThresholds = STATUS_CONFIG
): StatusEvaluationResult {
  const now = input.now ?? new Date();
  const effectivePatchAt = maxDate(input.lastPatchAt, input.lastPatchHeuristicAt);
  const lastShipAt = maxDate(effectivePatchAt, input.lastBuildAt);
  const lastActivityAt = maxDate(effectivePatchAt, input.lastBuildAt, input.lastDevPostAt);

  const eaStart = toUtcDate(input.eaStartDate);
  const leftEa = toUtcDate(input.leftEarlyAccessAt);
  const eaEndRef = !input.isEarlyAccessNow && leftEa ? leftEa : now;
  const eaDurationDays = eaStart ? daysBetweenUtc(eaStart, eaEndRef) : null;

  const reasons: StatusReason[] = [];

  // Calculate Activity Score (0 - 100) per Section 8.3:
  // 40 * recency(lastShipAt) + 25 * recency(lastDevPostAt) + 20 * min(patches12m/12, 1) + 15 * min(posts12m/12, 1)
  const recency = (d: Date | null): number => {
    if (!d) return 0;
    const days = daysBetweenUtc(d, now);
    return Math.max(0, 1 - days / thresholds.scoreDecayDays);
  };

  const rawScore =
    40 * recency(lastShipAt) +
    25 * recency(input.lastDevPostAt) +
    20 * Math.min(Math.max(0, input.patches12m) / 12, 1) +
    15 * Math.min(Math.max(0, input.posts12m) / 12, 1);

  const activityScore = Math.round(Math.max(0, Math.min(100, rawScore)));

  if (!input.lastBuildAt) {
    reasons.push({
      code: "missing_build_signal",
      label: "Build timestamp via Steam PICS is unavailable; evaluated using official Steam announcements.",
    });
  }

  let status: GameStatusType;

  // Rule 1: Left Early Access (no longer has genre 70, and we tracked it in EA)
  if (!input.isEarlyAccessNow && input.wasTrackedInEarlyAccess) {
    status = "left_early_access";
    const post10Count = input.post10Patches ?? 0;
    reasons.push({
      code: "left_ea",
      label: leftEa
        ? `Graduated from Early Access to 1.0 release on ${formatUtcDate(leftEa)}.`
        : "Graduated from Steam Early Access to full 1.0 release.",
      date: leftEa ? leftEa.toISOString().slice(0, 10) : undefined,
    });
    reasons.push({
      code: "post_1_0_updates",
      label: `Updated ${post10Count} time${post10Count === 1 ? "" : "s"} since 1.0 release.`,
      value: post10Count,
    });
  }
  // Rule 2: Not enough data
  else if (!lastActivityAt) {
    status = "not_enough_data";
    reasons.push({
      code: "no_data",
      label: "No public developer announcements or build timestamps found on Steam.",
    });
  } else {
    const daysSinceActivity = daysBetweenUtc(lastActivityAt, now);
    const daysSinceShip = lastShipAt ? daysBetweenUtc(lastShipAt, now) : null;
    const daysSincePost = input.lastDevPostAt ? daysBetweenUtc(input.lastDevPostAt, now) : null;

    // Special Case check (Section 8.3):
    // Only developer announcements, no patch/build shipped, OR last shipped update > 365 days ago -> capped at `stalled`
    const hasRecentPost = daysSincePost !== null && daysSincePost <= thresholds.activePostDays;
    const hasRecentShip = daysSinceShip !== null && daysSinceShip <= thresholds.activeShipDays;
    const shipOverYearAgo = daysSinceShip === null || daysSinceShip > thresholds.postOnlyMaxShipDays;

    if (hasRecentShip) {
      status = "active";
      reasons.push({
        code: "recent_ship",
        label: `Shipped a game update ${daysSinceShip} day${daysSinceShip === 1 ? "" : "s"} ago (${formatUtcDate(lastShipAt)}).`,
        value: daysSinceShip!,
        date: lastShipAt!.toISOString().slice(0, 10),
      });
      if (daysSincePost !== null) {
        reasons.push({
          code: "recent_dev_post",
          label: `Last developer announcement posted on ${formatUtcDate(input.lastDevPostAt)} (${daysSincePost} days ago).`,
          value: daysSincePost,
          date: input.lastDevPostAt!.toISOString().slice(0, 10),
        });
      }
    } else if (hasRecentPost && !shipOverYearAgo) {
      status = "active";
      reasons.push({
        code: "recent_dev_post",
        label: `Developer posted an announcement ${daysSincePost} day${daysSincePost === 1 ? "" : "s"} ago (${formatUtcDate(input.lastDevPostAt)}).`,
        value: daysSincePost!,
        date: input.lastDevPostAt!.toISOString().slice(0, 10),
      });
      if (lastShipAt && daysSinceShip !== null) {
        reasons.push({
          code: "recent_ship",
          label: `Last patch or build update was ${daysSinceShip} days ago (${formatUtcDate(lastShipAt)}).`,
          value: daysSinceShip,
          date: lastShipAt.toISOString().slice(0, 10),
        });
      }
    } else if (
      daysSincePost !== null &&
      daysSincePost <= thresholds.slowingActivityDays &&
      shipOverYearAgo
    ) {
      // Capped at Stalled per Special Rule in 8.3
      status = "stalled";
      const monthsWithoutShip =
        daysSinceShip !== null ? Math.max(12, Math.floor(daysSinceShip / 30)) : null;
      reasons.push({
        code: "post_only_no_ship_over_1y",
        label: monthsWithoutShip
          ? `Developer posted recently (${formatUtcDate(input.lastDevPostAt)}), but no game update in ${monthsWithoutShip} months (last: ${formatUtcDate(lastShipAt)}).`
          : `Developer posted recently (${formatUtcDate(input.lastDevPostAt)}), but no patch or build update has been recorded on Steam in over 12 months.`,
        value: daysSinceShip ?? 366,
        date: input.lastDevPostAt!.toISOString().slice(0, 10),
      });
    } else if (daysSinceActivity <= thresholds.slowingActivityDays) {
      status = "slowing";
      reasons.push({
        code: "activity_slowing",
        label: `No patch or developer post for ${Math.max(3, Math.floor(daysSinceActivity / 30))} months (${daysSinceActivity} days since ${formatUtcDate(lastActivityAt)}).`,
        value: daysSinceActivity,
        date: lastActivityAt.toISOString().slice(0, 10),
      });
    } else if (daysSinceActivity <= thresholds.stalledActivityDays) {
      status = "stalled";
      reasons.push({
        code: "activity_stalled",
        label: `No developer update for ${Math.floor(daysSinceActivity / 30)} months (${daysSinceActivity} days since ${formatUtcDate(lastActivityAt)}).`,
        value: daysSinceActivity,
        date: lastActivityAt.toISOString().slice(0, 10),
      });
    } else {
      status = "likely_abandoned";
      reasons.push({
        code: "no_activity_over_1y",
        label: `No developer post, patch note, or public build update on Steam in ${Math.floor(daysSinceActivity / 30)} months (${daysSinceActivity} days since ${formatUtcDate(lastActivityAt)}).`,
        value: daysSinceActivity,
        date: lastActivityAt.toISOString().slice(0, 10),
      });
    }

    // Verified External Updates override (Section 8.4: cap worst status at slowing)
    if (
      input.externalUpdatesUrl &&
      (status === "stalled" || status === "likely_abandoned")
    ) {
      status = "slowing";
      reasons.unshift({
        code: "external_updates_verified",
        label: `Developer verified that updates are published externally (${input.externalUpdatesUrl}). Status adjusted to Slowing Down.`,
      });
    }
  }

  // Indexability rules (Section 9.4):
  // noindex if: not_enough_data, delisted, adult, OR (totalReviews < 10 AND totalPosts < 3)
  const isThinContent =
    input.totalReviews < thresholds.minIndexableReviews &&
    input.totalPosts < thresholds.minIndexablePosts;

  const indexable =
    status !== "not_enough_data" &&
    !input.delisted &&
    !input.adult &&
    !isThinContent;

  const verdictSummary = buildVerdictSummary({
    status,
    lastActivityAt,
    lastShipAt,
    lastDevPostAt: input.lastDevPostAt,
    leftEaAt: leftEa,
    post10Patches: input.post10Patches ?? 0,
    now,
  });

  return {
    status,
    activityScore,
    lastActivityAt,
    lastShipAt,
    eaDurationDays,
    reasons,
    indexable,
    verdictSummary,
  };
}

function buildVerdictSummary(params: {
  status: GameStatusType;
  lastActivityAt: Date | null;
  lastShipAt: Date | null;
  lastDevPostAt: Date | null;
  leftEaAt: Date | null;
  post10Patches: number;
  now: Date;
}): string {
  const { status, lastActivityAt, lastShipAt, lastDevPostAt, leftEaAt, post10Patches, now } =
    params;

  if (status === "left_early_access") {
    const gradDate = leftEaAt ? ` on ${formatUtcDate(leftEaAt)}` : "";
    const lastShipStr = lastShipAt ? ` Last update: ${formatUtcDate(lastShipAt)}.` : "";
    return `Left Early Access${gradDate} — updated ${post10Patches} time${post10Patches === 1 ? "" : "s"} since 1.0.${lastShipStr}`;
  }

  if (status === "not_enough_data" || !lastActivityAt) {
    return "Not enough data — no public developer announcements or build timestamps recorded on Steam yet.";
  }

  const days = daysBetweenUtc(lastActivityAt, now);
  const months = Math.max(1, Math.floor(days / 30));

  if (status === "active") {
    if (lastShipAt && daysBetweenUtc(lastShipAt, now) <= 90) {
      const shipDays = daysBetweenUtc(lastShipAt, now);
      return `Active — last game update shipped ${shipDays === 0 ? "today" : `${shipDays} day${shipDays === 1 ? "" : "s"} ago`} (${formatUtcDate(lastShipAt)}).`;
    }
    if (lastDevPostAt) {
      const postDays = daysBetweenUtc(lastDevPostAt, now);
      return `Active — last developer post ${postDays === 0 ? "today" : `${postDays} day${postDays === 1 ? "" : "s"} ago`} (${formatUtcDate(lastDevPostAt)}).`;
    }
  }

  if (status === "slowing") {
    return `Slowing down — no patch or developer post for ${months} month${months === 1 ? "" : "s"} (last: ${formatUtcDate(lastActivityAt)}).`;
  }

  if (status === "stalled") {
    const postDays = lastDevPostAt ? daysBetweenUtc(lastDevPostAt, now) : null;
    const shipDays = lastShipAt ? daysBetweenUtc(lastShipAt, now) : null;
    if (postDays !== null && postDays <= 180 && (shipDays === null || shipDays > 365)) {
      const shipPart = lastShipAt
        ? `no game update in ${Math.floor(shipDays! / 30)} months (last patch: ${formatUtcDate(lastShipAt)})`
        : "no recorded game patch on Steam in over 12 months";
      return `Stalled — developer posted on ${formatUtcDate(lastDevPostAt)}, but ${shipPart}.`;
    }
    return `Stalled — last developer activity ${months} months ago (${formatUtcDate(lastActivityAt)}).${lastShipAt ? ` Last patch: ${formatUtcDate(lastShipAt)}.` : ""}`;
  }

  return `Likely abandoned — no patch or developer post on Steam for ${months} months (last: ${formatUtcDate(lastActivityAt)}).`;
}
