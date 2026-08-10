import type { Atom, MoleculeGraph } from "../chem/molecule";
import {
  createMolecule,
  addAtom as addGraphAtom,
  removeAtom as removeGraphAtom,
  addBond as addGraphBond,
  removeBond as removeGraphBond,
  findBond,
  usedValence
} from "../chem/molecule";
import { validate } from "../chem/validator";
import { moleculeKey, hillFormula } from "../chem/formula";
import { bondEnergy } from "../chem/bonds";
import { ELEMENTS, maxValence } from "../chem/elements";
import moleculeDB from "../chem/moleculeDB.json";
import {
  generatorCost,
  discoveryKnowledge,
  DEFAULT_BONUS_MULT,
  K_PROD,
  PRODUCTION_EXPONENT,
  STARTING_ATOMS
} from "./balance";

export interface MoleculeDBEntry {
  key: string;
  formula: string;
  name: string;
  bonusMult: number;
  discoveryC: number;
  tier: number;
  tags: string[];
  flavor: string;
}

const DB_BY_KEY = new Map<string, MoleculeDBEntry>(
  (moleculeDB as MoleculeDBEntry[]).map((entry) => [entry.key, entry])
);

/**
 * Resincronizează intrările din Colecție cu moleculeDB.json curent.
 * O moleculă descoperită înainte să fie adăugată în DB rămâne "Compus X" —
 * fără asta, un save vechi nu ar mai afla niciodată numele real al unei
 * molecule adăugate ulterior în baza de date.
 */
export function reconcileCollectionWithDB(state: GameState): void {
  for (const entry of Object.values(state.collection)) {
    const dbEntry = DB_BY_KEY.get(entry.key);
    if (!dbEntry) continue;
    entry.name = dbEntry.name;
    entry.flavor = dbEntry.flavor;
    entry.ePerSecondPerCopy = productionRate(entry.sumBondEnergy, dbEntry.bonusMult);
  }
}

export interface CollectionEntry {
  key: string;
  formula: string;
  name: string;
  copies: number;
  discovered: boolean;
  ePerSecondPerCopy: number;
  sumBondEnergy: number;
  atomsPerCopy: Record<string, number>;
  flavor: string;
}

export interface GameState {
  version: number;
  savedAt: number;
  resources: {
    energy: number;
    knowledge: number;
    atoms: Record<string, number>;
  };
  unlockedElements: string[];
  generators: Record<string, number>;
  collection: Record<string, CollectionEntry>;
  constructorDraft: MoleculeGraph;
  objectivesDone: string[];
  settings: {
    sound: boolean;
    offlineCap: number;
  };
}

export const SAVE_VERSION = 1;

export function createInitialState(): GameState {
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    resources: {
      energy: 0,
      knowledge: 0,
      atoms: { ...STARTING_ATOMS }
    },
    unlockedElements: ["H", "O", "N"],
    generators: { H: 0, O: 0, N: 0 },
    collection: {},
    constructorDraft: createMolecule(),
    objectivesDone: [],
    settings: { sound: true, offlineCap: 8 * 60 * 60 }
  };
}

type Listener = (...args: unknown[]) => void;

export class EventEmitter {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, cb: Listener): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
    return () => this.listeners.get(event)?.delete(cb);
  }

  emit(event: string, ...args: unknown[]): void {
    for (const cb of this.listeners.get(event) ?? []) cb(...args);
  }
}

export interface SynthesisResult {
  ok: boolean;
  reason?: string;
  isFirstDiscovery?: boolean;
  dbEntry?: MoleculeDBEntry;
  formula?: string;
}

export function sumGraphBondEnergy(graph: MoleculeGraph): number {
  const byId = new Map(graph.atoms.map((a) => [a.id, a.element]));
  return graph.bonds.reduce((sum, bond) => {
    const elA = byId.get(bond.a);
    const elB = byId.get(bond.b);
    if (!elA || !elB) return sum;
    return sum + bondEnergy(elA, elB, bond.order);
  }, 0);
}

function atomCounts(graph: MoleculeGraph): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const atom of graph.atoms) counts[atom.element] = (counts[atom.element] ?? 0) + 1;
  return counts;
}

/**
 * Verifică dacă ordinul `newOrder` pentru legătura (aId,bId) e permis fără
 * a depăși valența maximă a vreunui capăt (§6.2 — prevenție, nu pedeapsă).
 */
export function canSetBondOrder(
  graph: MoleculeGraph,
  aId: string,
  bId: string,
  newOrder: number
): boolean {
  const atomA = graph.atoms.find((a) => a.id === aId);
  const atomB = graph.atoms.find((a) => a.id === bId);
  if (!atomA || !atomB) return false;
  const existing = findBond(graph, aId, bId);
  const usedA = usedValence(graph, aId) - (existing?.order ?? 0) + newOrder;
  const usedB = usedValence(graph, bId) - (existing?.order ?? 0) + newOrder;
  return usedA <= maxValence(atomA.element) && usedB <= maxValence(atomB.element);
}

/** Are atomul cel puțin o valență liberă pentru o legătură simplă nouă? */
export function hasFreeValence(graph: MoleculeGraph, atomId: string): boolean {
  const atom = graph.atoms.find((a) => a.id === atomId);
  if (!atom) return false;
  return usedValence(graph, atomId) < maxValence(atom.element);
}

export class GameStore {
  state: GameState;
  events = new EventEmitter();

  constructor(state: GameState = createInitialState()) {
    this.state = state;
  }

  private emitResources(): void {
    this.events.emit("resources");
  }

  private emitDraft(): void {
    this.events.emit("draft");
  }

  addAtoms(element: string, amount: number): void {
    this.state.resources.atoms[element] = (this.state.resources.atoms[element] ?? 0) + amount;
    this.emitResources();
  }

  canAffordAtoms(costs: Record<string, number>): boolean {
    return Object.entries(costs).every(([el, n]) => (this.state.resources.atoms[el] ?? 0) >= n);
  }

  /** Deblochează un element din Tabelul Periodic, cheltuind Cunoaștere (§8.1). */
  canUnlockElement(symbol: string): boolean {
    if (this.state.unlockedElements.includes(symbol)) return false;
    const def = ELEMENTS[symbol];
    if (!def) return false;
    return this.state.resources.knowledge >= def.unlockCost;
  }

  unlockElement(symbol: string): boolean {
    if (!this.canUnlockElement(symbol)) return false;
    const def = ELEMENTS[symbol];
    this.state.resources.knowledge -= def.unlockCost;
    this.state.unlockedElements.push(symbol);
    this.state.generators[symbol] = this.state.generators[symbol] ?? 0;
    this.emitResources();
    this.events.emit("unlocked", symbol);
    return true;
  }

  buyGenerator(element: string): boolean {
    const owned = this.state.generators[element] ?? 0;
    const cost = generatorCost(element, owned);
    if (this.state.resources.energy < cost) return false;
    this.state.resources.energy -= cost;
    this.state.generators[element] = owned + 1;
    this.emitResources();
    this.events.emit("generators");
    return true;
  }

  draft(): MoleculeGraph {
    return this.state.constructorDraft;
  }

  setDraft(graph: MoleculeGraph): void {
    this.state.constructorDraft = graph;
    this.emitDraft();
  }

  /** Plasează un atom în Constructor, rezervându-l din stoc (§6.1). null dacă nu există stoc. */
  placeAtomInDraft(element: string, x: number, y: number): Atom | null {
    if ((this.state.resources.atoms[element] ?? 0) < 1) return null;
    this.state.resources.atoms[element] -= 1;
    const atom = addGraphAtom(this.state.constructorDraft, element, x, y);
    this.emitResources();
    this.emitDraft();
    return atom;
  }

  /** Șterge un atom din Constructor și îl întoarce în stoc, cu tot ce era legat de el. */
  removeAtomFromDraft(atomId: string): void {
    const graph = this.state.constructorDraft;
    const atom = graph.atoms.find((a) => a.id === atomId);
    if (!atom) return;
    removeGraphAtom(graph, atomId);
    this.state.resources.atoms[atom.element] = (this.state.resources.atoms[atom.element] ?? 0) + 1;
    this.emitResources();
    this.emitDraft();
  }

  /** Golește tot Constructorul, întorcând toți atomii în stoc. */
  clearDraft(): void {
    const graph = this.state.constructorDraft;
    for (const atom of graph.atoms) {
      this.state.resources.atoms[atom.element] = (this.state.resources.atoms[atom.element] ?? 0) + 1;
    }
    this.state.constructorDraft = createMolecule();
    this.emitResources();
    this.emitDraft();
  }

  /** Creează/actualizează o legătură, cu prevenția de valență din §6.2. */
  setBondOrder(aId: string, bId: string, order: 1 | 2 | 3): boolean {
    const graph = this.state.constructorDraft;
    if (aId === bId) return false;
    if (!canSetBondOrder(graph, aId, bId, order)) return false;
    addGraphBond(graph, aId, bId, order);
    this.emitDraft();
    return true;
  }

  moveAtomInDraft(atomId: string, x: number, y: number): void {
    const atom = this.state.constructorDraft.atoms.find((a) => a.id === atomId);
    if (!atom) return;
    atom.x = x;
    atom.y = y;
    this.emitDraft();
  }

  removeBondInDraft(aId: string, bId: string): void {
    removeGraphBond(this.state.constructorDraft, aId, bId);
    this.emitDraft();
  }

  /** Ciclează ordinul unei legături existente: 1→2→3→ștergere (§6.1). */
  cycleBondOrder(aId: string, bId: string): void {
    const graph = this.state.constructorDraft;
    const bond = findBond(graph, aId, bId);
    if (!bond) return;
    const next = bond.order + 1;
    if (next <= 3 && canSetBondOrder(graph, aId, bId, next)) {
      bond.order = next as 1 | 2 | 3;
    } else {
      removeGraphBond(graph, aId, bId);
    }
    this.emitDraft();
  }

  /** Sintetizează molecula din Constructor. Atomii au fost deja rezervați la plasare. */
  synthesizeDraft(): SynthesisResult {
    const graph = this.state.constructorDraft;
    const result = validate(graph);
    if (!result.ok) return { ok: false, reason: result.reason };

    const costs = atomCounts(graph);
    const key = moleculeKey(graph);
    const dbEntry = DB_BY_KEY.get(key);
    const isFirstDiscovery = !this.state.collection[key];

    if (isFirstDiscovery) {
      const sumE = sumGraphBondEnergy(graph);
      const bonusMult = dbEntry?.bonusMult ?? DEFAULT_BONUS_MULT;
      const ePerSecondPerCopy = productionRate(sumE, bonusMult);
      this.state.collection[key] = {
        key,
        formula: result.formula,
        name: dbEntry?.name ?? `Compus ${hillFormula(graph)}`,
        copies: 0,
        discovered: true,
        ePerSecondPerCopy,
        sumBondEnergy: sumE,
        atomsPerCopy: costs,
        flavor: dbEntry?.flavor ?? "O moleculă nouă, în afara bazei de date cunoscute."
      };
      const tier = dbEntry ? dbEntry.tier : 0;
      const gained = dbEntry ? dbEntry.discoveryC : discoveryKnowledge(sumE, tier);
      this.state.resources.knowledge += gained;
    }

    this.state.collection[key].copies += 1;
    this.state.constructorDraft = createMolecule();
    this.emitResources();
    this.emitDraft();
    this.events.emit("collection", key);
    if (isFirstDiscovery) {
      this.events.emit("discovery", { key, dbEntry, formula: result.formula });
    }

    return { ok: true, isFirstDiscovery, dbEntry, formula: result.formula };
  }

  /** Sintetizează N copii dintr-o moleculă deja descoperită, fără reconstrucție manuală. */
  synthesizeFromCollection(key: string, count: number): number {
    const entry = this.state.collection[key];
    if (!entry) return 0;
    let synthesized = 0;
    for (let i = 0; i < count; i++) {
      if (!this.canAffordAtoms(entry.atomsPerCopy)) break;
      for (const [el, n] of Object.entries(entry.atomsPerCopy)) {
        this.state.resources.atoms[el] -= n;
      }
      entry.copies += 1;
      synthesized += 1;
    }
    if (synthesized > 0) {
      this.emitResources();
      this.events.emit("collection", key);
    }
    return synthesized;
  }

  maxSynthesizable(key: string): number {
    const entry = this.state.collection[key];
    if (!entry) return 0;
    let max = Infinity;
    for (const [el, n] of Object.entries(entry.atomsPerCopy)) {
      if (n <= 0) continue;
      const have = this.state.resources.atoms[el] ?? 0;
      max = Math.min(max, Math.floor(have / n));
    }
    return Number.isFinite(max) ? max : 0;
  }

  totalEnergyPerSecond(): number {
    return Object.values(this.state.collection).reduce(
      (sum, entry) => sum + entry.copies * entry.ePerSecondPerCopy,
      0
    );
  }
}

export function productionRate(sumBondEnergyValue: number, bonusMult: number, globalUpgrade = 0): number {
  return K_PROD * Math.pow(sumBondEnergyValue, PRODUCTION_EXPONENT) * bonusMult * (1 + globalUpgrade);
}
