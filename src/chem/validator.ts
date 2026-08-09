import type { MoleculeGraph } from "./molecule";
import { usedValence } from "./molecule";
import { getElement } from "./elements";
import { hillFormula } from "./formula";

const MAX_ATOMS = 40;

export type ValidationResult =
  | { ok: true; formula: string }
  | {
      ok: false;
      reason: "empty" | "disconnected" | "unsatisfied" | "toobig";
      details: { atomId: string; missing: number }[];
    };

function isConnected(graph: MoleculeGraph): boolean {
  if (graph.atoms.length <= 1) return true;
  const adjacency = new Map<string, string[]>();
  for (const atom of graph.atoms) adjacency.set(atom.id, []);
  for (const bond of graph.bonds) {
    adjacency.get(bond.a)?.push(bond.b);
    adjacency.get(bond.b)?.push(bond.a);
  }
  const visited = new Set<string>();
  const stack = [graph.atoms[0].id];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of adjacency.get(current) ?? []) {
      if (!visited.has(next)) stack.push(next);
    }
  }
  return visited.size === graph.atoms.length;
}

/** Distanța până la cea mai apropiată valență validă; 0 dacă e deja satisfăcută. */
export function missingForValence(used: number, allowed: number[]): number {
  if (allowed.includes(used)) return 0;
  const higher = allowed.filter((v) => v > used);
  if (higher.length > 0) return Math.min(...higher) - used;
  // depășește toate valențele posibile — stare invalidă, dar nu mai "lipsește" nimic
  return 0;
}

/** Starea de valență a unui atom, pentru badge-urile din UI (§6.3). */
export function valenceStatus(graph: MoleculeGraph, atomId: string): { satisfied: boolean; missing: number } {
  const atom = graph.atoms.find((a) => a.id === atomId);
  if (!atom) return { satisfied: false, missing: 0 };
  const def = getElement(atom.element);
  const used = usedValence(graph, atomId);
  const satisfied = def.valences.includes(used);
  return { satisfied, missing: satisfied ? 0 : missingForValence(used, def.valences) };
}

export function validate(graph: MoleculeGraph): ValidationResult {
  if (graph.atoms.length === 0) {
    return { ok: false, reason: "empty", details: [] };
  }

  if (!isConnected(graph)) {
    return { ok: false, reason: "disconnected", details: [] };
  }

  const details: { atomId: string; missing: number }[] = [];
  for (const atom of graph.atoms) {
    const def = getElement(atom.element);
    const used = usedValence(graph, atom.id);
    if (!def.valences.includes(used)) {
      details.push({ atomId: atom.id, missing: missingForValence(used, def.valences) });
    }
  }
  if (details.length > 0) {
    return { ok: false, reason: "unsatisfied", details };
  }

  if (graph.atoms.length > MAX_ATOMS) {
    return { ok: false, reason: "toobig", details: [] };
  }

  return { ok: true, formula: hillFormula(graph) };
}
