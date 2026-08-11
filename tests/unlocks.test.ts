import { describe, it, expect } from "vitest";
import { GameStore, createInitialState } from "../src/core/state";

describe("GameStore.unlockElement — deblocare din Tabelul Periodic (§8.1)", () => {
  it("refuză deblocarea fără suficientă Cunoaștere", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.knowledge = 5;
    expect(store.canUnlockElement("C")).toBe(false);
    expect(store.unlockElement("C")).toBe(false);
    expect(store.state.unlockedElements).not.toContain("C");
    expect(store.state.resources.knowledge).toBe(5);
  });

  it("deblochează și scade Cunoașterea exact cu unlockCost", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.knowledge = 100;
    expect(store.unlockElement("C")).toBe(true);
    expect(store.state.unlockedElements).toContain("C");
    expect(store.state.resources.knowledge).toBe(40); // 100 - 60 (unlockCost Carbon)
    expect(store.state.generators.C).toBe(0);
  });

  it("refuză re-deblocarea unui element deja deblocat", () => {
    const store = new GameStore(createInitialState());
    expect(store.canUnlockElement("H")).toBe(false); // H e deja deblocat de la start
  });

  it("refuză un simbol necunoscut (fără ElementDef)", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.knowledge = 999999;
    expect(store.unlockElement("Xx")).toBe(false);
  });

  it("refuză deblocarea unui element decorativ, chiar cu Cunoaștere suficientă (unlockCost 0)", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.knowledge = 999999;
    expect(store.canUnlockElement("Fr")).toBe(false);
    expect(store.unlockElement("Fr")).toBe(false);
    expect(store.state.unlockedElements).not.toContain("Fr");
  });
});
