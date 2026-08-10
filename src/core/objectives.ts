import type { GameStore } from "./state";
import { H2O_KEY, CH4_KEY } from "../chem/wellKnownKeys";

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
    isComplete: (s) => collectionCopies(s, H2O_KEY) >= 1
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
    isComplete: (s) => collectionCopies(s, H2O_KEY) >= 10,
    progress: (s) => `${Math.min(collectionCopies(s, H2O_KEY), 10)}/10`
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
    isComplete: (s) => collectionCopies(s, CH4_KEY) >= 1
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
  },
  {
    id: "unlock_p",
    description: "Deblochează Fosforul",
    rewardC: 12,
    isComplete: (s) => s.state.unlockedElements.includes("P")
  },
  {
    id: "synth_adenine",
    description: "Sintetizează Adenină (C₅H₅N₅) — o „literă” a codului genetic",
    rewardC: 20,
    isComplete: (s) => Object.values(s.state.collection).some((e) => e.formula === "C5H5N5" && e.copies >= 1)
  },
  {
    id: "unlock_si",
    description: "Deblochează Siliciul",
    rewardC: 14,
    isComplete: (s) => s.state.unlockedElements.includes("Si")
  },
  {
    id: "synth_al2o3",
    description: "Sintetizează Alumină (Al₂O₃) — rubinele și safirele sunt exact acest compus",
    rewardC: 18,
    isComplete: (s) => collectionCopies(s, "Al2O3") >= 1
  },
  {
    id: "unlock_ag",
    description: "Deblochează Argintul",
    rewardC: 20,
    isComplete: (s) => s.state.unlockedElements.includes("Ag")
  },
  {
    id: "synth_agbr",
    description: "Sintetizează Bromură de argint (AgBr) — sarea sensibilă la lumină din fotografia clasică",
    rewardC: 22,
    isComplete: (s) => collectionCopies(s, "AgBr") >= 1
  },
  {
    id: "unlock_ti",
    description: "Deblochează Titanul",
    rewardC: 24,
    isComplete: (s) => s.state.unlockedElements.includes("Ti")
  },
  {
    id: "synth_tio2",
    description: "Sintetizează Dioxid de titan (TiO₂) — cel mai folosit pigment alb din lume",
    rewardC: 26,
    isComplete: (s) => collectionCopies(s, "TiO2") >= 1
  },
  {
    id: "unlock_au",
    description: "Deblochează Aurul",
    rewardC: 28,
    isComplete: (s) => s.state.unlockedElements.includes("Au")
  },
  {
    id: "synth_cr2o3",
    description: "Sintetizează Oxid de crom (Cr₂O₃) — pigmentul „verde crom”",
    rewardC: 30,
    isComplete: (s) => collectionCopies(s, "Cr2O3") >= 1
  },
  {
    id: "unlock_v",
    description: "Deblochează Vanadiul",
    rewardC: 32,
    isComplete: (s) => s.state.unlockedElements.includes("V")
  },
  {
    id: "synth_v2o5",
    description: "Sintetizează Pentoxid de vanadiu (V₂O₅) — catalizatorul din spatele majorității acidului sulfuric din lume",
    rewardC: 35,
    isComplete: (s) => collectionCopies(s, "V2O5") >= 1
  },
  {
    id: "unlock_zr",
    description: "Deblochează Zirconiul",
    rewardC: 32,
    isComplete: (s) => s.state.unlockedElements.includes("Zr")
  },
  {
    id: "synth_zro2",
    description: "Sintetizează Oxid de zirconiu (ZrO₂) — „zirconia cubică”, alternativa sintetică la diamant",
    rewardC: 34,
    isComplete: (s) => collectionCopies(s, "ZrO2") >= 1
  },
  {
    id: "unlock_pt",
    description: "Deblochează Platina",
    rewardC: 36,
    isComplete: (s) => s.state.unlockedElements.includes("Pt")
  },
  {
    id: "synth_pto2",
    description: "Sintetizează Dioxid de platină (PtO₂) — «catalizatorul lui Adams»",
    rewardC: 38,
    isComplete: (s) => collectionCopies(s, "PtO2") >= 1
  },
  {
    id: "unlock_re",
    description: "Deblochează Reniul — sarcina ionică +7, cea mai mare din joc",
    rewardC: 40,
    isComplete: (s) => s.state.unlockedElements.includes("Re")
  },
  {
    id: "synth_re2o7",
    description: "Sintetizează Heptoxid de reniu (Re₂O₇)",
    rewardC: 42,
    isComplete: (s) => collectionCopies(s, "Re2O7") >= 1
  },
  {
    id: "unlock_xe",
    description: "Deblochează Xenonul — gazul nobil care totuși formează legături reale",
    rewardC: 40,
    isComplete: (s) => s.state.unlockedElements.includes("Xe")
  },
  {
    id: "synth_xef4",
    description: "Sintetizează Tetrafluorură de xenon (XeF₄)",
    rewardC: 30,
    isComplete: (s) => Object.values(s.state.collection).some((e) => e.formula === "F4Xe" && e.copies >= 1)
  },
  {
    id: "unlock_yb",
    description: "Deblochează Yterbiul",
    rewardC: 42,
    isComplete: (s) => s.state.unlockedElements.includes("Yb")
  },
  {
    id: "synth_eu2o3",
    description: "Sintetizează Oxid de europiu (Eu₂O₃) — sursa fosforului roșu din ecrane",
    rewardC: 41,
    isComplete: (s) => collectionCopies(s, "Eu2O3") >= 1
  },
  {
    id: "unlock_u",
    description: "Deblochează Uraniul",
    rewardC: 45,
    isComplete: (s) => s.state.unlockedElements.includes("U")
  },
  {
    id: "synth_uo2",
    description: "Sintetizează Oxid de uraniu (UO₂) — combustibilul reactoarelor nucleare civile",
    rewardC: 46,
    isComplete: (s) => collectionCopies(s, "UO2") >= 1
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
