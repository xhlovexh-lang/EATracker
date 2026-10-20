import { describe, it, expect } from "vitest";
import { SEED_GAMES } from "../lib/catalog";
import { buildGameSeoMeta, buildGameJsonLd } from "../lib/seo";

describe("SEO & GEO Metadata and JSON-LD (Spec Section 9)", () => {
  it("generates title <= 60 chars and structured meta description", () => {
    for (const game of SEED_GAMES) {
      const meta = buildGameSeoMeta(game);
      expect(meta.title.length).toBeLessThanOrEqual(60);
      expect(meta.title).toContain(game.name.slice(0, 15));
      expect(meta.description).toContain("Early Access for");
      expect(meta.description).toContain("Last patch:");
      expect(meta.description).toContain("Status:");
    }
  });

  it("outputs VideoGame, FAQPage, and BreadcrumbList JSON-LD without aggregateRating", () => {
    const manor = SEED_GAMES[0]!;
    const schemas = buildGameJsonLd(manor);
    expect(schemas).toHaveLength(3);

    const jsonString = JSON.stringify(schemas);
    expect(jsonString).not.toContain("aggregateRating");
    expect(schemas[0]?.["@type"]).toBe("VideoGame");
    expect(schemas[1]?.["@type"]).toBe("FAQPage");
    expect(schemas[2]?.["@type"]).toBe("BreadcrumbList");
  });
});
