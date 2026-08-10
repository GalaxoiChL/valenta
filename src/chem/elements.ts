export interface ElementDef {
  symbol: string;
  name: string;
  Z: number;
  valences: number[];
  mass: number;
  color: string;
  tier: number;
  unlockCost: number;
  flavor: string;
  /**
   * M3 — sarcina ionică (§5.6): elementele cu valențe covalente goale
   * (ex. Na) sunt ionice-doar; cele cu ambele (Cl, F) pot forma și legături
   * covalente (HCl, HF), și compuși ionici (NaCl, NaF). 0/absent = nu
   * formează ioni în acest model (include gazele nobile, inerte).
   */
  ionicCharge?: number;
}

// Set MVP (M0): H, O, N. Restul tier 1–2 e pregătit pentru M1, dar rămâne
// nefolosit până când unlocks.ts din M1 le activează.
export const ELEMENTS: Record<string, ElementDef> = {
  H: {
    symbol: "H",
    name: "Hidrogen",
    Z: 1,
    valences: [1],
    mass: 1.008,
    color: "#ffffff",
    tier: 0,
    unlockCost: 0,
    flavor: "Cel mai simplu și mai abundent element din univers — un proton și un electron."
  },
  O: {
    symbol: "O",
    name: "Oxigen",
    Z: 8,
    valences: [2],
    mass: 15.999,
    color: "#ff3b30",
    tier: 1,
    unlockCost: 10,
    flavor: "Respirăm datorită lui, dar în stare pură e și el otrăvitor peste o anumită concentrație."
  },
  N: {
    symbol: "N",
    name: "Azot",
    Z: 7,
    valences: [3],
    mass: 14.007,
    color: "#3b82f6",
    tier: 1,
    unlockCost: 25,
    flavor: "78% din aerul pe care-l respiri e azot — dar molecula N₂ e atât de stabilă încât aproape nu reacționează."
  },
  C: {
    symbol: "C",
    name: "Carbon",
    Z: 6,
    valences: [4],
    mass: 12.011,
    color: "#4b5563",
    tier: 2,
    unlockCost: 60,
    flavor: "Singurul element care poate forma lanțuri și inele complexe — baza întregii chimii organice."
  },
  S: {
    symbol: "S",
    name: "Sulf",
    Z: 16,
    valences: [2, 4, 6],
    mass: 32.06,
    color: "#eab308",
    tier: 4,
    unlockCost: 250,
    flavor: "Mirosul de ouă stricate vine de la compușii lui de sulf — dar e esențial în multe proteine."
  },
  Cl: {
    symbol: "Cl",
    name: "Clor",
    Z: 17,
    valences: [1],
    mass: 35.45,
    color: "#1ff01f",
    tier: 3,
    unlockCost: 120,
    flavor: "Gaz galben-verzui toxic în stare pură — dar ionul său, clorura, e esențial pentru semnalele nervoase din corpul tău.",
    ionicCharge: -1
  },
  Na: {
    symbol: "Na",
    name: "Sodiu",
    Z: 11,
    valences: [],
    mass: 22.99,
    color: "#ab5cf2",
    tier: 3,
    unlockCost: 150,
    flavor: "Un metal atât de reactiv încât reacționează violent cu apa — dar combinat cu clorul devine sarea de masă, complet inofensivă.",
    ionicCharge: 1
  },
  F: {
    symbol: "F",
    name: "Fluor",
    Z: 9,
    valences: [1],
    mass: 18.998,
    color: "#90e050",
    tier: 3,
    unlockCost: 100,
    flavor: "Cel mai electronegativ element din tabelul periodic — atât de reactiv încât nu există liber în natură, doar legat în minerale.",
    ionicCharge: -1
  },
  He: {
    symbol: "He",
    name: "Heliu",
    Z: 2,
    valences: [0],
    mass: 4.003,
    color: "#d9ffff",
    tier: 3,
    unlockCost: 80,
    flavor: "Al doilea cel mai abundent element din univers — dar pe Pământ e atât de rar încât se extrage din gazul natural. Heliul refuză politicos orice legătură.",
    ionicCharge: 0
  },
  Ne: {
    symbol: "Ne",
    name: "Neon",
    Z: 10,
    valences: [0],
    mass: 20.18,
    color: "#ff99cc",
    tier: 3,
    unlockCost: 95,
    flavor: "Gazul care dă culoarea roșu-portocalie clasică reclamelor luminoase — la fel de puțin dornic să lege ca vecinul său Heliul.",
    ionicCharge: 0
  }
};

export function getElement(symbol: string): ElementDef {
  const def = ELEMENTS[symbol];
  if (!def) throw new Error(`Element necunoscut: ${symbol}`);
  return def;
}

export function maxValence(symbol: string): number {
  return Math.max(...getElement(symbol).valences);
}
