import type { MoleculeGraph } from "./molecule";

const SUBSCRIPT_DIGITS: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉"
};

function countByElement(graph: MoleculeGraph): Map<string, number> {
  const counts = new Map<string, number>();
  for (const atom of graph.atoms) {
    counts.set(atom.element, (counts.get(atom.element) ?? 0) + 1);
  }
  return counts;
}

/**
 * Formula Hill: dacă e prezent carbon, ordinea e C, H, apoi restul alfabetic;
 * altfel toate elementele (inclusiv H) sunt alfabetice.
 */
export function hillFormula(graph: MoleculeGraph): string {
  const counts = countByElement(graph);
  const hasCarbon = counts.has("C");
  const symbols = [...counts.keys()];

  let ordered: string[];
  if (hasCarbon) {
    const rest = symbols.filter((s) => s !== "C" && s !== "H").sort();
    ordered = ["C", ...(counts.has("H") ? ["H"] : []), ...rest];
  } else {
    ordered = symbols.sort();
  }

  return ordered.map((symbol) => symbol + formatCount(counts.get(symbol)!)).join("");
}

function formatCount(n: number): string {
  return n === 1 ? "" : String(n);
}

export function toUnicodeSubscript(formula: string): string {
  return formula.replace(/\d/g, (digit) => SUBSCRIPT_DIGITS[digit] ?? digit);
}

/**
 * Cheia de identificare pentru baza de date de molecule (MVP, §5.5):
 * formulă + multiset-ul ordinelor de legătură, sortat crescător.
 */
export function moleculeKey(graph: MoleculeGraph): string {
  const orders = graph.bonds.map((b) => b.order).sort((a, b) => a - b);
  return `${hillFormula(graph)}|${orders.join(",")}`;
}
