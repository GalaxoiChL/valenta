import { describe, it, expect } from "vitest";
import { addAtom, createMolecule, type MoleculeGraph } from "../src/chem/molecule";
import { validate } from "../src/chem/validator";
import { moleculeKey } from "../src/chem/formula";
import { validateIonicMix } from "../src/chem/ionic";
import { getElement } from "../src/chem/elements";
import moleculeDB from "../src/chem/moleculeDB.json";

const DB_KEYS = new Set((moleculeDB as { key: string }[]).map((e) => e.key));
const DB_FORMULAS = new Set((moleculeDB as { formula: string }[]).map((e) => e.formula));

function build(atomSpecs: string[]): MoleculeGraph {
  const graph = createMolecule();
  atomSpecs.map((el) => addAtom(graph, el));
  return graph;
}

describe("tier 15 — Kr, Tm, Lu, Ra, Th, U (ultimele lantanide stabile + primele actinide)", () => {
  it("toate cele 6 au ElementDef complet, tier 15", () => {
    for (const symbol of ["Kr", "Tm", "Lu", "Ra", "Th", "U"]) {
      const def = getElement(symbol);
      expect(def.tier).toBe(15);
      expect(def.unlockCost).toBeGreaterThan(0);
    }
  });

  it("Kr e inert (valență 0), ca He/Ne/Ar; Tm/Lu sunt +3, Ra e +2, Th/U sunt +4", () => {
    expect(getElement("Kr").valences).toEqual([0]);
    expect(getElement("Kr").ionicCharge).toBe(0);
    expect(getElement("Tm").ionicCharge).toBe(3);
    expect(getElement("Lu").ionicCharge).toBe(3);
    expect(getElement("Ra").ionicCharge).toBe(2);
    expect(getElement("Th").ionicCharge).toBe(4);
    expect(getElement("U").ionicCharge).toBe(4);
  });

  it("Kr validează ca „moleculă” monoatomică, ca He/Ne/Ar", () => {
    const graph = build(["Kr"]);
    const result = validate(graph);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.formula).toBe("Kr");
    expect(DB_KEYS.has(moleculeKey(graph))).toBe(true);
  });

  it("oxizii și clorurile de Tm/Lu/Ra/Th/U validează prin echilibru de sarcini", () => {
    const cases: [Record<string, number>, string][] = [
      [{ Tm: 2, O: 3 }, "Tm2O3"],
      [{ Tm: 1, Cl: 3 }, "TmCl3"],
      [{ Lu: 2, O: 3 }, "Lu2O3"],
      [{ Lu: 1, Cl: 3 }, "LuCl3"],
      [{ Th: 1, O: 2 }, "ThO2"],
      [{ U: 1, O: 2 }, "UO2"],
      [{ Ra: 1, O: 1 }, "RaO"],
      [{ Ra: 1, Cl: 2 }, "RaCl2"]
    ];
    for (const [mix, expectedFormula] of cases) {
      const result = validateIonicMix(mix);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.formula).toBe(expectedFormula);
      expect(DB_FORMULAS.has(expectedFormula)).toBe(true);
    }
  });
});
