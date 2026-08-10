import type { GameStore } from "./state";

export interface ObjectiveDef {
  id: string;
  description: string;
  rewardC: number;
  isComplete: (store: GameStore) => boolean;
  progress?: (store: GameStore) => string;
}

function collectionCopies(store: GameStore, key: string): number {
  return store.state.collection[key]?.copies ?? 0;
}

/**
 * Obiective ghidate (§8.3) — servesc drept tutorial continuu și ritm de progresie.
 * Se activează în ordine (primele 3 nefinalizate), fiecare acordă o recompensă
 * mică, unică, în Cunoaștere la finalizare.
 */
export const OBJECTIVES: ObjectiveDef[] = [
  {
    id: "first_h2o",
    description: "Sintetizează Apă (H₂O)",
    rewardC: 3,
    isComplete: (s) => collectionCopies(s, "H2O|1,1") >= 1
  },
  {
    id: "own_10_h_generators",
    description: "Deține 10 generatoare de Hidrogen",
    rewardC: 4,
    isComplete: (s) => (s.state.generators.H ?? 0) >= 10,
    progress: (s) => `${Math.min(s.state.generators.H ?? 0, 10)}/10`
  },
  {
    id: "synth_10_h2o",
    description: "Sintetizează 10× Apă (H₂O)",
    rewardC: 5,
    isComplete: (s) => collectionCopies(s, "H2O|1,1") >= 10,
    progress: (s) => `${Math.min(collectionCopies(s, "H2O|1,1"), 10)}/10`
  },
  {
    id: "reach_50_eps",
    description: "Atinge 50 E/s producție",
    rewardC: 6,
    isComplete: (s) => s.totalEnergyPerSecond() >= 50,
    progress: (s) => `${Math.min(Math.floor(s.totalEnergyPerSecond()), 50)}/50`
  },
  {
    id: "discover_5_molecules",
    description: "Descoperă 5 molecule diferite",
    rewardC: 6,
    isComplete: (s) => Object.keys(s.state.collection).length >= 5,
    progress: (s) => `${Math.min(Object.keys(s.state.collection).length, 5)}/5`
  },
  {
    id: "unlock_auto_synth",
    description: "Deblochează Automatizarea (auto-sintetizatoare)",
    rewardC: 5,
    isComplete: (s) => s.state.autoSynthUnlocked
  },
  {
    id: "unlock_c",
    description: "Deblochează Carbonul",
    rewardC: 8,
    isComplete: (s) => s.state.unlockedElements.includes("C")
  },
  {
    id: "generator_speed_upgrade",
    description: "Cumpără un upgrade de viteză a generatoarelor",
    rewardC: 6,
    isComplete: (s) => s.state.generatorSpeedLevel >= 1
  },
  {
    id: "synth_ch4",
    description: "Sintetizează Metan (CH₄)",
    rewardC: 6,
    isComplete: (s) => collectionCopies(s, "CH4|1,1,1,1") >= 1
  },
  {
    id: "reach_1000_energy",
    description: "Acumulează 1.000 Energie",
    rewardC: 5,
    isComplete: (s) => s.state.resources.energy >= 1000
  },
  {
    id: "discover_10_molecules",
    description: "Descoperă 10 molecule diferite",
    rewardC: 10,
    isComplete: (s) => Object.keys(s.state.collection).length >= 10,
    progress: (s) => `${Math.min(Object.keys(s.state.collection).length, 10)}/10`
  },
  {
    id: "reach_500_eps",
    description: "Atinge 500 E/s producție",
    rewardC: 15,
    isComplete: (s) => s.totalEnergyPerSecond() >= 500,
    progress: (s) => `${Math.min(Math.floor(s.totalEnergyPerSecond()), 500)}/500`
  },
  {
    id: "unlock_na",
    description: "Deblochează Sodiul",
    rewardC: 10,
    isComplete: (s) => s.state.unlockedElements.includes("Na")
  },
  {
    id: "synth_nacl",
    description: "Sintetizează Clorură de sodiu (NaCl) în Constructorul Ionic",
    rewardC: 10,
    isComplete: (s) => collectionCopies(s, "NaCl") >= 1
  }
];

/** Primele `count` obiective încă nefinalizate, în ordinea listei. */
export function activeObjectives(store: GameStore, count = 3): ObjectiveDef[] {
  return OBJECTIVES.filter((o) => !store.state.objectivesDone.includes(o.id)).slice(0, count);
}

/** Verifică toate obiectivele nefinalizate; marchează + acordă Cunoaștere pentru cele îndeplinite. */
export function checkObjectives(store: GameStore): string[] {
  const newlyCompleted: string[] = [];
  for (const objective of OBJECTIVES) {
    if (store.state.objectivesDone.includes(objective.id)) continue;
    if (!objective.isComplete(store)) continue;
    store.state.objectivesDone.push(objective.id);
    store.state.resources.knowledge += objective.rewardC;
    newlyCompleted.push(objective.id);
  }
  if (newlyCompleted.length > 0) {
    store.events.emit("resources");
    store.events.emit("objective-done", newlyCompleted);
  }
  return newlyCompleted;
}
