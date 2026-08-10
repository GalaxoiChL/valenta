import { describe, it, expect } from "vitest";
import { validateIonicMix } from "../src/chem/ionic";
import { getElement } from "../src/chem/elements";
import moleculeDB from "../src/chem/moleculeDB.json";

const DB_FORMULAS = new Set((moleculeDB as { formula: string }[]).map((e) => e.formula));

describe("tier 16 — Rh, Os (ultimele metale stabile din familia platinei)", () => {
  it("ambele au ElementDef complet, tier 16, doar ionice", () => {
    for (const symbol of ["Rh", "Os"]) {
      const def = getElement(symbol);
      expect(def.tier).toBe(16);
      expect(def.unlockCost).toBeGreaterThan(0);
      expect(def.valences).toEqual([]);
    }
  });

  it("Rh e +3, Os e +8 — cea mai mare sarcină ionică din joc", () => {
    expect(getElement("Rh").ionicCharge).toBe(3);
    expect(getElement("Os").ionicCharge).toBe(8);
  });

  it("oxizii/clorura de Rh și OsO4 validează prin echilibru de sarcini", () => {
    const cases: [Record<string, number>, string][] = [
      [{ Rh: 2, O: 3 }, "Rh2O3"],
      [{ Rh: 1, Cl: 3 }, "RhCl3"],
      [{ Os: 1, O: 4 }, "OsO4"]
    ];
    for (const [mix, expectedFormula] of cases) {
      const result = validateIonicMix(mix);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.formula).toBe(expectedFormula);
      expect(DB_FORMULAS.has(expectedFormula)).toBe(true);
    }
  });
});
