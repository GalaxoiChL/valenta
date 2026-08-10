import { describe, it, expect } from "vitest";
import { validateIonicMix } from "../src/chem/ionic";
import { getElement } from "../src/chem/elements";
import moleculeDB from "../src/chem/moleculeDB.json";

const DB_FORMULAS = new Set((moleculeDB as { formula: string }[]).map((e) => e.formula));

describe("tier 12 — Tl, Hf, Ru, Ta, Ir, Re", () => {
  it("toate cele 6 au ElementDef complet, tier 12, doar ionice", () => {
    for (const symbol of ["Tl", "Hf", "Ru", "Ta", "Ir", "Re"]) {
      const def = getElement(symbol);
      expect(def.tier).toBe(12);
      expect(def.unlockCost).toBeGreaterThan(0);
      expect(def.valences).toEqual([]);
    }
  });

  it("sarcinile ionice corecte, inclusiv +7 (cea mai mare din joc)", () => {
    expect(getElement("Tl").ionicCharge).toBe(1);
    expect(getElement("Hf").ionicCharge).toBe(4);
    expect(getElement("Ru").ionicCharge).toBe(3);
    expect(getElement("Ta").ionicCharge).toBe(5);
    expect(getElement("Ir").ionicCharge).toBe(3);
    expect(getElement("Re").ionicCharge).toBe(7);
  });

  it("oxizii și clorurile/bromurile de Tl/Hf/Ru/Ta/Ir/Re validează prin echilibru de sarcini", () => {
    const cases: [Record<string, number>, string][] = [
      [{ Tl: 1, Cl: 1 }, "TlCl"],
      [{ Tl: 1, Br: 1 }, "TlBr"],
      [{ Hf: 1, O: 2 }, "HfO2"],
      [{ Ta: 2, O: 5 }, "Ta2O5"],
      [{ Re: 2, O: 7 }, "Re2O7"],
      [{ Ru: 2, O: 3 }, "Ru2O3"],
      [{ Ru: 1, Cl: 3 }, "RuCl3"],
      [{ Ir: 2, O: 3 }, "Ir2O3"],
      [{ Ir: 1, Cl: 3 }, "IrCl3"]
    ];
    for (const [mix, expectedFormula] of cases) {
      const result = validateIonicMix(mix);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.formula).toBe(expectedFormula);
      expect(DB_FORMULAS.has(expectedFormula)).toBe(true);
    }
  });
});
