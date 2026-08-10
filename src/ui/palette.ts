import type { GameStore } from "../core/state";
import { getElement } from "../chem/elements";
import { attachTooltip } from "./tooltip";

export interface PaletteController {
  getSelected(): string | null;
}

interface PaletteItem {
  item: HTMLElement;
  stockEl: HTMLElement;
}

/** Elemente care pot fi plasate în Constructorul covalent — exclude elementele
 * fără nicio valență (ex. Na, M3: ionic-doar, vezi ionicConstructor.ts). */
function covalentCapable(store: GameStore): string[] {
  return store.state.unlockedElements.filter((s) => getElement(s).valences.length > 0);
}

export function renderPalette(container: HTMLElement, store: GameStore): PaletteController {
  let selected: string | null = covalentCapable(store)[0] ?? null;
  let query = "";

  container.innerHTML = "";
  const heading = document.createElement("h2");
  heading.textContent = "Paletă";
  container.appendChild(heading);

  // Căutare (§10: cu zeci de elemente deblocate, un scroll lung fără filtru
  // devine impracticabil — găsește după nume sau simbol, nu case-sensitive).
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.className = "search-input";
  searchInput.placeholder = "Caută element...";
  searchInput.addEventListener("input", () => {
    query = searchInput.value.trim().toLowerCase();
    applyFilter();
  });
  container.appendChild(searchInput);

  const items = new Map<string, PaletteItem>();

  function applyFilter(): void {
    for (const [symbol, { item }] of items) {
      const def = getElement(symbol);
      const matches = query === "" || def.name.toLowerCase().includes(query) || symbol.toLowerCase().includes(query);
      item.classList.toggle("filtered-out", !matches);
    }
  }

  function ensureItem(symbol: string): PaletteItem {
    const existing = items.get(symbol);
    if (existing) return existing;

    const def = getElement(symbol);
    const item = document.createElement("div");
    item.className = "palette-item";
    item.addEventListener("click", () => {
      selected = symbol;
      updateSelection();
    });
    attachTooltip(item, `${def.name} (${def.symbol}) — valență ${def.valences.join("/")}. ${def.flavor}`);

    const circle = document.createElement("div");
    circle.className = "symbol";
    circle.style.background = def.color;
    circle.textContent = def.symbol;

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = def.name;

    const stockEl = document.createElement("div");
    stockEl.className = "stock";

    item.append(circle, name, stockEl);
    container.appendChild(item);

    const entry: PaletteItem = { item, stockEl };
    items.set(symbol, entry);
    return entry;
  }

  function updateSelection(): void {
    for (const [symbol, { item }] of items) {
      item.classList.toggle("selected", selected === symbol);
    }
  }

  function render(): void {
    for (const symbol of covalentCapable(store)) {
      const { stockEl } = ensureItem(symbol);
      const stock = Math.floor(store.state.resources.atoms[symbol] ?? 0);
      stockEl.textContent = String(stock);
      stockEl.classList.toggle("zero", stock === 0);
    }
    updateSelection();
    applyFilter();
  }

  render();
  store.events.on("resources", render);
  store.events.on("generators", render);

  return {
    getSelected: () => selected
  };
}
