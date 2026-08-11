import type { GameStore } from "../core/state";
import { formatNumber, formatRate } from "./format";

export interface HudCallbacks {
  onOpenPeriodicTable: () => void;
  onOpenReactionsLab: () => void;
  onOpenSettings: () => void;
}

export function renderHud(container: HTMLElement, store: GameStore, callbacks: HudCallbacks): void {
  container.innerHTML = "";
  container.className = "hud";

  const energy = document.createElement("div");
  energy.className = "stat";
  const knowledge = document.createElement("div");
  knowledge.className = "stat";
  const stars = document.createElement("div");
  stars.className = "stat";
  const spacer = document.createElement("div");
  spacer.className = "spacer";

  const periodicBtn = document.createElement("button");
  periodicBtn.textContent = "Tabel Periodic";
  periodicBtn.addEventListener("click", callbacks.onOpenPeriodicTable);

  const reactionsBtn = document.createElement("button");
  reactionsBtn.textContent = "Reacții";
  reactionsBtn.addEventListener("click", callbacks.onOpenReactionsLab);

  const settingsBtn = document.createElement("button");
  settingsBtn.textContent = "⚙";
  settingsBtn.title = "Setări";
  settingsBtn.addEventListener("click", callbacks.onOpenSettings);

  container.append(energy, knowledge, stars, spacer, periodicBtn, reactionsBtn, settingsBtn);

  function render(): void {
    const rate = store.totalEnergyPerSecond();
    energy.innerHTML = `<span class="icon">⚡</span> ${formatNumber(store.state.resources.energy)} E <span style="opacity:.6">(${formatRate(rate)})</span>`;
    knowledge.innerHTML = `<span class="icon">🧠</span> ${formatNumber(store.state.resources.knowledge)} C`;
    // M5 — Stelele apar în HUD abia după prima Nucleosinteza, ca să nu aglomereze interfața unui jucător nou.
    stars.style.display = store.state.stars > 0 ? "" : "none";
    stars.innerHTML = `<span class="icon">⭐</span> ${store.state.stars}`;
  }

  render();
  store.events.on("resources", render);
}
