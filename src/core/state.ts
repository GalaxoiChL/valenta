import type { Atom, MoleculeGraph } from "../chem/molecule";
import {
  createMolecule,
  cloneMolecule,
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
import { validateIonicMix, ionicFormula } from "../chem/ionic";
import { latticeEnergy } from "../chem/lattice";
import moleculeDB from "../chem/moleculeDB.json";
import reactionDB from "../chem/reactionDB.json";
import type { ReactionDefinition } from "../chem/reactions";
import { maxReactionRuns as computeMaxReactionRuns } from "../chem/reactions";
import mutationDB from "../bio/mutationDB.json";
import type { Base, MutationDefinition } from "../bio/genetics";
import { BASES, matchesMutation, isValidBase } from "../bio/genetics";
import anatomyDB from "../bio/anatomyDB.json";
import { BODY_SYSTEMS, type AnatomyPart } from "../bio/anatomy";
import {
  generatorCost,
  discoveryKnowledge,
  analysisKnowledge,
  generatorSpeedUpgradeCost,
  starsForEnergy,
  DEFAULT_BONUS_MULT,
  K_PROD,
  PRODUCTION_EXPONENT,
  STARTING_ATOMS,
  AUTO_SYNTH_UNLOCK_COST,
  MAX_AUTO_SYNTH_RATE,
  STAR_PRODUCTION_BONUS
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

/** M7 — Reacții chimice (§7): definițiile statice din reactionDB.json, indexate după id. */
const REACTION_BY_ID = new Map<string, ReactionDefinition>(
  (reactionDB as ReactionDefinition[]).map((r) => [r.id, r])
);

/** M8 — ADN/ARN (§8): mutațiile reale cunoscute din mutationDB.json, indexate după id. */
const MUTATION_BY_ID = new Map<string, MutationDefinition>(
  (mutationDB as MutationDefinition[]).map((m) => [m.id, m])
);

/** M9 — Anatomie (§9): părțile din anatomyDB.json, indexate după id. */
const ANATOMY_BY_ID = new Map<string, AnatomyPart>((anatomyDB as AnatomyPart[]).map((p) => [p.id, p]));

/**
 * Resincronizează intrările din Colecție cu moleculeDB.json curent.
 * O moleculă descoperită înainte să fie adăugată în DB rămâne "Compus X" —
 * fără asta, un save vechi nu ar mai afla niciodată numele real al unei
 * molecule adăugate ulterior în baza de date.
 */
export function reconcileCollectionWithDB(state: GameState): void {
  for (const entry of Object.values(state.collection)) {
    // Save-uri pre-M2 nu au câmpul autoSynth — completat aici, singurul loc
    // rulat necondiționat la fiecare încărcare de save (vezi migrate() în save.ts).
    entry.autoSynth = entry.autoSynth ?? { rate: 0, progress: 0 };
    const dbEntry = DB_BY_KEY.get(entry.key);
    if (!dbEntry) continue;
    entry.name = dbEntry.name;
    entry.flavor = dbEntry.flavor;
    entry.ePerSecondPerCopy = productionRate(entry.sumBondEnergy, dbEntry.bonusMult, state.stars * STAR_PRODUCTION_BONUS);
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
  /** M2 — Auto-sintetizator (§7): rate = copii/s țintă, progress = acumulator fracționar. */
  autoSynth: { rate: number; progress: number };
  /** M4 — Grafic original (doar covalent, §6.5) — pentru "Încarcă în Constructor" ca șablon editabil. Absent pentru compuși ionici sau polimeri. */
  graph?: MoleculeGraph;
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
  generatorSpeedLevel: number;
  autoSynthUnlocked: boolean;
  collection: Record<string, CollectionEntry>;
  constructorDraft: MoleculeGraph;
  objectivesDone: string[];
  settings: {
    sound: boolean;
    offlineCap: number;
    autopilot: boolean;
  };
  /** M5 — Nucleosinteza (§3.3): Energie acumulată în era curentă (resetată la fiecare prestige). */
  totalEnergyEarned: number;
  /** M5 — Stele deținute, persistă peste resetări; fiecare dă +STAR_PRODUCTION_BONUS producție globală. */
  stars: number;
  /** M8 — ADN/ARN (§8): secvența curentă editabilă, persistă ca un draft (simetric cu constructorDraft). */
  dnaSequence: string;
  /** M8 — id-urile mutațiilor reale deja "descoperite" prin editare (§8.3), fiecare cu bonus unic de Cunoaștere. */
  geneticsDiscovered: string[];
  /** M9 — id-urile părților din Anatomie deja inspectate (§9.1), fiecare cu bonus unic de Cunoaștere. */
  anatomyDiscovered: string[];
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
    generatorSpeedLevel: 0,
    autoSynthUnlocked: false,
    collection: {},
    constructorDraft: createMolecule(),
    objectivesDone: [],
    settings: { sound: true, offlineCap: 8 * 60 * 60, autopilot: false },
    totalEnergyEarned: 0,
    stars: 0,
    dnaSequence: "",
    geneticsDiscovered: [],
    anatomyDiscovered: []
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

/** M7 — Reacții chimice (§7). */
export interface ReactionRunResult {
  ok: boolean;
  reason?: "unknown_reaction" | "invalid_multiplier" | "reactant_mismatch" | "insufficient_copies";
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

/** M4 — costul brut de atomi pentru n unități-monomer legate într-un lanț (§7). */
function scalePolymerAtoms(atomsPerCopy: Record<string, number>, n: number): Record<string, number> {
  const scaled: Record<string, number> = {};
  for (const [el, count] of Object.entries(atomsPerCopy)) scaled[el] = count * n;
  return scaled;
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

  /** M5 — Bonusul global de producție acumulat din Stele (§3.3): +10% per Stea. */
  globalProductionMultiplier(): number {
    return this.state.stars * STAR_PRODUCTION_BONUS;
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
    if (!def || def.decorative) return false;
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

  /** M2 — Upgrade de viteză a generatoarelor (§7): nivel global, +50% rată per nivel. */
  canBuyGeneratorSpeedUpgrade(): boolean {
    return this.state.resources.energy >= generatorSpeedUpgradeCost(this.state.generatorSpeedLevel);
  }

  buyGeneratorSpeedUpgrade(): boolean {
    if (!this.canBuyGeneratorSpeedUpgrade()) return false;
    this.state.resources.energy -= generatorSpeedUpgradeCost(this.state.generatorSpeedLevel);
    this.state.generatorSpeedLevel += 1;
    this.emitResources();
    this.events.emit("generators");
    return true;
  }

  /** M2 — Automatizare (§7): deblocare unică cu Cunoaștere a auto-sintetizatoarelor. */
  canUnlockAutoSynth(): boolean {
    return !this.state.autoSynthUnlocked && this.state.resources.knowledge >= AUTO_SYNTH_UNLOCK_COST;
  }

  unlockAutoSynth(): boolean {
    if (!this.canUnlockAutoSynth()) return false;
    this.state.resources.knowledge -= AUTO_SYNTH_UNLOCK_COST;
    this.state.autoSynthUnlocked = true;
    this.emitResources();
    this.events.emit("generators");
    return true;
  }

  /** Setează rata (copii/s) de auto-sintetizare pentru o moleculă din Colecție, plafonată. */
  setAutoSynthRate(key: string, rate: number): void {
    const entry = this.state.collection[key];
    if (!entry) return;
    entry.autoSynth.rate = Math.max(0, Math.min(MAX_AUTO_SYNTH_RATE, Math.round(rate)));
    this.events.emit("collection", key);
  }

  /** M2 — Analizatorul (§7): consumă `count` copii, produce Cunoaștere proporțională cu complexitatea. */
  canAnalyze(key: string, count = 1): boolean {
    const entry = this.state.collection[key];
    return !!entry && entry.copies >= count;
  }

  analyzeMolecule(key: string, count = 1): number {
    const entry = this.state.collection[key];
    if (!entry || entry.copies < count) return 0;
    entry.copies -= count;
    const gained = count * analysisKnowledge(entry.sumBondEnergy);
    this.state.resources.knowledge += gained;
    this.emitResources();
    this.events.emit("collection", key);
    return gained;
  }

  /** M3 — Rezervă un atom din stoc pentru mixul ionic (simetric cu placeAtomInDraft, §6.1). */
  reserveAtomForIon(element: string): boolean {
    if ((this.state.resources.atoms[element] ?? 0) < 1) return false;
    this.state.resources.atoms[element] -= 1;
    this.emitResources();
    return true;
  }

  /** Întoarce un atom rezervat pentru mixul ionic înapoi în stoc (Golește / eliminare din mix). */
  releaseAtomFromIon(element: string): void {
    this.state.resources.atoms[element] = (this.state.resources.atoms[element] ?? 0) + 1;
    this.emitResources();
  }

  /**
   * M3 — Sintetizează un compus ionic dintr-un mix de ioni deja rezervați
   * (§5.6): validare prin echilibru de sarcini, nu prin legături desenate.
   * Cheia unui compus ionic e formula însăși (fără sufixul "|ordine" al
   * cheilor covalente din moleculeKey()), deci nu poate coincide niciodată
   * cu o cheie covalentă.
   */
  synthesizeIonicMix(counts: Record<string, number>): SynthesisResult {
    const result = validateIonicMix(counts);
    if (!result.ok) return { ok: false, reason: result.reason };

    const { formula, copies, atomsPerCopy } = result;
    const key = formula;
    const dbEntry = DB_BY_KEY.get(key);
    const isFirstDiscovery = !this.state.collection[key];

    if (isFirstDiscovery) {
      const energyMetric = latticeEnergy(formula);
      const bonusMult = dbEntry?.bonusMult ?? DEFAULT_BONUS_MULT;
      const ePerSecondPerCopy = productionRate(energyMetric, bonusMult, this.globalProductionMultiplier());
      this.state.collection[key] = {
        key,
        formula,
        name: dbEntry?.name ?? `Compus ionic ${formula}`,
        copies: 0,
        discovered: true,
        ePerSecondPerCopy,
        sumBondEnergy: energyMetric,
        atomsPerCopy,
        flavor: dbEntry?.flavor ?? "Un compus ionic nou, în afara bazei de date cunoscute.",
        autoSynth: { rate: 0, progress: 0 }
      };
      const tier = dbEntry ? dbEntry.tier : 3;
      const gained = dbEntry ? dbEntry.discoveryC : discoveryKnowledge(energyMetric, tier);
      this.state.resources.knowledge += gained;
    }

    this.state.collection[key].copies += copies;
    this.emitResources();
    this.events.emit("collection", key);
    if (isFirstDiscovery) {
      this.events.emit("discovery", { key, dbEntry, formula });
    }

    return { ok: true, isFirstDiscovery, dbEntry, formula };
  }

  // --- M7 — Reacții chimice (§7): compuși deja din Colecție reacționează
  // între ei după ecuații reale, statice din reactionDB.json. Reactanții se
  // aleg din Colecție prin cheie exactă (nu doar formulă), la fel ca la
  // re-sinteză (§6.5) — necesar dacă mai mulți izomeri cu aceeași formulă
  // ajung vreodată să coexiste. ---

  listReactions(): ReactionDefinition[] {
    return [...REACTION_BY_ID.values()];
  }

  /**
   * Agregă cererea de copii per cheie aleasă (o cheie poate acoperi mai mulți
   * "sloturi" de reactant, dacă din greșeală/coincidență e aleasă de două
   * ori — defensiv). null dacă alegerea nu se potrivește cu reacția.
   */
  private aggregateReactionDemand(
    reaction: ReactionDefinition,
    reactantKeys: (string | null)[],
    multiplier: number
  ): Map<string, number> | null {
    if (reactantKeys.length !== reaction.reactants.length) return null;
    const demand = new Map<string, number>();
    for (let i = 0; i < reaction.reactants.length; i++) {
      const key = reactantKeys[i];
      if (!key) return null;
      const entry = this.state.collection[key];
      if (!entry || entry.formula !== reaction.reactants[i].formula) return null;
      demand.set(key, (demand.get(key) ?? 0) + reaction.reactants[i].coef * multiplier);
    }
    return demand;
  }

  canRunReaction(reactionId: string, reactantKeys: (string | null)[], multiplier: number): boolean {
    if (!Number.isInteger(multiplier) || multiplier < 1) return false;
    const reaction = REACTION_BY_ID.get(reactionId);
    if (!reaction) return false;
    const demand = this.aggregateReactionDemand(reaction, reactantKeys, multiplier);
    if (!demand) return false;
    for (const [key, need] of demand) {
      if ((this.state.collection[key]?.copies ?? 0) < need) return false;
    }
    return true;
  }

  /** Câte rulări permit copiile din intrările alese, independent de un multiplicator dat (pentru ×Max). */
  maxReactionRuns(reactionId: string, reactantKeys: (string | null)[]): number {
    const reaction = REACTION_BY_ID.get(reactionId);
    if (!reaction) return 0;
    const available = reaction.reactants.map((r, i) => {
      const key = reactantKeys[i];
      const entry = key ? this.state.collection[key] : undefined;
      return entry && entry.formula === r.formula ? entry.copies : 0;
    });
    return computeMaxReactionRuns(reaction.reactants, available);
  }

  runReaction(reactionId: string, reactantKeys: (string | null)[], multiplier: number): ReactionRunResult {
    const reaction = REACTION_BY_ID.get(reactionId);
    if (!reaction) return { ok: false, reason: "unknown_reaction" };
    if (!Number.isInteger(multiplier) || multiplier < 1) return { ok: false, reason: "invalid_multiplier" };
    const demand = this.aggregateReactionDemand(reaction, reactantKeys, multiplier);
    if (!demand) return { ok: false, reason: "reactant_mismatch" };
    for (const [key, need] of demand) {
      if ((this.state.collection[key]?.copies ?? 0) < need) return { ok: false, reason: "insufficient_copies" };
    }

    for (const [key, need] of demand) this.state.collection[key].copies -= need;

    const discoveries: { key: string; dbEntry?: MoleculeDBEntry; formula: string }[] = [];

    for (const p of reaction.products) {
      let key: string;
      let formula: string;
      let energyMetric: number;
      let atomsPerCopy: Record<string, number>;
      let graphForEntry: MoleculeGraph | undefined;

      if (p.kind === "covalent") {
        const result = validate(p.graph);
        if (!result.ok) continue; // conținut greșit în reactionDB.json — defensiv, acoperit de tests/reactions.test.ts
        formula = result.formula;
        key = moleculeKey(p.graph);
        energyMetric = sumGraphBondEnergy(p.graph);
        atomsPerCopy = atomCounts(p.graph);
        graphForEntry = cloneMolecule(p.graph);
      } else {
        formula = ionicFormula(p.ionCounts);
        key = formula;
        energyMetric = latticeEnergy(formula);
        atomsPerCopy = p.ionCounts;
      }

      const dbEntry = DB_BY_KEY.get(key);
      const isFirstDiscovery = !this.state.collection[key];

      if (isFirstDiscovery) {
        const bonusMult = dbEntry?.bonusMult ?? DEFAULT_BONUS_MULT;
        const ePerSecondPerCopy = productionRate(energyMetric, bonusMult, this.globalProductionMultiplier());
        this.state.collection[key] = {
          key,
          formula,
          name: dbEntry?.name ?? `Compus ${formula}`,
          copies: 0,
          discovered: true,
          ePerSecondPerCopy,
          sumBondEnergy: energyMetric,
          atomsPerCopy,
          flavor: dbEntry?.flavor ?? "Un produs de reacție nou, în afara bazei de date cunoscute.",
          autoSynth: { rate: 0, progress: 0 },
          ...(graphForEntry ? { graph: graphForEntry } : {})
        };
        const tier = dbEntry ? dbEntry.tier : p.kind === "covalent" ? 0 : 3;
        this.state.resources.knowledge += dbEntry ? dbEntry.discoveryC : discoveryKnowledge(energyMetric, tier);
        discoveries.push({ key, dbEntry, formula });
      }

      this.state.collection[key].copies += p.coef * multiplier;
    }

    this.emitResources();
    this.events.emit("collection", reactionId);
    for (const d of discoveries) this.events.emit("discovery", d);

    return { ok: true };
  }

  // --- M8 — ADN/ARN (§8): editare liberă, fără cost de atomi/Energie —
  // singurul cârlig cu economia e bonusul de Cunoaștere la prima
  // "descoperire" a uneia dintre mutațiile reale din mutationDB.json. ---

  dnaSequence(): string {
    return this.state.dnaSequence;
  }

  listMutations(): MutationDefinition[] {
    return [...MUTATION_BY_ID.values()];
  }

  setDnaSequence(seq: string): void {
    this.state.dnaSequence = seq.toUpperCase();
    this.events.emit("dna");
    this.checkGeneticDiscoveries();
  }

  cycleDnaBase(index: number): void {
    const seq = this.state.dnaSequence;
    if (index < 0 || index >= seq.length) return;
    const current = seq[index] as Base;
    const next = BASES[(BASES.indexOf(current) + 1) % BASES.length];
    this.state.dnaSequence = seq.slice(0, index) + next + seq.slice(index + 1);
    this.events.emit("dna");
    this.checkGeneticDiscoveries();
  }

  /** Inserție doar la capăt în v1 (§8.5) — ștergerea, mai jos, funcționează oriunde. */
  appendDnaBase(): void {
    this.state.dnaSequence += "A";
    this.events.emit("dna");
    this.checkGeneticDiscoveries();
  }

  deleteDnaBase(index: number): void {
    const seq = this.state.dnaSequence;
    if (index < 0 || index >= seq.length) return;
    this.state.dnaSequence = seq.slice(0, index) + seq.slice(index + 1);
    this.events.emit("dna");
    this.checkGeneticDiscoveries();
  }

  /**
   * Înlocuiește vizibil un segment [start, end) cu o secvență nouă, de orice
   * lungime — o singură bucată dintr-odată, nu bază-cu-bază. Acoperă
   * substituție (lungime egală), ștergere (înlocuire cu ""), inserție la
   * orice poziție (înlocuire mai lungă decât originalul) — depășește
   * restricția din §8.5 M8 v1 ("doar capăt"), fără o mecanică nouă separată:
   * e tot o substituție de segment, doar de lungime variabilă.
   */
  replaceDnaSegment(start: number, end: number, replacement: string): boolean {
    const seq = this.state.dnaSequence;
    if (start < 0 || end > seq.length || start >= end) return false;
    const upper = replacement.toUpperCase();
    if (![...upper].every((ch) => isValidBase(ch))) return false;
    this.state.dnaSequence = seq.slice(0, start) + upper + seq.slice(end);
    this.events.emit("dna");
    this.checkGeneticDiscoveries();
    return true;
  }

  loadMutationExample(id: string): boolean {
    const m = MUTATION_BY_ID.get(id);
    if (!m) return false;
    this.setDnaSequence(m.wildTypeSequence);
    return true;
  }

  private checkGeneticDiscoveries(): void {
    for (const m of MUTATION_BY_ID.values()) {
      if (this.state.geneticsDiscovered.includes(m.id)) continue;
      if (!matchesMutation(this.state.dnaSequence, m)) continue;
      this.state.geneticsDiscovered.push(m.id);
      this.state.resources.knowledge += m.discoveryC;
      this.emitResources();
      // reosește bannerul de descoperire deja existent (main.ts) — aceeași formă {dbEntry, formula}.
      this.events.emit("discovery", { dbEntry: { name: m.name, flavor: m.flavor }, formula: m.shortLabel });
    }
  }

  // --- M9 — Anatomie (§9): explorare liberă, fără cost — singurul cârlig cu
  // economia e bonusul de Cunoaștere la prima inspectare a fiecărei părți. ---

  listAnatomyParts(): AnatomyPart[] {
    return [...ANATOMY_BY_ID.values()];
  }

  /** Marchează o parte ca inspectată (o singură dată acordă Cunoaștere) și o întoarce, sau null dacă id-ul nu există. */
  inspectAnatomyPart(id: string): AnatomyPart | null {
    const part = ANATOMY_BY_ID.get(id);
    if (!part) return null;
    if (!this.state.anatomyDiscovered.includes(id)) {
      this.state.anatomyDiscovered.push(id);
      this.state.resources.knowledge += part.discoveryC;
      this.emitResources();
      // reosește bannerul de descoperire deja existent (main.ts) — aceeași formă {dbEntry, formula}.
      const systemLabel = BODY_SYSTEMS.find((s) => s.id === part.system)?.label ?? part.system;
      this.events.emit("discovery", { dbEntry: { name: part.name, flavor: part.flavor }, formula: systemLabel });
    }
    return part;
  }

  draft(): MoleculeGraph {
    return this.state.constructorDraft;
  }

  setDraft(graph: MoleculeGraph): void {
    this.state.constructorDraft = graph;
    this.emitDraft();
  }

  /**
   * M4 — "Încarcă în Constructor" (§6.5): reconstruiește o moleculă din
   * Colecție ca șablon editabil. Golește draftul curent (întoarce atomii lui
   * în stoc), apoi rezervă din stoc atomii șablonului la fel ca la plasarea
   * manuală (§6.1) — un șablon nu apare "din senin", trebuie să existe stoc.
   * false dacă intrarea nu are graf salvat (compuși ionici/polimeri) sau
   * dacă stocul nu ajunge pentru toți atomii șablonului.
   */
  loadTemplateIntoDraft(key: string): boolean {
    const entry = this.state.collection[key];
    if (!entry?.graph) return false;
    if (!this.canAffordAtoms(entry.atomsPerCopy)) return false;

    this.clearDraft();

    const idMap = new Map<string, string>();
    for (const atom of entry.graph.atoms) {
      const placed = this.placeAtomInDraft(atom.element, atom.x, atom.y);
      if (!placed) {
        // nu ar trebui să se întâmple (canAffordAtoms verificat mai sus), dar defensiv:
        this.clearDraft();
        return false;
      }
      idMap.set(atom.id, placed.id);
    }
    for (const bond of entry.graph.bonds) {
      const a = idMap.get(bond.a);
      const b = idMap.get(bond.b);
      if (!a || !b) continue;
      this.setBondOrder(a, b, bond.order);
    }

    this.events.emit("load-template");
    return true;
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
      const ePerSecondPerCopy = productionRate(sumE, bonusMult, this.globalProductionMultiplier());
      this.state.collection[key] = {
        key,
        formula: result.formula,
        name: dbEntry?.name ?? `Compus ${hillFormula(graph)}`,
        copies: 0,
        discovered: true,
        ePerSecondPerCopy,
        sumBondEnergy: sumE,
        atomsPerCopy: costs,
        flavor: dbEntry?.flavor ?? "O moleculă nouă, în afara bazei de date cunoscute.",
        autoSynth: { rate: 0, progress: 0 },
        graph: cloneMolecule(graph)
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

  /**
   * M4 — Poate un monomer din Colecție fi polimerizat? Necesită graf salvat
   * cu cel puțin o legătură dublă/triplă — semnul clasic al unui monomer de
   * adiție (etenă, stiren...): legătura multiplă se "deschide" pentru a lega
   * unitățile vecine (§7, §5.6).
   */
  canPolymerize(key: string): boolean {
    const entry = this.state.collection[key];
    return !!entry?.graph && entry.graph.bonds.some((b) => b.order >= 2);
  }

  canAffordPolymer(baseKey: string, n: number): boolean {
    const base = this.state.collection[baseKey];
    if (!base) return false;
    return this.canAffordAtoms(scalePolymerAtoms(base.atomsPerCopy, n));
  }

  /**
   * M4 — Unități polimerice repetitive (§7, simplificat): plătește direct
   * n×atomsPerCopy atomi bruți — polimerizarea prin adiție nu pierde/creează
   * atomi, doar rearanjează legăturile (§5.6) — și produce 1 copie a unui
   * compus derivat nou, cu propria intrare în Colecție (compatibilă automat
   * cu re-sinteză/Analizator/auto-sintetizator, la fel ca orice altă intrare).
   */
  polymerize(baseKey: string, n: number): SynthesisResult {
    if (!Number.isInteger(n) || n < 2) return { ok: false, reason: "invalid_n" };
    const base = this.state.collection[baseKey];
    if (!base) return { ok: false, reason: "not_discovered" };
    if (!this.canPolymerize(baseKey)) return { ok: false, reason: "not_polymerizable" };

    const atomsPerCopy = scalePolymerAtoms(base.atomsPerCopy, n);
    if (!this.canAffordAtoms(atomsPerCopy)) return { ok: false, reason: "insufficient_atoms" };

    for (const [el, count] of Object.entries(atomsPerCopy)) {
      this.state.resources.atoms[el] -= count;
    }

    const key = `${baseKey}×${n}`;
    const isFirstDiscovery = !this.state.collection[key];
    if (isFirstDiscovery) {
      const energyMetric = base.sumBondEnergy * n * 0.9;
      const formula = `(${base.formula})${n}`;
      this.state.collection[key] = {
        key,
        formula,
        name: `${base.name} — polimer ×${n}`,
        copies: 0,
        discovered: true,
        ePerSecondPerCopy: productionRate(energyMetric, DEFAULT_BONUS_MULT, this.globalProductionMultiplier()),
        sumBondEnergy: energyMetric,
        atomsPerCopy,
        flavor: `${n} unități de ${base.name} legate într-un lanț polimeric — atomii se rearanjează, nu se pierd (§5.6).`,
        autoSynth: { rate: 0, progress: 0 }
      };
      this.state.resources.knowledge += discoveryKnowledge(energyMetric, 5);
    }

    this.state.collection[key].copies += 1;
    this.emitResources();
    this.events.emit("collection", key);
    if (isFirstDiscovery) {
      this.events.emit("discovery", { key, formula: this.state.collection[key].formula });
    }

    return { ok: true, isFirstDiscovery, formula: this.state.collection[key].formula };
  }

  /**
   * M5 — Nucleosinteza (§3.3): câte Stele NOI ar aduce un reset acum,
   * calculat din Energia acumulată în era curentă (`totalEnergyEarned`,
   * resetată la 0 la fiecare declanșare — nu e un total pe viață).
   */
  pendingStars(): number {
    return starsForEnergy(this.state.totalEnergyEarned);
  }

  canTriggerNucleosynthesis(): boolean {
    return this.pendingStars() >= 1;
  }

  /**
   * M5 — Declanșează Nucleosinteza: reciclează progresul erei curente într-un
   * număr de Stele (permanente, +10% producție globală fiecare). Se păstrează
   * Cunoașterea și elementele deblocate (tematic: elementele grele rămân
   * "forjate"); se resetează tot ce ține de economia activă a erei — Energie,
   * atomi, generatoare, Colecție, obiective — ca bucla de progresie să aibă
   * sens să se rejoace, de data asta mai repede datorită bonusului global.
   * Întoarce numărul de Stele câștigate (0 dacă pragul nu e atins).
   */
  triggerNucleosynthesis(): number {
    const gained = this.pendingStars();
    if (gained < 1) return 0;

    this.state.stars += gained;
    this.state.totalEnergyEarned = 0;
    this.state.resources.energy = 0;
    this.state.resources.atoms = { ...STARTING_ATOMS };
    for (const el of Object.keys(this.state.generators)) this.state.generators[el] = 0;
    this.state.generatorSpeedLevel = 0;
    this.state.autoSynthUnlocked = false;
    this.state.collection = {};
    this.state.constructorDraft = createMolecule();
    this.state.objectivesDone = [];

    this.emitResources();
    this.emitDraft();
    this.events.emit("generators");
    this.events.emit("collection");
    this.events.emit("nucleosynthesis", gained);
    return gained;
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
