import { describe, it, expect } from "vitest";
import { getAllGames, getDeveloperStatement, GENRE_CATEGORIES } from "../lib/catalog";
import {
  buildGameSeoMeta,
  buildGameJsonLd,
  truncateTitleAtWord,
} from "../lib/seo";

describe("SEO & GEO Metadata and JSON-LD (Spec Section 9)", () => {
  const sampleGames = getAllGames()
    .filter((g) => g.indexable)
    .sort((a, b) => b.totalReviews - a.totalReviews)
    .slice(0, 12);

  it("generates title <= 60 chars and structured meta description", () => {
    expect(sampleGames.length).toBeGreaterThan(0);
    for (const game of sampleGames) {
      const meta = buildGameSeoMeta(game);
      expect(meta.title.length).toBeLessThanOrEqual(60);
      expect(meta.title).toContain(game.name.slice(0, Math.min(15, game.name.length)));
      expect(meta.description).toContain("Early Access for");
      expect(meta.description).toContain("Last patch:");
      expect(meta.description).toContain("Status:");
    }
  });

  it("truncates long titles on a word boundary", () => {
    const long =
      "Is Extremely Long Game Name That Exceeds Sixty Characters Abandoned? (Stalled)";
    const naive = long.slice(0, 60);
    const truncated = truncateTitleAtWord(long, 60);
    expect(truncated.length).toBeLessThanOrEqual(60);
    expect(truncated.endsWith(" ")).toBe(false);
    // Word-boundary truncate should differ from a naive mid-word cut
    expect(truncated).not.toBe(naive);
    expect(naive.endsWith("Charact") || naive.includes("Charact")).toBe(true);
    expect(truncated.endsWith("Characters") || truncated.includes("Characters")).toBe(
      true
    );
  });

  it("outputs VideoGame, FAQPage, and BreadcrumbList JSON-LD without aggregateRating", () => {
    const game = sampleGames[0]!;
    const schemas = buildGameJsonLd(game);
    expect(schemas).toHaveLength(3);

    const jsonString = JSON.stringify(schemas);
    expect(jsonString).not.toContain("aggregateRating");
    expect(schemas[0]?.["@type"]).toBe("VideoGame");
    expect(schemas[1]?.["@type"]).toBe("FAQPage");
    expect(schemas[2]?.["@type"]).toBe("BreadcrumbList");
  });

  it("pairs breadcrumb genre name and URL from the same sitemap genre", () => {
    const withGenre = sampleGames.find((g) =>
      g.tags.some((t) => GENRE_CATEGORIES.some((c) => c.slug === t.toLowerCase()))
    );
    expect(withGenre).toBeTruthy();
    const schemas = buildGameJsonLd(withGenre!);
    const breadcrumb = schemas[2] as {
      itemListElement: Array<{ position: number; name: string; item: string }>;
    };
    const genreItem = breadcrumb.itemListElement.find((i) => i.position === 2)!;
    const known = GENRE_CATEGORIES.find((c) => c.name === genreItem.name);
    expect(known).toBeTruthy();
    expect(genreItem.item).toBe(`https://eatrackers.vercel.app/genre/${known!.slug}`);
  });

  it("surfaces The Long Drive developer statement", () => {
    const longDrive = getAllGames().find((g) => g.slug === "the-long-drive");
    expect(longDrive).toBeTruthy();
    const statement = getDeveloperStatement(longDrive!);
    expect(statement).toBeTruthy();
    expect(statement!.summary.toLowerCase()).toContain("not abandoned");
  });
});
