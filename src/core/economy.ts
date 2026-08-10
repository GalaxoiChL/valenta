import type { GameStore } from "./state";
import { generatorRate } from "./balance";

/** Avansează economia cu `dt` secunde: produce atomi din generatoare și energie din Laborator. */
export function tick(store: GameStore, dt: number): void {
  if (dt <= 0) return;

  let atomsChanged = false;
  const speedLevel = store.state.generatorSpeedLevel;
  for (const [element, owned] of Object.entries(store.state.generators)) {
    if (owned <= 0) continue;
    const rate = generatorRate(owned, speedLevel);
    store.state.resources.atoms[element] = (store.state.resources.atoms[element] ?? 0) + rate * dt;
    atomsChanged = true;
  }

  const energyPerSecond = store.totalEnergyPerSecond();
  if (energyPerSecond > 0) {
    const gained = energyPerSecond * dt;
    store.state.resources.energy += gained;
    // M5 — Nucleosinteza (§3.3): totalul erei curente, nu scade la cheltuieli.
    store.state.totalEnergyEarned += gained;
  }

  if (atomsChanged || energyPerSecond > 0) {
    store.events.emit("resources");
  }

  tickAutoSynth(store, dt);
}

/**
 * M2 — Auto-sintetizatoare (§7): fiecare moleculă din Colecție cu o rată setată
 * acumulează fracțional (`progress += rate*dt`) și sintetizează copii întregi
 * cât timp există atomi. Backlogul NU se păstrează dacă lipsesc atomii — rata
 * e un plafon de producție, nu o coadă care se acumulează la infinit.
 */
function tickAutoSynth(store: GameStore, dt: number): void {
  if (!store.state.autoSynthUnlocked) return;
  for (const entry of Object.values(store.state.collection)) {
    if (!entry.autoSynth || entry.autoSynth.rate <= 0) continue;
    entry.autoSynth.progress += entry.autoSynth.rate * dt;
    const wholeCopies = Math.floor(entry.autoSynth.progress);
    if (wholeCopies <= 0) continue;
    store.synthesizeFromCollection(entry.key, wholeCopies);
    entry.autoSynth.progress -= wholeCopies;
  }
}
