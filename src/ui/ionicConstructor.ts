import type { GameStore } from "../core/state";
import { getElement, ELEMENTS } from "../chem/elements";
import { validateIonicMix, ionicFormula } from "../chem/ionic";
import { toUnicodeSubscript } from "../chem/formula";
import { formatNumber } from "./format";
import { attachTooltip } from "./tooltip";
import { playClick, playSynthesize } from "./sound";

interface IonRow {
  row: HTMLElement;
  stockEl: HTMLElement;
  countEl: HTMLElement;
  minusBtn: HTMLButtonElement;
  plusBtn: HTMLButtonElement;
}

/**
 * M3 — Constructorul Ionic (§5.6, §8.2): UI distinct de graful covalent —
 * o "rețea" de ioni (cationi + anioni) validată prin echilibru de sarcini,
 * nu prin legături desenate. Fiecare ion adăugat rezervă instant un atom
 * din stoc (simetric cu §6.1), la fel ca plasarea unui atom în Constructor.
 */
export function renderIonicConstructor(container: HTMLElement, store: GameStore): void {
  container.innerHTML = "";

  const hint = document.createElement("div");
  hint.className = "ionic-hint";
  hint.textContent =
    "Adaugă ioni cu + / − până la sarcină netă zero (cel puțin un cation și un anion), apoi Sintetizează.";

  const pickerWrap = document.createElement("div");
  pickerWrap.className = "ion-picker";

  const latticeWrap = document.createElement("div");
  latticeWrap.className = "lattice-visual";

  const statusBar = document.createElement("div");
  statusBar.className = "status-bar ionic-status-bar";
  const badge = document.createElement("div");
  badge.className = "state-badge";
  const formulaEl = document.createElement("div");
  formulaEl.className = "formula";
  const messageEl = document.createElement("div");
  messageEl.className = "message";
  const clearBtn = document.createElement("button");
  clearBtn.className = "clear-btn";
  clearBtn.textContent = "Golește";
  const synthBtn = document.createElement("button");
  synthBtn.className = "synthesize";
  synthBtn.textContent = "Sintetizează";
  statusBar.append(badge, formulaEl, messageEl, clearBtn, synthBtn);

  container.append(hint, pickerWrap, latticeWrap, statusBar);

  // mix = câți ioni din fiecare element sunt curent "în tavă", cu atomii deja
  // rezervați din stoc (§6.1) — stare locală UI, nepersistată (simplificare M3).
  const mix: Record<string, number> = {};

  function ionicElements(): string[] {
    return store.state.unlockedElements.filter((s) => (ELEMENTS[s]?.ionicCharge ?? 0) !== 0);
  }

  const rows = new Map<string, IonRow>();

  function ensureRow(symbol: string): IonRow {
    const existing = rows.get(symbol);
    if (existing) return existing;

    const def = getElement(symbol);
    const charge = def.ionicCharge ?? 0;
    const chargeLabel = charge > 0 ? `${symbol}${charge === 1 ? "⁺" : `${charge}⁺`}` : `${symbol}${charge === -1 ? "⁻" : `${Math.abs(charge)}⁻`}`;

    const row = document.createElement("div");
    row.className = "ion-chip";
    const symbolEl = document.createElement("div");
    symbolEl.className = "ion-symbol";
    symbolEl.textContent = chargeLabel;
    symbolEl.style.background = def.color;
    const nameEl = document.createElement("div");
    nameEl.className = "ion-name";
    nameEl.textContent = def.name;
    const stockEl = document.createElement("div");
    stockEl.className = "ion-stock";

    const controls = document.createElement("div");
    controls.className = "ion-controls";
    const minusBtn = document.createElement("button");
    minusBtn.textContent = "−";
    const countEl = document.createElement("span");
    countEl.className = "ion-count";
    const plusBtn = document.createElement("button");
    plusBtn.textContent = "+";

    minusBtn.addEventListener("click", () => {
      if ((mix[symbol] ?? 0) <= 0) return;
      mix[symbol] -= 1;
      if (mix[symbol] === 0) delete mix[symbol];
      store.releaseAtomFromIon(symbol);
      render();
    });
    plusBtn.addEventListener("click", () => {
      if (!store.reserveAtomForIon(symbol)) return;
      mix[symbol] = (mix[symbol] ?? 0) + 1;
      playClick(store);
      render();
    });

    controls.append(minusBtn, countEl, plusBtn);
    row.append(symbolEl, nameEl, stockEl, controls);
    attachTooltip(row, `${def.name} (${def.symbol}) — ion ${charge > 0 ? `${charge}+` : `${charge}`}. ${def.flavor}`);
    pickerWrap.appendChild(row);

    const entry: IonRow = { row, stockEl, countEl, minusBtn, plusBtn };
    rows.set(symbol, entry);
    return entry;
  }

  function clearMix(): void {
    for (const [symbol, count] of Object.entries(mix)) {
      for (let i = 0; i < count; i++) store.releaseAtomFromIon(symbol);
    }
    for (const key of Object.keys(mix)) delete mix[key];
    render();
  }

  clearBtn.addEventListener("click", clearMix);

  synthBtn.addEventListener("click", () => {
    const result = store.synthesizeIonicMix(mix);
    if (result.ok) {
      playSynthesize(store);
      for (const key of Object.keys(mix)) delete mix[key];
      render();
    }
  });

  function renderLattice(): void {
    latticeWrap.innerHTML = "";
    const symbols = Object.keys(mix).filter((s) => mix[s] > 0);
    if (symbols.length === 0) {
      latticeWrap.classList.add("empty");
      return;
    }
    latticeWrap.classList.remove("empty");
    // Vizual decorativ tip "rețea cristalină": pătrățele alternante, ordonate
    // cation-anion-cation-anion..., proporțional cu numărul din mix — nu e
    // un graf de legături (§8.2: "UI distinct... rețea, nu graf").
    const cations = symbols.filter((s) => (getElement(s).ionicCharge ?? 0) > 0);
    const anions = symbols.filter((s) => (getElement(s).ionicCharge ?? 0) < 0);
    const cells: string[] = [];
    const maxCount = Math.max(...symbols.map((s) => mix[s]));
    for (let i = 0; i < maxCount; i++) {
      for (const s of cations) if (i < mix[s]) cells.push(s);
      for (const s of anions) if (i < mix[s]) cells.push(s);
    }
    for (const symbol of cells) {
      const cell = document.createElement("div");
      cell.className = "lattice-cell";
      cell.style.background = getElement(symbol).color;
      cell.textContent = symbol;
      latticeWrap.appendChild(cell);
    }
  }

  function renderStatus(): void {
    const hasAny = Object.values(mix).some((n) => n > 0);
    if (!hasAny) {
      badge.classList.remove("valid", "error");
      badge.textContent = "⚪ goală";
      formulaEl.textContent = "—";
      messageEl.textContent = "";
      synthBtn.disabled = true;
      synthBtn.title = "Adaugă ioni cu +";
      return;
    }

    const result = validateIonicMix(mix);
    badge.classList.remove("valid", "error");
    if (result.ok) {
      formulaEl.textContent = toUnicodeSubscript(result.formula);
      badge.textContent = "🟢 VALID";
      badge.classList.add("valid");
      messageEl.textContent = result.copies > 1 ? `${result.copies} unități-formulă` : "";
      synthBtn.disabled = false;
      synthBtn.title = "";
    } else {
      formulaEl.textContent = toUnicodeSubscript(ionicFormula(mix)) || "—";
      badge.classList.add("error");
      badge.textContent = "🟡 în lucru";
      if (result.reason === "cannot_ionize") {
        messageEl.textContent = "Un element din mix nu poate forma ioni (gaz nobil sau element covalent).";
      } else if (result.reason === "needs_both_signs") {
        messageEl.textContent = "E nevoie de cel puțin un cation (+) și un anion (−).";
      } else {
        messageEl.textContent = `Sarcină netă ${result.netCharge! > 0 ? "+" : ""}${result.netCharge} — nu e neutră încă.`;
      }
      synthBtn.disabled = true;
      synthBtn.title = messageEl.textContent;
    }
  }

  function render(): void {
    for (const symbol of ionicElements()) {
      const def = getElement(symbol);
      const entry = ensureRow(symbol);
      const stock = Math.floor(store.state.resources.atoms[symbol] ?? 0);
      entry.stockEl.textContent = `stoc: ${formatNumber(stock)}`;
      entry.stockEl.classList.toggle("zero", stock === 0);
      entry.countEl.textContent = String(mix[symbol] ?? 0);
      entry.minusBtn.disabled = (mix[symbol] ?? 0) <= 0;
      entry.plusBtn.disabled = stock < 1;
      void def;
    }
    renderLattice();
    renderStatus();
  }

  render();
  store.events.on("resources", render);
  store.events.on("unlocked", render);
}
