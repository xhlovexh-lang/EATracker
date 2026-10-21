import { describe, it, expect } from "vitest";
import { evaluateGameStatus, formatDurationDays, formatUtcDate } from "../lib/status-engine";

const REF_NOW = new Date("2026-10-19T12:00:00Z");

function daysAgo(days: number): Date {
  return new Date(REF_NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

describe("evaluateGameStatus — Deterministic Rule Set (Spec Section 8.3)", () => {
  it("1. returns left_early_access when game graduated from EA (no longer genre 70, was tracked)", () => {
    const res = evaluateGameStatus({
      isEarlyAccessNow: false,
      wasTrackedInEarlyAccess: true,
      eaStartDate: "2024-01-24",
      leftEarlyAccessAt: "2026-10-15",
      lastPatchAt: daysAgo(4),
      lastDevPostAt: daysAgo(4),
      lastBuildAt: daysAgo(4),
      posts12m: 14,
      patches12m: 8,
      post10Patches: 3,
      totalReviews: 45000,
      totalPosts: 30,
      adult: false,
      delisted: false,
      now: REF_NOW,
    });

    expect(res.status).toBe("left_early_access");
    expect(res.indexable).toBe(true);
    expect(res.verdictSummary).toContain("updated 3 times since 1.0");
    expect(res.reasons.some((r) => r.code === "post_1_0_updates")).toBe(true);
  });

  it("2. returns not_enough_data and noindex when lastActivityAt is null", () => {
    const res = evaluateGameStatus({
      isEarlyAccessNow: true,
      wasTrackedInEarlyAccess: true,
      eaStartDate: "2025-05-01",
      lastPatchAt: null,
      lastDevPostAt: null,
      lastBuildAt: null,
      posts12m: 0,
      patches12m: 0,
      totalReviews: 120,
      totalPosts: 0,
      adult: false,
      delisted: false,
      now: REF_NOW,
    });

    expect(res.status).toBe("not_enough_data");
    expect(res.indexable).toBe(false);
    expect(res.activityScore).toBe(0);
    expect(res.reasons.some((r) => r.code === "no_data")).toBe(true);
  });

  it("3a. returns active when shipped a patch or build within <= 90 days", () => {
    const res = evaluateGameStatus({
      isEarlyAccessNow: true,
      wasTrackedInEarlyAccess: true,
      eaStartDate: "2024-04-26",
      lastPatchAt: daysAgo(45),
      lastDevPostAt: daysAgo(70),
      lastBuildAt: daysAgo(20),
      posts12m: 12,
      patches12m: 10,
      totalReviews: 50000,
      totalPosts: 25,
      adult: false,
      delisted: false,
      now: REF_NOW,
    });

    expect(res.status).toBe("active");
    expect(res.activityScore).toBeGreaterThanOrEqual(80);
    expect(res.indexable).toBe(true);
  });

  it("3b. returns active when dev posted within <= 60 days and shipped within 365 days", () => {
    const res = evaluateGameStatus({
      isEarlyAccessNow: true,
      wasTrackedInEarlyAccess: true,
      eaStartDate: "2024-06-01",
      lastPatchAt: daysAgo(150),
      lastDevPostAt: daysAgo(15),
      lastBuildAt: null,
      posts12m: 6,
      patches12m: 3,
      totalReviews: 800,
      totalPosts: 10,
      adult: false,
      delisted: false,
      now: REF_NOW,
    });

    expect(res.status).toBe("active");
    expect(res.reasons.some((r) => r.code === "recent_dev_post")).toBe(true);
  });

  it("4. SPECIAL CASE: caps at stalled when developer posted recently (<60d) but no game update in >365 days", () => {
    const res = evaluateGameStatus({
      isEarlyAccessNow: true,
      wasTrackedInEarlyAccess: true,
      eaStartDate: "2022-01-10",
      lastPatchAt: daysAgo(420),
      lastDevPostAt: daysAgo(10),
      lastBuildAt: null,
      posts12m: 2,
      patches12m: 0,
      totalReviews: 350,
      totalPosts: 8,
      adult: false,
      delisted: false,
      now: REF_NOW,
    });

    expect(res.status).toBe("stalled");
    expect(res.reasons.some((r) => r.code === "post_only_no_ship_over_1y")).toBe(true);
    expect(
      res.reasons.find((r) => r.code === "post_only_no_ship_over_1y")?.label
    ).toContain("Developer posted recently");
  });

  it("5. returns slowing when lastActivityAt is between 91 and 180 days ago", () => {
    const res = evaluateGameStatus({
      isEarlyAccessNow: true,
      wasTrackedInEarlyAccess: true,
      eaStartDate: "2024-02-01",
      lastPatchAt: daysAgo(125),
      lastDevPostAt: daysAgo(125),
      lastBuildAt: daysAgo(120),
      posts12m: 4,
      patches12m: 3,
      totalReviews: 240,
      totalPosts: 9,
      adult: false,
      delisted: false,
      now: REF_NOW,
    });

    expect(res.status).toBe("slowing");
    expect(res.reasons.some((r) => r.code === "activity_slowing")).toBe(true);
  });

  it("6. returns stalled when lastActivityAt is between 181 and 365 days ago", () => {
    const res = evaluateGameStatus({
      isEarlyAccessNow: true,
      wasTrackedInEarlyAccess: true,
      eaStartDate: "2023-05-15",
      lastPatchAt: daysAgo(280),
      lastDevPostAt: daysAgo(240),
      lastBuildAt: null,
      posts12m: 1,
      patches12m: 1,
      totalReviews: 95,
      totalPosts: 6,
      adult: false,
      delisted: false,
      now: REF_NOW,
    });

    expect(res.status).toBe("stalled");
    expect(res.reasons.some((r) => r.code === "activity_stalled")).toBe(true);
  });

  it("7. returns likely_abandoned when lastActivityAt > 365 days ago", () => {
    const res = evaluateGameStatus({
      isEarlyAccessNow: true,
      wasTrackedInEarlyAccess: true,
      eaStartDate: "2021-11-01",
      lastPatchAt: daysAgo(580),
      lastDevPostAt: daysAgo(580),
      lastBuildAt: daysAgo(580),
      posts12m: 0,
      patches12m: 0,
      totalReviews: 1200,
      totalPosts: 12,
      adult: false,
      delisted: false,
      now: REF_NOW,
    });

    expect(res.status).toBe("likely_abandoned");
    expect(res.activityScore).toBe(0);
    expect(res.reasons.some((r) => r.code === "no_activity_over_1y")).toBe(true);
    expect(res.verdictSummary).toContain("Likely abandoned");
  });

  it("8. downgrades likely_abandoned to slowing when developer verified externalUpdatesUrl", () => {
    const res = evaluateGameStatus({
      isEarlyAccessNow: true,
      wasTrackedInEarlyAccess: true,
      eaStartDate: "2022-03-01",
      lastPatchAt: daysAgo(450),
      lastDevPostAt: daysAgo(450),
      lastBuildAt: null,
      posts12m: 0,
      patches12m: 0,
      totalReviews: 500,
      totalPosts: 5,
      adult: false,
      delisted: false,
      externalUpdatesUrl: "https://example-devblog.com/roadmap",
      now: REF_NOW,
    });

    expect(res.status).toBe("slowing");
    expect(res.reasons[0]?.code).toBe("external_updates_verified");
  });

  it("9. enforces noindex for adult content, delisted games, or thin pages (<10 reviews AND <3 posts)", () => {
    const thinRes = evaluateGameStatus({
      isEarlyAccessNow: true,
      wasTrackedInEarlyAccess: true,
      eaStartDate: "2026-01-01",
      lastPatchAt: daysAgo(20),
      lastDevPostAt: daysAgo(20),
      lastBuildAt: null,
      posts12m: 2,
      patches12m: 2,
      totalReviews: 5,
      totalPosts: 2,
      adult: false,
      delisted: false,
      now: REF_NOW,
    });
    expect(thinRes.indexable).toBe(false);

    const adultRes = evaluateGameStatus({
      isEarlyAccessNow: true,
      wasTrackedInEarlyAccess: true,
      eaStartDate: "2025-01-01",
      lastPatchAt: daysAgo(10),
      lastDevPostAt: daysAgo(10),
      lastBuildAt: null,
      posts12m: 10,
      patches12m: 10,
      totalReviews: 500,
      totalPosts: 15,
      adult: true,
      delisted: false,
      now: REF_NOW,
    });
    expect(adultRes.indexable).toBe(false);
  });

  it("formats dates and durations accurately in UTC", () => {
    expect(formatUtcDate(new Date("2025-03-03T00:00:00Z"))).toBe("Mar 3, 2025");
    expect(formatDurationDays(910)).toBe("2 years 6 months");
    // 1094 days was previously "2 years 12 months" — roll 12 months into the next year
    expect(formatDurationDays(1094)).toBe("3 years");
  });
});
