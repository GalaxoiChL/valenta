// M3 — Energia de rețea (kJ/mol) a compușilor ionici, echivalentul lui
// bonds.ts pentru legăturile covalente: folosită de productionRate() în
// locul sumei energiilor de legătură (compușii ionici nu au legături
// desenate, deci nu au un ΣE_leg de graf).

const LATTICE_ENERGY: Record<string, number> = {
  NaCl: 787,
  NaF: 923,
  // M6 — oxizi/cloruri de metale tier 4: sarcini mai mari → rețele mult mai
  // energice decât NaCl/NaF (proporțional cu produsul sarcinilor ionilor).
  MgO: 3795,
  MgCl2: 2526,
  CuO: 3300,
  CuCl2: 2400,
  FeCl3: 3900,
  Fe2O3: 14300
};

const DEFAULT_LATTICE_ENERGY = 700;

export function latticeEnergy(formula: string): number {
  return LATTICE_ENERGY[formula] ?? DEFAULT_LATTICE_ENERGY;
}
