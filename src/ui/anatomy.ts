// M9 v2 — Anatomie (§9): explorator vizual al corpului uman, cu ilustrații
// reale (Wikimedia Commons) ca fundal pe sistem și hotspot-uri invizibile
// suprapuse. Rescris în urma feedback-ului direct: siluetele desenate manual
// din v1 erau sub nivelul de ambiție cerut. Tipar overlay identic cu
// reactions.ts/genetics.ts; comutatorul de sisteme reosește clasa .mode-tabs.

import type { GameStore } from "../core/state";
import type { OverlayController } from "./periodicTable";
import { BODY_SYSTEMS, type BodySystem, type AnatomyPart } from "../bio/anatomy";

export function renderAnatomyLab(store: GameStore): OverlayController {
  let activeSystem: BodySystem = "skeletal";
  const parts = store.listAnatomyParts();

  const overlay = document.createElement("div");
  overlay.className = "overlay overlay-bio";

  const panel = document.createElement("div");
  panel.className = "overlay-panel anatomy-panel";

  const header = document.createElement("div");
  header.className = "overlay-header";
  const title = document.createElement("h2");
  title.textContent = "Anatomie";
  const closeBtn = document.createElement("button");
  closeBtn.className = "overlay-close";
  closeBtn.textContent = "✕";
  header.append(title, closeBtn);

  const hint = document.createElement("div");
  hint.className = "periodic-hint";
  hint.textContent =
    "Ilustrații anatomice reale — click pe un punct marcat pentru numele și un fapt real. Comută sistemul cu tab-urile de mai jos.";

  const tabs = document.createElement("div");
  tabs.className = "mode-tabs";
  const tabBtns = new Map<BodySystem, HTMLButtonElement>();
  for (const sys of BODY_SYSTEMS) {
    const btn = document.createElement("button");
    btn.textContent = sys.label;
    btn.addEventListener("click", () => setSystem(sys.id));
    tabs.appendChild(btn);
    tabBtns.set(sys.id, btn);
  }

  const stage = document.createElement("div");
  stage.className = "anatomy-stage";
  const bgImage = document.createElement("img");
  bgImage.className = "anatomy-bg";
  bgImage.alt = "";
  const hotspotsLayer = document.createElement("div");
  hotspotsLayer.className = "anatomy-hotspots";
  stage.append(bgImage, hotspotsLayer);

  const credit = document.createElement("div");
  credit.className = "anatomy-credit";

  const infoPanel = document.createElement("div");
  infoPanel.className = "anatomy-info";
  infoPanel.textContent = "Click pe un punct marcat pe ilustrație ca să afli ce e.";

  panel.append(header, hint, tabs, stage, credit, infoPanel);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  function close(): void {
    overlay.classList.remove("open");
  }
  function open(): void {
    overlay.classList.add("open");
  }
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (evt) => {
    if (evt.target === overlay) close();
  });
  document.addEventListener("keydown", (evt) => {
    if (evt.key === "Escape" && overlay.classList.contains("open")) close();
  });

  function showInfo(part: AnatomyPart): void {
    infoPanel.innerHTML = `<strong>${part.name}</strong><div class="flavor">${part.flavor}</div>`;
  }

  // A4 — hotspot-urile (statice pe durata de viață a modulului: `parts` nu se
  // schimbă) sunt create O SINGURĂ DATĂ aici, nu la fiecare "resources" (10x/s).
  // renderParts() doar comută vizibilitatea/starea .discovered pe nodurile deja
  // existente — elimină atât recrearea DOM-ului, cât și re-atașarea
  // listener-elor de click la fiecare tick economic.
  const hotspots = new Map<string, HTMLButtonElement>();
  for (const part of parts) {
    const dot = document.createElement("button");
    dot.className = "anatomy-hotspot";
    dot.style.left = `${part.x}%`;
    dot.style.top = `${part.y}%`;
    dot.title = part.name;
    dot.setAttribute("aria-label", part.name);
    dot.addEventListener("click", () => {
      const inspected = store.inspectAnatomyPart(part.id);
      if (inspected) showInfo(inspected);
      renderParts();
    });
    hotspotsLayer.appendChild(dot);
    hotspots.set(part.id, dot);
  }

  function renderParts(): void {
    for (const part of parts) {
      const dot = hotspots.get(part.id)!;
      dot.style.display = part.system === activeSystem ? "" : "none";
      dot.classList.toggle("discovered", store.state.anatomyDiscovered.includes(part.id));
    }
  }

  function setSystem(sys: BodySystem): void {
    activeSystem = sys;
    const def = BODY_SYSTEMS.find((s) => s.id === sys)!;
    bgImage.src = def.image;
    credit.textContent = `Sursă: ${def.credit}`;
    for (const [id, btn] of tabBtns) btn.classList.toggle("active", id === sys);
    renderParts();
  }

  setSystem("skeletal");
  store.events.on("resources", renderParts);

  return { open, close };
}
