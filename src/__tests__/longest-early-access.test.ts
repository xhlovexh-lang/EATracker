import { describe, expect, it } from "vitest";
import { getAllGames } from "../lib/catalog";
import {
  listLeftAfterLongStay,
  listStillInEaByDuration,
  STILL_IN_EA_TOP_N,
} from "../lib/longest-early-access";

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
});
