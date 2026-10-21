import { describe, it, expect } from "vitest";
import { parseEarlyAccessPlanFromHtml } from "../../crawler/fetchers";
import { isGenreIndexable, MIN_GAMES_FOR_GENRE_INDEX } from "../lib/catalog";
import { DISCOVERY_TARGET_GAMES, PREBUILD_GAME_LIMIT } from "../config/discovery";

describe("Early Access plan HTML parser", () => {
  it("extracts duration and quarter timing from store notice text", () => {
    const html = `
      <h2>Early Access Game</h2>
      <p>This game is in Early Access. We plan to leave Early Access in Q3 2027
      after approximately 18 months of development. Get updates on the community hub.</p>
    `;
    const parsed = parseEarlyAccessPlanFromHtml(html);
    expect(parsed.plannedEaDurationText).toBe("18 months");
    expect(parsed.planned10TimingText?.toLowerCase()).toContain("q3");
    expect(parsed.plannedEaEndDate).toBe("2027-07-01");
  });

  it("returns nulls when no Early Access notice is present", () => {
    const parsed = parseEarlyAccessPlanFromHtml("<html><body>No EA block</body></html>");
    expect(parsed.plannedEaEndDate).toBeNull();
    expect(parsed.plannedEaDurationText).toBeNull();
    expect(parsed.planned10TimingText).toBeNull();
  });
});

describe("discovery & indexability constants", () => {
  it("targets ~8000 EA games and prebuilds only the top 500", () => {
    expect(DISCOVERY_TARGET_GAMES).toBe(8000);
    expect(PREBUILD_GAME_LIMIT).toBe(500);
  });

  it("keeps genre pages with fewer than 20 games noindex", () => {
    expect(MIN_GAMES_FOR_GENRE_INDEX).toBe(20);
    expect(isGenreIndexable(19)).toBe(false);
    expect(isGenreIndexable(20)).toBe(true);
  });
});
