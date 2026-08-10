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

describe("tier 8 — Au, Ge, Hg, Cr, Mn, Cd", () => {
  it("toate cele 6 au ElementDef complet, tier 8", () => {
    for (const symbol of ["Au", "Ge", "Hg", "Cr", "Mn", "Cd"]) {
      const def = getElement(symbol);
      expect(def.tier).toBe(8);
      expect(def.unlockCost).toBeGreaterThan(0);
    }
  });

  it("Ge e covalent (valență 4); Au/Hg/Cr/Mn/Cd sunt doar ionice", () => {
    expect(getElement("Ge").valences).toEqual([4]);
    expect(getElement("Ge").ionicCharge ?? 0).toBe(0);
    for (const symbol of ["Au", "Hg", "Cr", "Mn", "Cd"]) {
      expect(getElement(symbol).valences).toEqual([]);
    }
    expect(getElement("Au").ionicCharge).toBe(3);
    expect(getElement("Hg").ionicCharge).toBe(2);
    expect(getElement("Cr").ionicCharge).toBe(3);
    expect(getElement("Mn").ionicCharge).toBe(2);
    expect(getElement("Cd").ionicCharge).toBe(2);
  });

  it("GeH4 (german), GeCl4 (tetraclorură de germaniu) — analogii de Ge ai CH4/SiH4/CCl4", () => {
    expectMoleculeInDB(
      build(["Ge", "H", "H", "H", "H"], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]),
      "GeH4"
    );
    expectMoleculeInDB(
      build(["Ge", "Cl", "Cl", "Cl", "Cl"], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]),
      "Cl4Ge"
    );
  });

  it("oxizii și clorurile de Au/Hg/Cr/Mn/Cd validează prin echilibru de sarcini", () => {
    const cases: [Record<string, number>, string][] = [
      [{ Au: 1, Cl: 3 }, "AuCl3"],
      [{ Hg: 1, O: 1 }, "HgO"],
      [{ Hg: 1, Cl: 2 }, "HgCl2"],
      [{ Cr: 2, O: 3 }, "Cr2O3"],
      [{ Cr: 1, Cl: 3 }, "CrCl3"],
      [{ Mn: 1, O: 1 }, "MnO"],
      [{ Mn: 1, Cl: 2 }, "MnCl2"],
      [{ Cd: 1, O: 1 }, "CdO"],
      [{ Cd: 1, Cl: 2 }, "CdCl2"]
    ];
    for (const [mix, expectedFormula] of cases) {
      const result = validateIonicMix(mix);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.formula).toBe(expectedFormula);
      expect(DB_FORMULAS.has(expectedFormula)).toBe(true);
    }
  });
});
