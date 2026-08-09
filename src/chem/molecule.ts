export interface Atom {
  id: string;
  element: string;
  x: number;
  y: number;
}

export interface Bond {
  a: string;
  b: string;
  order: 1 | 2 | 3;
}

export interface MoleculeGraph {
  atoms: Atom[];
  bonds: Bond[];
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `a${idCounter}`;
}

export function createMolecule(): MoleculeGraph {
  return { atoms: [], bonds: [] };
}

export function addAtom(graph: MoleculeGraph, element: string, x = 0, y = 0): Atom {
  const atom: Atom = { id: nextId(), element, x, y };
  graph.atoms.push(atom);
  return atom;
}

export function removeAtom(graph: MoleculeGraph, atomId: string): void {
  graph.atoms = graph.atoms.filter((a) => a.id !== atomId);
  graph.bonds = graph.bonds.filter((b) => b.a !== atomId && b.b !== atomId);
}

export function findBond(graph: MoleculeGraph, a: string, b: string): Bond | undefined {
  return graph.bonds.find(
    (bond) => (bond.a === a && bond.b === b) || (bond.a === b && bond.b === a)
  );
}

export function addBond(graph: MoleculeGraph, a: string, b: string, order: 1 | 2 | 3 = 1): Bond {
  if (a === b) throw new Error("Un atom nu se poate lega de el însuși");
  const existing = findBond(graph, a, b);
  if (existing) {
    existing.order = order;
    return existing;
  }
  const bond: Bond = { a, b, order };
  graph.bonds.push(bond);
  return bond;
}

export function removeBond(graph: MoleculeGraph, a: string, b: string): void {
  graph.bonds = graph.bonds.filter(
    (bond) => !((bond.a === a && bond.b === b) || (bond.a === b && bond.b === a))
  );
}

export function usedValence(graph: MoleculeGraph, atomId: string): number {
  return graph.bonds
    .filter((b) => b.a === atomId || b.b === atomId)
    .reduce((sum, b) => sum + b.order, 0);
}

export function neighbors(graph: MoleculeGraph, atomId: string): string[] {
  return graph.bonds
    .filter((b) => b.a === atomId || b.b === atomId)
    .map((b) => (b.a === atomId ? b.b : b.a));
}

export function cloneMolecule(graph: MoleculeGraph): MoleculeGraph {
  return { atoms: graph.atoms.map((a) => ({ ...a })), bonds: graph.bonds.map((b) => ({ ...b })) };
}
