import type { GameStore } from "./state";
import {
  generatorRate,
  generatorCost,
  generatorSpeedUpgradeCost,
  AUTOPILOT_MAX_PURCHASES_PER_TICK,
  AUTO_SYNTH_UNLOCK_COST
} from "./balance";
import { ELEMENTS } from "../chem/elements";

/** Un pas de progres autonom (unlock/upgrade), pentru banner-ul de rezumat din UI — vezi `autopilotAction` mai jos. */
export type AutopilotAction =
  | { kind: "element"; symbol: string; name: string }
  | { kind: "autosynth" }
  | { kind: "speedUpgrade"; level: number };

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
 * Deblochează repetat elementul blocat cu cel mai mic `unlockCost`, tratând
 * și deblocarea Automatizării (auto-sintetizator, cost fix 15 C) ca pe o
 * opțiune concurentă în aceeași monedă (Cunoaștere) — altfel Autopilot-ul
 * cumpără la infinit generatoare de atomi fără nicio creștere de E/s, pentru
 * că E/s vine doar din sinteze, nu din generatoarele înseși. Fiecare
 * deblocare emite `autopilotAction` pentru banner-ul de rezumat din UI.
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

    if (store.canUnlockAutoSynth() && AUTO_SYNTH_UNLOCK_COST < cheapestCost) {
      if (!store.unlockAutoSynth()) break;
      store.events.emit("autopilotAction", { kind: "autosynth" } satisfies AutopilotAction);
      continue;
    }

    if (!cheapest || !store.unlockElement(cheapest)) break;
    store.events.emit("autopilotAction", {
      kind: "element",
      symbol: cheapest,
      name: ELEMENTS[cheapest].name
    } satisfies AutopilotAction);
  }
}

/**
 * Cumpără repetat cea mai ieftină opțiune afordabilă în Energie: fie un
 * generator (dintre cele deblocate), fie upgrade-ul global de viteză a
 * generatoarelor — tratate ca opțiuni concurente în aceeași monedă, altfel
 * Autopilot-ul nu cumpăra niciodată upgrade-ul (nu era inclus în scan-ul
 * "cel mai ieftin întâi"). Se oprește la plafonul de siguranță
 * AUTOPILOT_MAX_PURCHASES_PER_TICK (vezi balance.ts). Cumpărările de
 * generatoare (frecvente, zeci-sute pe tick) nu emit `autopilotAction` — ar
 * fi zgomot; upgrade-ul de viteză (rar) emite, la fel ca deblocările.
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

    const speedUpgradeCost = generatorSpeedUpgradeCost(store.state.generatorSpeedLevel);
    if (speedUpgradeCost < cheapestCost) {
      if (!store.buyGeneratorSpeedUpgrade()) break;
      store.events.emit("autopilotAction", {
        kind: "speedUpgrade",
        level: store.state.generatorSpeedLevel
      } satisfies AutopilotAction);
      continue;
    }

    if (!cheapest || !store.buyGenerator(cheapest)) break;
  }
}
