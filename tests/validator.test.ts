import { describe, it, expect } from "vitest";
import { createMolecule, addAtom, addBond } from "../src/chem/molecule";
import { validate } from "../src/chem/validator";

describe("validator", () => {
  it("H singur → invalid (unsatisfied, missing 1)", () => {
    const m = createMolecule();
    addAtom(m, "H");
    const r = validate(m);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("unsatisfied");
      expect(r.details[0].missing).toBe(1);
    }
  });

  it("H–H → valid, formula H2", () => {
    const m = createMolecule();
    const a = addAtom(m, "H");
    const b = addAtom(m, "H");
    addBond(m, a.id, b.id, 1);
    const r = validate(m);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.formula).toBe("H2");
  });

  it("H–O–H → valid, formula H2O", () => {
    const m = createMolecule();
    const h1 = addAtom(m, "H");
    const o = addAtom(m, "O");
    const h2 = addAtom(m, "H");
    addBond(m, h1.id, o.id, 1);
    addBond(m, o.id, h2.id, 1);
    const r = validate(m);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.formula).toBe("H2O");
  });

  it("O=O → valid, formula O2", () => {
    const m = createMolecule();
    const a = addAtom(m, "O");
    const b = addAtom(m, "O");
    addBond(m, a.id, b.id, 2);
    const r = validate(m);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.formula).toBe("O2");
  });

  it("N≡N → valid, formula N2", () => {
    const m = createMolecule();
    const a = addAtom(m, "N");
    const b = addAtom(m, "N");
    addBond(m, a.id, b.id, 3);
    const r = validate(m);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.formula).toBe("N2");
  });

  it("N cu 3×H → valid, formula NH3", () => {
    const m = createMolecule();
    const n = addAtom(m, "N");
    const h1 = addAtom(m, "H");
    const h2 = addAtom(m, "H");
    const h3 = addAtom(m, "H");
    addBond(m, n.id, h1.id, 1);
    addBond(m, n.id, h2.id, 1);
    addBond(m, n.id, h3.id, 1);
    const r = validate(m);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.formula).toBe("H3N");
  });

  it("O cu 3 legături → respins defensiv de validator", () => {
    const m = createMolecule();
    const o = addAtom(m, "O");
    const h1 = addAtom(m, "H");
    const h2 = addAtom(m, "H");
    const h3 = addAtom(m, "H");
    // forțăm construcția direct pe graf, ocolind UI-ul care ar preveni asta
    m.bonds.push({ a: o.id, b: h1.id, order: 1 });
    m.bonds.push({ a: o.id, b: h2.id, order: 1 });
    m.bonds.push({ a: o.id, b: h3.id, order: 1 });
    const r = validate(m);
    expect(r.ok).toBe(false);
  });

  it("două fragmente H–H  H–H nelegate → disconnected", () => {
    const m = createMolecule();
    const a = addAtom(m, "H");
    const b = addAtom(m, "H");
    const c = addAtom(m, "H");
    const d = addAtom(m, "H");
    addBond(m, a.id, b.id, 1);
    addBond(m, c.id, d.id, 1);
    const r = validate(m);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("disconnected");
  });

  it("C cu 4×H → valid, formula CH4", () => {
    const m = createMolecule();
    const c = addAtom(m, "C");
    const h1 = addAtom(m, "H");
    const h2 = addAtom(m, "H");
    const h3 = addAtom(m, "H");
    const h4 = addAtom(m, "H");
    addBond(m, c.id, h1.id, 1);
    addBond(m, c.id, h2.id, 1);
    addBond(m, c.id, h3.id, 1);
    addBond(m, c.id, h4.id, 1);
    const r = validate(m);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.formula).toBe("CH4");
  });

  it("S cu 2 legături valid ȘI S cu 6 legături valid (valențe multiple)", () => {
    const m2 = createMolecule();
    const s2 = addAtom(m2, "S");
    const h1 = addAtom(m2, "H");
    const h2 = addAtom(m2, "H");
    addBond(m2, s2.id, h1.id, 1);
    addBond(m2, s2.id, h2.id, 1);
    expect(validate(m2).ok).toBe(true);

    const m6 = createMolecule();
    const s6 = addAtom(m6, "S");
    const n1 = addAtom(m6, "N");
    m6.bonds.push({ a: s6.id, b: n1.id, order: 3 });
    const n2 = addAtom(m6, "N");
    m6.bonds.push({ a: s6.id, b: n2.id, order: 3 });
    // 3 + 3 = 6, valență validă pentru S; fiecare N își satisface valența 3 cu legătura triplă
    expect(validate(m6).ok).toBe(true);
  });

  it("graf gol → invalid (empty)", () => {
    const m = createMolecule();
    const r = validate(m);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("empty");
  });
});
