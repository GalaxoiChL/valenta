import type { GameStore } from "../core/state";
import { activeObjectives } from "../core/objectives";
import { playObjectiveComplete } from "./sound";

export function renderObjectives(container: HTMLElement, store: GameStore): void {
  container.innerHTML = "";
  container.className = "objectives-bar";

  const heading = document.createElement("div");
  heading.className = "objectives-heading";
  heading.textContent = "Obiective";
  container.appendChild(heading);

  const cardsWrap = document.createElement("div");
  cardsWrap.className = "objectives-cards";
  container.appendChild(cardsWrap);

  const doneAll = document.createElement("div");
  doneAll.className = "objectives-done-all";
  doneAll.textContent = "Toate obiectivele curente sunt îndeplinite — bravo!";

  // A4 — rânduri create o singură dată per obiectiv, apoi doar actualizate;
  // înainte, render() rescria tot cardsWrap.innerHTML la fiecare "resources"
  // (10x/s), exact bug-ul de perf reparat în M0 la Lab/Paletă.
  const cardRows = new Map<string, { card: HTMLElement; meta: HTMLElement }>();

  function ensureObjectiveCard(id: string, description: string): { card: HTMLElement; meta: HTMLElement } {
    const existing = cardRows.get(id);
    if (existing) return existing;
    const card = document.createElement("div");
    card.className = "objective-card";
    const desc = document.createElement("div");
    desc.className = "objective-desc";
    desc.textContent = description;
    const meta = document.createElement("div");
    meta.className = "objective-meta";
    card.append(desc, meta);
    const entry = { card, meta };
    cardRows.set(id, entry);
    return entry;
  }

  function render(): void {
    const active = activeObjectives(store, 3);
    const currentIds = new Set(active.map((o) => o.id));
    for (const [id, entry] of cardRows) {
      if (!currentIds.has(id)) {
        entry.card.remove();
        cardRows.delete(id);
      }
    }
    if (active.length === 0) {
      if (!doneAll.isConnected) cardsWrap.appendChild(doneAll);
      return;
    }
    doneAll.remove();
    for (const objective of active) {
      const { card, meta } = ensureObjectiveCard(objective.id, objective.description);
      const progressText = objective.progress?.(store);
      meta.textContent = `${progressText ? progressText + " · " : ""}+${objective.rewardC} 🧠`;
      cardsWrap.appendChild(card); // re-parentarea unui nod deja atașat îl reordonează, gratis
    }
  }

  render();
  store.events.on("resources", render);
  store.events.on("collection", render);
  store.events.on("generators", render);
  store.events.on("unlocked", render);
  store.events.on("objective-done", () => playObjectiveComplete(store));
}
