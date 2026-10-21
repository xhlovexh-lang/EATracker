import { describe, it, expect } from "vitest";
import {
  GENRE_CATEGORIES,
  getGamesByGenreSlug,
  SEED_GAMES,
} from "../lib/catalog";
import {
  buildGenrePageStats,
  buildGenreSummaryParagraph,
  genreIndexabilityCounts,
  isGenrePageIndexable,
  MIN_GAMES_FOR_GENRE_INDEX,
} from "../lib/genre-stats";

describe("genre page stats & indexability", () => {
  it(`marks genre pages with fewer than ${MIN_GAMES_FOR_GENRE_INDEX} games as noindex`, () => {
    expect(isGenrePageIndexable(MIN_GAMES_FOR_GENRE_INDEX - 1)).toBe(false);
    expect(isGenrePageIndexable(MIN_GAMES_FOR_GENRE_INDEX)).toBe(true);
    expect(isGenrePageIndexable(0)).toBe(false);
  });

  it("reports indexed vs noindexed genre directory counts from live catalog", () => {
    const counts = genreIndexabilityCounts(GENRE_CATEGORIES, getGamesByGenreSlug);
    expect(counts.total).toBe(GENRE_CATEGORIES.length);
    expect(counts.indexed + counts.noindexed).toBe(counts.total);
    expect(counts.indexed).toBeGreaterThan(0);
    expect(counts.noindexed).toBeGreaterThan(0);

    for (const cat of GENRE_CATEGORIES) {
      const n = getGamesByGenreSlug(cat.slug).length;
      const shouldIndex = n >= MIN_GAMES_FOR_GENRE_INDEX;
      expect(isGenrePageIndexable(n)).toBe(shouldIndex);
    }
  });

  it("builds status shares, median EA duration, and highlight lists from real data", () => {
    const survival = getGamesByGenreSlug("survival");
    expect(survival.length).toBeGreaterThanOrEqual(MIN_GAMES_FOR_GENRE_INDEX);

    const stats = buildGenrePageStats(survival, "Survival");
    expect(stats.total).toBe(survival.length);
    expect(stats.indexable).toBe(true);
    expect(stats.statusCounts).toHaveLength(5);

    const statusSum = stats.statusCounts.reduce((sum, row) => sum + row.count, 0);
    expect(statusSum + stats.notEnoughDataCount).toBe(stats.total);

    for (const row of stats.statusCounts) {
      expect(row.sharePercent).toBeGreaterThanOrEqual(0);
      expect(row.sharePercent).toBeLessThanOrEqual(100);
      if (stats.total > 0) {
        expect(row.sharePercent).toBe(
          Math.round((row.count / stats.total) * 1000) / 10
        );
      }
    }

    expect(stats.recentlyUpdated.length).toBeGreaterThan(0);
    expect(stats.recentlyUpdated.length).toBeLessThanOrEqual(5);
    expect(stats.longestGap.length).toBeGreaterThan(0);
    expect(stats.longestGap.length).toBeLessThanOrEqual(5);

    // Recently updated should be newest-first by lastActivityAt
    for (let i = 1; i < stats.recentlyUpdated.length; i++) {
      const prev = stats.recentlyUpdated[i - 1]!.lastActivityAt!;
      const curr = stats.recentlyUpdated[i]!.lastActivityAt!;
      expect(new Date(prev).getTime()).toBeGreaterThanOrEqual(
        new Date(curr).getTime()
      );
    }

    // Longest gap should be oldest-first (nulls treated as longest)
    for (let i = 1; i < stats.longestGap.length; i++) {
      const prev = stats.longestGap[i - 1]!;
      const curr = stats.longestGap[i]!;
      if (!prev.lastActivityAt) continue;
      if (!curr.lastActivityAt) {
        expect.fail("null activity should sort before dated activity");
      }
      expect(new Date(prev.lastActivityAt).getTime()).toBeLessThanOrEqual(
        new Date(curr.lastActivityAt).getTime()
      );
    }

    expect(stats.summary).toContain(String(stats.total));
    expect(stats.summary).toContain("Survival");
    expect(stats.summary).toContain(stats.medianEaDurationLabel);
  });

  it("generates different summary paragraphs for different genre mixes", () => {
    const a = buildGenrePageStats(getGamesByGenreSlug("survival"), "Survival");
    const b = buildGenrePageStats(getGamesByGenreSlug("space"), "Space & Sci-Fi");
    expect(a.summary).not.toBe(b.summary);
    expect(a.summary).toContain("Survival");
    expect(b.summary).toContain("Space & Sci-Fi");
  });

  it("summary only restates provided numbers (no invented game names)", () => {
    const games = SEED_GAMES.slice(0, 3);
    const statsBase = buildGenrePageStats(games, "Test Genre");
    const summary = buildGenreSummaryParagraph(statsBase);
    expect(summary).toContain("3");
    expect(summary).toContain("Test Genre");
    const named = new Set(
      [statsBase.recentlyUpdated[0]?.name, statsBase.longestGap[0]?.name].filter(
        Boolean
      ) as string[]
    );
    for (const name of named) {
      expect(summary).toContain(name);
    }
    for (const game of games) {
      if (!named.has(game.name)) {
        expect(summary).not.toContain(game.name);
      }
    }
    expect(summary).not.toMatch(/\bapproximately\b/i);
    expect(summary).not.toMatch(/\bestimated\b/i);
  });

  it("handles empty genre lists without throwing", () => {
    const stats = buildGenrePageStats([], "Empty");
    expect(stats.total).toBe(0);
    expect(stats.indexable).toBe(false);
    expect(stats.recentlyUpdated).toEqual([]);
    expect(stats.longestGap).toEqual([]);
    expect(stats.summary).toContain("Empty");
  });
});
