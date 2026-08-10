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

describe("M6 — elementele tier 4 rămase (P, Mg, Cu, Fe) + Adenină", () => {
  it("P, Mg, Cu, Fe au ElementDef complet", () => {
    for (const symbol of ["P", "Mg", "Cu", "Fe"]) {
      const def = getElement(symbol);
      expect(def.tier).toBe(4);
      expect(def.unlockCost).toBeGreaterThan(0);
    }
  });

  it("P e covalent (valențe 3, 5); Mg/Cu/Fe sunt doar ionice", () => {
    expect(getElement("P").valences).toEqual([3, 5]);
    expect(getElement("Mg").valences).toEqual([]);
    expect(getElement("Cu").valences).toEqual([]);
    expect(getElement("Fe").valences).toEqual([]);
    expect(getElement("Mg").ionicCharge).toBe(2);
    expect(getElement("Cu").ionicCharge).toBe(2);
    expect(getElement("Fe").ionicCharge).toBe(3);
  });

  it("Fosfină PH3 (P valență 3)", () => {
    expectMoleculeInDB(build(["P", "H", "H", "H"], [[0, 1, 1], [0, 2, 1], [0, 3, 1]]), "H3P");
  });

  it("Fosfor alb P4 (tetraedru — fiecare P legat de ceilalți 3, valență 3 satisfăcută prin 3 legături simple)", () => {
    const g = build(
      ["P", "P", "P", "P"],
      [[0, 1, 1], [0, 2, 1], [0, 3, 1], [1, 2, 1], [1, 3, 1], [2, 3, 1]]
    );
    expectMoleculeInDB(g, "P4");
  });

  it("Acid fosforic H3PO4 (P valență 5: trei O-H simple + un O dublu)", () => {
    const g = build(
      ["P", "O", "H", "O", "H", "O", "H", "O"],
      [[0, 1, 1], [1, 2, 1], [0, 3, 1], [3, 4, 1], [0, 5, 1], [5, 6, 1], [0, 7, 2]]
    );
    expectMoleculeInDB(g, "H3O4P");
  });

  it("Adenină C5H5N5 — inel purinic fuzionat (6+5), Kekulé, endgame-ul tier 5", () => {
    const graph = createMolecule();
    const N1 = addAtom(graph, "N");
    const C2 = addAtom(graph, "C");
    const N3 = addAtom(graph, "N");
    const C4 = addAtom(graph, "C");
    const C5 = addAtom(graph, "C");
    const C6 = addAtom(graph, "C");
    const N7 = addAtom(graph, "N");
    const C8 = addAtom(graph, "C");
    const N9 = addAtom(graph, "N");
    const Nam = addAtom(graph, "N");
    const H2 = addAtom(graph, "H");
    const H8 = addAtom(graph, "H");
    const H9 = addAtom(graph, "H");
    const Ham1 = addAtom(graph, "H");
    const Ham2 = addAtom(graph, "H");

    addBond(graph, N1.id, C2.id, 2);
    addBond(graph, C2.id, N3.id, 1);
    addBond(graph, N3.id, C4.id, 2);
    addBond(graph, C4.id, C5.id, 1);
    addBond(graph, C5.id, C6.id, 2);
    addBond(graph, C6.id, N1.id, 1);
    addBond(graph, C4.id, N9.id, 1);
    addBond(graph, N9.id, C8.id, 1);
    addBond(graph, C8.id, N7.id, 2);
    addBond(graph, N7.id, C5.id, 1);
    addBond(graph, C6.id, Nam.id, 1);
    addBond(graph, C2.id, H2.id, 1);
    addBond(graph, C8.id, H8.id, 1);
    addBond(graph, N9.id, H9.id, 1);
    addBond(graph, Nam.id, Ham1.id, 1);
    addBond(graph, Nam.id, Ham2.id, 1);

    expectMoleculeInDB(graph, "C5H5N5");
  });

  it("oxizii și clorurile metalelor tier 4 sunt neutre și validează prin echilibru de sarcini", () => {
    const cases: [Record<string, number>, string][] = [
      [{ Mg: 1, O: 1 }, "MgO"],
      [{ Mg: 1, Cl: 2 }, "MgCl2"],
      [{ Cu: 1, O: 1 }, "CuO"],
      [{ Cu: 1, Cl: 2 }, "CuCl2"],
      [{ Fe: 1, Cl: 3 }, "FeCl3"],
      [{ Fe: 2, O: 3 }, "Fe2O3"]
    ];
    for (const [mix, expectedFormula] of cases) {
      const result = validateIonicMix(mix);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.formula).toBe(expectedFormula);
      expect(DB_FORMULAS.has(expectedFormula)).toBe(true);
    }
  });
});
