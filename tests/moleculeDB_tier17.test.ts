import { describe, it, expect } from "vitest";
import { validateIonicMix } from "../src/chem/ionic";
import { getElement } from "../src/chem/elements";
import moleculeDB from "../src/chem/moleculeDB.json";

const DB_FORMULAS = new Set((moleculeDB as { formula: string }[]).map((e) => e.formula));

describe("tier 17 — Ho, Er (lantanide omise din loturile anterioare)", () => {
  it("ambele au ElementDef complet, tier 17, doar ionice, sarcină +3", () => {
    for (const symbol of ["Ho", "Er"]) {
      const def = getElement(symbol);
      expect(def.tier).toBe(17);
      expect(def.unlockCost).toBeGreaterThan(0);
      expect(def.valences).toEqual([]);
      expect(def.ionicCharge).toBe(3);
    }
  });

  it("oxizii și clorurile de Ho/Er validează prin echilibru de sarcini", () => {
    const cases: [Record<string, number>, string][] = [
      [{ Ho: 2, O: 3 }, "Ho2O3"],
      [{ Ho: 1, Cl: 3 }, "HoCl3"],
      [{ Er: 2, O: 3 }, "Er2O3"],
      [{ Er: 1, Cl: 3 }, "ErCl3"]
    ];
    for (const [mix, expectedFormula] of cases) {
      const result = validateIonicMix(mix);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.formula).toBe(expectedFormula);
      expect(DB_FORMULAS.has(expectedFormula)).toBe(true);
    }
  });
});
