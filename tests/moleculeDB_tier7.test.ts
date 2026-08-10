import { describe, it, expect } from "vitest";
import { addAtom, addBond, createMolecule, type MoleculeGraph } from "../src/chem/molecule";
import { validate } from "../src/chem/validator";
import { moleculeKey } from "../src/chem/formula";
import { validateIonicMix } from "../src/chem/ionic";
import { getElement } from "../src/chem/elements";
import moleculeDB from "../src/chem/moleculeDB.json";

const DB_KEYS = new Set((moleculeDB as { key: string }[]).map((e) => e.key));
const DB_FORMULAS = new Set((moleculeDB as { formula: string }[]).map((e) => e.formula));

function build(atomSpecs: string[], bondSpecs: [number, number, 1 | 2 | 3][]): MoleculeGraph {
  const graph = createMolecule();
  const atoms = atomSpecs.map((el) => addAtom(graph, el));
  for (const [a, b, order] of bondSpecs) addBond(graph, atoms[a].id, atoms[b].id, order);
  return graph;
}

function expectMoleculeInDB(graph: MoleculeGraph, expectedFormula: string): void {
  const result = validate(graph);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.formula).toBe(expectedFormula);
  expect(DB_KEYS.has(moleculeKey(graph))).toBe(true);
}

describe("tier 7 — Ti, Sr, Ni, Co, Cs, B", () => {
  it("toate cele 6 au ElementDef complet, tier 7", () => {
    for (const symbol of ["Ti", "Sr", "Ni", "Co", "Cs", "B"]) {
      const def = getElement(symbol);
      expect(def.tier).toBe(7);
      expect(def.unlockCost).toBeGreaterThan(0);
    }
  });

  it("B e covalent (valență 3); Ti/Sr/Ni/Co/Cs sunt doar ionice", () => {
    expect(getElement("B").valences).toEqual([3]);
    expect(getElement("B").ionicCharge ?? 0).toBe(0);
    for (const symbol of ["Ti", "Sr", "Ni", "Co", "Cs"]) {
      expect(getElement(symbol).valences).toEqual([]);
      expect(getElement(symbol).ionicCharge).not.toBe(0);
    }
    expect(getElement("Ti").ionicCharge).toBe(4);
    expect(getElement("Cs").ionicCharge).toBe(1);
  });

  it("BF3, BCl3 — trifluorura/triclorura de bor, valență 3 satisfăcută prin 3 legături simple", () => {
    expectMoleculeInDB(
      build(["B", "F", "F", "F"], [[0, 1, 1], [0, 2, 1], [0, 3, 1]]),
      "BF3"
    );
    expectMoleculeInDB(
      build(["B", "Cl", "Cl", "Cl"], [[0, 1, 1], [0, 2, 1], [0, 3, 1]]),
      "BCl3"
    );
  });

  it("oxizii și sărurile de Ti/Sr/Ni/Co/Cs validează prin echilibru de sarcini", () => {
    const cases: [Record<string, number>, string][] = [
      [{ Ti: 1, O: 2 }, "TiO2"],
      [{ Sr: 1, O: 1 }, "SrO"],
      [{ Sr: 1, Cl: 2 }, "SrCl2"],
      [{ Ni: 1, O: 1 }, "NiO"],
      [{ Ni: 1, Cl: 2 }, "NiCl2"],
      [{ Co: 1, O: 1 }, "CoO"],
      [{ Co: 1, Cl: 2 }, "CoCl2"],
      [{ Cs: 1, Cl: 1 }, "CsCl"],
      [{ Cs: 1, Br: 1 }, "CsBr"]
    ];
    for (const [mix, expectedFormula] of cases) {
      const result = validateIonicMix(mix);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.formula).toBe(expectedFormula);
      expect(DB_FORMULAS.has(expectedFormula)).toBe(true);
    }
  });
});
