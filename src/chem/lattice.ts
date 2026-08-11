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
  PbCl2: 3020,
  // Tier 7 — Ti/Sr/Ni/Co/Cs: aceeași metodă, țintă peste vârful tier 6 (PbO,
  // eff 4,20), continuând urcarea monotonă.
  TiO2: 3042,
  SrO: 1934,
  SrCl2: 3814,
  NiO: 1903,
  NiCl2: 3757,
  CoO: 1815,
  CoCl2: 3572,
  CsCl: 2181,
  CsBr: 2069,
  // Tier 8 — Au/Hg/Cr/Mn/Cd: aceeași metodă, țintă peste vârful tier 7
  // (TiO2, eff 4,75).
  AuCl3: 5371,
  HgO: 2089,
  HgCl2: 4091,
  Cr2O3: 6630,
  CrCl3: 5528,
  MnO: 2226,
  MnCl2: 4372,
  CdO: 2259,
  CdCl2: 4435,
  // Tier 9 — Be/Ga/In/Bi/W/V: aceeași metodă, țintă peste vârful tier 8
  // (Cr2O3, eff 5,30).
  BeO: 2774,
  BeCl2: 5449,
  Ga2O3: 8178,
  GaCl3: 6819,
  In2O3: 8280,
  InCl3: 6907,
  Bi2O3: 7943,
  BiCl3: 6582,
  WO3: 6526,
  WCl6: 13987,
  V2O5: 12497,
  // Tier 10 — Rb/Sc/Zr/Sb/Mo/Nb: aceeași metodă, țintă peste vârful tier 9
  // (V2O5, eff 5,90). ZrCl4/NbCl5/MoCl6 evitate deliberat — la fel ca TiCl4
  // din tier 7, sunt de fapt covalente/moleculare în realitate, nu săruri
  // ionice — fiecare metal de tranziție cu sarcină ≥4 primește un singur
  // compus (oxidul, genuine ionic), consistent cu Ti/Au/V.
  RbCl: 3457,
  RbBr: 3263,
  ZrO2: 5099,
  Nb2O5: 14037,
  MoO3: 7091,
  Sb2O3: 9115,
  SbCl3: 7713,
  Sc2O3: 9529,
  ScCl3: 8122,
  // Tier 11 — As/Se/Te/Y/Pd/Pt: aceeași metodă, țintă peste vârful tier 10
  // (Nb2O5, eff 6,40).
  As2O3: 10664,
  AsCl3: 9206,
  SeO2: 5853,
  TeO2: 5567,
  Y2O3: 10633,
  YCl3: 9307,
  PdO: 3615,
  PdCl2: 6523,
  PtO2: 5179,
  PtCl4: 10855,
  // Tier 12 — Tl/Hf/Ru/Ta/Ir/Re: aceeași metodă, țintă peste vârful tier 11
  // (PtCl4, eff 6,95). Re2O7 e prima sarcină +7 din joc.
  TlCl: 4309,
  TlBr: 4060,
  HfO2: 6170,
  Ta2O5: 16940,
  Re2O7: 23979,
  Ru2O3: 11304,
  RuCl3: 9597,
  Ir2O3: 10818,
  IrCl3: 9122,
  // Tier 13 — La/Ce/Nd/Gd: aceeași metodă, țintă peste vârful tier 12
  // (Re2O7, eff 7,50).
  La2O3: 12334,
  LaCl3: 10785,
  Nd2O3: 12567,
  NdCl3: 10785,
  Gd2O3: 12129,
  GdCl3: 10243,
  CeO2: 6284,
  // Tier 14 — Pr/Sm/Eu/Tb/Dy/Yb: al doilea lot de lantanide, aceeași metodă,
  // țintă peste vârful tier 13 (CeO2, eff 7,90).
  Pr2O3: 13272,
  PrCl3: 11599,
  Sm2O3: 13391,
  SmCl3: 11702,
  Eu2O3: 12914,
  EuCl3: 11012,
  Tb2O3: 13510,
  TbCl3: 11599,
  Dy2O3: 13027,
  DyCl3: 11109,
  Yb2O3: 13141,
  YbCl3: 11207,
  // Tier 15 — Tm/Lu (ultimele lantanide stabile), Ra/Th/U: aceeași metodă,
  // țintă peste vârful tier 14 (Yb2O3, eff 8,25). Kr rămâne inert (ca He/
  // Ne/Ar), fără compuși ionici sau energie de rețea.
  Tm2O3: 14109,
  TmCl3: 12326,
  Lu2O3: 14351,
  LuCl3: 12326,
  ThO2: 7035,
  UO2: 6487,
  RaO: 4963,
  RaCl2: 9545,
  // Tier 16 — Rh/Os: ultimele 2 metale stabile din familia platinei. OsO4
  // e prima sarcină +8 din joc — cea mai mare posibilă în modelul actual.
  Rh2O3: 15332,
  RhCl3: 13388,
  OsO4: 13209,
  // Tier 17 — Ho/Er: două lantanide stabile omise din loturile anterioare.
  // Aceeași metodă, țintă peste vârful tier 16 (OsO4, eff 9,20).
  Ho2O3: 15600,
  HoCl3: 13600,
  Er2O3: 15850,
  ErCl3: 13820
};

const DEFAULT_LATTICE_ENERGY = 700;

export function latticeEnergy(formula: string): number {
  return LATTICE_ENERGY[formula] ?? DEFAULT_LATTICE_ENERGY;
}
