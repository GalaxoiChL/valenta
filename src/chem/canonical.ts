// M4 — Hash canonic de graf (§5.5): algoritm Morgan simplificat (rafinare
// Weisfeiler-Lehman a "culorilor" nodurilor), folosit pentru a distinge
// izomeri structurali (formulă identică, conectivitate diferită — ex.
// etanol vs dimetil-eter) în identificarea moleculelor din moleculeDB.

import type { MoleculeGraph } from "./molecule";

function neighborsOf(graph: MoleculeGraph, atomId: string): { order: number; other: string }[] {
  const result: { order: number; other: string }[] = [];
  for (const bond of graph.bonds) {
    if (bond.a === atomId) result.push({ order: bond.order, other: bond.b });
    else if (bond.b === atomId) result.push({ order: bond.order, other: bond.a });
  }
  return result;
}

/**
 * Calculează un hash canonic — invariant la ordinea/ID-urile atomilor,
 * sensibil la conectivitatea reală a grafului. Pornește de la o culoare
 * inițială per atom (element + valența folosită), apoi rafinează iterativ
 * combinând culoarea fiecărui atom cu multisetul (ordin, culoarea vecinului)
 * al vecinilor lui, până când numărul de clase distincte se stabilizează
 * (rafinarea Weisfeiler-Lehman standard — Morgan e cazul ei aplicat în chimie).
 */
export function canonicalGraphHash(graph: MoleculeGraph): string {
  if (graph.atoms.length === 0) return "";
  if (graph.atoms.length === 1) return graph.atoms[0].element;

  let colors = new Map<string, string>();
  for (const atom of graph.atoms) {
    const degree = neighborsOf(graph, atom.id).reduce((sum, n) => sum + n.order, 0);
    colors.set(atom.id, `${atom.element}:${degree}`);
  }

  const maxRounds = graph.atoms.length;
  for (let round = 0; round < maxRounds; round++) {
    const next = new Map<string, string>();
    for (const atom of graph.atoms) {
      const signature = neighborsOf(graph, atom.id)
        .map((n) => `${n.order}:${colors.get(n.other)}`)
        .sort()
        .join(",");
      next.set(atom.id, `${colors.get(atom.id)}(${signature})`);
    }
    const distinctBefore = new Set(colors.values()).size;
    const distinctAfter = new Set(next.values()).size;
    colors = next;
    if (distinctAfter <= distinctBefore) break;
  }

  return graph.atoms
    .map((atom) => colors.get(atom.id)!)
    .sort()
    .join("|");
}
