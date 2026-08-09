import type { GameStore } from "../core/state";
import { getElement } from "../chem/elements";
import { attachTooltip } from "./tooltip";

export interface PaletteController {
  getSelected(): string | null;
}

export function renderPalette(container: HTMLElement, store: GameStore): PaletteController {
  let selected: string | null = store.state.unlockedElements[0] ?? null;

  function render(): void {
    container.innerHTML = "";
    const heading = document.createElement("h2");
    heading.textContent = "Paletă";
    container.appendChild(heading);

    for (const symbol of store.state.unlockedElements) {
      const def = getElement(symbol);
      const stock = Math.floor(store.state.resources.atoms[symbol] ?? 0);

      const item = document.createElement("div");
      item.className = "palette-item" + (selected === symbol ? " selected" : "");
      item.addEventListener("click", () => {
        selected = symbol;
        render();
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
      stockEl.className = "stock" + (stock === 0 ? " zero" : "");
      stockEl.textContent = String(stock);

      item.append(circle, name, stockEl);
      container.appendChild(item);
    }
  }

  render();
  store.events.on("resources", render);
  store.events.on("generators", render);

  return {
    getSelected: () => selected
  };
}
