import { describe, expect, it } from "vitest";
import { getAllGames } from "../lib/catalog";
import {
  listLeftAfterLongStay,
  listStillInEaByDuration,
  STILL_IN_EA_TOP_N,
  toStillInEaListItem,
} from "../lib/longest-early-access";
import { buildSearchIndex } from "../lib/search-index";

describe("longest early access ranking splits", () => {
  const games = getAllGames();

  it("keeps still-in-EA and left-EA lists disjoint", () => {
    const still = listStillInEaByDuration(games);
    const left = listLeftAfterLongStay(games);
    const stillIds = new Set(still.map((g) => g.appid));
    for (const g of left) {
      expect(stillIds.has(g.appid)).toBe(false);
    }
  });

  it("ranks still-in-EA by duration descending", () => {
    const still = listStillInEaByDuration(games);
    expect(still.length).toBeGreaterThan(STILL_IN_EA_TOP_N);
    for (let i = 1; i < still.length; i++) {
      expect(still[i - 1]!.eaDurationDays ?? 0).toBeGreaterThanOrEqual(
        still[i]!.eaDurationDays ?? 0
      );
    }
    expect(still[0]?.isEarlyAccess).toBe(true);
    expect(still.some((g) => g.status === "left_early_access")).toBe(false);
  });

  it("lists long-stay graduations with leave dates, not still-stuck", () => {
    const left = listLeftAfterLongStay(games);
    expect(left.length).toBeGreaterThan(0);
    const names = left.map((g) => g.name);
    for (const expected of [
      "7 Days to Die",
      "Scrap Mechanic",
      "Valheim",
      "Core Keeper",
      "Enshrouded",
    ]) {
      expect(names).toContain(expected);
    }
    for (const g of left) {
      expect(g.leftEaAt || g.status === "left_early_access").toBeTruthy();
      expect(g.eaDurationDays ?? 0).toBeGreaterThanOrEqual(365);
    }
  });

  it("SSR default slice is Top N; remainder is available for client fetch", () => {
    const still = listStillInEaByDuration(games);
    const ssr = still.slice(0, STILL_IN_EA_TOP_N).map(toStillInEaListItem);
    const rest = still.slice(STILL_IN_EA_TOP_N).map(toStillInEaListItem);
    expect(ssr).toHaveLength(STILL_IN_EA_TOP_N);
    expect(rest.length).toBeGreaterThan(0);
    expect(ssr[0]?.slug).toBe(still[0]?.slug);
    expect(rest[0]?.slug).toBe(still[STILL_IN_EA_TOP_N]?.slug);
    // Compact DTO must not carry announcement timelines into HTML/RSC.
    expect(ssr[0]).not.toHaveProperty("announcements");
    expect(ssr[0]?.headerImage).toBeTruthy();
    expect(ssr[0]?.statusShortLabel).toBeTruthy();
  });
});

describe("search index payload", () => {
  it("builds lean autocomplete items without announcement payloads", () => {
    const items = buildSearchIndex(getAllGames());
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toEqual(
      expect.objectContaining({
        appid: expect.any(Number),
        name: expect.any(String),
        slug: expect.any(String),
        status: expect.any(String),
        activityScore: expect.any(Number),
        lastUpdateLabel: expect.any(String),
        headerImage: expect.any(String),
      })
    );
    expect(items[0]).not.toHaveProperty("announcements");
    expect(items[0]).not.toHaveProperty("monthlyTimeline");
  });
});
