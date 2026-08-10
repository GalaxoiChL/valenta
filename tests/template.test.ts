import { describe, it, expect } from "vitest";
import { GameStore, createInitialState } from "../src/core/state";

function synthH2O(store: GameStore) {
  store.state.resources.atoms.H = (store.state.resources.atoms.H ?? 0) + 100;
  store.state.resources.atoms.O = (store.state.resources.atoms.O ?? 0) + 100;
  const h1 = store.placeAtomInDraft("H", 10, 20)!;
  const o = store.placeAtomInDraft("O", 50, 20)!;
  const h2 = store.placeAtomInDraft("H", 90, 20)!;
  store.setBondOrder(h1.id, o.id, 1);
  store.setBondOrder(o.id, h2.id, 1);
  return store.synthesizeDraft();
}

function synthEthylene(store: GameStore) {
  // C2H4: CH2=CH2
  store.state.resources.atoms.H = (store.state.resources.atoms.H ?? 0) + 100;
  store.state.resources.atoms.C = (store.state.resources.atoms.C ?? 0) + 100;
  const c1 = store.placeAtomInDraft("C", 0, 0)!;
  const c2 = store.placeAtomInDraft("C", 40, 0)!;
  const h1 = store.placeAtomInDraft("H", -20, -20)!;
  const h2 = store.placeAtomInDraft("H", -20, 20)!;
  const h3 = store.placeAtomInDraft("H", 60, -20)!;
  const h4 = store.placeAtomInDraft("H", 60, 20)!;
  store.setBondOrder(c1.id, c2.id, 2);
  store.setBondOrder(c1.id, h1.id, 1);
  store.setBondOrder(c1.id, h2.id, 1);
  store.setBondOrder(c2.id, h3.id, 1);
  store.setBondOrder(c2.id, h4.id, 1);
  return store.synthesizeDraft();
}

const H2O_KEY_LOOKUP = (store: GameStore) => Object.keys(store.state.collection)[0];

describe("GameStore.loadTemplateIntoDraft — șabloane editabile (§6.5, M4)", () => {
  it("golește draftul curent și reconstruiește graful salvat, rezervând atomi din stoc", () => {
    const store = new GameStore(createInitialState());
    synthH2O(store);
    const key = H2O_KEY_LOOKUP(store);
    const stockBefore = { ...store.state.resources.atoms };

    const ok = store.loadTemplateIntoDraft(key);

    expect(ok).toBe(true);
    expect(store.draft().atoms.length).toBe(3);
    expect(store.draft().bonds.length).toBe(2);
    // 2H + 1O rezervate din stoc, la fel ca la plasarea manuală
    expect(store.state.resources.atoms.H).toBe(stockBefore.H - 2);
    expect(store.state.resources.atoms.O).toBe(stockBefore.O - 1);
  });

  it("șablonul încărcat e valid și poate fi re-sintetizat direct", () => {
    const store = new GameStore(createInitialState());
    synthH2O(store);
    const key = H2O_KEY_LOOKUP(store);
    store.loadTemplateIntoDraft(key);
    const result = store.synthesizeDraft();
    expect(result.ok).toBe(true);
    expect(store.state.collection[key].copies).toBe(2);
  });

  it("refuză dacă nu există stoc suficient pentru șablon", () => {
    const store = new GameStore(createInitialState());
    synthH2O(store);
    const key = H2O_KEY_LOOKUP(store);
    store.state.resources.atoms = { H: 0, O: 0, N: 0 };
    expect(store.loadTemplateIntoDraft(key)).toBe(false);
  });

  it("refuză pentru o cheie inexistentă sau fără graf salvat (ex. compus ionic)", () => {
    const store = new GameStore(createInitialState());
    expect(store.loadTemplateIntoDraft("nu-exista")).toBe(false);
  });
});

describe("GameStore.polymerize — unități polimerice repetitive (§7, M4)", () => {
  it("un monomer fără legătură dublă/triplă (ex. Apă) nu e polimerizabil", () => {
    const store = new GameStore(createInitialState());
    synthH2O(store);
    const key = H2O_KEY_LOOKUP(store);
    expect(store.canPolymerize(key)).toBe(false);
  });

  it("etena (C=C) e polimerizabilă; consumă n×atomii bruți și produce 1 copie de polimer", () => {
    const store = new GameStore(createInitialState());
    synthEthylene(store);
    const key = H2O_KEY_LOOKUP(store);
    expect(store.canPolymerize(key)).toBe(true);

    const before = { ...store.state.resources.atoms };
    const result = store.polymerize(key, 5);

    expect(result.ok).toBe(true);
    expect(result.isFirstDiscovery).toBe(true);
    expect(store.state.resources.atoms.C).toBe(before.C - 5 * 2);
    expect(store.state.resources.atoms.H).toBe(before.H - 5 * 4);

    const polymerKey = `${key}×5`;
    expect(store.state.collection[polymerKey].copies).toBe(1);
    expect(store.state.collection[polymerKey].formula).toContain("5");
  });

  it("respinge n < 2", () => {
    const store = new GameStore(createInitialState());
    synthEthylene(store);
    const key = H2O_KEY_LOOKUP(store);
    expect(store.polymerize(key, 1).ok).toBe(false);
  });

  it("respinge fără stoc suficient", () => {
    const store = new GameStore(createInitialState());
    synthEthylene(store);
    const key = H2O_KEY_LOOKUP(store);
    store.state.resources.atoms = { H: 1, C: 1, O: 0, N: 0 };
    expect(store.polymerize(key, 10).ok).toBe(false);
  });

  it("polimerul produs e o intrare de Colecție obișnuită — re-sintetizabilă și analizabilă", () => {
    const store = new GameStore(createInitialState());
    synthEthylene(store);
    const key = H2O_KEY_LOOKUP(store);
    store.polymerize(key, 3);
    const polymerKey = `${key}×3`;

    store.state.resources.atoms.C = 100;
    store.state.resources.atoms.H = 100;
    const synthesized = store.synthesizeFromCollection(polymerKey, 2);
    expect(synthesized).toBe(2);
    expect(store.state.collection[polymerKey].copies).toBe(3);

    const gained = store.analyzeMolecule(polymerKey, 1);
    expect(gained).toBeGreaterThan(0);
  });
});
