import type { GameStore } from "../core/state";
import { activeObjectives } from "../core/objectives";

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

  function render(): void {
    const active = activeObjectives(store, 3);
    cardsWrap.innerHTML = "";
    if (active.length === 0) {
      cardsWrap.appendChild(doneAll);
      return;
    }
    for (const objective of active) {
      const card = document.createElement("div");
      card.className = "objective-card";
      const desc = document.createElement("div");
      desc.className = "objective-desc";
      desc.textContent = objective.description;
      const meta = document.createElement("div");
      meta.className = "objective-meta";
      const progressText = objective.progress?.(store);
      meta.textContent = `${progressText ? progressText + " · " : ""}+${objective.rewardC} 🧠`;
      card.append(desc, meta);
      cardsWrap.appendChild(card);
    }
  }

  render();
  store.events.on("resources", render);
  store.events.on("collection", render);
  store.events.on("generators", render);
  store.events.on("unlocked", render);
}
