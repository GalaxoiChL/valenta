// M3 — Energia de rețea (kJ/mol) a compușilor ionici, echivalentul lui
// bonds.ts pentru legăturile covalente: folosită de productionRate() în
// locul sumei energiilor de legătură (compușii ionici nu au legături
// desenate, deci nu au un ΣE_leg de graf).

const LATTICE_ENERGY: Record<string, number> = {
  NaCl: 787,
  NaF: 923,
  // M6 — oxizi/cloruri de metale tier 4: sarcini mai mari → rețele mult mai
  // energice decât NaCl/NaF (proporțional cu produsul sarcinilor ionilor).
  // Recalibrate în trecerea de echilibrare numerică (post-M6): valorile reale
  // inițiale (Fe2O3 = 14300 etc.) sunt corecte chimic, dar prin productionRate()
  // (exponent 0.7) dădeau o eficiență E/s-per-atom de 3-4× peste orice altă
  // moleculă din joc, inclusiv Adenina (finalul tematic din §8.2) — vezi DEVLOG.
  // Coborâte ca eficiența tier 4 ionic să rămână puțin peste tier 3 (NaCl/NaF)
  // și sub Adenină, păstrând progresia monotonă pe tot jocul.
  MgO: 1285,
  MgCl2: 2346,
  CuO: 1175,
  CuCl2: 2448,
  FeCl3: 3390,
  Fe2O3: 4075
};

const DEFAULT_LATTICE_ENERGY = 700;

export function latticeEnergy(formula: string): number {
  return LATTICE_ENERGY[formula] ?? DEFAULT_LATTICE_ENERGY;
}
