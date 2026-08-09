import { describe, it, expect } from "vitest";
import { createMolecule, addAtom, addBond } from "../src/chem/molecule";
import { hillFormula, toUnicodeSubscript, moleculeKey } from "../src/chem/formula";

function methane() {
  const m = createMolecule();
  const c = addAtom(m, "C");
  for (let i = 0; i < 4; i++) {
    const h = addAtom(m, "H");
    addBond(m, c.id, h.id, 1);
  }
  return m;
}

function ethanol() {
  // C2H6O (etanol, CH3-CH2-OH) — formula Hill, nu structura condensată
  const m = createMolecule();
  const c1 = addAtom(m, "C");
  const c2 = addAtom(m, "C");
  const o = addAtom(m, "O");
  addBond(m, c1.id, c2.id, 1);
  addBond(m, c2.id, o.id, 1);
  for (const atom of [c1, c1, c1, c2, c2, o]) {
    const h = addAtom(m, "H");
    addBond(m, atom.id, h.id, 1);
  }
  return m;
}

describe("formula Hill", () => {
  it("H2O: fără carbon → alfabetic (H înainte de O)", () => {
    const m = createMolecule();
    const h1 = addAtom(m, "H");
    const o = addAtom(m, "O");
    const h2 = addAtom(m, "H");
    addBond(m, h1.id, o.id, 1);
    addBond(m, o.id, h2.id, 1);
    expect(hillFormula(m)).toBe("H2O");
  });

  it("CH4: C primul, apoi H", () => {
    expect(hillFormula(methane())).toBe("CH4");
  });

  it("C2H5OH → formula Hill C2H6O (nu C2H5OH)", () => {
    expect(hillFormula(ethanol())).toBe("C2H6O");
  });

  it("toUnicodeSubscript transformă cifrele în indici Unicode", () => {
    expect(toUnicodeSubscript("H2O")).toBe("H₂O");
    expect(toUnicodeSubscript("CH4")).toBe("CH₄");
    expect(toUnicodeSubscript("C2H6O")).toBe("C₂H₆O");
  });

  it("moleculeKey combină formula cu multiset-ul ordinelor de legătură", () => {
    const m = createMolecule();
    const h1 = addAtom(m, "H");
    const o = addAtom(m, "O");
    const h2 = addAtom(m, "H");
    addBond(m, h1.id, o.id, 1);
    addBond(m, o.id, h2.id, 1);
    expect(moleculeKey(m)).toBe("H2O|1,1");
  });
});
