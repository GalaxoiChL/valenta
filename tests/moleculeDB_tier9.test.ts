import { describe, it, expect } from "vitest";
import { validateIonicMix } from "../src/chem/ionic";
import { getElement } from "../src/chem/elements";
import moleculeDB from "../src/chem/moleculeDB.json";

const DB_FORMULAS = new Set((moleculeDB as { formula: string }[]).map((e) => e.formula));

describe("tier 9 — Be, Ga, In, Bi, W, V", () => {
  it("toate cele 6 au ElementDef complet, tier 9, doar ionice", () => {
    for (const symbol of ["Be", "Ga", "In", "Bi", "W", "V"]) {
      const def = getElement(symbol);
      expect(def.tier).toBe(9);
      expect(def.unlockCost).toBeGreaterThan(0);
      expect(def.valences).toEqual([]);
    }
  });

  it("sarcinile ionice corecte, inclusiv prima sarcină +5 și +6 din joc", () => {
    expect(getElement("Be").ionicCharge).toBe(2);
    expect(getElement("Ga").ionicCharge).toBe(3);
    expect(getElement("In").ionicCharge).toBe(3);
    expect(getElement("Bi").ionicCharge).toBe(3);
    expect(getElement("W").ionicCharge).toBe(6);
    expect(getElement("V").ionicCharge).toBe(5);
  });

  it("oxizii și clorurile de Be/Ga/In/Bi/W/V validează prin echilibru de sarcini", () => {
    const cases: [Record<string, number>, string][] = [
      [{ Be: 1, O: 1 }, "BeO"],
      [{ Be: 1, Cl: 2 }, "BeCl2"],
      [{ Ga: 2, O: 3 }, "Ga2O3"],
      [{ Ga: 1, Cl: 3 }, "GaCl3"],
      [{ In: 2, O: 3 }, "In2O3"],
      [{ In: 1, Cl: 3 }, "InCl3"],
      [{ Bi: 2, O: 3 }, "Bi2O3"],
      [{ Bi: 1, Cl: 3 }, "BiCl3"],
      [{ W: 1, O: 3 }, "WO3"],
      [{ W: 1, Cl: 6 }, "WCl6"],
      [{ V: 2, O: 5 }, "V2O5"]
    ];
    for (const [mix, expectedFormula] of cases) {
      const result = validateIonicMix(mix);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.formula).toBe(expectedFormula);
      expect(DB_FORMULAS.has(expectedFormula)).toBe(true);
    }
  });
});
