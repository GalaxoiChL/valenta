import type { GameStore } from "../core/state";
import { ELEMENTS } from "../chem/elements";
import { PERIODIC_LAYOUT, PERIODIC_ROWS, PERIODIC_COLS, type PeriodicSlot } from "../chem/periodicLayout";
import { attachTooltip } from "./tooltip";
import { formatNumber } from "./format";

export interface OverlayController {
  open: () => void;
  close: () => void;
}

export function renderPeriodicTable(store: GameStore): OverlayController {
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.style.display = "none";

  const panel = document.createElement("div");
  panel.className = "overlay-panel periodic-panel";

  const header = document.createElement("div");
  header.className = "overlay-header";
  const title = document.createElement("h2");
  title.textContent = "Tabelul Periodic";
  const closeBtn = document.createElement("button");
  closeBtn.className = "overlay-close";
  closeBtn.textContent = "✕";
  header.append(title, closeBtn);

  const hint = document.createElement("div");
  hint.className = "periodic-hint";
  hint.textContent = "Click pe un element deblocabil (gri, cu cost afișat) ca să-l cumperi cu Cunoaștere.";

  const grid = document.createElement("div");
  grid.className = "periodic-grid";
  grid.style.gridTemplateColumns = `repeat(${PERIODIC_COLS}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${PERIODIC_ROWS}, 1fr)`;

  panel.append(header, hint, grid);
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

  const cells = new Map<string, { cell: HTMLElement; symbolEl: HTMLElement; costEl: HTMLElement }>();

  function ensureCell(slot: PeriodicSlot): void {
    if (cells.has(slot.symbol)) return;
    const def = ELEMENTS[slot.symbol];
    const cell = document.createElement("div");
    cell.className = "periodic-cell";
    cell.style.gridRow = String(slot.row);
    cell.style.gridColumn = String(slot.col);

    if (!def) {
      cell.classList.add("unknown");
      cell.textContent = "?";
      grid.appendChild(cell);
      return;
    }

    const symbolEl = document.createElement("div");
    symbolEl.className = "symbol";
    const costEl = document.createElement("div");
    costEl.className = "cost";
    cell.append(symbolEl, costEl);

    cell.addEventListener("click", () => {
      if (store.unlockElement(slot.symbol)) render();
    });
    attachTooltip(cell, () => {
      const unlocked = store.state.unlockedElements.includes(slot.symbol);
      const base = `${def.name} (${def.symbol}) — valență ${def.valences.join("/")}. ${def.flavor}`;
      return unlocked ? base : `${base} Cost deblocare: ${formatNumber(def.unlockCost)} C.`;
    });

    grid.appendChild(cell);
    cells.set(slot.symbol, { cell, symbolEl, costEl });
  }

  function render(): void {
    for (const slot of PERIODIC_LAYOUT) {
      ensureCell(slot);
      const def = ELEMENTS[slot.symbol];
      if (!def) continue;
      const entry = cells.get(slot.symbol)!;
      const unlocked = store.state.unlockedElements.includes(slot.symbol);
      const affordable = !unlocked && store.canUnlockElement(slot.symbol);
      entry.cell.classList.toggle("unlocked", unlocked);
      entry.cell.classList.toggle("locked", !unlocked);
      entry.cell.classList.toggle("affordable", affordable);
      entry.symbolEl.textContent = def.symbol;
      entry.symbolEl.style.background = unlocked ? def.color : "";
      entry.costEl.textContent = unlocked ? def.name : `${formatNumber(def.unlockCost)} C`;
    }
  }

  render();
  store.events.on("resources", render);
  store.events.on("unlocked", render);

  return { open, close };
}
