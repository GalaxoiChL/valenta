import { describe, it, expect } from "vitest";
import { GameStore, createInitialState } from "../src/core/state";

describe("GameStore — rezervare ioni (M3, §6.1 simetric)", () => {
  it("reserveAtomForIon scade stocul, releaseAtomFromIon îl întoarce", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.atoms.Na = 2;
    expect(store.reserveAtomForIon("Na")).toBe(true);
    expect(store.state.resources.atoms.Na).toBe(1);
    store.releaseAtomFromIon("Na");
    expect(store.state.resources.atoms.Na).toBe(2);
  });

  it("refuză rezervarea fără stoc", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.atoms.Na = 0;
    expect(store.reserveAtomForIon("Na")).toBe(false);
  });
});

describe("GameStore.synthesizeIonicMix (M3, §5.6)", () => {
  it("Na⁺ + Cl⁻ → sintetizează NaCl, adaugă în Colecție și acordă Cunoaștere la prima descoperire", () => {
    const store = new GameStore(createInitialState());
    const before = store.state.resources.knowledge;

    const result = store.synthesizeIonicMix({ Na: 1, Cl: 1 });

    expect(result.ok).toBe(true);
    expect(result.isFirstDiscovery).toBe(true);
    expect(result.formula).toBe("NaCl");
    expect(store.state.collection["NaCl"]?.copies).toBe(1);
    expect(store.state.resources.knowledge).toBeGreaterThan(before);
  });

  it("nu descontează atomi la sinteză — se presupune că au fost deja rezervați la adăugarea în mix", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.atoms.Na = 5;
    store.state.resources.atoms.Cl = 5;
    store.synthesizeIonicMix({ Na: 1, Cl: 1 });
    expect(store.state.resources.atoms.Na).toBe(5);
    expect(store.state.resources.atoms.Cl).toBe(5);
  });

  it("a doua sinteză a aceluiași compus nu acordă din nou bonusul de descoperire", () => {
    const store = new GameStore(createInitialState());
    store.synthesizeIonicMix({ Na: 1, Cl: 1 });
    const after1 = store.state.resources.knowledge;
    const result2 = store.synthesizeIonicMix({ Na: 1, Cl: 1 });
    expect(result2.isFirstDiscovery).toBe(false);
    expect(store.state.resources.knowledge).toBe(after1);
    expect(store.state.collection["NaCl"].copies).toBe(2);
  });

  it("un mix dezechilibrat eșuează și nu modifică Colecția", () => {
    const store = new GameStore(createInitialState());
    const result = store.synthesizeIonicMix({ Na: 2, Cl: 1 });
    expect(result.ok).toBe(false);
    expect(store.state.collection["NaCl"]).toBeUndefined();
  });

  it("compusul ionic sintetizat e compatibil cu re-sinteza din Colecție (×1/×10/×Max)", () => {
    const store = new GameStore(createInitialState());
    store.synthesizeIonicMix({ Na: 1, Cl: 1 });
    store.state.resources.atoms.Na = 10;
    store.state.resources.atoms.Cl = 10;
    const synthesized = store.synthesizeFromCollection("NaCl", 5);
    expect(synthesized).toBe(5);
    expect(store.state.collection["NaCl"].copies).toBe(6);
  });

  it("compusul ionic produce E/s ca orice altă intrare din Colecție", () => {
    const store = new GameStore(createInitialState());
    store.synthesizeIonicMix({ Na: 1, Cl: 1 });
    expect(store.totalEnergyPerSecond()).toBeGreaterThan(0);
  });
});
