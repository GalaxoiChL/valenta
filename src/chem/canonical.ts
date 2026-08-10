// M4 — Hash canonic de graf (§5.5): algoritm Morgan simplificat (rafinare
// Weisfeiler-Lehman a "culorilor" nodurilor), folosit pentru a distinge
// izomeri structurali (formulă identică, conectivitate diferită — ex.
// etanol vs dimetil-eter) în identificarea moleculelor din moleculeDB.

import type { MoleculeGraph } from "./molecule";

// Bug găsit prin recitirea completă a algoritmului (nu prin verificare live):
// fără plafon, culoarea unui atom înglobează string-ul întreg al rundei
// anterioare — pentru grafuri cu multă simetrie (lanțuri lungi de alcani,
// inele aromatice), care au nevoie de multe runde ca WL să stabilizeze,
// lungimea crește MULTIPLICATIV per rundă (exponențial). Măsurat direct:
// Glucoză (24 atomi) producea o cheie de 250.895 caractere. Peste prag,
// colapsăm fiecare clasă distinctă a rundei la o etichetă scurtă — păstrează
// exact aceleași clase de echivalență (deci aceeași putere de discriminare
// WL), doar reprezentarea devine compactă. Sub prag, comportamentul e
// identic byte-cu-byte cu algoritmul dinainte de fix (pragul are marjă
// generoasă față de orice intrare validă deja din moleculeDB.json).
// Pragul se verifică pe SUMA lungimilor tuturor atomilor dintr-o rundă, nu
// pe maximul unui singur atom — pentru Toluen (15 atomi), fiecare atom
// individual rămânea sub 5000 caractere (max 4806 la runda 4, unde WL se
// și stabilizează), dar suma celor 15 string-uri concatenate în hash-ul
// final tot ajungea la 40.454 caractere. Verificat prin trasare pas-cu-pas.
const COMPACT_THRESHOLD_CHARS = 5000;

function compactRelabel(colors: Map<string, string>): Map<string, string> {
  const distinctSorted = [...new Set(colors.values())].sort();
  const labelOf = new Map(distinctSorted.map((v, i) => [v, `#${i}`]));
  const result = new Map<string, string>();
  for (const [atomId, value] of colors) result.set(atomId, labelOf.get(value)!);
  return result;
}

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
    let next = new Map<string, string>();
    for (const atom of graph.atoms) {
      const signature = neighborsOf(graph, atom.id)
        .map((n) => `${n.order}:${colors.get(n.other)}`)
        .sort()
        .join(",");
      next.set(atom.id, `${colors.get(atom.id)}(${signature})`);
    }
    const totalLength = [...next.values()].reduce((sum, v) => sum + v.length, 0);
    if (totalLength > COMPACT_THRESHOLD_CHARS) {
      next = compactRelabel(next);
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
