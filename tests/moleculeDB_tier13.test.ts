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

describe("tier 13 — Ar, La, Ce, Nd, Gd, Xe", () => {
  it("toate cele 6 au ElementDef complet, tier 13", () => {
    for (const symbol of ["Ar", "La", "Ce", "Nd", "Gd", "Xe"]) {
      const def = getElement(symbol);
      expect(def.tier).toBe(13);
      expect(def.unlockCost).toBeGreaterThan(0);
    }
  });

  it("Ar e inert (valență 0), ca He/Ne; Xe e covalent cu 3 valențe reale (2, 4, 6)", () => {
    expect(getElement("Ar").valences).toEqual([0]);
    expect(getElement("Ar").ionicCharge).toBe(0);
    expect(getElement("Xe").valences).toEqual([2, 4, 6]);
    expect(getElement("Xe").ionicCharge ?? 0).toBe(0);
  });

  it("La/Ce/Nd/Gd sunt doar ionice, cu sarcinile corecte (Ce e singura lantanidă +4 din acest lot)", () => {
    for (const symbol of ["La", "Nd", "Gd"]) {
      expect(getElement(symbol).valences).toEqual([]);
      expect(getElement(symbol).ionicCharge).toBe(3);
    }
    expect(getElement("Ce").valences).toEqual([]);
    expect(getElement("Ce").ionicCharge).toBe(4);
  });

  it("Ar validează ca „moleculă” monoatomică, ca He/Ne", () => {
    expectMoleculeInDB(build(["Ar"], []), "Ar");
  });

  it("XeF2, XeF4, XeF6 — fluorurile reale de xenon, câte o valență diferită", () => {
    expectMoleculeInDB(build(["Xe", "F", "F"], [[0, 1, 1], [0, 2, 1]]), "F2Xe");
    expectMoleculeInDB(
      build(["Xe", "F", "F", "F", "F"], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]),
      "F4Xe"
    );
    expectMoleculeInDB(
      build(
        ["Xe", "F", "F", "F", "F", "F", "F"],
        [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1]]
      ),
      "F6Xe"
    );
  });

  it("oxizii și clorurile de La/Ce/Nd/Gd validează prin echilibru de sarcini", () => {
    const cases: [Record<string, number>, string][] = [
      [{ La: 2, O: 3 }, "La2O3"],
      [{ La: 1, Cl: 3 }, "LaCl3"],
      [{ Ce: 1, O: 2 }, "CeO2"],
      [{ Nd: 2, O: 3 }, "Nd2O3"],
      [{ Nd: 1, Cl: 3 }, "NdCl3"],
      [{ Gd: 2, O: 3 }, "Gd2O3"],
      [{ Gd: 1, Cl: 3 }, "GdCl3"]
    ];
    for (const [mix, expectedFormula] of cases) {
      const result = validateIonicMix(mix);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.formula).toBe(expectedFormula);
      expect(DB_FORMULAS.has(expectedFormula)).toBe(true);
    }
  });
});
