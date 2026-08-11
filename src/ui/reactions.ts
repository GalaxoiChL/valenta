// M7 — Reacții chimice (§7): compuși din Colecție reacționează după ecuații
// reale. UI-ul urmează tiparul overlay deja stabilit (periodicTable.ts) și
// tiparul de căutare + rânduri stabile din lab.ts.

import type { GameStore } from "../core/state";
import type { OverlayController } from "./periodicTable";
import type { ReactionDefinition } from "../chem/reactions";
import reactionDB from "../chem/reactionDB.json";
import { toUnicodeSubscript } from "../chem/formula";
import { formatNumber } from "./format";
import { attachTooltip } from "./tooltip";

const REACTIONS = reactionDB as ReactionDefinition[];

interface ReactionRow {
  row: HTMLElement;
  equation: HTMLElement;
  status: HTMLElement;
  btn1: HTMLButtonElement;
  btn10: HTMLButtonElement;
  btnMax: HTMLButtonElement;
}

/**
 * V1: alege prima intrare din Colecție a cărei formulă se potrivește cu
 * fiecare reactant, în ordine. Niciuna dintre cele 16 reacții din v1 n-are
 * reactanți cu formulă ambiguă (mai mulți izomeri deja descoperiți cu
 * aceeași formulă) — dacă asta se schimbă vreodată, aici e locul de extins
 * cu un selector explicit per slot, nu o presupunere silențioasă.
 */
function pickReactantKeys(store: GameStore, reaction: ReactionDefinition): (string | null)[] {
  return reaction.reactants.map((r) => {
    const match = Object.values(store.state.collection).find((entry) => entry.formula === r.formula);
    return match?.key ?? null;
  });
}

function equationText(reaction: ReactionDefinition): string {
  const left = reaction.reactants
    .map((r) => `${r.coef > 1 ? r.coef : ""}${toUnicodeSubscript(r.formula)}`)
    .join(" + ");
  const right = reaction.products
    .map((p) => {
      const formula = p.kind === "covalent" ? p.formula : Object.entries(p.ionCounts).map(([s, n]) => s + (n > 1 ? n : "")).join("");
      return `${p.coef > 1 ? p.coef : ""}${toUnicodeSubscript(formula)}`;
    })
    .join(" + ");
  return `${left} → ${right}`;
}

export function renderReactionsLab(store: GameStore): OverlayController {
  let query = "";

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.style.display = "none";

  const panel = document.createElement("div");
  panel.className = "overlay-panel reactions-panel";

  const header = document.createElement("div");
  header.className = "overlay-header";
  const title = document.createElement("h2");
  title.textContent = "Reacții";
  const closeBtn = document.createElement("button");
  closeBtn.className = "overlay-close";
  closeBtn.textContent = "✕";
  header.append(title, closeBtn);

  const hint = document.createElement("div");
  hint.className = "periodic-hint";
  hint.textContent =
    "Compuși deja descoperiți în Colecție reacționează după ecuații reale. Reacțiile nerulabile arată clar ce lipsește — nimic ascuns.";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.className = "search-input";
  searchInput.placeholder = "Caută reacție...";
  searchInput.addEventListener("input", () => {
    query = searchInput.value.trim().toLowerCase();
    applyFilter();
  });

  const list = document.createElement("div");
  list.className = "reactions-list";

  panel.append(header, hint, searchInput, list);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  function close(): void {
    overlay.style.display = "none";
  }
  function open(): void {
    render();
    overlay.style.display = "flex";
  }
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (evt) => {
    if (evt.target === overlay) close();
  });
  document.addEventListener("keydown", (evt) => {
    if (evt.key === "Escape" && overlay.style.display !== "none") close();
  });

  const rows = new Map<string, ReactionRow>();

  function ensureRow(reaction: ReactionDefinition): ReactionRow {
    const existing = rows.get(reaction.id);
    if (existing) return existing;

    const row = document.createElement("div");
    row.className = "collection-row reaction-row";

    const top = document.createElement("div");
    top.className = "top";
    const label = document.createElement("span");
    label.textContent = reaction.name;
    top.appendChild(label);

    const equation = document.createElement("div");
    equation.className = "rate";
    equation.textContent = equationText(reaction);

    const status = document.createElement("div");
    status.className = "rate";

    const actions = document.createElement("div");
    actions.style.marginTop = "6px";
    const btn1 = document.createElement("button");
    btn1.textContent = "×1";
    const btn10 = document.createElement("button");
    btn10.textContent = "×10";
    const btnMax = document.createElement("button");
    btnMax.textContent = "×Max";
    btn1.addEventListener("click", () => store.runReaction(reaction.id, pickReactantKeys(store, reaction), 1));
    btn10.addEventListener("click", () => store.runReaction(reaction.id, pickReactantKeys(store, reaction), 10));
    btnMax.addEventListener("click", () => {
      const keys = pickReactantKeys(store, reaction);
      const max = store.maxReactionRuns(reaction.id, keys);
      if (max > 0) store.runReaction(reaction.id, keys, max);
    });
    attachTooltip(btnMax, () => `Rulează ${store.maxReactionRuns(reaction.id, pickReactantKeys(store, reaction))} de ori, limitat de copiile disponibile`);
    actions.append(btn1, btn10, btnMax);

    const flavorEl = document.createElement("div");
    flavorEl.className = "flavor";
    flavorEl.textContent = reaction.flavor;

    row.append(top, equation, status, actions, flavorEl);
    list.appendChild(row);

    const entry: ReactionRow = { row, equation, status, btn1, btn10, btnMax };
    rows.set(reaction.id, entry);
    return entry;
  }

  function missingText(store: GameStore, reaction: ReactionDefinition, keys: (string | null)[]): string | null {
    for (let i = 0; i < reaction.reactants.length; i++) {
      const r = reaction.reactants[i];
      const key = keys[i];
      const have = key ? (store.state.collection[key]?.copies ?? 0) : 0;
      if (have < r.coef) {
        return `lipsește: ${toUnicodeSubscript(r.formula)} (ai ${formatNumber(have)}, ai nevoie de ${formatNumber(r.coef)})`;
      }
    }
    return null;
  }

  function applyFilter(): void {
    for (const [id, { row }] of rows) {
      const reaction = REACTIONS.find((r) => r.id === id)!;
      const haystack = (reaction.name + " " + reaction.tags.join(" ") + " " + equationText(reaction)).toLowerCase();
      row.classList.toggle("filtered-out", query !== "" && !haystack.includes(query));
    }
  }

  function render(): void {
    for (const reaction of REACTIONS) {
      const { equation, status, btn1, btn10, btnMax } = ensureRow(reaction);
      equation.textContent = equationText(reaction);

      const keys = pickReactantKeys(store, reaction);
      const missing = missingText(store, reaction, keys);
      const max = store.maxReactionRuns(reaction.id, keys);

      status.textContent = missing ?? `disponibil: ${formatNumber(max)} rulări`;
      btn1.disabled = max < 1;
      btn10.disabled = max < 10;
      btnMax.disabled = max < 1;
    }
    applyFilter();
  }

  render();
  store.events.on("resources", render);
  store.events.on("collection", render);

  return { open, close };
}
