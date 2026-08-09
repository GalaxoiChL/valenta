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
