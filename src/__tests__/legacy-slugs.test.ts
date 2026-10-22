import { describe, it, expect } from "vitest";
import {
  LEGACY_GONE_SLUGS,
  LEGACY_REAL_GAME_SLUGS,
  getLegacySlugEntry,
  isLegacyGoneSlug,
} from "../lib/legacy-slugs";
import { getImportedGamesJsonCount, getJsonFallbackGames } from "../lib/catalog";
import importedGames from "../../data/imported-games.json";

describe("legacy demo slugs", () => {
  it("maps the four real titles to Steam appids with genre/home fallbacks", () => {
    expect(LEGACY_REAL_GAME_SLUGS["manor-lords"]?.appid).toBe(1363080);
    expect(LEGACY_REAL_GAME_SLUGS["valheim"]?.appid).toBe(892970);
    expect(LEGACY_REAL_GAME_SLUGS["enshrouded"]?.appid).toBe(1203620);
    expect(LEGACY_REAL_GAME_SLUGS["icarus-first-cohort"]?.appid).toBe(1149460);

    for (const entry of Object.values(LEGACY_REAL_GAME_SLUGS)) {
      expect(entry.fallbackPath.startsWith("/")).toBe(true);
      expect(getLegacySlugEntry(
        Object.keys(LEGACY_REAL_GAME_SLUGS).find(
          (s) => LEGACY_REAL_GAME_SLUGS[s] === entry
        )!
      )?.kind).toBe("real");
    }
  });

  it("marks the ten invented demo titles as gone", () => {
    expect(LEGACY_GONE_SLUGS.size).toBe(10);
    for (const slug of LEGACY_GONE_SLUGS) {
      expect(isLegacyGoneSlug(slug)).toBe(true);
      expect(getLegacySlugEntry(slug)?.kind).toBe("gone");
    }
  });

  it("covers all 14 retired demo URLs exactly once", () => {
    const all = [
      ...Object.keys(LEGACY_REAL_GAME_SLUGS),
      ...LEGACY_GONE_SLUGS,
    ];
    expect(all).toHaveLength(14);
    expect(new Set(all).size).toBe(14);
  });

  it("keeps json fallback / health count equal to imported-games.json only", () => {
    expect(getImportedGamesJsonCount()).toBe(importedGames.length);
    expect(getJsonFallbackGames().length).toBe(importedGames.length);
    for (const slug of allRetiredSlugs()) {
      expect(getJsonFallbackGames().some((g) => g.slug === slug)).toBe(false);
    }
  });
});

function allRetiredSlugs(): string[] {
  return [...Object.keys(LEGACY_REAL_GAME_SLUGS), ...LEGACY_GONE_SLUGS];
}
