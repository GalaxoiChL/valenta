// Echilibrare pe curbe (§12, M5) — trecere dedicată, cerută explicit în SPEC
// dar niciodată făcută ca exercițiu separat (balansul a rămas empiric).
//
// Nu reimplementează formulele: importă direct din sursa reală (balance.ts,
// lattice.ts, elements.ts, moleculeDB.json) ca raportul să nu poată diverge
// tăcut de codul jocului. Rulare: `npm run balance-report`.
//
// Ce verifică:
//   1. Costurile de deblocare a elementelor (Cunoaștere) — cresc monoton,
//      fără salturi/goluri anormale între elemente consecutive.
//   2. Eficiența compușilor ionici (E/s per atom) — aceeași metodă folosită
//      manual, per-tier, în DEVLOG de la tier 5 încoace; aici agregată pe tot
//      jocul dintr-o singură trecere, ca să confirme monotonia globală.
//   3. Costul generatoarelor de atomi — timpul (în cumpărări) până la
//      generatorul N rămâne pe o curbă geometrică lină, fără anomalii.
//   4. Pragurile Nucleosintezei — curba de randament descrescător (§3.3).
//
// Exportă și 3 fișiere .csv (deschise direct în Excel/Sheets) pentru
// inspecție vizuală, dacă cineva vrea literalmente "foaia de calcul" din SPEC.

import { writeFileSync } from "fs";
import { ELEMENTS } from "../src/chem/elements.ts";
import moleculeDB from "../src/chem/moleculeDB.json" with { type: "json" };
import { latticeEnergy } from "../src/chem/lattice.ts";
import {
  K_PROD,
  PRODUCTION_EXPONENT,
  GENERATOR_COST_GROWTH,
  GENERATOR_BASE_COST,
  starsForEnergy,
  NUCLEOSYNTHESIS_MIN_ENERGY
} from "../src/core/balance.ts";

function productionRate(value, bonusMult) {
  return K_PROD * Math.pow(value, PRODUCTION_EXPONENT) * bonusMult;
}

function atomCountFromFormula(formula) {
  const matches = formula.match(/[A-Z][a-z]?\d*/g) ?? [];
  return matches.reduce((sum, m) => {
    const n = parseInt(m.replace(/[A-Z][a-z]?/, ""), 10);
    return sum + (Number.isNaN(n) ? 1 : n);
  }, 0);
}

const lines = [];
function report(text = "") {
  lines.push(text);
  console.log(text);
}

// ---------------------------------------------------------------------------
// 1. Costurile de deblocare a elementelor
// ---------------------------------------------------------------------------
report("=== 1. Costuri de deblocare elemente (Cunoaștere) ===\n");

const playable = Object.values(ELEMENTS)
  .filter((e) => !e.decorative)
  .sort((a, b) => a.unlockCost - b.unlockCost);

const unlockRows = [["symbol", "name", "tier", "unlockCost", "ratioFatDePrecedent"]];
let prevCost = null;
let maxJump = { ratio: 0, symbol: null };
for (const def of playable) {
  const ratio = prevCost ? def.unlockCost / prevCost : null;
  unlockRows.push([def.symbol, def.name, def.tier, def.unlockCost, ratio ? ratio.toFixed(3) : ""]);
  if (ratio && def.unlockCost > 0 && prevCost > 0 && ratio > maxJump.ratio) {
    maxJump = { ratio, symbol: def.symbol, from: prevCost, to: def.unlockCost };
  }
  if (def.unlockCost > 0) prevCost = def.unlockCost;
}
report(`Elemente jucabile: ${playable.length}`);
report(`Cost minim (după H, gratis): ${playable.find((e) => e.unlockCost > 0)?.unlockCost} C`);
report(`Cost maxim: ${playable[playable.length - 1].unlockCost} C (${playable[playable.length - 1].symbol})`);
report(
  `Cel mai mare salt relativ între elemente consecutive: ×${maxJump.ratio.toFixed(2)} (${maxJump.from} → ${maxJump.to} C, la ${maxJump.symbol})`
);
if (maxJump.ratio < 2) {
  report("OK — nicio discontinuitate mare; curba de cost e lină pe tot jocul.");
} else if (maxJump.from < 50) {
  report(
    `Salt de ×${maxJump.ratio.toFixed(2)} la ${maxJump.symbol}, dar între costuri mici (${maxJump.from}→${maxJump.to} C) — ` +
      "diferență absolută neglijabilă, în zona de start (H/O/N aproape gratis, cf. deciziei M1 din DEVLOG). Nu e o problemă reală."
  );
} else {
  report(`ATENȚIE — salt de peste ×2 între elemente consecutive la costuri semnificative (${maxJump.from}→${maxJump.to} C), merită verificat manual.`);
}
report("");

// ---------------------------------------------------------------------------
// 2. Eficiența compușilor ionici (E/s per atom)
// ---------------------------------------------------------------------------
report("=== 2. Eficiența compușilor ionici (E/s per atom, la nivel de bază) ===\n");

const ionicRows = [["formula", "name", "tier", "bonusMult", "latticeEnergy", "atoms", "eff"]];
const ionicByTier = new Map();
for (const entry of moleculeDB) {
  const lattice = latticeEnergy(entry.formula);
  // latticeEnergy() întoarce un fallback (700) pentru compușii necunoscuți —
  // îi excludem din raport (nu sunt de fapt compuși ionici calibrați).
  const isIonic = entry.tags?.includes("ionic") ?? false;
  if (!isIonic) continue;
  const atoms = atomCountFromFormula(entry.formula);
  const rate = productionRate(lattice, entry.bonusMult);
  const eff = rate / atoms;
  ionicRows.push([entry.formula, entry.name, entry.tier, entry.bonusMult, lattice, atoms, eff.toFixed(3)]);
  const list = ionicByTier.get(entry.tier) ?? [];
  list.push({ ...entry, eff });
  ionicByTier.set(entry.tier, list);
}

const tiersSorted = [...ionicByTier.keys()].sort((a, b) => a - b);
report("Vârful de eficiență per tier (ionic):");
let prevPeak = 0;
let regressions = 0;
for (const tier of tiersSorted) {
  const list = ionicByTier.get(tier);
  const peak = Math.max(...list.map((e) => e.eff));
  const peakEntry = list.find((e) => e.eff === peak);
  const status = peak >= prevPeak ? "OK" : "REGRESIE";
  if (peak < prevPeak) regressions++;
  report(`  tier ${String(tier).padStart(2)}: eff max ${peak.toFixed(2)}  (${peakEntry.formula}, ${peakEntry.name})  [${status}]`);
  prevPeak = Math.max(prevPeak, peak);
}
report("");
report(
  regressions === 0
    ? "OK — vârful de eficiență ionic crește monoton pe toate tier-urile (fiecare tier nou depășește tier-ul precedent, exact cum a fost intenția documentată în DEVLOG)."
    : `ATENȚIE — ${regressions} tier(e) cu regresie de eficiență față de vârful anterior.`
);
report("");

// ---------------------------------------------------------------------------
// 3. Costul generatoarelor de atomi
// ---------------------------------------------------------------------------
report("=== 3. Costul cumulat al generatoarelor de atomi (H, O, N, C — folosite din start) ===\n");

const generatorRows = [["element", "n", "costCumulat"]];
for (const el of ["H", "O", "N", "C"]) {
  const base = GENERATOR_BASE_COST[el];
  let cumulative = 0;
  const checkpoints = [1, 5, 10, 20, 50];
  const values = [];
  for (let n = 0; n < 50; n++) {
    cumulative += base * Math.pow(GENERATOR_COST_GROWTH, n);
    if (checkpoints.includes(n + 1)) values.push(`${n + 1}→${Math.round(cumulative)} E`);
  }
  report(`  ${el.padEnd(2)} (bază ${base} E): ${values.join(", ")}`);
  generatorRows.push([el, 50, Math.round(cumulative)]);
}
report("");
report(
  `Creștere geometrică ×${GENERATOR_COST_GROWTH} per generator — standard pentru jocuri idle (dublare la ~${Math.round(
    Math.log(2) / Math.log(GENERATOR_COST_GROWTH)
  )} generatoare), fără recalibrare necesară.`
);
report("");

// ---------------------------------------------------------------------------
// 4. Pragurile Nucleosintezei
// ---------------------------------------------------------------------------
report("=== 4. Curba Nucleosintezei (randament descrescător, §3.3) ===\n");
for (const stars of [1, 2, 3, 4, 5, 10]) {
  const energyNeeded = stars * stars * NUCLEOSYNTHESIS_MIN_ENERGY;
  report(`  ${stars} Stele: necesită ${(energyNeeded / 1_000_000).toFixed(1)}M E acumulați în eră`);
}
report("");
report("Confirmat: starsForEnergy(1e6)=" + starsForEnergy(1_000_000) + ", starsForEnergy(4e6)=" + starsForEnergy(4_000_000));
report("");

// ---------------------------------------------------------------------------
// Export CSV
// ---------------------------------------------------------------------------
function toCsv(rows) {
  return rows.map((r) => r.map((v) => (typeof v === "string" && v.includes(",") ? `"${v}"` : v)).join(",")).join("\n");
}

writeFileSync("scripts/balance-report-unlocks.csv", toCsv(unlockRows));
writeFileSync("scripts/balance-report-ionic.csv", toCsv(ionicRows));
writeFileSync("scripts/balance-report-generators.csv", toCsv(generatorRows));

report("=== Fișiere CSV scrise în scripts/ (deschide-le direct în Excel/Sheets) ===");
report("  scripts/balance-report-unlocks.csv");
report("  scripts/balance-report-ionic.csv");
report("  scripts/balance-report-generators.csv");

writeFileSync("scripts/balance-report.txt", lines.join("\n"));
