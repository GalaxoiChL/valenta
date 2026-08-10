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

describe("tier 5 — Al, Si, K, Ca, Br, I", () => {
  it("toate cele 6 au ElementDef complet, cu tier 5", () => {
    for (const symbol of ["Al", "Si", "K", "Ca", "Br", "I"]) {
      const def = getElement(symbol);
      expect(def.tier).toBe(5);
      expect(def.unlockCost).toBeGreaterThan(0);
    }
  });

  it("Si e covalent (valență 4); Al/K/Ca sunt doar ionice; Br/I sunt duale (covalent + ionic), ca Cl/F", () => {
    expect(getElement("Si").valences).toEqual([4]);
    expect(getElement("Al").valences).toEqual([]);
    expect(getElement("K").valences).toEqual([]);
    expect(getElement("Ca").valences).toEqual([]);
    expect(getElement("Br").valences).toEqual([1]);
    expect(getElement("I").valences).toEqual([1]);
    expect(getElement("Al").ionicCharge).toBe(3);
    expect(getElement("K").ionicCharge).toBe(1);
    expect(getElement("Ca").ionicCharge).toBe(2);
    expect(getElement("Br").ionicCharge).toBe(-1);
    expect(getElement("I").ionicCharge).toBe(-1);
  });

  it("HBr, Br2, HI, I2 — acizi halogenhidrici și elementele diatomice", () => {
    expectMoleculeInDB(build(["H", "Br"], [[0, 1, 1]]), "BrH");
    expectMoleculeInDB(build(["Br", "Br"], [[0, 1, 1]]), "Br2");
    expectMoleculeInDB(build(["H", "I"], [[0, 1, 1]]), "HI");
    expectMoleculeInDB(build(["I", "I"], [[0, 1, 1]]), "I2");
  });

  it("CH3Br, CH3I — halogenoalcani, ca CH3Cl din M4", () => {
    expectMoleculeInDB(
      build(["C", "H", "H", "H", "Br"], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]),
      "CH3Br"
    );
    expectMoleculeInDB(
      build(["C", "H", "H", "H", "I"], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]),
      "CH3I"
    );
  });

  it("SiH4 (silan) și SiCl4 (tetraclorură de siliciu) — analogii de siliciu ai CH4/CCl4", () => {
    expectMoleculeInDB(
      build(["Si", "H", "H", "H", "H"], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]),
      "H4Si"
    );
    expectMoleculeInDB(
      build(["Si", "Cl", "Cl", "Cl", "Cl"], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]),
      "Cl4Si"
    );
  });

  it("sărurile și oxizii de K/Ca/Al validează prin echilibru de sarcini", () => {
    const cases: [Record<string, number>, string][] = [
      [{ K: 1, Cl: 1 }, "KCl"],
      [{ K: 1, Br: 1 }, "KBr"],
      [{ K: 1, I: 1 }, "KI"],
      [{ Ca: 1, O: 1 }, "CaO"],
      [{ Ca: 1, Cl: 2 }, "CaCl2"],
      [{ Al: 1, Cl: 3 }, "AlCl3"],
      [{ Al: 2, O: 3 }, "Al2O3"]
    ];
    for (const [mix, expectedFormula] of cases) {
      const result = validateIonicMix(mix);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.formula).toBe(expectedFormula);
      expect(DB_FORMULAS.has(expectedFormula)).toBe(true);
    }
  });
});
