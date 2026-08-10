import { describe, it, expect } from "vitest";
import { validateIonicMix } from "../src/chem/ionic";
import { getElement } from "../src/chem/elements";
import moleculeDB from "../src/chem/moleculeDB.json";

const DB_FORMULAS = new Set((moleculeDB as { formula: string }[]).map((e) => e.formula));

describe("tier 6 — Li, Sn, Zn, Ba, Ag, Pb", () => {
  it("toate cele 6 au ElementDef complet, tier 6, doar ionice", () => {
    for (const symbol of ["Li", "Sn", "Zn", "Ba", "Ag", "Pb"]) {
      const def = getElement(symbol);
      expect(def.tier).toBe(6);
      expect(def.unlockCost).toBeGreaterThan(0);
      expect(def.valences).toEqual([]);
      expect(def.ionicCharge).not.toBe(0);
    }
  });

  it("sarcinile ionice corecte: Li+/Ag+ monovalenți, Sn2+/Zn2+/Ba2+/Pb2+ divalenți", () => {
    expect(getElement("Li").ionicCharge).toBe(1);
    expect(getElement("Ag").ionicCharge).toBe(1);
    expect(getElement("Sn").ionicCharge).toBe(2);
    expect(getElement("Zn").ionicCharge).toBe(2);
    expect(getElement("Ba").ionicCharge).toBe(2);
    expect(getElement("Pb").ionicCharge).toBe(2);
  });

  it("oxizii și clorurile de Li/Sn/Zn/Ba/Ag/Pb validează prin echilibru de sarcini", () => {
    const cases: [Record<string, number>, string][] = [
      [{ Li: 1, Cl: 1 }, "LiCl"],
      [{ Li: 2, O: 1 }, "Li2O"],
      [{ Ba: 1, O: 1 }, "BaO"],
      [{ Ba: 1, Cl: 2 }, "BaCl2"],
      [{ Zn: 1, O: 1 }, "ZnO"],
      [{ Zn: 1, Cl: 2 }, "ZnCl2"],
      [{ Ag: 1, Cl: 1 }, "AgCl"],
      [{ Ag: 1, Br: 1 }, "AgBr"],
      [{ Sn: 1, O: 1 }, "SnO"],
      [{ Sn: 1, Cl: 2 }, "SnCl2"],
      [{ Pb: 1, O: 1 }, "PbO"],
      [{ Pb: 1, Cl: 2 }, "PbCl2"]
    ];
    for (const [mix, expectedFormula] of cases) {
      const result = validateIonicMix(mix);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.formula).toBe(expectedFormula);
      expect(DB_FORMULAS.has(expectedFormula)).toBe(true);
    }
  });
});
