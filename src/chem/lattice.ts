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
  Fe2O3: 4075,
  // Tier 5 — K/Ca/Al: aceleași energii reale de rețea ar fi cu un ordin de
  // mărime peste orice altceva din joc (ex. Al2O3 real ≈ 15.900 kJ/mol) —
  // recalibrate direct la introducere, cu aceeași metodă ca la Fe2O3 mai sus,
  // ca eficiența E/s-per-atom să rămână puțin peste tier 4 și sub Adenină.
  KCl: 1634,
  KBr: 1665,
  KI: 1587,
  CaO: 1452,
  CaCl2: 2830,
  AlCl3: 3679,
  Al2O3: 4185,
  // Tier 6 — Li/Sn/Zn/Ba/Ag/Pb: aceeași metodă de recalibrare de la introducere.
  // Adenina (§8.2) nu mai e plafonul absolut al jocului odată ce tier-urile
  // depășesc roadmap-ul original din SPEC — normal ca un tier nou să urce
  // peste un vârf vechi, exact ca în orice joc idle cu progresie deschisă.
  LiCl: 1830,
  Li2O: 3282,
  BaO: 1750,
  BaCl2: 3167,
  ZnO: 1780,
  ZnCl2: 3223,
  AgCl: 1503,
  AgBr: 1440,
  SnO: 1836,
  SnCl2: 3391,
  PbO: 1699,
  PbCl2: 3020
};

const DEFAULT_LATTICE_ENERGY = 700;

export function latticeEnergy(formula: string): number {
  return LATTICE_ENERGY[formula] ?? DEFAULT_LATTICE_ENERGY;
}
