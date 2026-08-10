// M3 — Chimia ionică (§5.6): validare printr-un mecanic NOU, separat de
// validator.ts — echilibru de sarcini, nu graf de legături. Un mix de ioni
// e valid dacă sarcina netă e zero și conține cel puțin un cation și un anion.

import { getElement } from "./elements";

export type IonicValidationResult =
  | { ok: true; formula: string; copies: number; atomsPerCopy: Record<string, number> }
  | { ok: false; reason: "empty" | "cannot_ionize" | "needs_both_signs" | "not_neutral"; netCharge?: number };

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Formula unui compus ionic: cationii întâi (alfabetic), apoi anionii (alfabetic). */
export function ionicFormula(counts: Record<string, number>): string {
  const symbols = Object.keys(counts).filter((s) => counts[s] > 0);
  const cations = symbols.filter((s) => (getElement(s).ionicCharge ?? 0) > 0).sort();
  const anions = symbols.filter((s) => (getElement(s).ionicCharge ?? 0) < 0).sort();
  return [...cations, ...anions]
    .map((symbol) => symbol + (counts[symbol] > 1 ? String(counts[symbol]) : ""))
    .join("");
}

/**
 * Validează un mix de ioni prin echilibru de sarcini (§5.6), nu prin legături
 * desenate. Reduce raportul la cea mai simplă formă (GCD) — `copies` spune câte
 * unități-formulă complete conține mixul (ex. 2×Na + 2×Cl → formula NaCl, 2 copii).
 */
export function validateIonicMix(counts: Record<string, number>): IonicValidationResult {
  const entries = Object.entries(counts).filter(([, n]) => n > 0);
  if (entries.length === 0) return { ok: false, reason: "empty" };

  let net = 0;
  let hasPositive = false;
  let hasNegative = false;
  for (const [symbol, n] of entries) {
    const charge = getElement(symbol).ionicCharge ?? 0;
    if (charge === 0) return { ok: false, reason: "cannot_ionize" };
    if (charge > 0) hasPositive = true;
    else hasNegative = true;
    net += charge * n;
  }
  if (!hasPositive || !hasNegative) return { ok: false, reason: "needs_both_signs", netCharge: net };
  if (net !== 0) return { ok: false, reason: "not_neutral", netCharge: net };

  const counts_ = entries.map(([, n]) => n);
  const g = counts_.reduce((acc, n) => gcd(acc, n), counts_[0]);
  const atomsPerCopy: Record<string, number> = {};
  for (const [symbol, n] of entries) atomsPerCopy[symbol] = n / g;

  return { ok: true, formula: ionicFormula(atomsPerCopy), copies: g, atomsPerCopy };
}
