import type { GameStore } from "../core/state";
import { formatNumber, formatRate } from "./format";

export function renderHud(container: HTMLElement, store: GameStore): void {
  container.innerHTML = "";
  container.className = "hud";

  const energy = document.createElement("div");
  energy.className = "stat";
  const knowledge = document.createElement("div");
  knowledge.className = "stat";
  const spacer = document.createElement("div");
  spacer.className = "spacer";

  container.append(energy, knowledge, spacer);

  function render(): void {
    const rate = store.totalEnergyPerSecond();
    energy.innerHTML = `<span class="icon">⚡</span> ${formatNumber(store.state.resources.energy)} E <span style="opacity:.6">(${formatRate(rate)})</span>`;
    knowledge.innerHTML = `<span class="icon">🧠</span> ${formatNumber(store.state.resources.knowledge)} C`;
  }

  render();
  store.events.on("resources", render);
}
