import type { GameStore } from "../core/state";
import { getElement } from "../chem/elements";
import { generatorCost, generatorRate } from "../core/balance";
import { formatNumber, formatRate } from "./format";
import { attachTooltip } from "./tooltip";

type Tab = "generators" | "collection";

interface GeneratorRow {
  row: HTMLElement;
  label: HTMLElement;
  buyBtn: HTMLButtonElement;
  rateEl: HTMLElement;
}

interface CollectionRow {
  row: HTMLElement;
  label: HTMLElement;
  meta: HTMLElement;
  btn1: HTMLButtonElement;
  btn10: HTMLButtonElement;
  btnMax: HTMLButtonElement;
}

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

  const generatorsBody = document.createElement("div");
  const collectionBody = document.createElement("div");
  const emptyCollectionMsg = document.createElement("div");
  emptyCollectionMsg.className = "rate";
  emptyCollectionMsg.textContent = "Nicio moleculă descoperită încă — sintetizează una în Constructor.";

  container.append(heading, tabs, generatorsBody, collectionBody);

  function setTab(next: Tab): void {
    tab = next;
    genTabBtn.classList.toggle("active", tab === "generators");
    colTabBtn.classList.toggle("active", tab === "collection");
    generatorsBody.style.display = tab === "generators" ? "" : "none";
    collectionBody.style.display = tab === "collection" ? "" : "none";
  }
  genTabBtn.addEventListener("click", () => setTab("generators"));
  colTabBtn.addEventListener("click", () => setTab("collection"));

  // --- Generatoare: rânduri create o singură dată per element, apoi doar actualizate ---
  const generatorRows = new Map<string, GeneratorRow>();

  function ensureGeneratorRow(symbol: string): GeneratorRow {
    const existing = generatorRows.get(symbol);
    if (existing) return existing;

    const def = getElement(symbol);
    const row = document.createElement("div");
    row.className = "generator-row";
    const top = document.createElement("div");
    top.className = "top";
    const label = document.createElement("span");
    const buyBtn = document.createElement("button");
    buyBtn.addEventListener("click", () => store.buyGenerator(symbol));
    top.append(label, buyBtn);
    const rateEl = document.createElement("div");
    rateEl.className = "rate";
    row.append(top, rateEl);
    generatorsBody.appendChild(row);

    const entry: GeneratorRow = { row, label, buyBtn, rateEl };
    generatorRows.set(symbol, entry);
    void def;
    return entry;
  }

  function renderGenerators(): void {
    for (const symbol of store.state.unlockedElements) {
      const def = getElement(symbol);
      const owned = store.state.generators[symbol] ?? 0;
      const cost = generatorCost(symbol, owned);
      const rate = generatorRate(owned);
      const { label, buyBtn, rateEl } = ensureGeneratorRow(symbol);

      label.textContent = `${def.symbol} — ${def.name} ×${owned}`;
      buyBtn.textContent = `Cumpără (${formatNumber(cost)} E)`;
      buyBtn.disabled = store.state.resources.energy < cost;
      rateEl.textContent = `${def.symbol}: ${formatRate(rate)}  ·  stoc: ${formatNumber(store.state.resources.atoms[symbol] ?? 0)}`;
    }
  }

  // --- Colecție: la fel, rânduri stabile per cheie de moleculă ---
  const collectionRows = new Map<string, CollectionRow>();

  function ensureCollectionRow(key: string, flavor: string): CollectionRow {
    const existing = collectionRows.get(key);
    if (existing) return existing;

    const row = document.createElement("div");
    row.className = "collection-row";
    const top = document.createElement("div");
    top.className = "top";
    const label = document.createElement("span");
    top.appendChild(label);
    const meta = document.createElement("div");
    meta.className = "meta";
    const actions = document.createElement("div");
    actions.style.marginTop = "6px";
    const btn1 = document.createElement("button");
    btn1.textContent = "×1";
    const btn10 = document.createElement("button");
    btn10.textContent = "×10";
    const btnMax = document.createElement("button");
    btnMax.textContent = "×Max";
    btn1.addEventListener("click", () => store.synthesizeFromCollection(key, 1));
    btn10.addEventListener("click", () => store.synthesizeFromCollection(key, 10));
    btnMax.addEventListener("click", () => store.synthesizeFromCollection(key, store.maxSynthesizable(key)));
    attachTooltip(btnMax, () => `Sintetizează ${store.maxSynthesizable(key)} copii, limitat de stocul de atomi`);
    actions.append(btn1, btn10, btnMax);
    const flavorEl = document.createElement("div");
    flavorEl.className = "flavor";
    flavorEl.textContent = flavor;

    row.append(top, meta, actions, flavorEl);
    collectionBody.appendChild(row);

    const entry: CollectionRow = { row, label, meta, btn1, btn10, btnMax };
    collectionRows.set(key, entry);
    return entry;
  }

  function renderCollection(): void {
    const entries = Object.values(store.state.collection);
    if (entries.length === 0) {
      if (!emptyCollectionMsg.isConnected) collectionBody.appendChild(emptyCollectionMsg);
      return;
    }
    emptyCollectionMsg.remove();

    for (const entry of entries) {
      const { label, meta, btn1, btn10, btnMax } = ensureCollectionRow(entry.key, entry.flavor);
      label.textContent = `${entry.name} — ${entry.formula} ×${entry.copies}`;
      const totalRate = entry.copies * entry.ePerSecondPerCopy;
      meta.textContent = `${formatRate(entry.ePerSecondPerCopy)}/copie · total ${formatRate(totalRate)}`;
      const maxAvailable = store.maxSynthesizable(entry.key);
      btn1.disabled = maxAvailable < 1;
      btn10.disabled = maxAvailable < 10;
      btnMax.disabled = maxAvailable < 1;
    }
  }

  function render(): void {
    renderGenerators();
    renderCollection();
  }

  setTab("generators");
  render();
  store.events.on("resources", render);
  store.events.on("generators", render);
  store.events.on("collection", render);
}
