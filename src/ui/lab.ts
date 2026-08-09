import type { GameStore } from "../core/state";
import { getElement } from "../chem/elements";
import { generatorCost, generatorRate } from "../core/balance";
import { formatNumber, formatRate } from "./format";
import { attachTooltip } from "./tooltip";

type Tab = "generators" | "collection";

export function renderLab(container: HTMLElement, store: GameStore): void {
  let tab: Tab = "generators";
  container.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = "Laborator";

  const tabs = document.createElement("div");
  tabs.className = "lab-tabs";
  const genTabBtn = document.createElement("button");
  genTabBtn.textContent = "Generatoare";
  const colTabBtn = document.createElement("button");
  colTabBtn.textContent = "Colecție";
  tabs.append(genTabBtn, colTabBtn);

  const body = document.createElement("div");

  container.append(heading, tabs, body);

  function setTab(next: Tab): void {
    tab = next;
    genTabBtn.classList.toggle("active", tab === "generators");
    colTabBtn.classList.toggle("active", tab === "collection");
    render();
  }
  genTabBtn.addEventListener("click", () => setTab("generators"));
  colTabBtn.addEventListener("click", () => setTab("collection"));

  function renderGenerators(): void {
    body.innerHTML = "";
    for (const symbol of store.state.unlockedElements) {
      const def = getElement(symbol);
      const owned = store.state.generators[symbol] ?? 0;
      const cost = generatorCost(symbol, owned);
      const rate = generatorRate(owned);

      const row = document.createElement("div");
      row.className = "generator-row";

      const top = document.createElement("div");
      top.className = "top";
      const label = document.createElement("span");
      label.textContent = `${def.symbol} — ${def.name} ×${owned}`;
      const buyBtn = document.createElement("button");
      buyBtn.textContent = `Cumpără (${formatNumber(cost)} E)`;
      buyBtn.disabled = store.state.resources.energy < cost;
      buyBtn.addEventListener("click", () => store.buyGenerator(symbol));
      top.append(label, buyBtn);

      const rateEl = document.createElement("div");
      rateEl.className = "rate";
      rateEl.textContent = `${def.symbol}: ${formatRate(rate)}  ·  stoc: ${formatNumber(store.state.resources.atoms[symbol] ?? 0)}`;

      row.append(top, rateEl);
      body.appendChild(row);
    }
  }

  function renderCollection(): void {
    body.innerHTML = "";
    const entries = Object.values(store.state.collection);
    if (entries.length === 0) {
      const empty = document.createElement("div");
      empty.className = "rate";
      empty.textContent = "Nicio moleculă descoperită încă — sintetizează una în Constructor.";
      body.appendChild(empty);
      return;
    }

    for (const entry of entries) {
      const row = document.createElement("div");
      row.className = "collection-row";

      const top = document.createElement("div");
      top.className = "top";
      const label = document.createElement("span");
      label.textContent = `${entry.name} — ${entry.formula} ×${entry.copies}`;
      top.appendChild(label);

      const meta = document.createElement("div");
      meta.className = "meta";
      const totalRate = entry.copies * entry.ePerSecondPerCopy;
      meta.textContent = `${formatRate(entry.ePerSecondPerCopy)}/copie · total ${formatRate(totalRate)}`;

      const actions = document.createElement("div");
      actions.style.marginTop = "6px";
      const btn1 = document.createElement("button");
      btn1.textContent = "×1";
      const btn10 = document.createElement("button");
      btn10.textContent = "×10";
      const btnMax = document.createElement("button");
      btnMax.textContent = "×Max";
      const maxAvailable = store.maxSynthesizable(entry.key);
      btn1.disabled = maxAvailable < 1;
      btn10.disabled = maxAvailable < 10;
      btnMax.disabled = maxAvailable < 1;
      btn1.addEventListener("click", () => store.synthesizeFromCollection(entry.key, 1));
      btn10.addEventListener("click", () => store.synthesizeFromCollection(entry.key, 10));
      btnMax.addEventListener("click", () => store.synthesizeFromCollection(entry.key, maxAvailable));
      attachTooltip(btnMax, () => `Sintetizează ${store.maxSynthesizable(entry.key)} copii, limitat de stocul de atomi`);
      actions.append(btn1, btn10, btnMax);

      const flavor = document.createElement("div");
      flavor.className = "flavor";
      flavor.textContent = entry.flavor;

      row.append(top, meta, actions, flavor);
      body.appendChild(row);
    }
  }

  function render(): void {
    if (tab === "generators") renderGenerators();
    else renderCollection();
  }

  setTab("generators");
  store.events.on("resources", render);
  store.events.on("generators", render);
  store.events.on("collection", render);
}
