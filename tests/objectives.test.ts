import { describe, it, expect } from "vitest";
import { GameStore, createInitialState } from "../src/core/state";
import { checkObjectives, activeObjectives, OBJECTIVES } from "../src/core/objectives";

describe("checkObjectives — stare inițială", () => {
  it("nu acordă Cunoaștere la pornire (fără progres real)", () => {
    const store = new GameStore(createInitialState());
    checkObjectives(store);
    expect(store.state.resources.knowledge).toBe(0);
    expect(store.state.objectivesDone).toEqual([]);
  });

  it("activeObjectives întoarce primele 3 nefinalizate, în ordinea listei", () => {
    const store = new GameStore(createInitialState());
    const active = activeObjectives(store, 3);
    expect(active.map((o) => o.id)).toEqual(OBJECTIVES.slice(0, 3).map((o) => o.id));
  });
});

describe("checkObjectives — finalizare reală", () => {
  it("sinteza primei Ape finalizează obiectivul, acordă recompensa și îl scoate din lista activă", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.atoms = { H: 5, O: 3, N: 0 };
    const h1 = store.placeAtomInDraft("H", 0, 0)!;
    const o = store.placeAtomInDraft("O", 1, 0)!;
    const h2 = store.placeAtomInDraft("H", 2, 0)!;
    store.setBondOrder(h1.id, o.id, 1);
    store.setBondOrder(o.id, h2.id, 1);
    store.synthesizeDraft();

    const before = store.state.resources.knowledge;
    const completed = checkObjectives(store);
    expect(completed).toContain("first_h2o");
    expect(store.state.resources.knowledge).toBeGreaterThan(before);
    expect(activeObjectives(store, 3).map((o) => o.id)).not.toContain("first_h2o");
  });
});
