import { describe, it, expect } from "vitest";
import { GameStore, createInitialState } from "../src/core/state";
import { tick } from "../src/core/economy";
import { applyOfflineProgress } from "../src/core/offline";
import { generatorRate, generatorSpeedUpgradeCost, OFFLINE_CAP_SECONDS } from "../src/core/balance";
import { H2O_KEY } from "../src/chem/wellKnownKeys";

function synthH2O(store: GameStore) {
  store.state.resources.atoms.H = (store.state.resources.atoms.H ?? 0) + 100;
  store.state.resources.atoms.O = (store.state.resources.atoms.O ?? 0) + 100;
  const h1 = store.placeAtomInDraft("H", 0, 0)!;
  const o = store.placeAtomInDraft("O", 1, 0)!;
  const h2 = store.placeAtomInDraft("H", 2, 0)!;
  store.setBondOrder(h1.id, o.id, 1);
  store.setBondOrder(o.id, h2.id, 1);
  return store.synthesizeDraft();
}

describe("M2 — Auto-sintetizatoare (§7)", () => {
  it("nu produce nimic dacă Automatizarea nu e deblocată", () => {
    const store = new GameStore(createInitialState());
    synthH2O(store);
    store.setAutoSynthRate(H2O_KEY, 5);
    store.state.resources.atoms = { H: 1000, O: 1000, N: 0 };
    const before = store.state.collection[H2O_KEY].copies;
    tick(store, 5);
    expect(store.state.collection[H2O_KEY].copies).toBe(before);
  });

  it("acumulează fracțional și sintetizează doar copii întregi", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.knowledge = 100;
    store.unlockAutoSynth();
    synthH2O(store);
    store.state.resources.atoms = { H: 1000, O: 1000, N: 0 };
    store.setAutoSynthRate(H2O_KEY, 2); // 2 copii/s
    const before = store.state.collection[H2O_KEY].copies;

    tick(store, 0.4); // acumulat 0.8 -> încă 0 copii
    expect(store.state.collection[H2O_KEY].copies).toBe(before);

    tick(store, 0.4); // acumulat 1.6 -> 1 copie nouă
    expect(store.state.collection[H2O_KEY].copies).toBe(before + 1);
  });

  it("rata e un plafon de producție, nu o coadă — backlogul nu se acumulează la infinit fără atomi", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.knowledge = 100;
    store.unlockAutoSynth();
    synthH2O(store);
    store.state.resources.atoms = { H: 0, O: 0, N: 0 };
    store.setAutoSynthRate(H2O_KEY, 10);

    tick(store, 5); // ar cere 50 de copii, dar stocul de atomi e 0
    expect(store.state.collection[H2O_KEY].copies).toBe(1); // doar cea sintetizată manual
    expect(store.state.collection[H2O_KEY].autoSynth.progress).toBe(0);
  });

  it("setAutoSynthRate plafonează la MAX_AUTO_SYNTH_RATE și nu coboară sub 0", () => {
    const store = new GameStore(createInitialState());
    synthH2O(store);
    store.setAutoSynthRate(H2O_KEY, 9999);
    expect(store.state.collection[H2O_KEY].autoSynth.rate).toBeLessThanOrEqual(50);
    store.setAutoSynthRate(H2O_KEY, -5);
    expect(store.state.collection[H2O_KEY].autoSynth.rate).toBe(0);
  });
});

describe("M2 — Analizatorul (§7)", () => {
  it("consumă o copie și acordă Cunoaștere proporțională cu complexitatea", () => {
    const store = new GameStore(createInitialState());
    synthH2O(store);
    const before = store.state.resources.knowledge;
    const copiesBefore = store.state.collection[H2O_KEY].copies;

    const gained = store.analyzeMolecule(H2O_KEY, 1);

    expect(gained).toBeGreaterThan(0);
    expect(store.state.resources.knowledge).toBe(before + gained);
    expect(store.state.collection[H2O_KEY].copies).toBe(copiesBefore - 1);
  });

  it("refuză analiza dacă nu există suficiente copii, fără să modifice starea", () => {
    const store = new GameStore(createInitialState());
    synthH2O(store);
    expect(store.canAnalyze(H2O_KEY, 5)).toBe(false);
    const before = store.state.resources.knowledge;
    expect(store.analyzeMolecule(H2O_KEY, 5)).toBe(0);
    expect(store.state.resources.knowledge).toBe(before);
  });
});

describe("M2 — Upgrade de viteză a generatoarelor (§7)", () => {
  it("fiecare nivel înmulțește rata generatorului cu GENERATOR_SPEED_UPGRADE_MULT (1.5)", () => {
    const rate0 = generatorRate(10, 0);
    const rate1 = generatorRate(10, 1);
    expect(rate1 / rate0).toBeCloseTo(1.5);
  });

  it("costul upgrade-ului crește geometric cu nivelul", () => {
    const cost0 = generatorSpeedUpgradeCost(0);
    const cost1 = generatorSpeedUpgradeCost(1);
    expect(cost1 / cost0).toBeCloseTo(2.2);
  });

  it("GameStore.buyGeneratorSpeedUpgrade cheltuiește Energie și incrementează nivelul", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.energy = 100_000;
    expect(store.buyGeneratorSpeedUpgrade()).toBe(true);
    expect(store.state.generatorSpeedLevel).toBe(1);
  });

  it("refuză cumpărarea fără suficientă Energie", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.energy = 0;
    expect(store.buyGeneratorSpeedUpgrade()).toBe(false);
    expect(store.state.generatorSpeedLevel).toBe(0);
  });
});

describe("M2 — Progres offline plafonat (§4.3)", () => {
  it("nu face nimic sub pragul de 15s", () => {
    const store = new GameStore(createInitialState());
    store.state.savedAt = Date.now() - 5000;
    expect(applyOfflineProgress(store)).toBeNull();
  });

  it("plafonează durata la OFFLINE_CAP_SECONDS și produce la 50% din rata normală", () => {
    const store = new GameStore(createInitialState());
    synthH2O(store);
    const realSecondsElapsed = OFFLINE_CAP_SECONDS * 3; // mult peste cap (24h simulate, cap 8h)
    store.state.savedAt = Date.now() - realSecondsElapsed * 1000;
    const eps = store.totalEnergyPerSecond();

    const report = applyOfflineProgress(store);

    expect(report).not.toBeNull();
    expect(report!.cappedSeconds).toBeCloseTo(OFFLINE_CAP_SECONDS, 0);
    expect(report!.realSeconds).toBeGreaterThan(OFFLINE_CAP_SECONDS);
    expect(report!.energyGained).toBeCloseTo(eps * OFFLINE_CAP_SECONDS * 0.5, 0);
  });
});
