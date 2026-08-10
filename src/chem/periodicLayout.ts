// Poziții de grilă (rând, coloană) pentru layout-ul standard al tabelului periodic,
// folosite doar pentru afișare (§8.1) — "vederea întregului tabel de la început".
// Elementele fără ElementDef în elements.ts se randează ca siluete "?", neclickabile.

export interface PeriodicSlot {
  symbol: string;
  row: number;
  col: number;
}

const PERIODS: string[][] = [
  ["H", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "He"],
  ["Li", "Be", "", "", "", "", "", "", "", "", "", "", "B", "C", "N", "O", "F", "Ne"],
  ["Na", "Mg", "", "", "", "", "", "", "", "", "", "", "Al", "Si", "P", "S", "Cl", "Ar"],
  ["K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr"],
  ["Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Xe"],
  ["Cs", "Ba", "*", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Po", "At", "Rn"],
  ["Fr", "Ra", "**", "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds", "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og"]
];

const LANTHANIDES = ["La", "Ce", "Pr", "Nd", "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu"];
const ACTINIDES = ["Ac", "Th", "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm", "Md", "No", "Lr"];

function buildLayout(): PeriodicSlot[] {
  const slots: PeriodicSlot[] = [];
  PERIODS.forEach((period, rowIdx) => {
    period.forEach((symbol, colIdx) => {
      if (!symbol || symbol === "*" || symbol === "**") return;
      slots.push({ symbol, row: rowIdx + 1, col: colIdx + 1 });
    });
  });
  LANTHANIDES.forEach((symbol, i) => slots.push({ symbol, row: 9, col: i + 3 }));
  ACTINIDES.forEach((symbol, i) => slots.push({ symbol, row: 10, col: i + 3 }));
  return slots;
}

export const PERIODIC_LAYOUT: PeriodicSlot[] = buildLayout();
export const PERIODIC_ROWS = 10;
export const PERIODIC_COLS = 18;
