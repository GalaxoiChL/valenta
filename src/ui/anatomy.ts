// M9 — Anatomie (§9): explorator vizual stilizat al corpului uman, siluetă +
// forme SVG pe 4 sisteme comutabile. Tipar overlay identic cu reactions.ts/
// genetics.ts; comutatorul de sisteme reosește clasa .mode-tabs deja
// stilizată pentru Covalent/Ionic din Constructor.

import type { GameStore } from "../core/state";
import type { OverlayController } from "./periodicTable";
import { BODY_SYSTEMS, type BodySystem, type AnatomyPart, type AnatomyShape } from "../bio/anatomy";

const SVG_NS = "http://www.w3.org/2000/svg";

function el<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tag);
}

function limb(x1: number, y1: number, x2: number, y2: number, width: number): SVGLineElement {
  const line = el("line");
  line.setAttribute("x1", String(x1));
  line.setAttribute("y1", String(y1));
  line.setAttribute("x2", String(x2));
  line.setAttribute("y2", String(y2));
  line.setAttribute("stroke-width", String(width));
  line.setAttribute("stroke-linecap", "round");
  return line;
}

function shapeToElement(shape: AnatomyShape): SVGElement {
  if (shape.kind === "ellipse") {
    const e = el("ellipse");
    e.setAttribute("cx", String(shape.cx));
    e.setAttribute("cy", String(shape.cy));
    e.setAttribute("rx", String(shape.rx));
    e.setAttribute("ry", String(shape.ry));
    if (shape.rotate) e.setAttribute("transform", `rotate(${shape.rotate} ${shape.cx} ${shape.cy})`);
    return e;
  }
  if (shape.kind === "line") {
    const e = limb(shape.x1, shape.y1, shape.x2, shape.y2, shape.strokeWidth);
    e.setAttribute("fill", "none");
    if (shape.dashed) e.setAttribute("stroke-dasharray", "6,5");
    return e;
  }
  const e = el("path");
  e.setAttribute("d", shape.d);
  return e;
}

export function renderAnatomyLab(store: GameStore): OverlayController {
  let activeSystem: BodySystem = "skeletal";
  const parts = store.listAnatomyParts();

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.style.display = "none";

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
    "Siluetă stilizată, nu o ilustrație medicală — click pe o parte pentru numele și un fapt real. Comută sistemul cu tab-urile de mai jos.";

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

  const svg = el("svg");
  svg.setAttribute("viewBox", "0 0 300 600");
  svg.classList.add("anatomy-svg");

  const outline = el("g");
  outline.classList.add("anatomy-outline");
  const head = el("circle");
  head.setAttribute("cx", "150");
  head.setAttribute("cy", "40");
  head.setAttribute("r", "30");
  const torso = el("polygon");
  torso.setAttribute("points", "100,95 200,95 195,230 105,230");
  outline.append(
    head,
    torso,
    limb(97, 100, 60, 180, 22),
    limb(60, 180, 55, 255, 18),
    limb(203, 100, 240, 180, 22),
    limb(240, 180, 245, 255, 18),
    limb(122, 228, 118, 400, 26),
    limb(118, 400, 113, 560, 20),
    limb(178, 228, 182, 400, 26),
    limb(182, 400, 187, 560, 20)
  );
  svg.appendChild(outline);

  const partsGroup = el("g");
  svg.appendChild(partsGroup);

  const infoPanel = document.createElement("div");
  infoPanel.className = "anatomy-info";
  infoPanel.textContent = "Click pe o formă colorată ca să afli ce e.";

  panel.append(header, hint, tabs, svg, infoPanel);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  function close(): void {
    overlay.style.display = "none";
  }
  function open(): void {
    overlay.style.display = "flex";
  }
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (evt) => {
    if (evt.target === overlay) close();
  });
  document.addEventListener("keydown", (evt) => {
    if (evt.key === "Escape" && overlay.style.display !== "none") close();
  });

  function showInfo(part: AnatomyPart): void {
    infoPanel.innerHTML = `<strong>${part.name}</strong><div class="flavor">${part.flavor}</div>`;
  }

  function renderParts(): void {
    partsGroup.innerHTML = "";
    for (const part of parts) {
      if (part.system !== activeSystem) continue;
      const shapeEl = shapeToElement(part.shape);
      shapeEl.classList.add("anatomy-part");
      if (part.outlineOnly) {
        shapeEl.setAttribute("fill", "none");
        shapeEl.setAttribute("stroke", part.color);
        shapeEl.setAttribute("stroke-width", "2.5");
      } else if (part.shape.kind === "line") {
        shapeEl.setAttribute("stroke", part.color);
      } else {
        shapeEl.setAttribute("fill", part.color);
      }
      shapeEl.classList.toggle("discovered", store.state.anatomyDiscovered.includes(part.id));
      shapeEl.addEventListener("click", () => {
        const inspected = store.inspectAnatomyPart(part.id);
        if (inspected) showInfo(inspected);
        renderParts();
      });
      partsGroup.appendChild(shapeEl);
    }
  }

  function setSystem(sys: BodySystem): void {
    activeSystem = sys;
    for (const [id, btn] of tabBtns) btn.classList.toggle("active", id === sys);
    renderParts();
  }

  setSystem("skeletal");
  store.events.on("resources", renderParts);

  return { open, close };
}
