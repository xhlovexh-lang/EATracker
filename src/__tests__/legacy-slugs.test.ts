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
  it("maps real titles and 7DTD/KSP2 demo URLs to Steam appids", () => {
    expect(LEGACY_REAL_GAME_SLUGS["manor-lords"]?.appid).toBe(1363080);
    expect(LEGACY_REAL_GAME_SLUGS["valheim"]?.appid).toBe(892970);
    expect(LEGACY_REAL_GAME_SLUGS["enshrouded"]?.appid).toBe(1203620);
    expect(LEGACY_REAL_GAME_SLUGS["icarus-first-cohort"]?.appid).toBe(1149460);
    expect(LEGACY_REAL_GAME_SLUGS["7-days-survival-sandbox"]?.appid).toBe(251570);
    expect(LEGACY_REAL_GAME_SLUGS["starsector-frontier-protocol"]?.appid).toBe(954850);

    for (const entry of Object.values(LEGACY_REAL_GAME_SLUGS)) {
      expect(entry.fallbackPath.startsWith("/")).toBe(true);
    }
  });

  it("keeps only unverifiable invented titles as gone", () => {
    expect(LEGACY_GONE_SLUGS.has("7-days-survival-sandbox")).toBe(false);
    expect(LEGACY_GONE_SLUGS.has("chrono-forged-aether-realms")).toBe(true);
    for (const slug of LEGACY_GONE_SLUGS) {
      expect(isLegacyGoneSlug(slug)).toBe(true);
      expect(getLegacySlugEntry(slug)?.kind).toBe("gone");
    }
  });

  it("serves real 7 Days to Die under the canonical slug in JSON fallback", () => {
    const seven = getJsonFallbackGames().find((g) => g.appid === 251570);
    expect(seven?.slug).toBe("7-days-to-die");
    expect(seven?.name).toBe("7 Days to Die");
    expect(getJsonFallbackGames().some((g) => g.slug === "7-days-survival-sandbox")).toBe(
      false
    );
  });

  it("keeps json fallback / health count equal to imported-games.json only", () => {
    expect(getImportedGamesJsonCount()).toBe(importedGames.length);
    expect(getJsonFallbackGames().length).toBe(importedGames.length);
  });
});
