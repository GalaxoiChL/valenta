import type { GameStore } from "./state";
import { generatorRate } from "./balance";

/** Avansează economia cu `dt` secunde: produce atomi din generatoare și energie din Laborator. */
export function tick(store: GameStore, dt: number): void {
  if (dt <= 0) return;

  let atomsChanged = false;
  for (const [element, owned] of Object.entries(store.state.generators)) {
    if (owned <= 0) continue;
    const rate = generatorRate(owned);
    store.state.resources.atoms[element] = (store.state.resources.atoms[element] ?? 0) + rate * dt;
    atomsChanged = true;
  }

  const energyPerSecond = store.totalEnergyPerSecond();
  if (energyPerSecond > 0) {
    store.state.resources.energy += energyPerSecond * dt;
  }

  if (atomsChanged || energyPerSecond > 0) {
    store.events.emit("resources");
  }
}
