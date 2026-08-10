import { describe, it, expect } from "vitest";
import { GameStore, createInitialState } from "../src/core/state";
import { tick } from "../src/core/economy";
import { starsForEnergy, NUCLEOSYNTHESIS_MIN_ENERGY, STAR_PRODUCTION_BONUS } from "../src/core/balance";

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

describe("starsForEnergy — curbă rădăcină pătrată (§3.3)", () => {
  it("0 stele sub prag", () => {
    expect(starsForEnergy(0)).toBe(0);
    expect(starsForEnergy(NUCLEOSYNTHESIS_MIN_ENERGY - 1)).toBe(0);
  });

  it("exact 1 stea la prag, 2 la 4×prag, 3 la 9×prag (randament descrescător)", () => {
    expect(starsForEnergy(NUCLEOSYNTHESIS_MIN_ENERGY)).toBe(1);
    expect(starsForEnergy(NUCLEOSYNTHESIS_MIN_ENERGY * 4)).toBe(2);
    expect(starsForEnergy(NUCLEOSYNTHESIS_MIN_ENERGY * 9)).toBe(3);
  });
});

describe("GameStore — totalEnergyEarned crește la fiecare tick, nu scade la cheltuieli", () => {
  it("tick() acumulează totalEnergyEarned din producția Colecției", () => {
    const store = new GameStore(createInitialState());
    synthH2O(store);
    expect(store.state.totalEnergyEarned).toBe(0);
    tick(store, 10);
    expect(store.state.totalEnergyEarned).toBeGreaterThan(0);
    expect(store.state.totalEnergyEarned).toBeCloseTo(store.state.resources.energy, 5);
  });

  it("cumpărarea unui generator scade Energia dar NU totalEnergyEarned", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.energy = 1000;
    store.state.totalEnergyEarned = 1000;
    store.buyGenerator("H");
    expect(store.state.resources.energy).toBeLessThan(1000);
    expect(store.state.totalEnergyEarned).toBe(1000);
  });
});

describe("GameStore.triggerNucleosynthesis (§3.3)", () => {
  it("refuză sub prag, nu modifică starea", () => {
    const store = new GameStore(createInitialState());
    store.state.totalEnergyEarned = 100;
    expect(store.canTriggerNucleosynthesis()).toBe(false);
    expect(store.triggerNucleosynthesis()).toBe(0);
    expect(store.state.stars).toBe(0);
  });

  it("acordă Stele, resetează era curentă, păstrează Cunoașterea și elementele deblocate", () => {
    const store = new GameStore(createInitialState());
    synthH2O(store);
    store.unlockElement("O") || undefined; // O e deja deblocat implicit; verificăm doar că nu crapă
    store.state.resources.knowledge = 250;
    store.state.totalEnergyEarned = NUCLEOSYNTHESIS_MIN_ENERGY * 4; // -> 2 stele
    store.state.resources.energy = 5000;
    store.state.generators.H = 10;
    store.state.autoSynthUnlocked = true;
    store.state.objectivesDone = ["first_h2o"];

    const gained = store.triggerNucleosynthesis();

    expect(gained).toBe(2);
    expect(store.state.stars).toBe(2);
    expect(store.state.totalEnergyEarned).toBe(0);
    expect(store.state.resources.energy).toBe(0);
    expect(store.state.resources.knowledge).toBe(250); // păstrată
    expect(store.state.unlockedElements).toContain("O"); // păstrate
    expect(store.state.generators.H).toBe(0);
    expect(store.state.autoSynthUnlocked).toBe(false);
    expect(Object.keys(store.state.collection).length).toBe(0);
    expect(store.state.objectivesDone).toEqual([]);
  });

  it("Stelele acumulate din reset-uri succesive se adună", () => {
    const store = new GameStore(createInitialState());
    store.state.totalEnergyEarned = NUCLEOSYNTHESIS_MIN_ENERGY;
    store.triggerNucleosynthesis();
    expect(store.state.stars).toBe(1);

    store.state.totalEnergyEarned = NUCLEOSYNTHESIS_MIN_ENERGY;
    store.triggerNucleosynthesis();
    expect(store.state.stars).toBe(2);
  });
});

describe("Bonusul global al Stelelor se aplică la sinteza de molecule noi", () => {
  it("cu 3 Stele, o moleculă nou descoperită produce cu 30% mai mult E/s", () => {
    const withoutStars = new GameStore(createInitialState());
    synthH2O(withoutStars);
    const baseRate = Object.values(withoutStars.state.collection)[0].ePerSecondPerCopy;

    const withStars = new GameStore(createInitialState());
    withStars.state.stars = 3;
    synthH2O(withStars);
    const boostedRate = Object.values(withStars.state.collection)[0].ePerSecondPerCopy;

    expect(boostedRate).toBeCloseTo(baseRate * (1 + 3 * STAR_PRODUCTION_BONUS), 5);
  });
});
