// Energii de legătură (kJ/mol), rotunjite. Cheia = simboluri sortate alfabetic + ordinul.
// Sursă: §5.4 din SPEC.md.

type BondKey = `${string}-${string}-${1 | 2 | 3}`;

function bondKey(a: string, b: string, order: 1 | 2 | 3): BondKey {
  const [x, y] = [a, b].sort();
  return `${x}-${y}-${order}`;
}

const BOND_ENERGIES: Partial<Record<BondKey, number>> = {
  [bondKey("H", "H", 1)]: 436,
  [bondKey("H", "O", 1)]: 463,
  [bondKey("O", "O", 2)]: 498,
  [bondKey("N", "N", 3)]: 945,
  [bondKey("H", "Cl", 1)]: 431,
  [bondKey("C", "Cl", 1)]: 328,
  [bondKey("C", "C", 1)]: 348,
  [bondKey("C", "C", 2)]: 614,
  [bondKey("C", "C", 3)]: 839,
  [bondKey("C", "H", 1)]: 413,
  [bondKey("C", "O", 1)]: 358,
  [bondKey("C", "O", 2)]: 799,
  [bondKey("C", "N", 1)]: 293,
  [bondKey("C", "N", 3)]: 891,
  [bondKey("N", "O", 1)]: 201,
  [bondKey("N", "O", 2)]: 607,
  [bondKey("H", "N", 1)]: 391,
  [bondKey("H", "F", 1)]: 565,
  [bondKey("Cl", "Cl", 1)]: 242,
  // F-F e neobișnuit de slabă (respingerea perechilor de electroni neparticipanți
  // de pe cei doi atomi mici, vecini) — de-asta fluorul e atât de reactiv: rupe
  // ușor propria legătură. Valoare reală, nu o simplificare a modelului.
  [bondKey("F", "F", 1)]: 159,
  // M6 — Fosfor (PH3, P4, H3PO4) și C=N (necesar pentru Adenină, §8.2 tier 5).
  [bondKey("P", "H", 1)]: 322,
  [bondKey("P", "O", 1)]: 335,
  [bondKey("P", "O", 2)]: 544,
  [bondKey("P", "P", 1)]: 201,
  [bondKey("C", "N", 2)]: 615
};

// Medie brută per element, folosită doar pentru fallback (§5.4).
const AVERAGE_BOND_ENERGY: Record<string, number> = {
  H: 430,
  O: 480,
  N: 500,
  C: 500,
  Cl: 380,
  S: 350,
  F: 400
};

export function bondEnergy(a: string, b: string, order: 1 | 2 | 3): number {
  const known = BOND_ENERGIES[bondKey(a, b, order)];
  if (known !== undefined) return known;
  const avgA = AVERAGE_BOND_ENERGY[a] ?? 400;
  const avgB = AVERAGE_BOND_ENERGY[b] ?? 400;
  return 0.9 * ((avgA + avgB) / 2) * order;
}
