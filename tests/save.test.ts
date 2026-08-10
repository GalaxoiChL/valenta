import { describe, it, expect } from "vitest";
import { GameStore, createInitialState } from "../src/core/state";
import { exportSave, importSave } from "../src/core/save";
import { productionRate } from "../src/core/state";

describe("export/import save (§11.1, panoul de Setări)", () => {
  it("un save exportat și reimportat restaurează identic starea relevantă", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.energy = 1234;
    store.state.resources.knowledge = 42;
    store.unlockElement("H"); // no-op, deja deblocat — verificăm doar că nu crapă
    store.state.generators.H = 7;

    const json = exportSave(store);

    const fresh = new GameStore(createInitialState());
    const ok = importSave(fresh, json);

    expect(ok).toBe(true);
    expect(fresh.state.resources.energy).toBe(1234);
    expect(fresh.state.resources.knowledge).toBe(42);
    expect(fresh.state.generators.H).toBe(7);
  });

  it("respinge un JSON invalid fără să arunce excepție", () => {
    const store = new GameStore(createInitialState());
    const ok = importSave(store, "{ nu e json valid");
    expect(ok).toBe(false);
  });

  it("un save vechi (pre-M2, fără stars/generatorSpeedLevel/autoSynthUnlocked) migrează la câmpuri valide, nu NaN", () => {
    // SAVE_VERSION n-a fost incrementat din M0, deci un save cu version:1 dar
    // schema veche (înainte ca M2/M5 să adauge aceste câmpuri) trebuie oricum
    // să primească default-uri la migrare — altfel globalProductionMultiplier()
    // calculează `undefined * 0.1 = NaN` la orice moleculă nou sintetizată.
    const oldSave = {
      version: 1,
      resources: { energy: 100, knowledge: 10, atoms: { H: 5, O: 5, N: 5 } },
      unlockedElements: ["H", "O", "N"],
      generators: { H: 0, O: 0, N: 0 },
      collection: {}
    };
    const store = new GameStore(createInitialState());
    const ok = importSave(store, JSON.stringify(oldSave));

    expect(ok).toBe(true);
    expect(store.state.stars).toBe(0);
    expect(store.state.generatorSpeedLevel).toBe(0);
    expect(store.globalProductionMultiplier()).toBe(0);
    expect(Number.isFinite(productionRate(500, 1.5, store.globalProductionMultiplier()))).toBe(true);
  });
});
