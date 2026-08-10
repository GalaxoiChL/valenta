import type { GameStore } from "../core/state";
import { hasFreeValence, sumGraphBondEnergy, productionRate } from "../core/state";
import { cloneMolecule, type MoleculeGraph } from "../chem/molecule";
import { validate, valenceStatus } from "../chem/validator";
import { getElement } from "../chem/elements";
import { hillFormula, toUnicodeSubscript } from "../chem/formula";
import { DEFAULT_BONUS_MULT, MAX_UNDO_STEPS } from "../core/balance";
import type { PaletteController } from "./palette";
import { attachTooltip } from "./tooltip";
import { renderIonicConstructor } from "./ionicConstructor";

const SNAP_RADIUS = 48;
const ATOM_RADIUS = 20;

interface Snapshot {
  draft: MoleculeGraph;
  atoms: Record<string, number>;
}

export function renderConstructor(
  container: HTMLElement,
  store: GameStore,
  palette: PaletteController
): void {
  container.innerHTML = "";
  container.classList.add("constructor-panel-wrap");

  // --- M3: comutator Covalent / Ionic — două paradigme de construcție
  // distincte pe același ecran, fără navigare (§10.1). ---
  const modeTabs = document.createElement("div");
  modeTabs.className = "mode-tabs";
  const covalentTabBtn = document.createElement("button");
  covalentTabBtn.textContent = "Covalent";
  const ionicTabBtn = document.createElement("button");
  ionicTabBtn.textContent = "Ionic";
  modeTabs.append(covalentTabBtn, ionicTabBtn);

  const covalentView = document.createElement("div");
  covalentView.className = "constructor-panel";
  const ionicView = document.createElement("div");
  ionicView.className = "ionic-panel";

  container.append(modeTabs, covalentView, ionicView);

  function setMode(mode: "covalent" | "ionic"): void {
    covalentTabBtn.classList.toggle("active", mode === "covalent");
    ionicTabBtn.classList.toggle("active", mode === "ionic");
    covalentView.style.display = mode === "covalent" ? "flex" : "none";
    ionicView.style.display = mode === "ionic" ? "flex" : "none";
  }
  covalentTabBtn.addEventListener("click", () => setMode("covalent"));
  ionicTabBtn.addEventListener("click", () => setMode("ionic"));
  setMode("covalent");

  // M4, §6.5 — "Încarcă în Constructor" din Colecție trebuie să comute
  // automat pe tab-ul Covalent, indiferent unde era jucătorul.
  store.events.on("load-template", () => setMode("covalent"));

  renderIonicConstructor(ionicView, store);

  const statusBar = document.createElement("div");
  statusBar.className = "status-bar";
  const badge = document.createElement("div");
  badge.className = "state-badge";
  const formulaEl = document.createElement("div");
  formulaEl.className = "formula";
  const messageEl = document.createElement("div");
  messageEl.className = "message";
  const previewEl = document.createElement("div");
  previewEl.className = "preview";
  const clearBtn = document.createElement("button");
  clearBtn.className = "clear-btn";
  clearBtn.textContent = "Golește";
  const synthBtn = document.createElement("button");
  synthBtn.className = "synthesize";
  synthBtn.textContent = "Sintetizează";
  statusBar.append(badge, formulaEl, messageEl, previewEl, clearBtn, synthBtn);

  const canvasWrap = document.createElement("div");
  canvasWrap.className = "canvas-wrap";
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  canvasWrap.appendChild(svg);

  covalentView.append(statusBar, canvasWrap);

  const undoStack: Snapshot[] = [];
  const redoStack: Snapshot[] = [];

  function snapshot(): Snapshot {
    return { draft: cloneMolecule(store.draft()), atoms: { ...store.state.resources.atoms } };
  }

  function pushUndo(): void {
    undoStack.push(snapshot());
    if (undoStack.length > MAX_UNDO_STEPS) undoStack.shift();
    redoStack.length = 0;
  }

  function restore(snap: Snapshot): void {
    store.state.constructorDraft = cloneMolecule(snap.draft);
    store.state.resources.atoms = { ...snap.atoms };
    store.events.emit("draft");
    store.events.emit("resources");
  }

  function undo(): void {
    const snap = undoStack.pop();
    if (!snap) return;
    redoStack.push(snapshot());
    restore(snap);
  }

  function redo(): void {
    const snap = redoStack.pop();
    if (!snap) return;
    undoStack.push(snapshot());
    restore(snap);
  }

  document.addEventListener("keydown", (e) => {
    if (!e.ctrlKey) return;
    if (e.key.toLowerCase() === "z") {
      e.preventDefault();
      undo();
    } else if (e.key.toLowerCase() === "y") {
      e.preventDefault();
      redo();
    } else if (e.key === "Backspace") {
      e.preventDefault();
      pushUndo();
      store.clearDraft();
    }
  });

  clearBtn.addEventListener("click", () => {
    pushUndo();
    store.clearDraft();
  });

  synthBtn.addEventListener("click", () => {
    const result = store.synthesizeDraft();
    if (result.ok) {
      undoStack.length = 0;
      redoStack.length = 0;
    }
  });

  // --- interacțiune drag: plasare, mutare, legare ---
  let dragState:
    | { kind: "new-atom" }
    | { kind: "move-or-bond"; atomId: string; startX: number; startY: number; moved: boolean }
    | null = null;
  let ghostLine: SVGLineElement | null = null;

  function svgPoint(evt: MouseEvent): { x: number; y: number } {
    const rect = svg.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  }

  function nearestAtom(x: number, y: number, excludeId?: string): string | null {
    let best: string | null = null;
    let bestDist = SNAP_RADIUS;
    for (const atom of store.draft().atoms) {
      if (atom.id === excludeId) continue;
      const d = Math.hypot(atom.x - x, atom.y - y);
      if (d < bestDist) {
        bestDist = d;
        best = atom.id;
      }
    }
    return best;
  }

  svg.addEventListener("mousedown", (evt) => {
    const target = evt.target as SVGElement;
    const atomId = target.closest("[data-atom-id]")?.getAttribute("data-atom-id");
    const point = svgPoint(evt);

    if (atomId) {
      dragState = { kind: "move-or-bond", atomId, startX: point.x, startY: point.y, moved: false };
      return;
    }

    const bondEl = target.closest("[data-bond]");
    if (bondEl) return; // click pe legătură se tratează separat (click, nu drag)

    const element = palette.getSelected();
    if (!element) return;
    pushUndo();
    const atom = store.placeAtomInDraft(element, point.x, point.y);
    if (!atom) undoStack.pop(); // n-a reușit (fără stoc) — anulăm snapshot-ul degeaba pus
  });

  svg.addEventListener("mousemove", (evt) => {
    if (!dragState || dragState.kind !== "move-or-bond") return;
    const draggedAtomId = dragState.atomId;
    dragState.moved = true;
    const point = svgPoint(evt);
    const target = nearestAtom(point.x, point.y, draggedAtomId);

    if (!ghostLine) {
      ghostLine = document.createElementNS(svgNS, "line");
      ghostLine.setAttribute("class", "bond-line ghost");
      svg.appendChild(ghostLine);
    }
    const startAtom = store.draft().atoms.find((a) => a.id === draggedAtomId);
    if (!startAtom) return;
    const endX = target ? (store.draft().atoms.find((a) => a.id === target)?.x ?? point.x) : point.x;
    const endY = target ? (store.draft().atoms.find((a) => a.id === target)?.y ?? point.y) : point.y;
    ghostLine.setAttribute("x1", String(startAtom.x));
    ghostLine.setAttribute("y1", String(startAtom.y));
    ghostLine.setAttribute("x2", String(endX));
    ghostLine.setAttribute("y2", String(endY));
    render();
  });

  window.addEventListener("mouseup", (evt) => {
    if (!dragState || dragState.kind !== "move-or-bond") {
      dragState = null;
      return;
    }
    ghostLine?.remove();
    ghostLine = null;

    const { atomId, moved } = dragState;
    dragState = null;
    if (!moved) return;

    const point = svgPoint(evt);
    const targetId = nearestAtom(point.x, point.y, atomId);

    if (targetId) {
      const graph = store.draft();
      const alreadyBonded = graph.bonds.some(
        (b) => (b.a === atomId && b.b === targetId) || (b.a === targetId && b.b === atomId)
      );
      if (!alreadyBonded) {
        pushUndo();
        const ok = store.setBondOrder(atomId, targetId, 1);
        if (!ok) undoStack.pop();
      }
    } else {
      pushUndo();
      store.moveAtomInDraft(atomId, point.x, point.y);
    }
  });

  svg.addEventListener("contextmenu", (evt) => {
    evt.preventDefault();
    const target = evt.target as SVGElement;
    const atomId = target.closest("[data-atom-id]")?.getAttribute("data-atom-id");
    if (!atomId) return;
    pushUndo();
    store.removeAtomFromDraft(atomId);
  });

  svg.addEventListener("click", (evt) => {
    const target = evt.target as SVGElement;
    const bondEl = target.closest("[data-bond]") as SVGElement | null;
    if (!bondEl) return;
    const a = bondEl.getAttribute("data-a")!;
    const b = bondEl.getAttribute("data-b")!;
    pushUndo();
    store.cycleBondOrder(a, b);
  });

  // --- randare ---
  function bondOffsets(order: number): number[] {
    if (order === 1) return [0];
    if (order === 2) return [-4, 4];
    return [-6, 0, 6];
  }

  function render(): void {
    svg.innerHTML = "";
    if (ghostLine) svg.appendChild(ghostLine);

    const graph = store.draft();
    const byId = new Map(graph.atoms.map((a) => [a.id, a]));

    for (const bond of graph.bonds) {
      const a = byId.get(bond.a);
      const b = byId.get(bond.b);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      // Zonă de hit invizibilă, mai groasă, pe centrul real al legăturii —
      // pentru order 2/3 liniile vizuale sunt desenate offset de centru
      // (vezi bondOffsets), lăsând un gol neclickabil exact pe mijloc. Fără
      // asta, un click acolo nu găsește legătura și cade prin la "plasează
      // atom nou pe canvas gol" (bug descoperit prin testare în browser).
      const hitLine = document.createElementNS(svgNS, "line");
      hitLine.setAttribute("class", "bond-hit");
      hitLine.setAttribute("data-bond", "1");
      hitLine.setAttribute("data-a", bond.a);
      hitLine.setAttribute("data-b", bond.b);
      hitLine.setAttribute("x1", String(a.x));
      hitLine.setAttribute("y1", String(a.y));
      hitLine.setAttribute("x2", String(b.x));
      hitLine.setAttribute("y2", String(b.y));
      svg.appendChild(hitLine);

      for (const offset of bondOffsets(bond.order)) {
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("class", "bond-line");
        line.setAttribute("data-bond", "1");
        line.setAttribute("data-a", bond.a);
        line.setAttribute("data-b", bond.b);
        line.setAttribute("x1", String(a.x + nx * offset));
        line.setAttribute("y1", String(a.y + ny * offset));
        line.setAttribute("x2", String(b.x + nx * offset));
        line.setAttribute("y2", String(b.y + ny * offset));
        svg.appendChild(line);
      }
    }

    const draggingFrom = dragState?.kind === "move-or-bond" ? dragState.atomId : null;

    for (const atom of graph.atoms) {
      const def = getElement(atom.element);
      const status = valenceStatus(graph, atom.id);
      const free = hasFreeValence(graph, atom.id);
      const dimmed = draggingFrom !== null && draggingFrom !== atom.id && !free;

      const g = document.createElementNS(svgNS, "g");
      g.setAttribute("data-atom-id", atom.id);

      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("class", "atom-circle" + (dimmed ? " dimmed" : "") + (status.satisfied ? " satisfied" : ""));
      circle.setAttribute("cx", String(atom.x));
      circle.setAttribute("cy", String(atom.y));
      circle.setAttribute("r", String(ATOM_RADIUS));
      circle.setAttribute("fill", def.color);
      circle.setAttribute("style", `color:${def.color}`);
      g.appendChild(circle);

      const label = document.createElementNS(svgNS, "text");
      label.setAttribute("class", "atom-label");
      label.setAttribute("x", String(atom.x));
      label.setAttribute("y", String(atom.y + 4));
      label.setAttribute("text-anchor", "middle");
      label.textContent = def.symbol;
      g.appendChild(label);

      if (!status.satisfied && status.missing > 0) {
        const badge = document.createElementNS(svgNS, "text");
        badge.setAttribute("class", "atom-badge");
        badge.setAttribute("x", String(atom.x + ATOM_RADIUS - 2));
        badge.setAttribute("y", String(atom.y - ATOM_RADIUS + 4));
        badge.setAttribute("text-anchor", "middle");
        badge.textContent = String(status.missing);
        g.appendChild(badge);
      }

      attachTooltip(g, () => {
        const s = valenceStatus(store.draft(), atom.id);
        return s.satisfied
          ? `${def.name} — valență satisfăcută`
          : `${def.name} mai are nevoie de ${s.missing} legătură/i`;
      });

      svg.appendChild(g);
    }

    renderStatus(graph);
  }

  function renderStatus(graph: MoleculeGraph): void {
    const result = validate(graph);
    formulaEl.textContent = toUnicodeSubscript(hillFormula(graph)) || "—";

    badge.classList.remove("valid", "error");
    if (graph.atoms.length === 0) {
      badge.textContent = "⚪ goală";
      messageEl.textContent = "";
      previewEl.textContent = "";
      synthBtn.disabled = true;
      synthBtn.title = "Adaugă atomi din paletă";
      return;
    }

    if (result.ok) {
      badge.textContent = "🟢 VALIDĂ";
      badge.classList.add("valid");
      messageEl.textContent = "";
      const sumE = sumGraphBondEnergy(graph);
      const rate = productionRate(sumE, DEFAULT_BONUS_MULT);
      previewEl.textContent = `~${rate.toFixed(2)} E/s`;
      synthBtn.disabled = false;
      synthBtn.title = "";
    } else {
      badge.classList.add("error");
      if (result.reason === "disconnected") {
        badge.textContent = "🔴 deconectată";
        messageEl.textContent = "Molecula nu e legată într-o singură bucată.";
      } else {
        badge.textContent = "🟡 în lucru";
        const first = result.details[0];
        const atom = graph.atoms.find((a) => a.id === first?.atomId);
        messageEl.textContent = atom
          ? `${getElement(atom.element).name} mai are nevoie de ${first.missing} legătură/i.`
          : "Molecula nu e încă validă.";
      }
      previewEl.textContent = "";
      synthBtn.disabled = true;
      synthBtn.title = messageEl.textContent;
    }
  }

  store.events.on("draft", render);
  store.events.on("resources", () => renderStatus(store.draft()));
  render();
}
