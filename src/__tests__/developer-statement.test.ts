import { describe, it, expect } from "vitest";
import {
  getAdjustedStatusLabel,
  getAllGames,
  getDeveloperStatement,
  getLastUpdateAt,
} from "../lib/catalog";
import { buildGameFaqItems, buildGameSeoMeta } from "../lib/seo";
import { formatDurationDays } from "../lib/status-engine";

describe("developer statement fairness + last update", () => {
  it("uses the verbatim Long Drive quote without engine-rewrite claims", () => {
    const longDrive = getAllGames().find((g) => g.appid === 1017180);
    expect(longDrive).toBeTruthy();
    const statement = getDeveloperStatement(longDrive!);
    expect(statement).toBeTruthy();
    expect(statement!.quote).toBe("Game Abandoned? No.");
    expect(statement!.stance).toBe("not_abandoned");
    expect(JSON.stringify(statement)).not.toMatch(/engine rewrite/i);

    const adjusted = getAdjustedStatusLabel(longDrive!);
    expect(adjusted.label).toMatch(/Stalled — developer says not abandoned/i);
    expect(adjusted.activityScoreNote).toMatch(/public Steam updates only/i);

    const faq = buildGameFaqItems(longDrive!)[0]!;
    expect(faq.answer).toContain('the developer said "Game Abandoned? No."');
    expect(faq.answer).toContain("Our status only measures public Steam activity");
    expect(faq.answer).not.toMatch(/engine rewrite/i);
  });

  it("uses a single lastShipAt last-update date for Lethal Company everywhere", () => {
    const lethal = getAllGames().find((g) => g.appid === 1966720);
    expect(lethal).toBeTruthy();
    const lastUpdate = getLastUpdateAt(lethal!);
    expect(lastUpdate).toBe(lethal!.lastShipAt);

    const meta = buildGameSeoMeta(lethal!);
    const faq = buildGameFaqItems(lethal!).find((f) =>
      f.question.includes("last updated")
    )!;
    expect(meta.description).toContain("Last update:");
    expect(meta.description).toContain("Last developer post:");
    // Dev post date must not replace last update in the title's Last Update slot
    if (lethal!.lastDevPostAt && lethal!.lastShipAt) {
      const shipMonth = lethal!.lastShipAt.slice(0, 7);
      const postMonth = lethal!.lastDevPostAt.slice(0, 7);
      if (shipMonth !== postMonth) {
        expect(faq.answer).toContain(
          new Date(lethal!.lastShipAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          })
        );
      }
    }
  });

  it("formats 1094 days as 3 years (no 2 years 12 months)", () => {
    expect(formatDurationDays(1094)).toBe("3 years");
  });

  it("includes KSP2 intro FAQs without prices or takeover claims", () => {
    const ksp2 = getAllGames().find((g) => g.appid === 954850);
    expect(ksp2).toBeTruthy();
    expect(ksp2!.slug).toBe("kerbal-space-program-2");
    const faqs = buildGameFaqItems(ksp2!);
    expect(faqs.some((f) => f.question.includes("still being developed"))).toBe(true);
    expect(faqs.some((f) => f.question.includes("KSP2 or KSP1"))).toBe(true);
    const blob = JSON.stringify(faqs);
    expect(blob).not.toMatch(/\$\d/);
    expect(blob).not.toMatch(/takeover|new owner|acquired/i);
  });
});
