import type { GameStore } from "../core/state";
import { formatNumber, formatRate } from "./format";

export interface HudCallbacks {
  onOpenPeriodicTable: () => void;
  onOpenReactionsLab: () => void;
  onOpenGeneticsLab: () => void;
  onOpenAnatomyLab: () => void;
  onOpenSettings: () => void;
}

// A2 — count-up: constanta de timp a interpolării exponențiale. Suficient de
// mică încât un salt mare (×Max, offline, autopilot) se vede "așezat" în sub
// o secundă, dar suficient de mare încât venitul continuu (10 ticks/s) nu
// pare că sare brusc.
const SMOOTH_TAU_MS = 200;

function createSmoother(initial: number) {
  let displayed = initial;
  let target = initial;
  return {
    setTarget(v: number): void {
      target = v;
    },
    step(dtMs: number): number {
      if (dtMs > 0) {
        displayed += (target - displayed) * (1 - Math.exp(-dtMs / SMOOTH_TAU_MS));
        const epsilon = Math.max(0.01, Math.abs(target) * 0.0005);
        if (Math.abs(target - displayed) < epsilon) displayed = target;
      }
      return displayed;
    },
    settled(): boolean {
      return displayed === target;
    }
  };
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

  const geneticsBtn = document.createElement("button");
  geneticsBtn.textContent = "ADN/ARN";
  geneticsBtn.addEventListener("click", callbacks.onOpenGeneticsLab);

  const anatomyBtn = document.createElement("button");
  anatomyBtn.textContent = "Anatomie";
  anatomyBtn.addEventListener("click", callbacks.onOpenAnatomyLab);

  const settingsBtn = document.createElement("button");
  settingsBtn.textContent = "⚙";
  settingsBtn.title = "Setări";
  settingsBtn.addEventListener("click", callbacks.onOpenSettings);

  // B7 — grupare vizuală Chimie (Tabel Periodic/Reacții) vs Biologie
  // (ADN-ARN/Anatomie), separate printr-un chenar subțire — bara nu mai
  // crește ca un șir plat pe măsură ce se adaugă module noi.
  const chemGroup = document.createElement("div");
  chemGroup.className = "hud-group";
  chemGroup.append(periodicBtn, reactionsBtn);

  const bioGroup = document.createElement("div");
  bioGroup.className = "hud-group hud-group-bio";
  bioGroup.append(geneticsBtn, anatomyBtn);

  container.append(energy, knowledge, stars, spacer, chemGroup, bioGroup, settingsBtn);

  const energySmoother = createSmoother(store.state.resources.energy);
  const knowledgeSmoother = createSmoother(store.state.resources.knowledge);
  const starsSmoother = createSmoother(store.state.stars);

  function paint(eVal: number, kVal: number, sVal: number): void {
    const rate = store.totalEnergyPerSecond();
    const eText = `<span class="icon">⚡</span> ${formatNumber(eVal)} E <span style="opacity:.6">(${formatRate(rate)})</span>`;
    if (energy.innerHTML !== eText) energy.innerHTML = eText;
    const kText = `<span class="icon">🧠</span> ${formatNumber(kVal)} C`;
    if (knowledge.innerHTML !== kText) knowledge.innerHTML = kText;
    // M5 — Stelele apar în HUD abia după prima Nucleosinteza, ca să nu aglomereze interfața unui jucător nou.
    stars.style.display = store.state.stars > 0 ? "" : "none";
    const sText = `<span class="icon">⭐</span> ${Math.round(sVal)}`;
    if (stars.innerHTML !== sText) stars.innerHTML = sText;
  }

  let rafId: number | null = null;
  let lastFrame = 0;

  function frame(now: number): void {
    const dt = lastFrame ? now - lastFrame : 16;
    lastFrame = now;
    const eVal = energySmoother.step(dt);
    const kVal = knowledgeSmoother.step(dt);
    const sVal = starsSmoother.step(dt);
    paint(eVal, kVal, sVal);
    if (!energySmoother.settled() || !knowledgeSmoother.settled() || !starsSmoother.settled()) {
      rafId = requestAnimationFrame(frame);
    } else {
      rafId = null;
      lastFrame = 0;
    }
  }

  function ensureLoop(): void {
    if (rafId !== null) return;
    lastFrame = 0;
    rafId = requestAnimationFrame(frame);
  }

  function onResources(): void {
    energySmoother.setTarget(store.state.resources.energy);
    knowledgeSmoother.setTarget(store.state.resources.knowledge);
    starsSmoother.setTarget(store.state.stars);
    ensureLoop();
  }

  paint(store.state.resources.energy, store.state.resources.knowledge, store.state.stars);
  store.events.on("resources", onResources);
}
