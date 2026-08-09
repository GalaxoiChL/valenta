import { describe, it, expect, beforeEach } from "vitest";
import { GameStore, createInitialState, sumGraphBondEnergy, productionRate } from "../src/core/state";
import { tick } from "../src/core/economy";
import { addAtom, addBond, createMolecule } from "../src/chem/molecule";
import { generatorCost, generatorRate } from "../src/core/balance";

function placeH2O(store: GameStore) {
  const h1 = store.placeAtomInDraft("H", 0, 0)!;
  const o = store.placeAtomInDraft("O", 1, 0)!;
  const h2 = store.placeAtomInDraft("H", 2, 0)!;
  store.setBondOrder(h1.id, o.id, 1);
  store.setBondOrder(o.id, h2.id, 1);
}

describe("economy.tick", () => {
  let store: GameStore;

  beforeEach(() => {
    store = new GameStore(createInitialState());
  });

  it("generatoarele produc atomi proporțional cu dt", () => {
    store.state.resources.atoms.H = 0;
    store.state.generators.H = 4;
    tick(store, 2);
    expect(store.state.resources.atoms.H).toBeCloseTo(generatorRate(4) * 2);
  });

  it("moleculele din colecție produc Energie/s", () => {
    store.state.resources.atoms = { H: 2, O: 1, N: 0 };
    placeH2O(store);

    const result = store.synthesizeDraft();
    expect(result.ok).toBe(true);

    const before = store.state.resources.energy;
    tick(store, 1);
    expect(store.state.resources.energy).toBeGreaterThan(before);
    expect(store.totalEnergyPerSecond()).toBeGreaterThan(0);
  });

  it("dt=0 nu schimbă nimic", () => {
    store.state.resources.atoms.H = 0;
    store.state.generators.H = 4;
    tick(store, 0);
    expect(store.state.resources.atoms.H).toBe(0);
  });
});

describe("generatorCost", () => {
  it("crește geometric cu 1.18^n", () => {
    const cost0 = generatorCost("H", 0);
    const cost1 = generatorCost("H", 1);
    expect(cost1 / cost0).toBeCloseTo(1.18);
  });
});

describe("synthesizeDraft — sinteza consumă atomii stoichiometric", () => {
  it("H2O consumă exact 2H + 1O (rezervate la plasare) și adaugă o copie în colecție", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.atoms = { H: 5, O: 3, N: 0 };
    placeH2O(store);

    // atomii au fost deja rezervați la plasare
    expect(store.state.resources.atoms.H).toBe(3);
    expect(store.state.resources.atoms.O).toBe(2);

    const result = store.synthesizeDraft();
    expect(result.ok).toBe(true);
    expect(result.isFirstDiscovery).toBe(true);
    expect(store.state.resources.atoms.H).toBe(3);
    expect(store.state.resources.atoms.O).toBe(2);
    expect(store.state.resources.knowledge).toBeGreaterThan(0);

    const entry = store.state.collection["H2O|1,1"];
    expect(entry.copies).toBe(1);
    expect(entry.name).toBe("Apă");
  });

  it("ștergerea unui atom din draft îl întoarce în stoc", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.atoms = { H: 5, O: 3, N: 0 };
    const h1 = store.placeAtomInDraft("H", 0, 0)!;
    expect(store.state.resources.atoms.H).toBe(4);
    store.removeAtomFromDraft(h1.id);
    expect(store.state.resources.atoms.H).toBe(5);
  });

  it("nu se poate depăși valența prin setBondOrder (prevenție §6.2)", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.atoms = { H: 5, O: 3, N: 0 };
    const h1 = store.placeAtomInDraft("H", 0, 0)!;
    const h2 = store.placeAtomInDraft("H", 1, 0)!;
    const h3 = store.placeAtomInDraft("H", 2, 0)!;
    expect(store.setBondOrder(h1.id, h2.id, 1)).toBe(true);
    // h1 (H, valență 1) e deja saturat — o a doua legătură trebuie respinsă
    expect(store.setBondOrder(h1.id, h3.id, 1)).toBe(false);
  });
});

describe("moleculeDB — compuși reali suplimentari (H/O/N)", () => {
  it("Hidrazină H2N-NH2 → cheie H4N2|1,1,1,1,1", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.atoms = { H: 4, O: 0, N: 2 };
    const n1 = store.placeAtomInDraft("N", 0, 0)!;
    const n2 = store.placeAtomInDraft("N", 1, 0)!;
    const h1 = store.placeAtomInDraft("H", 0, 1)!;
    const h2 = store.placeAtomInDraft("H", 0, 2)!;
    const h3 = store.placeAtomInDraft("H", 1, 1)!;
    const h4 = store.placeAtomInDraft("H", 1, 2)!;
    store.setBondOrder(n1.id, n2.id, 1);
    store.setBondOrder(n1.id, h1.id, 1);
    store.setBondOrder(n1.id, h2.id, 1);
    store.setBondOrder(n2.id, h3.id, 1);
    store.setBondOrder(n2.id, h4.id, 1);

    const result = store.synthesizeDraft();
    expect(result.ok).toBe(true);
    expect(store.state.collection["H4N2|1,1,1,1,1"]?.name).toBe("Hidrazină");
  });

  it("Diazenă HN=NH → cheie H2N2|1,1,2", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.atoms = { H: 2, O: 0, N: 2 };
    const n1 = store.placeAtomInDraft("N", 0, 0)!;
    const n2 = store.placeAtomInDraft("N", 1, 0)!;
    const h1 = store.placeAtomInDraft("H", 0, 1)!;
    const h2 = store.placeAtomInDraft("H", 1, 1)!;
    store.setBondOrder(n1.id, n2.id, 2);
    store.setBondOrder(n1.id, h1.id, 1);
    store.setBondOrder(n2.id, h2.id, 1);

    const result = store.synthesizeDraft();
    expect(result.ok).toBe(true);
    expect(store.state.collection["H2N2|1,1,2"]?.name).toBe("Diazenă");
  });

  it("Hidroxilamină NH2-OH → cheie H3NO|1,1,1,1", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.atoms = { H: 3, O: 1, N: 1 };
    const n = store.placeAtomInDraft("N", 0, 0)!;
    const o = store.placeAtomInDraft("O", 1, 0)!;
    const h1 = store.placeAtomInDraft("H", 0, 1)!;
    const h2 = store.placeAtomInDraft("H", 0, 2)!;
    const h3 = store.placeAtomInDraft("H", 1, 1)!;
    store.setBondOrder(n.id, o.id, 1);
    store.setBondOrder(n.id, h1.id, 1);
    store.setBondOrder(n.id, h2.id, 1);
    store.setBondOrder(o.id, h3.id, 1);

    const result = store.synthesizeDraft();
    expect(result.ok).toBe(true);
    expect(store.state.collection["H3NO|1,1,1,1"]?.name).toBe("Hidroxilamină");
  });
});

describe("productionRate & sumGraphBondEnergy", () => {
  it("moleculele mai mari au randament descrescător (exponent 0.7)", () => {
    const small = productionRate(400, 1);
    const large = productionRate(800, 1);
    expect(large).toBeGreaterThan(small);
    expect(large / small).toBeLessThan(2); // sub-liniar
  });

  it("sumGraphBondEnergy însumează energiile legăturilor din graf", () => {
    const graph = createMolecule();
    const h1 = addAtom(graph, "H");
    const h2 = addAtom(graph, "H");
    addBond(graph, h1.id, h2.id, 1);
    expect(sumGraphBondEnergy(graph)).toBe(436);
  });
});
