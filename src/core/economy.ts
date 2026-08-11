import type { GameStore } from "./state";
import { generatorRate, generatorCost, AUTOPILOT_MAX_PURCHASES_PER_TICK } from "./balance";
import { ELEMENTS } from "../chem/elements";

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
  tickAutopilot(store);
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

/**
 * Autopilot (toggle global din Setări): când activ, la fiecare tick
 * deblochează automat elementul cel mai ieftin afordabil (Cunoaștere), apoi
 * cumpără repetat generatorul cel mai ieftin afordabil (Energie) — până
 * epuizează ce-și poate permite. Cele două faze folosesc monede independente
 * (Cunoaștere vs Energie), deci ordinea dintre ele nu contează economic;
 * păstrăm "deblocări întâi" ca ordine fixă și predictibilă.
 */
function tickAutopilot(store: GameStore): void {
  if (!store.state.settings.autopilot) return;
  autopilotUnlockElements(store);
  autopilotBuyGenerators(store);
}

/**
 * Deblochează repetat elementul blocat cu cel mai mic `unlockCost`. Dacă acel
 * minim nu e afordabil, niciun alt element blocat nu poate fi (are cost ≥),
 * deci un singur scan per iterație e suficient.
 */
function autopilotUnlockElements(store: GameStore): void {
  for (;;) {
    let cheapest: string | null = null;
    let cheapestCost = Infinity;
    for (const symbol in ELEMENTS) {
      if (store.state.unlockedElements.includes(symbol)) continue;
      if (ELEMENTS[symbol].decorative) continue;
      if (ELEMENTS[symbol].unlockCost < cheapestCost) {
        cheapest = symbol;
        cheapestCost = ELEMENTS[symbol].unlockCost;
      }
    }
    if (!cheapest || !store.unlockElement(cheapest)) break;
  }
}

/**
 * Cumpără repetat generatorul (dintre cele deblocate) cu costul curent cel
 * mai mic, până nu mai e nimic afordabil sau se atinge plafonul de siguranță
 * AUTOPILOT_MAX_PURCHASES_PER_TICK (vezi balance.ts).
 */
function autopilotBuyGenerators(store: GameStore): void {
  for (let i = 0; i < AUTOPILOT_MAX_PURCHASES_PER_TICK; i++) {
    let cheapest: string | null = null;
    let cheapestCost = Infinity;
    for (const element of store.state.unlockedElements) {
      const cost = generatorCost(element, store.state.generators[element] ?? 0);
      if (cost < cheapestCost) {
        cheapest = element;
        cheapestCost = cost;
      }
    }
    if (!cheapest || !store.buyGenerator(cheapest)) break;
  }
}
