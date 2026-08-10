import { describe, it, expect } from "vitest";
import { GameStore, createInitialState } from "../src/core/state";
import { tick } from "../src/core/economy";
import { ELEMENTS } from "../src/chem/elements";
import { AUTOPILOT_MAX_PURCHASES_PER_TICK, generatorCost } from "../src/core/balance";

describe("Autopilot", () => {
  it("dezactivat: nu deblochează și nu cumpără nimic", () => {
    const store = new GameStore(createInitialState());
    store.state.resources.knowledge = 10_000;
    store.state.resources.energy = 10_000;
    tick(store, 1);
    expect(store.state.unlockedElements).toEqual(["H", "O", "N"]);
    expect(store.state.generators).toEqual({ H: 0, O: 0, N: 0 });
  });

  it("activat: cumpără cel mai ieftin generator afordabil, o singură dată dacă bugetul ajunge doar pentru unul", () => {
    const store = new GameStore(createInitialState());
    store.state.settings.autopilot = true;
    // H e cel mai ieftin (cost 15, owned=0); O/N sunt mai scumpe (60/90).
    store.state.resources.energy = 20;
    tick(store, 0.001);
    expect(store.state.generators.H).toBe(1);
    expect(store.state.generators.O).toBe(0);
    expect(store.state.generators.N).toBe(0);
  });

  it("activat: deblochează cel mai ieftin element afordabil dintre cele blocate", () => {
    const store = new GameStore(createInitialState());
    store.state.settings.autopilot = true;
    const cheapestLocked = Object.values(ELEMENTS)
      .filter((def) => !store.state.unlockedElements.includes(def.symbol))
      .reduce((min, def) => (def.unlockCost < min.unlockCost ? def : min));
    store.state.resources.knowledge = cheapestLocked.unlockCost;
    tick(store, 0.001);
    expect(store.state.unlockedElements).toContain(cheapestLocked.symbol);
  });

  it("respectă plafonul de siguranță AUTOPILOT_MAX_PURCHASES_PER_TICK într-un singur apel de tick()", () => {
    const store = new GameStore(createInitialState());
    store.state.settings.autopilot = true;
    store.state.resources.energy = 1e18; // stoc uriaș, simulează un catch-up offline
    tick(store, 0.001);
    const totalBought = Object.values(store.state.generators).reduce((a, b) => a + b, 0);
    expect(totalBought).toBe(AUTOPILOT_MAX_PURCHASES_PER_TICK);
    expect(store.state.resources.energy).toBeGreaterThan(0); // plafonul oprește bucla, nu affordability
  });

  it("nu blochează niciodată — costul celui mai ieftin generator rămas sub plafon e mereu finit", () => {
    // Sanity check pentru testul de mai sus: chiar și 200 de cumpărări pe doar
    // 3 elemente (H/O/N, singurele deblocate la pornire) rămân mult sub 1e18.
    let worstCase = 0;
    for (let owned = 0; owned < AUTOPILOT_MAX_PURCHASES_PER_TICK; owned++) {
      worstCase += generatorCost("N", owned); // N are cel mai mare cost de bază dintre H/O/N
    }
    expect(worstCase).toBeLessThan(1e18);
  });
});
