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
  S: 300
};
export const GENERATOR_BASE_RATE = 0.5; // atomi/s per generator
export const GENERATOR_MILESTONE_STEP = 10; // la fiecare 10 generatoare
export const GENERATOR_MILESTONE_MULT = 2;

export const ELEMENT_UNLOCK_COST: Record<string, number> = {
  H: 0,
  O: 10,
  N: 25,
  C: 60,
  S: 250
};

export const OFFLINE_CAP_SECONDS = 8 * 60 * 60;
export const OFFLINE_PRODUCTION_RATE = 0.5;

export const AUTOSAVE_INTERVAL_MS = 15_000;
export const ECONOMY_TICK_MS = 100;
export const MAX_UNDO_STEPS = 20;

export function generatorCost(element: string, owned: number): number {
  const base = GENERATOR_BASE_COST[element] ?? 100;
  return base * Math.pow(GENERATOR_COST_GROWTH, owned);
}

export function generatorRate(owned: number): number {
  const milestones = Math.floor(owned / GENERATOR_MILESTONE_STEP);
  return owned * GENERATOR_BASE_RATE * Math.pow(GENERATOR_MILESTONE_MULT, milestones);
}

export function discoveryKnowledge(sumBondEnergy: number, tier: number): number {
  const multiplicatorTier = tier + 1;
  return 1 + Math.floor(Math.pow(sumBondEnergy / 200, 1.1)) * multiplicatorTier;
}
