export type GameStatusType =
  | "active"
  | "slowing"
  | "stalled"
  | "likely_abandoned"
  | "left_early_access"
  | "not_enough_data";

export interface StatusThresholds {
  /** Days since last patch or build update to qualify as Active */
  activeShipDays: number;
  /** Days since last developer post to qualify as Active (unless no ship in >365d) */
  activePostDays: number;
  /** Days since last activity to qualify as Slowing Down */
  slowingActivityDays: number;
  /** Days since last activity to qualify as Stalled (above this = Likely Abandoned) */
  stalledActivityDays: number;
  /** Maximum days without a shipped patch/build before dev-post-only is capped at Stalled */
  postOnlyMaxShipDays: number;
  /** Recency decay window in days for activityScore (0-100) */
  scoreDecayDays: number;
  /** Minimum reviews or announcements required for indexable SEO page */
  minIndexableReviews: number;
  minIndexablePosts: number;
}

export const STATUS_CONFIG: StatusThresholds = {
  activeShipDays: 90,
  activePostDays: 60,
  slowingActivityDays: 180,
  stalledActivityDays: 365,
  postOnlyMaxShipDays: 365,
  scoreDecayDays: 540,
  minIndexableReviews: 10,
  minIndexablePosts: 3,
};

export const STATUS_META: Record<
  GameStatusType,
  {
    label: string;
    shortLabel: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotColor: string;
    description: string;
  }
> = {
  active: {
    label: "Active",
    shortLabel: "Active",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-300",
    badgeBorder: "border-emerald-500/30",
    dotColor: "bg-emerald-400",
    description:
      "Shipped a patch or build within the last 90 days, or posted a developer announcement within the last 60 days (with a game update in the past year).",
  },
  slowing: {
    label: "Slowing Down",
    shortLabel: "Slowing",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-500/30",
    dotColor: "bg-amber-400",
    description:
      "Last recorded patch, build update, or developer announcement was between 91 and 180 days ago.",
  },
  stalled: {
    label: "Stalled",
    shortLabel: "Stalled",
    badgeBg: "bg-orange-500/15",
    badgeText: "text-orange-300",
    badgeBorder: "border-orange-500/30",
    dotColor: "bg-orange-400",
    description:
      "Last recorded update was between 181 and 365 days ago, or the developer posted recently without shipping a patch/build for over 12 months.",
  },
  likely_abandoned: {
    label: "Likely Abandoned",
    shortLabel: "Likely Abandoned",
    badgeBg: "bg-rose-500/15",
    badgeText: "text-rose-300",
    badgeBorder: "border-rose-500/30",
    dotColor: "bg-rose-500",
    description:
      "No developer announcement, patch note, or public Steam branch build update recorded for over 365 days.",
  },
  left_early_access: {
    label: "Left Early Access (1.0)",
    shortLabel: "1.0 Released",
    badgeBg: "bg-sky-500/15",
    badgeText: "text-sky-300",
    badgeBorder: "border-sky-500/30",
    dotColor: "bg-sky-400",
    description:
      "Graduated from Steam Early Access to full 1.0 release while tracked. We continue monitoring post-1.0 patches.",
  },
  not_enough_data: {
    label: "Not Enough Data",
    shortLabel: "Insufficient Data",
    badgeBg: "bg-slate-500/15",
    badgeText: "text-slate-300",
    badgeBorder: "border-slate-500/30",
    dotColor: "bg-slate-400",
    description:
      "No public community announcements or branch build timestamps found on Steam yet.",
  },
};
