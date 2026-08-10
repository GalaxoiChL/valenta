// Toate constantele de echilibrare, conform §4.2 din SPEC.md.
// Calibrabile în M5 — nu se hardcodează în altă parte.

export const K_PROD = 0.02;
export const PRODUCTION_EXPONENT = 0.7;
export const DEFAULT_BONUS_MULT = 1.0;

// Stoc inițial de atomi, ca jucătorul să poată sintetiza manual primele molecule
// înainte de a avea generatoare sau Energie (fără asta bucla de start e blocată:
// 0 E → nu poți cumpăra generatoare → 0 atomi → nu poți sintetiza → 0 E).
export const STARTING_ATOMS: Record<string, number> = { H: 6, O: 4, N: 4 };

export const GENERATOR_COST_GROWTH = 1.18;
export const GENERATOR_BASE_COST: Record<string, number> = {
  H: 15,
  O: 60,
  N: 90,
  C: 200,
  S: 300,
  Cl: 400,
  F: 350,
  Na: 500,
  He: 600,
  Ne: 650,
  P: 700,
  Mg: 550,
  Cu: 750,
  Fe: 700,
  Al: 800,
  Si: 850,
  Br: 900,
  K: 950,
  Ca: 1000,
  I: 1100,
  Li: 1200,
  Sn: 1300,
  Zn: 1400,
  Ba: 1500,
  Ag: 1600,
  Pb: 1700,
  Ti: 1800,
  Sr: 1900,
  Ni: 2000,
  Co: 2100,
  Cs: 2200,
  B: 2300,
  Au: 2400,
  Ge: 2500,
  Hg: 2600,
  Cr: 2700,
  Mn: 2800,
  Cd: 2900,
  Be: 3000,
  Ga: 3100,
  In: 3200,
  Bi: 3300,
  W: 3400,
  V: 3500
};
export const GENERATOR_BASE_RATE = 0.5; // atomi/s per generator
export const GENERATOR_MILESTONE_STEP = 10; // la fiecare 10 generatoare
export const GENERATOR_MILESTONE_MULT = 2;

export const OFFLINE_CAP_SECONDS = 8 * 60 * 60;
export const OFFLINE_PRODUCTION_RATE = 0.5;

export const AUTOSAVE_INTERVAL_MS = 15_000;
export const ECONOMY_TICK_MS = 100;
export const MAX_UNDO_STEPS = 20;

// M2 — Auto-sintetizatoare (§7): deblocare unică cu Cunoaștere, apoi o rată
// (copii/s) ajustabilă per moleculă din Colecție.
export const AUTO_SYNTH_UNLOCK_COST = 15; // C
export const MAX_AUTO_SYNTH_RATE = 50; // copii/s, per moleculă

// M2 — Analizatorul (§7): consumă o copie din Colecție, produce Cunoaștere
// proporțional cu complexitatea moleculei (suma energiilor de legătură).
// Calibrat puțin peste bonusul de primă descoperire, ca prețul (pierderea
// producției de E/s a acelei copii) să aibă o recompensă vizibilă.
export const K_ANALYSIS_PER_ENERGY = 0.01;

// M2 — Upgrade de viteză a generatoarelor: nivel global, cost geometric,
// fiecare nivel înmulțește rata TUTUROR generatoarelor.
export const GENERATOR_SPEED_UPGRADE_BASE_COST = 500; // E
export const GENERATOR_SPEED_UPGRADE_GROWTH = 2.2;
export const GENERATOR_SPEED_UPGRADE_MULT = 1.5; // +50% rată per nivel

export function generatorCost(element: string, owned: number): number {
  const base = GENERATOR_BASE_COST[element] ?? 100;
  return base * Math.pow(GENERATOR_COST_GROWTH, owned);
}

export function generatorRate(owned: number, speedLevel = 0): number {
  const milestones = Math.floor(owned / GENERATOR_MILESTONE_STEP);
  const base = owned * GENERATOR_BASE_RATE * Math.pow(GENERATOR_MILESTONE_MULT, milestones);
  return base * Math.pow(GENERATOR_SPEED_UPGRADE_MULT, speedLevel);
}

export function generatorSpeedUpgradeCost(level: number): number {
  return GENERATOR_SPEED_UPGRADE_BASE_COST * Math.pow(GENERATOR_SPEED_UPGRADE_GROWTH, level);
}

export function discoveryKnowledge(sumBondEnergy: number, tier: number): number {
  const multiplicatorTier = tier + 1;
  return 1 + Math.floor(Math.pow(sumBondEnergy / 200, 1.1)) * multiplicatorTier;
}

export function analysisKnowledge(sumBondEnergy: number): number {
  return Math.max(1, Math.round(K_ANALYSIS_PER_ENERGY * sumBondEnergy));
}

// M5 — Nucleosinteza (§3.3): prestige. Pragul de Energie acumulată în era
// curentă pentru prima Stea; scalare rădăcină pătrată pentru randament
// descrescător (fiecare Stea suplimentară cere din ce în ce mai multă
// Energie, curbă clasică de prestige în jocurile idle).
export const NUCLEOSYNTHESIS_MIN_ENERGY = 1_000_000;
export const STAR_PRODUCTION_BONUS = 0.1; // +10% producție globală per Stea

export function starsForEnergy(totalEnergyEarned: number): number {
  if (totalEnergyEarned < NUCLEOSYNTHESIS_MIN_ENERGY) return 0;
  return Math.floor(Math.sqrt(totalEnergyEarned / NUCLEOSYNTHESIS_MIN_ENERGY));
}
