import { describe, it, expect } from "vitest";
import { validateIonicMix } from "../src/chem/ionic";
import { getElement } from "../src/chem/elements";
import moleculeDB from "../src/chem/moleculeDB.json";

const DB_FORMULAS = new Set((moleculeDB as { formula: string }[]).map((e) => e.formula));

describe("tier 14 — Pr, Sm, Eu, Tb, Dy, Yb (al doilea lot de lantanide)", () => {
  it("toate cele 6 au ElementDef complet, tier 14, doar ionice, sarcină +3", () => {
    for (const symbol of ["Pr", "Sm", "Eu", "Tb", "Dy", "Yb"]) {
      const def = getElement(symbol);
      expect(def.tier).toBe(14);
      expect(def.unlockCost).toBeGreaterThan(0);
      expect(def.valences).toEqual([]);
      expect(def.ionicCharge).toBe(3);
    }
  });

  it("oxizii și clorurile de Pr/Sm/Eu/Tb/Dy/Yb validează prin echilibru de sarcini", () => {
    const cases: [Record<string, number>, string][] = [
      [{ Pr: 2, O: 3 }, "Pr2O3"],
      [{ Pr: 1, Cl: 3 }, "PrCl3"],
      [{ Sm: 2, O: 3 }, "Sm2O3"],
      [{ Sm: 1, Cl: 3 }, "SmCl3"],
      [{ Eu: 2, O: 3 }, "Eu2O3"],
      [{ Eu: 1, Cl: 3 }, "EuCl3"],
      [{ Tb: 2, O: 3 }, "Tb2O3"],
      [{ Tb: 1, Cl: 3 }, "TbCl3"],
      [{ Dy: 2, O: 3 }, "Dy2O3"],
      [{ Dy: 1, Cl: 3 }, "DyCl3"],
      [{ Yb: 2, O: 3 }, "Yb2O3"],
      [{ Yb: 1, Cl: 3 }, "YbCl3"]
    ];
    for (const [mix, expectedFormula] of cases) {
      const result = validateIonicMix(mix);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.formula).toBe(expectedFormula);
      expect(DB_FORMULAS.has(expectedFormula)).toBe(true);
    }
  });
});
