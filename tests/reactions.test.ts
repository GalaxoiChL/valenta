import { describe, it, expect } from "vitest";
import { GameStore, createInitialState, type CollectionEntry } from "../src/core/state";
import { maxReactionRuns, type ReactionDefinition } from "../src/chem/reactions";
import reactionDB from "../src/chem/reactionDB.json";
import moleculeDB from "../src/chem/moleculeDB.json";
import { validate } from "../src/chem/validator";
import { moleculeKey } from "../src/chem/formula";
import { ionicFormula } from "../src/chem/ionic";
import { getElement } from "../src/chem/elements";

const REACTIONS = reactionDB as ReactionDefinition[];
const DB_FORMULAS = new Set((moleculeDB as { formula: string }[]).map((e) => e.formula));

function seedEntry(store: GameStore, key: string, formula: string, copies: number): void {
  const entry: CollectionEntry = {
    key,
    formula,
    name: formula,
    copies,
    discovered: true,
    ePerSecondPerCopy: 0,
    sumBondEnergy: 0,
    atomsPerCopy: {},
    flavor: "",
    autoSynth: { rate: 0, progress: 0 }
  };
  store.state.collection[key] = entry;
}

describe("maxReactionRuns (pură, chem/reactions.ts)", () => {
  it("0 copii disponibile → 0 rulări", () => {
    expect(maxReactionRuns([{ formula: "H2", coef: 2 }], [0])).toBe(0);
  });

  it("multiplu exact → numărul exact de rulări", () => {
    expect(maxReactionRuns([{ formula: "H2", coef: 2 }], [10])).toBe(5);
  });

  it("non-multiplu → floor", () => {
    expect(maxReactionRuns([{ formula: "H2", coef: 2 }], [9])).toBe(4);
  });

  it("mai mulți reactanți → minimul dintre ei", () => {
    expect(maxReactionRuns([{ formula: "H2", coef: 2 }, { formula: "O2", coef: 1 }], [10, 3])).toBe(3);
  });
});

describe("reactionDB.json — integritate de conținut (16 reacții v1)", () => {
  it("are exact 16 reacții, fiecare cu reactanți și produși", () => {
    expect(REACTIONS.length).toBe(16);
    for (const r of REACTIONS) {
      expect(r.reactants.length).toBeGreaterThan(0);
      expect(r.products.length).toBeGreaterThan(0);
    }
  });

  it("fiecare produs covalent validează prin graf, cu formula corectă", () => {
    for (const r of REACTIONS) {
      for (const p of r.products) {
        if (p.kind !== "covalent") continue;
        const result = validate(p.graph);
        expect(result.ok, `${r.id}: graful produsului ${p.formula} nu validează`).toBe(true);
        if (result.ok) expect(result.formula).toBe(p.formula);
      }
    }
  });

  it("fiecare produs ionic e neutru din punct de vedere al sarcinii", () => {
    for (const r of REACTIONS) {
      for (const p of r.products) {
        if (p.kind !== "ionic") continue;
        const net = Object.entries(p.ionCounts).reduce(
          (sum, [symbol, n]) => sum + (getElement(symbol).ionicCharge ?? 0) * n,
          0
        );
        expect(net, `${r.id}: ${JSON.stringify(p.ionCounts)} nu e neutru`).toBe(0);
      }
    }
  });

  it("fiecare formulă de reactant există în moleculeDB.json (nicio greșeală de tastare)", () => {
    for (const r of REACTIONS) {
      for (const reactant of r.reactants) {
        expect(DB_FORMULAS.has(reactant.formula), `${r.id}: reactant necunoscut ${reactant.formula}`).toBe(true);
      }
    }
  });

  it("toate grafurile covalente cu aceeași formulă (repetate în fișier) hash-uiesc identic", () => {
    const keyByFormula = new Map<string, string>();
    for (const r of REACTIONS) {
      for (const p of r.products) {
        if (p.kind !== "covalent") continue;
        const key = moleculeKey(p.graph);
        const existing = keyByFormula.get(p.formula);
        if (existing) {
          expect(key, `${r.id}: graful lui ${p.formula} diferă de o apariție anterioară`).toBe(existing);
        } else {
          keyByFormula.set(p.formula, key);
        }
      }
    }
  });

  it("fiecare formulă ionică de produs corespunde unei intrări reale din moleculeDB.json", () => {
    for (const r of REACTIONS) {
      for (const p of r.products) {
        if (p.kind !== "ionic") continue;
        const formula = ionicFormula(p.ionCounts);
        expect(DB_FORMULAS.has(formula), `${r.id}: ${formula} nu e în moleculeDB.json`).toBe(true);
      }
    }
  });
});

describe("GameStore.runReaction — sinteza apei (water_synthesis, doar covalent)", () => {
  it("refuză fără copii suficiente; nu modifică nimic", () => {
    const store = new GameStore(createInitialState());
    seedEntry(store, "H2", "H2", 1);
    seedEntry(store, "O2", "O2", 1);
    const before = { ...store.state.collection };
    const result = store.runReaction("water_synthesis", ["H2", "O2"], 1);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("insufficient_copies");
    expect(store.state.collection["H2"].copies).toBe(before["H2"].copies);
  });

  it("consumă exact coef×multiplicator din fiecare reactant, produce coef×multiplicator din produs", () => {
    const store = new GameStore(createInitialState());
    seedEntry(store, "H2", "H2", 10);
    seedEntry(store, "O2", "O2", 10);
    const result = store.runReaction("water_synthesis", ["H2", "O2"], 3);
    expect(result.ok).toBe(true);
    expect(store.state.collection["H2"].copies).toBe(10 - 2 * 3);
    expect(store.state.collection["O2"].copies).toBe(10 - 1 * 3);
    const waterKey = Object.keys(store.state.collection).find((k) => store.state.collection[k].formula === "H2O")!;
    expect(store.state.collection[waterKey].copies).toBe(2 * 3);
  });

  it("prima descoperire a H2O: banner de descoperire, +Cunoaștere din DB, graf salvat", () => {
    const store = new GameStore(createInitialState());
    seedEntry(store, "H2", "H2", 2);
    seedEntry(store, "O2", "O2", 1);
    const before = store.state.resources.knowledge;

    let discovered: unknown = null;
    store.events.on("discovery", (payload) => (discovered = payload));

    const result = store.runReaction("water_synthesis", ["H2", "O2"], 1);
    expect(result.ok).toBe(true);
    expect(discovered).not.toBeNull();

    const waterKey = Object.keys(store.state.collection).find((k) => store.state.collection[k].formula === "H2O")!;
    const entry = store.state.collection[waterKey];
    expect(entry.name).toBe("Apă"); // din moleculeDB.json, nu fallback generic
    expect(entry.graph).toBeDefined(); // produs covalent — "Încarcă în Constructor" funcționează
    expect(store.state.resources.knowledge).toBeGreaterThan(before);
  });

  it("a doua rulare (produs deja descoperit): doar copii în plus, fără bonus repetat de Cunoaștere", () => {
    const store = new GameStore(createInitialState());
    seedEntry(store, "H2", "H2", 10);
    seedEntry(store, "O2", "O2", 10);
    store.runReaction("water_synthesis", ["H2", "O2"], 1);
    const waterKey = Object.keys(store.state.collection).find((k) => store.state.collection[k].formula === "H2O")!;
    const afterFirst = store.state.resources.knowledge;

    store.runReaction("water_synthesis", ["H2", "O2"], 1);
    expect(store.state.resources.knowledge).toBe(afterFirst);
    expect(store.state.collection[waterKey].copies).toBe(4);
  });

  it("respinge o cheie de reactant a cărei formulă nu se potrivește sloturilor reacției", () => {
    const store = new GameStore(createInitialState());
    seedEntry(store, "N2", "N2", 10);
    seedEntry(store, "O2", "O2", 10);
    const result = store.runReaction("water_synthesis", ["N2", "O2"], 1);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("reactant_mismatch");
  });

  it("×10/×Max se scalează corect cu maxReactionRuns", () => {
    const store = new GameStore(createInitialState());
    seedEntry(store, "H2", "H2", 21);
    seedEntry(store, "O2", "O2", 10);
    const keys = ["H2", "O2"];
    expect(store.maxReactionRuns("water_synthesis", keys)).toBe(10); // limitat de O2 (21/2=10.5→10, 10/1=10)
    const result = store.runReaction("water_synthesis", keys, store.maxReactionRuns("water_synthesis", keys));
    expect(result.ok).toBe(true);
    expect(store.state.collection["O2"].copies).toBe(0);
  });
});

describe("GameStore.runReaction — neutralizare acid-bază (mgo_hcl_neutralization, produs ionic + covalent)", () => {
  it("produsul ionic (MgCl2) nu are graf; produsul covalent (H2O) are graf", () => {
    const store = new GameStore(createInitialState());
    seedEntry(store, "MgO", "MgO", 5);
    seedEntry(store, "ClH", "ClH", 10);

    const result = store.runReaction("mgo_hcl_neutralization", ["MgO", "ClH"], 1);
    expect(result.ok).toBe(true);

    const mgCl2 = store.state.collection["MgCl2"];
    expect(mgCl2).toBeDefined();
    expect(mgCl2.copies).toBe(1);
    expect(mgCl2.graph).toBeUndefined();
    expect(mgCl2.name).toBe("Clorură de magneziu"); // din moleculeDB.json

    const waterKey = Object.keys(store.state.collection).find((k) => store.state.collection[k].formula === "H2O")!;
    expect(store.state.collection[waterKey].graph).toBeDefined();
  });

  it("consumă 2 copii de ClH per rulare (coeficientul din ecuație)", () => {
    const store = new GameStore(createInitialState());
    seedEntry(store, "MgO", "MgO", 5);
    seedEntry(store, "ClH", "ClH", 10);
    store.runReaction("mgo_hcl_neutralization", ["MgO", "ClH"], 2);
    expect(store.state.collection["MgO"].copies).toBe(3);
    expect(store.state.collection["ClH"].copies).toBe(6);
  });
});
