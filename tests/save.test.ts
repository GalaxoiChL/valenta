import { describe, it, expect } from "vitest";
import { GameStore, createInitialState } from "../src/core/state";
import { exportSave, importSave } from "../src/core/save";

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
});
