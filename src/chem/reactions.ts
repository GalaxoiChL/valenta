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

/**
 * Găsește reacția a cărei mulțime de formule de reactanți se potrivește
 * exact (ordine irelevantă) cu formulele plasate în sloturi — pentru UI-ul
 * de tip "trage compuși într-o zonă de reacție" (§7.1). null dacă nicio
 * reacție nu se potrivește exact cu setul curent.
 */
export function findReactionByReactantFormulas(
  reactions: ReactionDefinition[],
  formulas: string[]
): ReactionDefinition | null {
  const target = new Set(formulas);
  if (target.size === 0) return null;
  for (const r of reactions) {
    const reactantFormulas = new Set(r.reactants.map((x) => x.formula));
    if (reactantFormulas.size !== target.size) continue;
    if ([...reactantFormulas].every((f) => target.has(f))) return r;
  }
  return null;
}
