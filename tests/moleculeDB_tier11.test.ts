import { describe, it, expect } from "vitest";
import { validateIonicMix } from "../src/chem/ionic";
import { getElement } from "../src/chem/elements";
import moleculeDB from "../src/chem/moleculeDB.json";

const DB_FORMULAS = new Set((moleculeDB as { formula: string }[]).map((e) => e.formula));

describe("tier 11 — As, Se, Te, Y, Pd, Pt", () => {
  it("toate cele 6 au ElementDef complet, tier 11, doar ionice", () => {
    for (const symbol of ["As", "Se", "Te", "Y", "Pd", "Pt"]) {
      const def = getElement(symbol);
      expect(def.tier).toBe(11);
      expect(def.unlockCost).toBeGreaterThan(0);
      expect(def.valences).toEqual([]);
    }
  });

  it("sarcinile ionice corecte", () => {
    expect(getElement("As").ionicCharge).toBe(3);
    expect(getElement("Se").ionicCharge).toBe(4);
    expect(getElement("Te").ionicCharge).toBe(4);
    expect(getElement("Y").ionicCharge).toBe(3);
    expect(getElement("Pd").ionicCharge).toBe(2);
    expect(getElement("Pt").ionicCharge).toBe(4);
  });

  it("oxizii și clorurile de As/Se/Te/Y/Pd/Pt validează prin echilibru de sarcini, cu formula ionică (cation întâi)", () => {
    const cases: [Record<string, number>, string][] = [
      [{ As: 2, O: 3 }, "As2O3"],
      [{ As: 1, Cl: 3 }, "AsCl3"],
      [{ Se: 1, O: 2 }, "SeO2"],
      [{ Te: 1, O: 2 }, "TeO2"],
      [{ Y: 2, O: 3 }, "Y2O3"],
      [{ Y: 1, Cl: 3 }, "YCl3"],
      [{ Pd: 1, O: 1 }, "PdO"],
      [{ Pd: 1, Cl: 2 }, "PdCl2"],
      [{ Pt: 1, O: 2 }, "PtO2"],
      [{ Pt: 1, Cl: 4 }, "PtCl4"]
    ];
    for (const [mix, expectedFormula] of cases) {
      const result = validateIonicMix(mix);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.formula).toBe(expectedFormula);
      expect(DB_FORMULAS.has(expectedFormula)).toBe(true);
    }
  });
});
