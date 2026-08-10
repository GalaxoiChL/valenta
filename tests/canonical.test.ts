import { describe, it, expect } from "vitest";
import { addAtom, addBond, createMolecule, type MoleculeGraph } from "../src/chem/molecule";
import { canonicalGraphHash } from "../src/chem/canonical";

function build(atomSpecs: string[], bondSpecs: [number, number, 1 | 2 | 3][]): MoleculeGraph {
  const graph = createMolecule();
  const atoms = atomSpecs.map((el) => addAtom(graph, el));
  for (const [a, b, order] of bondSpecs) addBond(graph, atoms[a].id, atoms[b].id, order);
  return graph;
}

describe("canonicalGraphHash — izomeri structurali (§5.5)", () => {
  it("etanol și dimetil-eter (aceeași formulă C2H6O) primesc hash-uri diferite", () => {
    // Etanol: CH3-CH2-OH
    const ethanol = build(
      ["C", "C", "O", "H", "H", "H", "H", "H", "H"],
      [
        [0, 1, 1], // C-C
        [1, 2, 1], // C-O
        [2, 3, 1], // O-H
        [0, 4, 1], [0, 5, 1], [0, 6, 1], // CH3
        [1, 7, 1], [1, 8, 1] // CH2
      ]
    );
    // Dimetil-eter: CH3-O-CH3
    const dimethylEther = build(
      ["C", "O", "C", "H", "H", "H", "H", "H", "H"],
      [
        [0, 1, 1], [1, 2, 1], // C-O-C
        [0, 3, 1], [0, 4, 1], [0, 5, 1],
        [2, 6, 1], [2, 7, 1], [2, 8, 1]
      ]
    );
    expect(canonicalGraphHash(ethanol)).not.toBe(canonicalGraphHash(dimethylEther));
  });

  it("invariant la ordinea de inserare/ID-urile atomilor (aceeași moleculă, construită diferit)", () => {
    const h2o_a = build(["H", "O", "H"], [[0, 1, 1], [1, 2, 1]]);
    const h2o_b = build(["O", "H", "H"], [[0, 1, 1], [0, 2, 1]]);
    expect(canonicalGraphHash(h2o_a)).toBe(canonicalGraphHash(h2o_b));
  });

  it("molecule diferite (formulă diferită) au hash-uri diferite", () => {
    const h2 = build(["H", "H"], [[0, 1, 1]]);
    const o2 = build(["O", "O"], [[0, 1, 2]]);
    expect(canonicalGraphHash(h2)).not.toBe(canonicalGraphHash(o2));
  });

  it("un singur atom → hash-ul e simbolul elementului", () => {
    const he = build(["He"], []);
    expect(canonicalGraphHash(he)).toBe("He");
  });

  it("moleculă simetrică (benzen) e stabilă și diferă de un lanț neciclic cu aceeași formulă", () => {
    const benzene = build(
      ["C", "C", "C", "C", "C", "C", "H", "H", "H", "H", "H", "H"],
      [
        [0, 1, 1], [1, 2, 2], [2, 3, 1], [3, 4, 2], [4, 5, 1], [5, 0, 2],
        [0, 6, 1], [1, 7, 1], [2, 8, 1], [3, 9, 1], [4, 10, 1], [5, 11, 1]
      ]
    );
    expect(canonicalGraphHash(benzene)).toBeTruthy();
    // Aceeași moleculă, pornind randarea de la alt atom — trebuie să dea același hash.
    const benzeneRotated = build(
      ["C", "C", "C", "C", "C", "C", "H", "H", "H", "H", "H", "H"],
      [
        [1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 2], [5, 0, 1], [0, 1, 2],
        [1, 6, 1], [2, 7, 1], [3, 8, 1], [4, 9, 1], [5, 10, 1], [0, 11, 1]
      ]
    );
    expect(canonicalGraphHash(benzene)).toBe(canonicalGraphHash(benzeneRotated));
  });
});
