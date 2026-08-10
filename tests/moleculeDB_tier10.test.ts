import { describe, it, expect } from "vitest";
import { validateIonicMix } from "../src/chem/ionic";
import { getElement } from "../src/chem/elements";
import moleculeDB from "../src/chem/moleculeDB.json";

const DB_FORMULAS = new Set((moleculeDB as { formula: string }[]).map((e) => e.formula));

describe("tier 10 — Rb, Sc, Zr, Sb, Mo, Nb", () => {
  it("toate cele 6 au ElementDef complet, tier 10, doar ionice", () => {
    for (const symbol of ["Rb", "Sc", "Zr", "Sb", "Mo", "Nb"]) {
      const def = getElement(symbol);
      expect(def.tier).toBe(10);
      expect(def.unlockCost).toBeGreaterThan(0);
      expect(def.valences).toEqual([]);
    }
  });

  it("sarcinile ionice corecte", () => {
    expect(getElement("Rb").ionicCharge).toBe(1);
    expect(getElement("Sc").ionicCharge).toBe(3);
    expect(getElement("Zr").ionicCharge).toBe(4);
    expect(getElement("Sb").ionicCharge).toBe(3);
    expect(getElement("Mo").ionicCharge).toBe(6);
    expect(getElement("Nb").ionicCharge).toBe(5);
  });

  it("oxizii și clorurile/bromurile de Rb/Sc/Zr/Sb/Mo/Nb validează prin echilibru de sarcini", () => {
    const cases: [Record<string, number>, string][] = [
      [{ Rb: 1, Cl: 1 }, "RbCl"],
      [{ Rb: 1, Br: 1 }, "RbBr"],
      [{ Zr: 1, O: 2 }, "ZrO2"],
      [{ Nb: 2, O: 5 }, "Nb2O5"],
      [{ Mo: 1, O: 3 }, "MoO3"],
      [{ Sb: 2, O: 3 }, "Sb2O3"],
      [{ Sb: 1, Cl: 3 }, "SbCl3"],
      [{ Sc: 2, O: 3 }, "Sc2O3"],
      [{ Sc: 1, Cl: 3 }, "ScCl3"]
    ];
    for (const [mix, expectedFormula] of cases) {
      const result = validateIonicMix(mix);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.formula).toBe(expectedFormula);
      expect(DB_FORMULAS.has(expectedFormula)).toBe(true);
    }
  });
});
