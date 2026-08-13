// M7 — Reacții chimice (§7): compuși din Colecție reacționează după ecuații
// reale. Paletă vizuală (structuri reale, nu doar text) + zonă de reacție cu
// drag&drop — tragi compuși în sloturi, jocul recunoaște automat rețeta
// dacă una există. Tiparul overlay urmează periodicTable.ts; drag-ul
// reosește convenția mousedown/mousemove/mouseup deja folosită în
// constructor.ts, nu HTML5 drag&drop nativ (consecvent cu restul codului).

import type { GameStore } from "../core/state";
import type { OverlayController } from "./periodicTable";
import type { MoleculeGraph } from "../chem/molecule";
import type { ReactionDefinition } from "../chem/reactions";
import { findReactionByReactantFormulas } from "../chem/reactions";
import reactionDB from "../chem/reactionDB.json";
import { toUnicodeSubscript } from "../chem/formula";
import { getElement } from "../chem/elements";
import { formatNumber } from "./format";
import { playSynthesize } from "./sound";

const REACTIONS = reactionDB as ReactionDefinition[];
const SVG_NS = "http://www.w3.org/2000/svg";
const SLOT_COUNT = 3;

function equationText(reaction: ReactionDefinition): string {
  const left = reaction.reactants
    .map((r) => `${r.coef > 1 ? r.coef : ""}${toUnicodeSubscript(r.formula)}`)
    .join(" + ");
  const right = reaction.products
    .map((p) => {
      const formula =
        p.kind === "covalent"
          ? p.formula
          : Object.entries(p.ionCounts)
              .map(([s, n]) => s + (n > 1 ? n : ""))
              .join("");
      return `${p.coef > 1 ? p.coef : ""}${toUnicodeSubscript(formula)}`;
    })
    .join(" + ");
  return `${left} → ${right}`;
}

function ionicFormulaOf(ionCounts: Record<string, number>): string {
  return Object.entries(ionCounts)
    .map(([s, n]) => s + (n > 1 ? n : ""))
    .join("");
}

// --- vizual mic al unui compus: structură reală (grafuri covalente) sau grilă tip rețea (ionici, fără graf) ---

function renderMiniGraph(graph: MoleculeGraph): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
  svg.setAttribute("viewBox", "0 0 60 60");
  svg.classList.add("compound-mini-graph");

  const xs = graph.atoms.map((a) => a.x);
  const ys = graph.atoms.map((a) => a.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const w = Math.max(maxX - minX, 1);
  const h = Math.max(maxY - minY, 1);
  const scale = Math.min(42 / w, 42 / h, 9);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const px = (x: number) => 30 + (x - cx) * scale;
  const py = (y: number) => 30 + (y - cy) * scale;

  for (const bond of graph.bonds) {
    const a = graph.atoms.find((x) => x.id === bond.a);
    const b = graph.atoms.find((x) => x.id === bond.b);
    if (!a || !b) continue;
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(px(a.x)));
    line.setAttribute("y1", String(py(a.y)));
    line.setAttribute("x2", String(px(b.x)));
    line.setAttribute("y2", String(py(b.y)));
    line.setAttribute("stroke", "#8a8f9c");
    line.setAttribute("stroke-width", "2");
    svg.appendChild(line);
  }
  for (const atom of graph.atoms) {
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("cx", String(px(atom.x)));
    circle.setAttribute("cy", String(py(atom.y)));
    circle.setAttribute("r", "5.5");
    circle.setAttribute("fill", getElement(atom.element).color);
    circle.setAttribute("stroke", "#0e1420");
    circle.setAttribute("stroke-width", "0.75");
    svg.appendChild(circle);
  }
  return svg;
}

function renderMiniLattice(atomsPerCopy: Record<string, number>): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "compound-mini-lattice";
  for (const [symbol, count] of Object.entries(atomsPerCopy)) {
    for (let i = 0; i < count; i++) {
      const cell = document.createElement("div");
      cell.className = "lattice-cell";
      cell.style.background = getElement(symbol).color;
      cell.textContent = symbol;
      grid.appendChild(cell);
    }
  }
  return grid;
}

function buildCompoundVisual(graph: MoleculeGraph | undefined, atomsPerCopy: Record<string, number>): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "compound-visual";
  wrap.appendChild(graph ? renderMiniGraph(graph) : renderMiniLattice(atomsPerCopy));
  return wrap;
}

export function renderReactionsLab(store: GameStore): OverlayController {
  let paletteQuery = "";
  const slots: (string | null)[] = new Array(SLOT_COUNT).fill(null);
  let dragState: { key: string; ghost: HTMLElement } | null = null;

  const overlay = document.createElement("div");
  overlay.className = "overlay";

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
    "Trage compuși din Colecție în sloturile de mai jos. Dacă între ei există o reacție reală cunoscută, apare automat rețeta.";

  // --- paletă vizuală (Colecție, draggable) ---
  const paletteSearch = document.createElement("input");
  paletteSearch.type = "text";
  paletteSearch.className = "search-input";
  paletteSearch.placeholder = "Caută compus...";
  paletteSearch.addEventListener("input", () => {
    paletteQuery = paletteSearch.value.trim().toLowerCase();
    renderPalette();
  });

  const palette = document.createElement("div");
  palette.className = "compound-palette";

  // --- zona de reacție ---
  const zone = document.createElement("div");
  zone.className = "reaction-zone";
  const slotEls: HTMLElement[] = [];
  for (let i = 0; i < SLOT_COUNT; i++) {
    const slot = document.createElement("div");
    slot.className = "reaction-slot empty";
    slot.textContent = "Trage un compus aici";
    slot.addEventListener("click", () => {
      if (!slots[i]) return;
      slots[i] = null;
      renderZone();
    });
    zone.appendChild(slot);
    slotEls.push(slot);
  }

  const clearZoneBtn = document.createElement("button");
  clearZoneBtn.textContent = "Golește zona";
  clearZoneBtn.addEventListener("click", () => {
    slots.fill(null);
    renderZone();
  });

  const preview = document.createElement("div");
  preview.className = "reaction-preview";

  // --- rețete cunoscute (referință, ca jucătorul să știe ce să încerce) ---
  const recipesToggle = document.createElement("button");
  recipesToggle.className = "recipes-toggle";
  recipesToggle.textContent = "Rețete cunoscute ▾";
  const recipesList = document.createElement("div");
  recipesList.className = "reactions-recipes";
  recipesList.style.display = "none";
  recipesToggle.addEventListener("click", () => {
    const willShow = recipesList.style.display === "none";
    recipesList.style.display = willShow ? "" : "none";
    recipesToggle.textContent = willShow ? "Rețete cunoscute ▴" : "Rețete cunoscute ▾";
  });
  for (const r of REACTIONS) {
    const line = document.createElement("div");
    line.className = "recipe-line";
    line.textContent = equationText(r);
    recipesList.appendChild(line);
  }

  panel.append(header, hint, paletteSearch, palette, zone, clearZoneBtn, preview, recipesToggle, recipesList);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  function close(): void {
    overlay.classList.remove("open");
  }
  function open(): void {
    render();
    overlay.classList.add("open");
  }
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (evt) => {
    if (evt.target === overlay) close();
  });
  document.addEventListener("keydown", (evt) => {
    if (evt.key === "Escape" && overlay.classList.contains("open")) close();
  });

  // --- drag&drop (pointer events, ca în constructor.ts — nu HTML5 DnD nativ) ---

  function startDrag(key: string, evt: MouseEvent): void {
    evt.preventDefault();
    const entry = store.state.collection[key];
    if (!entry || entry.copies < 1) return;
    const ghost = document.createElement("div");
    ghost.className = "compound-drag-ghost";
    ghost.appendChild(buildCompoundVisual(entry.graph, entry.atomsPerCopy));
    document.body.appendChild(ghost);
    dragState = { key, ghost };
    moveGhost(evt.clientX, evt.clientY);
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
  }

  function moveGhost(x: number, y: number): void {
    if (!dragState) return;
    dragState.ghost.style.left = `${x}px`;
    dragState.ghost.style.top = `${y}px`;
  }

  function onDragMove(evt: MouseEvent): void {
    moveGhost(evt.clientX, evt.clientY);
    for (const slot of slotEls) slot.classList.remove("drag-over");
    const target = document.elementFromPoint(evt.clientX, evt.clientY);
    const slotEl = target?.closest(".reaction-slot");
    slotEl?.classList.add("drag-over");
  }

  function onDragEnd(evt: MouseEvent): void {
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", onDragEnd);
    if (!dragState) return;
    const key = dragState.key;
    dragState.ghost.remove();
    dragState = null;
    for (const s of slotEls) s.classList.remove("drag-over");

    const target = document.elementFromPoint(evt.clientX, evt.clientY);
    const slotEl = target?.closest(".reaction-slot") as HTMLElement | null;
    if (!slotEl) return;
    const index = slotEls.indexOf(slotEl);
    if (index === -1) return;

    const existingIndex = slots.indexOf(key);
    if (existingIndex !== -1) slots[existingIndex] = null;
    slots[index] = key;
    renderZone();
  }

  // --- randare paletă ---
  const paletteCards = new Map<string, { card: HTMLElement; label: HTMLElement }>();

  function ensurePaletteCard(key: string): { card: HTMLElement; label: HTMLElement } {
    const existing = paletteCards.get(key);
    if (existing) return existing;
    const entry = store.state.collection[key];
    const card = document.createElement("div");
    card.className = "compound-card";
    card.appendChild(buildCompoundVisual(entry.graph, entry.atomsPerCopy));
    const label = document.createElement("div");
    label.className = "compound-label";
    card.appendChild(label);
    card.addEventListener("mousedown", (evt) => startDrag(key, evt));
    palette.appendChild(card);
    const result = { card, label };
    paletteCards.set(key, result);
    return result;
  }

  function renderPalette(): void {
    const entries = Object.values(store.state.collection);
    const currentKeys = new Set(entries.map((e) => e.key));
    for (const [key, { card }] of paletteCards) {
      if (!currentKeys.has(key)) {
        card.remove();
        paletteCards.delete(key);
      }
    }
    for (const entry of entries) {
      const { card, label } = ensurePaletteCard(entry.key);
      label.textContent = `${toUnicodeSubscript(entry.formula)} ×${formatNumber(entry.copies)}`;
      const haystack = (entry.name + " " + entry.formula).toLowerCase();
      card.classList.toggle("filtered-out", paletteQuery !== "" && !haystack.includes(paletteQuery));
      card.classList.toggle("depleted", entry.copies < 1);
    }
  }

  // --- randare zonă + previzualizare rețetă potrivită ---
  function renderZone(): void {
    for (let i = 0; i < SLOT_COUNT; i++) {
      const slot = slotEls[i];
      const key = slots[i];
      const entry = key ? store.state.collection[key] : undefined;
      slot.innerHTML = "";
      if (!entry) {
        slots[i] = null;
        slot.classList.add("empty");
        slot.textContent = "Trage un compus aici";
        continue;
      }
      slot.classList.remove("empty");
      slot.appendChild(buildCompoundVisual(entry.graph, entry.atomsPerCopy));
      const label = document.createElement("div");
      label.className = "compound-label";
      label.textContent = toUnicodeSubscript(entry.formula);
      slot.appendChild(label);
    }
    renderPreview();
  }

  function renderPreview(): void {
    preview.innerHTML = "";
    const filledKeys = slots.filter((k): k is string => !!k);
    if (filledKeys.length === 0) return;

    const formulas = filledKeys.map((k) => store.state.collection[k].formula);
    const reaction = findReactionByReactantFormulas(REACTIONS, formulas);

    if (!reaction) {
      const msg = document.createElement("div");
      msg.className = "reaction-no-match";
      msg.textContent = "Nicio reacție reală cunoscută cu acești reactanți.";
      preview.appendChild(msg);
      return;
    }

    const reactionKeys = reaction.reactants.map(
      (r) => filledKeys.find((k) => store.state.collection[k].formula === r.formula) ?? null
    );
    const max = store.maxReactionRuns(reaction.id, reactionKeys);

    const eq = document.createElement("div");
    eq.className = "reaction-equation";
    eq.textContent = equationText(reaction);
    preview.appendChild(eq);

    const productsRow = document.createElement("div");
    productsRow.className = "reaction-products";
    for (const p of reaction.products) {
      const card = document.createElement("div");
      card.className = "compound-card product-preview";
      card.appendChild(p.kind === "covalent" ? renderMiniGraph(p.graph) : renderMiniLattice(p.ionCounts));
      const lbl = document.createElement("div");
      lbl.className = "compound-label";
      lbl.textContent = toUnicodeSubscript(p.kind === "covalent" ? p.formula : ionicFormulaOf(p.ionCounts));
      card.appendChild(lbl);
      productsRow.appendChild(card);
    }
    preview.appendChild(productsRow);

    const flavorEl = document.createElement("div");
    flavorEl.className = "flavor";
    flavorEl.textContent = reaction.flavor;
    preview.appendChild(flavorEl);

    const actions = document.createElement("div");
    actions.className = "reaction-actions";
    const btn1 = document.createElement("button");
    btn1.textContent = "×1";
    const btn10 = document.createElement("button");
    btn10.textContent = "×10";
    const btnMax = document.createElement("button");
    btnMax.textContent = "×Max";
    btn1.disabled = max < 1;
    btn10.disabled = max < 10;
    btnMax.disabled = max < 1;
    btn1.addEventListener("click", () => triggerReaction(reaction, reactionKeys, 1));
    btn10.addEventListener("click", () => triggerReaction(reaction, reactionKeys, 10));
    btnMax.addEventListener("click", () => triggerReaction(reaction, reactionKeys, max));
    actions.append(btn1, btn10, btnMax);
    preview.appendChild(actions);

    const status = document.createElement("div");
    status.className = "rate";
    status.textContent = max > 0 ? `disponibil: ${formatNumber(max)} rulări` : "nu ai destule copii încă";
    preview.appendChild(status);
  }

  function triggerReaction(reaction: ReactionDefinition, keys: (string | null)[], n: number): void {
    if (n < 1) return;
    zone.classList.add("reacting");
    const result = store.runReaction(reaction.id, keys, n);
    if (result.ok) playSynthesize(store);
    setTimeout(() => {
      zone.classList.remove("reacting");
      slots.fill(null);
      renderZone();
    }, 420);
  }

  function render(): void {
    renderPalette();
    renderZone();
  }

  render();
  store.events.on("resources", render);
  store.events.on("collection", render);

  return { open, close };
}
