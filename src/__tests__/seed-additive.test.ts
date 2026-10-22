import { describe, it, expect } from "vitest";
import { planAdditiveSeedInserts } from "../db/seed";
import importedGames from "../../data/imported-games.json";

describe("additive JSON → Neon seed", () => {
  it("inserts only appids missing from the DB and never lists existing ones for overwrite", () => {
    const jsonIds = (importedGames as Array<{ appid: number }>).map((g) => g.appid);
    const existing = jsonIds.slice(0, 50);
    const { toInsert, toSkip } = planAdditiveSeedInserts(jsonIds, existing);

    expect(toSkip).toEqual(existing);
    expect(toInsert.length).toBe(jsonIds.length - existing.length);
    for (const id of existing) {
      expect(toInsert).not.toContain(id);
    }
    // Plan never invents deletes
    expect(toInsert.every((id) => jsonIds.includes(id))).toBe(true);
  });

  it("inserts every JSON appid when the DB is empty", () => {
    const jsonIds = (importedGames as Array<{ appid: number }>).map((g) => g.appid);
    const { toInsert, toSkip } = planAdditiveSeedInserts(jsonIds, []);
    expect(toSkip).toEqual([]);
    expect(toInsert).toEqual(jsonIds);
  });
});
