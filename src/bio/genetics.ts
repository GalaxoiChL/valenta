// M8 — ADN/ARN (§8 din SPEC.md): dogma centrală reală a biologiei
// moleculare — transcriere (ADN→ARNm) și traducere (ARNm→proteină) prin
// codul genetic standard, invariant biologic real, nu inventat.

export type Base = "A" | "T" | "G" | "C";
export const BASES: Base[] = ["A", "T", "G", "C"];

/** Codul genetic standard: codon ARNm (3 baze, cu U) → aminoacid (cod cu 3 litere) sau "STOP". */
const CODON_TABLE: Record<string, string> = {
  UUU: "Phe", UUC: "Phe", UUA: "Leu", UUG: "Leu",
  CUU: "Leu", CUC: "Leu", CUA: "Leu", CUG: "Leu",
  AUU: "Ile", AUC: "Ile", AUA: "Ile", AUG: "Met",
  GUU: "Val", GUC: "Val", GUA: "Val", GUG: "Val",

  UCU: "Ser", UCC: "Ser", UCA: "Ser", UCG: "Ser",
  CCU: "Pro", CCC: "Pro", CCA: "Pro", CCG: "Pro",
  ACU: "Thr", ACC: "Thr", ACA: "Thr", ACG: "Thr",
  GCU: "Ala", GCC: "Ala", GCA: "Ala", GCG: "Ala",

  UAU: "Tyr", UAC: "Tyr", UAA: "STOP", UAG: "STOP",
  CAU: "His", CAC: "His", CAA: "Gln", CAG: "Gln",
  AAU: "Asn", AAC: "Asn", AAA: "Lys", AAG: "Lys",
  GAU: "Asp", GAC: "Asp", GAA: "Glu", GAG: "Glu",

  UGU: "Cys", UGC: "Cys", UGA: "STOP", UGG: "Trp",
  CGU: "Arg", CGC: "Arg", CGA: "Arg", CGG: "Arg",
  AGU: "Ser", AGC: "Ser", AGA: "Arg", AGG: "Arg",
  GGU: "Gly", GGC: "Gly", GGA: "Gly", GGG: "Gly"
};

/** Transcriere (§8.2): catena codantă, T→U, restul neschimbat. */
export function transcribe(dna: string): string {
  return dna.toUpperCase().replace(/T/g, "U");
}

export interface TranslationResult {
  aminoAcids: string[];
  /** Indexul (în codoni) primului STOP întâlnit, sau null dacă nu apare/secvența se termină înainte. */
  stopIndex: number | null;
}

/** Traducere (§8.2): citește codoni de 3 baze de la începutul secvenței, până la primul STOP sau capăt. */
export function translate(mrna: string): TranslationResult {
  const aminoAcids: string[] = [];
  for (let i = 0; i + 3 <= mrna.length; i += 3) {
    const codon = mrna.slice(i, i + 3);
    const aa = CODON_TABLE[codon];
    if (!aa) break; // codon incomplet/necunoscut (nu ar trebui, ADN validat la editare)
    if (aa === "STOP") return { aminoAcids, stopIndex: i / 3 };
    aminoAcids.push(aa);
  }
  return { aminoAcids, stopIndex: null };
}

export function codonAt(mrna: string, codonIndex: number): string | null {
  const start = codonIndex * 3;
  if (start + 3 > mrna.length) return null;
  return mrna.slice(start, start + 3);
}

export function aminoAcidForCodon(codon: string): string | undefined {
  return CODON_TABLE[codon];
}

export type MutationClass = "silent" | "missense" | "nonsense";

/** Clasificarea unei substituții la nivel de codon (§8.1) — ambii codoni trebuie să fie ARNm valid (3 baze). */
export function classifySubstitution(oldCodon: string, newCodon: string): MutationClass | null {
  const oldAA = CODON_TABLE[oldCodon];
  const newAA = CODON_TABLE[newCodon];
  if (!oldAA || !newAA) return null;
  if (newAA === "STOP") return "nonsense";
  if (newAA === oldAA) return "silent";
  return "missense";
}

export function isValidBase(ch: string): ch is Base {
  return ch === "A" || ch === "T" || ch === "G" || ch === "C";
}

/** O secvență și-a pierdut/câștigat cadrul de citire dacă diferența de lungime nu e multiplu de 3 (§8.1). */
export function isFrameshift(originalLength: number, currentLength: number): boolean {
  return (currentLength - originalLength) % 3 !== 0;
}

// --- M8 — Mutații reale cunoscute (§8.3), tipar identic cu ReactionDefinition ---

interface MutationBase {
  id: string;
  name: string;
  shortLabel: string;
  wildTypeSequence: string;
  codonIndex: number;
  discoveryC: number;
  flavor: string;
}

export interface SubstitutionMutation extends MutationBase {
  kind: "substitution";
  mutatedCodon: string;
}

export interface DeletionMutation extends MutationBase {
  kind: "deletion";
  deletedBases: number;
}

export type MutationDefinition = SubstitutionMutation | DeletionMutation;

/** Secvența ADN rezultată dacă mutația s-ar aplica integral peste secvența ei sălbatică (wild-type). */
export function mutatedSequenceFor(m: MutationDefinition): string {
  const start = m.codonIndex * 3;
  if (m.kind === "substitution") {
    return m.wildTypeSequence.slice(0, start) + m.mutatedCodon + m.wildTypeSequence.slice(start + 3);
  }
  return m.wildTypeSequence.slice(0, start) + m.wildTypeSequence.slice(start + m.deletedBases);
}

/** A ajuns secvența curentă a jucătorului exact la forma mutantă cunoscută? */
export function matchesMutation(currentSequence: string, m: MutationDefinition): boolean {
  return currentSequence.toUpperCase() === mutatedSequenceFor(m).toUpperCase();
}
