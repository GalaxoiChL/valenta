// Chei calculate programatic pentru moleculele referențiate direct în cod
// (obiective, teste) — niciodată hardcodate ca literali, ca să nu rămână
// desincronizate silențios dacă algoritmul de hash canonic (canonical.ts)
// se schimbă vreodată din nou.

import { addAtom, addBond, createMolecule } from "./molecule";
import { moleculeKey } from "./formula";

function buildH2O() {
  const graph = createMolecule();
  const h1 = addAtom(graph, "H");
  const o = addAtom(graph, "O");
  const h2 = addAtom(graph, "H");
  addBond(graph, h1.id, o.id, 1);
  addBond(graph, o.id, h2.id, 1);
  return graph;
}

function buildCH4() {
  const graph = createMolecule();
  const c = addAtom(graph, "C");
  for (let i = 0; i < 4; i++) addBond(graph, c.id, addAtom(graph, "H").id, 1);
  return graph;
}

export const H2O_KEY = moleculeKey(buildH2O());
export const CH4_KEY = moleculeKey(buildCH4());
