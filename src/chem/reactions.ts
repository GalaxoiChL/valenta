// M7 — Reacții chimice (§7 din SPEC.md): compuși deja din Colecție
// reacționează între ei după ecuații reale, echilibrate. Reactanții se
// potrivesc după formulă (nu graf), ca sistemul să funcționeze uniform
// pentru compuși covalenți ȘI ionici — ionicii nu-și păstrează graful de
// legături după sinteză (vezi CollectionEntry.graph, opțional).

import type { MoleculeGraph } from "./molecule";

export interface ReactionReactant {
  formula: string;
  coef: number;
}

export interface CovalentReactionProduct {
  kind: "covalent";
  /** Redundant cu validate(graph).formula — verificat de tests/reactions.test.ts, păstrat pentru JSON lizibil. */
  formula: string;
  coef: number;
  graph: MoleculeGraph;
}

export interface IonicReactionProduct {
  kind: "ionic";
  coef: number;
  /** Raport deja redus, ex. { Mg: 1, Cl: 2 } pentru MgCl2. */
  ionCounts: Record<string, number>;
}

export type ReactionProduct = CovalentReactionProduct | IonicReactionProduct;

export interface ReactionDefinition {
  id: string;
  name: string;
  reactants: ReactionReactant[];
  products: ReactionProduct[];
  tags: string[];
  flavor: string;
}

/** Câte rulări permit copiile disponibile, per reactant (paralel cu `reactants`). */
export function maxReactionRuns(reactants: ReactionReactant[], availableCopies: number[]): number {
  let max = Infinity;
  reactants.forEach((r, i) => {
    max = Math.min(max, Math.floor((availableCopies[i] ?? 0) / r.coef));
  });
  return Number.isFinite(max) ? Math.max(0, max) : 0;
}
