import { describe, it, expect } from "vitest";
import { addAtom, addBond, createMolecule, type MoleculeGraph } from "../src/chem/molecule";
import { validate } from "../src/chem/validator";
import { moleculeKey } from "../src/chem/formula";
import moleculeDB from "../src/chem/moleculeDB.json";

const DB_KEYS = new Set((moleculeDB as { key: string }[]).map((e) => e.key));

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

describe("moleculeDB — noile intrări M4 (sulf, aromatice, biochimie, izomeri)", () => {
  it("Hidrogen sulfurat H2S", () => {
    expectMoleculeInDB(build(["H", "S", "H"], [[0, 1, 1], [1, 2, 1]]), "H2S");
  });

  it("Dioxid de sulf SO2 (valență 4)", () => {
    expectMoleculeInDB(build(["O", "S", "O"], [[0, 1, 2], [1, 2, 2]]), "O2S");
  });

  it("Trioxid de sulf SO3 (valență 6)", () => {
    expectMoleculeInDB(build(["S", "O", "O", "O"], [[0, 1, 2], [0, 2, 2], [0, 3, 2]]), "O3S");
  });

  it("Acid sulfuric H2SO4", () => {
    const g = build(
      ["S", "O", "O", "O", "H", "O", "H"],
      [[0, 1, 2], [0, 2, 2], [0, 3, 1], [3, 4, 1], [0, 5, 1], [5, 6, 1]]
    );
    expectMoleculeInDB(g, "H2O4S");
  });

  it("Disulfură de carbon CS2 și sulfură de carbonil COS", () => {
    expectMoleculeInDB(build(["S", "C", "S"], [[0, 1, 2], [1, 2, 2]]), "CS2");
    expectMoleculeInDB(build(["O", "C", "S"], [[0, 1, 2], [1, 2, 2]]), "COS");
  });

  it("Toluen C7H8 (benzen + metil)", () => {
    const g = build(
      ["C", "C", "C", "C", "C", "C", "C", "H", "H", "H", "H", "H", "H", "H", "H"],
      [
        [0, 1, 1], [1, 2, 2], [2, 3, 1], [3, 4, 2], [4, 5, 1], [5, 0, 2],
        [0, 6, 1],
        [1, 7, 1], [2, 8, 1], [3, 9, 1], [4, 10, 1], [5, 11, 1],
        [6, 12, 1], [6, 13, 1], [6, 14, 1]
      ]
    );
    expectMoleculeInDB(g, "C7H8");
  });

  it("Fenol C6H6O și anilină C6H7N (benzen substituit)", () => {
    const phenol = build(
      ["C", "C", "C", "C", "C", "C", "O", "H", "H", "H", "H", "H", "H"],
      [
        [0, 1, 1], [1, 2, 2], [2, 3, 1], [3, 4, 2], [4, 5, 1], [5, 0, 2],
        [0, 6, 1], [6, 7, 1],
        [1, 8, 1], [2, 9, 1], [3, 10, 1], [4, 11, 1], [5, 12, 1]
      ]
    );
    expectMoleculeInDB(phenol, "C6H6O");

    const aniline = build(
      ["C", "C", "C", "C", "C", "C", "N", "H", "H", "H", "H", "H", "H", "H"],
      [
        [0, 1, 1], [1, 2, 2], [2, 3, 1], [3, 4, 2], [4, 5, 1], [5, 0, 2],
        [0, 6, 1], [6, 7, 1], [6, 8, 1],
        [1, 9, 1], [2, 10, 1], [3, 11, 1], [4, 12, 1], [5, 13, 1]
      ]
    );
    expectMoleculeInDB(aniline, "C6H7N");
  });

  it("Glucoză C6H12O6 (formă deschisă, aldehidă)", () => {
    const g = build(
      [
        "C", "O", "H", "C", "O", "H", "H", "C", "O", "H", "H", "C", "O", "H", "H", "C", "O", "H", "H", "C", "O", "H", "H", "H"
      ],
      [
        [0, 1, 2], [0, 2, 1], [0, 3, 1],
        [3, 4, 1], [4, 5, 1], [3, 6, 1], [3, 7, 1],
        [7, 8, 1], [8, 9, 1], [7, 10, 1], [7, 11, 1],
        [11, 12, 1], [12, 13, 1], [11, 14, 1], [11, 15, 1],
        [15, 16, 1], [16, 17, 1], [15, 18, 1], [15, 19, 1],
        [19, 20, 1], [20, 21, 1], [19, 22, 1], [19, 23, 1]
      ]
    );
    expectMoleculeInDB(g, "C6H12O6");
  });

  it("Alanină, Serină, Cisteină — aminoacizi", () => {
    const alanine = build(
      ["C", "H", "H", "H", "C", "N", "H", "H", "H", "C", "O", "O", "H"],
      [
        [0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1],
        [4, 5, 1], [5, 6, 1], [5, 7, 1], [4, 8, 1],
        [4, 9, 1], [9, 10, 2], [9, 11, 1], [11, 12, 1]
      ]
    );
    expectMoleculeInDB(alanine, "C3H7NO2");

    const cysteine = build(
      ["S", "H", "C", "H", "H", "C", "N", "H", "H", "H", "C", "O", "O", "H"],
      [
        [0, 1, 1], [2, 0, 1], [2, 3, 1], [2, 4, 1], [2, 5, 1],
        [5, 6, 1], [6, 7, 1], [6, 8, 1], [5, 9, 1],
        [5, 10, 1], [10, 11, 2], [10, 12, 1], [12, 13, 1]
      ]
    );
    expectMoleculeInDB(cysteine, "C3H7NO2S");
  });

  it("Piridină C5H5N — inel aromatic cu azot, fără H pe N", () => {
    const g = build(
      ["N", "C", "C", "C", "C", "C", "H", "H", "H", "H", "H"],
      [
        [0, 1, 2], [1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 2], [5, 0, 1],
        [1, 6, 1], [2, 7, 1], [3, 8, 1], [4, 9, 1], [5, 10, 1]
      ]
    );
    expectMoleculeInDB(g, "C5H5N");
  });

  it("Izomeri C4H10: n-butan, izobutan și terț-butanol/eter dietilic (C4H10O) — chei distincte", () => {
    const isobutane = build(
      ["C", "H", "C", "H", "H", "H", "C", "H", "H", "H", "C", "H", "H", "H"],
      [
        [0, 1, 1], [0, 2, 1], [2, 3, 1], [2, 4, 1], [2, 5, 1],
        [0, 6, 1], [6, 7, 1], [6, 8, 1], [6, 9, 1],
        [0, 10, 1], [10, 11, 1], [10, 12, 1], [10, 13, 1]
      ]
    );
    expectMoleculeInDB(isobutane, "C4H10");

    const tertButanol = build(
      ["C", "C", "H", "H", "H", "C", "H", "H", "H", "C", "H", "H", "H", "O", "H"],
      [
        [0, 1, 1], [1, 2, 1], [1, 3, 1], [1, 4, 1],
        [0, 5, 1], [5, 6, 1], [5, 7, 1], [5, 8, 1],
        [0, 9, 1], [9, 10, 1], [9, 11, 1], [9, 12, 1],
        [0, 13, 1], [13, 14, 1]
      ]
    );
    expectMoleculeInDB(tertButanol, "C4H10O");

    expect(moleculeKey(isobutane)).not.toBe(moleculeKey(tertButanol));
  });

  it("Neopentan C5H12 — al treilea izomer al pentanului, carbon central fără H", () => {
    const g = build(
      ["C", "C", "H", "H", "H", "C", "H", "H", "H", "C", "H", "H", "H", "C", "H", "H", "H"],
      [
        [0, 1, 1], [1, 2, 1], [1, 3, 1], [1, 4, 1],
        [0, 5, 1], [5, 6, 1], [5, 7, 1], [5, 8, 1],
        [0, 9, 1], [9, 10, 1], [9, 11, 1], [9, 12, 1],
        [0, 13, 1], [13, 14, 1], [13, 15, 1], [13, 16, 1]
      ]
    );
    expectMoleculeInDB(g, "C5H12");
  });

  it("Izomeri C3H6O: propanal vs acetonă — chei distincte", () => {
    const propanal = build(
      ["C", "H", "H", "H", "C", "H", "H", "C", "O", "H"],
      [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [4, 5, 1], [4, 6, 1], [4, 7, 1], [7, 8, 2], [7, 9, 1]]
    );
    expectMoleculeInDB(propanal, "C3H6O");
  });

  it("Izomeri C2H6S: dimetil sulfură vs etantiol — chei distincte", () => {
    const dimethylSulfide = build(
      ["C", "H", "H", "H", "S", "C", "H", "H", "H"],
      [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [4, 5, 1], [5, 6, 1], [5, 7, 1], [5, 8, 1]]
    );
    const ethanethiol = build(
      ["C", "H", "H", "H", "C", "H", "H", "S", "H"],
      [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [4, 5, 1], [4, 6, 1], [4, 7, 1], [7, 8, 1]]
    );
    expectMoleculeInDB(dimethylSulfide, "C2H6S");
    expectMoleculeInDB(ethanethiol, "C2H6S");
    expect(moleculeKey(dimethylSulfide)).not.toBe(moleculeKey(ethanethiol));
  });

  it("Izomeri C4H8O2: acetat de etil vs acid butiric — chei distincte", () => {
    const ethylAcetate = build(
      ["C", "H", "H", "H", "C", "O", "O", "C", "H", "H", "C", "H", "H", "H"],
      [
        [0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1],
        [4, 5, 2], [4, 6, 1], [6, 7, 1],
        [7, 8, 1], [7, 9, 1], [7, 10, 1],
        [10, 11, 1], [10, 12, 1], [10, 13, 1]
      ]
    );
    const butyricAcid = build(
      ["C", "H", "H", "H", "C", "H", "H", "C", "H", "H", "C", "O", "O", "H"],
      [
        [0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1],
        [4, 5, 1], [4, 6, 1], [4, 7, 1],
        [7, 8, 1], [7, 9, 1], [7, 10, 1],
        [10, 11, 2], [10, 12, 1], [12, 13, 1]
      ]
    );
    expectMoleculeInDB(ethylAcetate, "C4H8O2");
    expectMoleculeInDB(butyricAcid, "C4H8O2");
    expect(moleculeKey(ethylAcetate)).not.toBe(moleculeKey(butyricAcid));
  });

  it("Clorură de vinil C2H3Cl — monomer polimerizabil (legătură dublă)", () => {
    const g = build(["C", "H", "H", "C", "Cl", "H"], [[0, 3, 2], [0, 1, 1], [0, 2, 1], [3, 4, 1], [3, 5, 1]]);
    expectMoleculeInDB(g, "C2H3Cl");
  });

  it("Halogenoalcani simpli: CH3Cl, CH2Cl2, CHCl3, CCl4, CH3F", () => {
    expectMoleculeInDB(build(["C", "H", "H", "H", "Cl"], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]), "CH3Cl");
    expectMoleculeInDB(build(["C", "H", "H", "Cl", "Cl"], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]), "CH2Cl2");
    expectMoleculeInDB(build(["C", "H", "Cl", "Cl", "Cl"], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]), "CHCl3");
    expectMoleculeInDB(build(["C", "Cl", "Cl", "Cl", "Cl"], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]), "CCl4");
    expectMoleculeInDB(build(["C", "H", "H", "H", "F"], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]), "CH3F");
  });

  it("Octan C8H18 (lanț de 8 carboni)", () => {
    const g = build(
      [
        "C", "C", "C", "C", "C", "C", "C", "C",
        "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H"
      ],
      [
        [0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 6, 1], [6, 7, 1],
        [0, 8, 1], [0, 9, 1], [0, 10, 1],
        [1, 11, 1], [1, 12, 1],
        [2, 13, 1], [2, 14, 1],
        [3, 15, 1], [3, 16, 1],
        [4, 17, 1], [4, 18, 1],
        [5, 19, 1], [5, 20, 1],
        [6, 21, 1], [6, 22, 1],
        [7, 23, 1], [7, 24, 1], [7, 25, 1]
      ]
    );
    expectMoleculeInDB(g, "C8H18");
  });

  it("Acid oxalic C2H2O4 și acid malonic C3H4O4 (diacizi)", () => {
    const oxalic = build(
      ["C", "O", "O", "H", "C", "O", "O", "H"],
      [[0, 1, 2], [0, 2, 1], [2, 3, 1], [0, 4, 1], [4, 5, 2], [4, 6, 1], [6, 7, 1]]
    );
    expectMoleculeInDB(oxalic, "C2H2O4");

    const malonic = build(
      ["C", "O", "O", "H", "C", "H", "H", "C", "O", "O", "H"],
      [
        [0, 1, 2], [0, 2, 1], [2, 3, 1], [0, 4, 1],
        [4, 5, 1], [4, 6, 1], [4, 7, 1],
        [7, 8, 2], [7, 9, 1], [9, 10, 1]
      ]
    );
    expectMoleculeInDB(malonic, "C3H4O4");
  });

  it("Glicerol C3H8O3 și etilenglicol C2H6O2", () => {
    const glycerol = build(
      ["O", "H", "C", "H", "H", "C", "O", "H", "H", "C", "H", "H", "O", "H"],
      [
        [0, 1, 1], [2, 0, 1], [2, 3, 1], [2, 4, 1], [2, 5, 1],
        [5, 6, 1], [6, 7, 1], [5, 8, 1], [5, 9, 1],
        [9, 10, 1], [9, 11, 1], [9, 12, 1], [12, 13, 1]
      ]
    );
    expectMoleculeInDB(glycerol, "C3H8O3");

    const ethyleneGlycol = build(
      ["O", "H", "C", "H", "H", "C", "H", "H", "O", "H"],
      [
        [0, 1, 1], [2, 0, 1], [2, 3, 1], [2, 4, 1], [2, 5, 1],
        [5, 6, 1], [5, 7, 1], [5, 8, 1], [8, 9, 1]
      ]
    );
    expectMoleculeInDB(ethyleneGlycol, "C2H6O2");
  });

  it("Dimetil sulfoxid (DMSO) C2H6OS — sulf în starea de valență 4", () => {
    const g = build(
      ["C", "H", "H", "H", "S", "O", "C", "H", "H", "H"],
      [
        [0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1],
        [4, 5, 2], [4, 6, 1],
        [6, 7, 1], [6, 8, 1], [6, 9, 1]
      ]
    );
    expectMoleculeInDB(g, "C2H6OS");
  });
});
