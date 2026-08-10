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

function expectKeyInDB(graph: MoleculeGraph): string {
  const result = validate(graph);
  expect(result.ok).toBe(true);
  const key = moleculeKey(graph);
  expect(DB_KEYS.has(key)).toBe(true);
  return key;
}

describe("moleculeDB — noile intrări M1 se pot construi valid din structurile reale", () => {
  it("Metan CH4", () => {
    const g = build(["C", "H", "H", "H", "H"], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]);
    expect(expectKeyInDB(g)).toBe("CH4|1,1,1,1");
  });

  it("Dioxid de carbon CO2 (O=C=O)", () => {
    const g = build(["O", "C", "O"], [[0, 1, 2], [1, 2, 2]]);
    expect(expectKeyInDB(g)).toBe("CO2|2,2");
  });

  it("Etan C2H6", () => {
    const g = build(
      ["C", "C", "H", "H", "H", "H", "H", "H"],
      [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1], [1, 6, 1], [1, 7, 1]]
    );
    expect(expectKeyInDB(g)).toBe("C2H6|1,1,1,1,1,1,1");
  });

  it("Etenă C2H4 (C=C)", () => {
    const g = build(
      ["C", "C", "H", "H", "H", "H"],
      [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]]
    );
    expect(expectKeyInDB(g)).toBe("C2H4|1,1,1,1,2");
  });

  it("Acetilenă C2H2 (C≡C)", () => {
    const g = build(["C", "C", "H", "H"], [[0, 1, 3], [0, 2, 1], [1, 3, 1]]);
    expect(expectKeyInDB(g)).toBe("C2H2|1,1,3");
  });

  it("Acid cianhidric HCN (H-C≡N)", () => {
    const g = build(["H", "C", "N"], [[0, 1, 1], [1, 2, 3]]);
    expect(expectKeyInDB(g)).toBe("CHN|1,3");
  });

  it("Metanol CH4O (C-O-H + 3×C-H)", () => {
    const g = build(
      ["C", "O", "H", "H", "H", "H"],
      [[0, 1, 1], [1, 2, 1], [0, 3, 1], [0, 4, 1], [0, 5, 1]]
    );
    expect(expectKeyInDB(g)).toBe("CH4O|1,1,1,1,1");
  });

  it("Acid acetic C2H4O2 (CH3-COOH)", () => {
    const g = build(
      ["C", "H", "H", "H", "C", "O", "O", "H"],
      [
        [0, 1, 1], [0, 2, 1], [0, 3, 1], // CH3
        [0, 4, 1], // C-C
        [4, 5, 2], // C=O
        [4, 6, 1], // C-O
        [6, 7, 1] // O-H
      ]
    );
    expect(expectKeyInDB(g)).toBe("C2H4O2|1,1,1,1,1,1,2");
  });

  it("Benzen C6H6 (Kekulé)", () => {
    const c = [0, 1, 2, 3, 4, 5].map(() => "C");
    const h = [0, 1, 2, 3, 4, 5].map(() => "H");
    const g = build(
      [...c, ...h],
      [
        [0, 1, 1], [1, 2, 2], [2, 3, 1], [3, 4, 2], [4, 5, 1], [5, 0, 2],
        [0, 6, 1], [1, 7, 1], [2, 8, 1], [3, 9, 1], [4, 10, 1], [5, 11, 1]
      ]
    );
    expect(expectKeyInDB(g)).toBe("C6H6|1,1,1,1,1,1,1,1,1,2,2,2");
  });

  it("Glicină C2H5NO2 (NH2-CH2-COOH)", () => {
    const g = build(
      ["N", "H", "H", "C", "H", "H", "C", "O", "O", "H"],
      [
        [0, 1, 1], [0, 2, 1], // N-H×2
        [0, 3, 1], // N-C
        [3, 4, 1], [3, 5, 1], // CH2
        [3, 6, 1], // C-C
        [6, 7, 2], // C=O
        [6, 8, 1], // C-O
        [8, 9, 1] // O-H
      ]
    );
    expect(expectKeyInDB(g)).toBe("C2H5NO2|1,1,1,1,1,1,1,1,2");
  });

  it("Uree CH4N2O ((NH2)2C=O)", () => {
    const g = build(
      ["C", "O", "N", "H", "H", "N", "H", "H"],
      [[0, 1, 2], [0, 2, 1], [2, 3, 1], [2, 4, 1], [0, 5, 1], [5, 6, 1], [5, 7, 1]]
    );
    expect(expectKeyInDB(g)).toBe("CH4N2O|1,1,1,1,1,1,2");
  });

  it("1-Butină și Butadienă — izomeri C4H6 cu chei DB distincte", () => {
    // 1-Butină: HC≡C-CH2-CH3
    const butyne = build(
      ["C", "H", "C", "C", "H", "H", "C", "H", "H", "H"],
      [
        [0, 1, 1], [0, 2, 3], // HC≡C
        [2, 3, 1], // C-CH2
        [3, 4, 1], [3, 5, 1], // CH2's H's
        [3, 6, 1], // C-CH3
        [6, 7, 1], [6, 8, 1], [6, 9, 1]
      ]
    );
    expect(expectKeyInDB(butyne)).toBe("C4H6|1,1,1,1,1,1,1,1,3");

    // 1,3-Butadienă: CH2=CH-CH=CH2
    const butadiene = build(
      ["C", "H", "H", "C", "H", "C", "H", "C", "H", "H"],
      [
        [0, 1, 1], [0, 2, 1], [0, 3, 2], // C1H2=C2
        [3, 4, 1], // C2-H
        [3, 5, 1], // C2-C3
        [5, 6, 1], // C3-H
        [5, 7, 2], // C3=C4
        [7, 8, 1], [7, 9, 1] // C4H2
      ]
    );
    expect(expectKeyInDB(butadiene)).toBe("C4H6|1,1,1,1,1,1,1,2,2");
  });
});

describe("moleculeDB — noile intrări covalente M3 (tier 3: Cl, F)", () => {
  it("Acid clorhidric HCl (H-Cl)", () => {
    const g = build(["H", "Cl"], [[0, 1, 1]]);
    expect(expectKeyInDB(g)).toBe("ClH|1");
  });

  it("Acid fluorhidric HF (H-F)", () => {
    const g = build(["H", "F"], [[0, 1, 1]]);
    expect(expectKeyInDB(g)).toBe("FH|1");
  });

  it("Clor Cl2 (Cl-Cl)", () => {
    const g = build(["Cl", "Cl"], [[0, 1, 1]]);
    expect(expectKeyInDB(g)).toBe("Cl2|1");
  });

  it("Fluor F2 (F-F)", () => {
    const g = build(["F", "F"], [[0, 1, 1]]);
    expect(expectKeyInDB(g)).toBe("F2|1");
  });

  it("Heliu — atom singur, moleculă monoatomică validă", () => {
    const g = build(["He"], []);
    expect(expectKeyInDB(g)).toBe("He|");
  });

  it("Neon — atom singur, moleculă monoatomică validă", () => {
    const g = build(["Ne"], []);
    expect(expectKeyInDB(g)).toBe("Ne|");
  });
});
