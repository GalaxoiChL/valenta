// M8 — ADN/ARN (§8): editor de secvențe cu dogma centrală reală (transcriere +
// traducere) și mutații reale cunoscute. Tipar overlay identic cu
// periodicTable.ts/reactions.ts.
//
// M8 v2 — înlocuire vizibilă de segment (cerută explicit de utilizator, ca la
// M7 v2): click simplu pe o bază tot o ciclează (editare rapidă); click-drag
// peste mai multe baze selectează un segment și deschide un panou unde
// jucătorul scrie înlocuirea — o bucată dintr-odată, nu bază-cu-bază.
// Selecția reosește tiparul mousedown/mousemove/mouseup din reactions.ts
// (nu HTML5 drag&drop nativ).

import type { GameStore } from "../core/state";
import type { OverlayController } from "./periodicTable";
import {
  transcribe,
  translate,
  classifySubstitution,
  isFrameshift,
  isValidBase,
  matchesMutation,
  type MutationDefinition
} from "../bio/genetics";
import { formatNumber } from "./format";
import { attachTooltip } from "./tooltip";

const CLASS_LABEL: Record<string, string> = {
  silent: "silențioasă — același aminoacid, redundanța codului genetic",
  missense: "cu sens greșit — aminoacid diferit",
  nonsense: "non-sens — codon STOP prematur, proteina se scurtează"
};

export function renderGeneticsLab(store: GameStore): OverlayController {
  const mutations = store.listMutations();
  /** Lungimea secvenței la ultima încărcare/golire — referință pentru decalajul de cadru (§8.1). */
  let referenceLength = store.dnaSequence().length;

  /** Selecția curentă de baze (click-drag) — null când nu selectează nimic. */
  let selectionStart: number | null = null;
  let selectionEnd: number | null = null;
  let isDragging = false;

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.style.display = "none";

  const panel = document.createElement("div");
  panel.className = "overlay-panel genetics-panel";

  const header = document.createElement("div");
  header.className = "overlay-header";
  const title = document.createElement("h2");
  title.textContent = "ADN/ARN";
  const closeBtn = document.createElement("button");
  closeBtn.className = "overlay-close";
  closeBtn.textContent = "✕";
  header.append(title, closeBtn);

  const hint = document.createElement("div");
  hint.className = "periodic-hint";
  hint.textContent =
    "Click pe o bază o ciclează rapid. Trage peste mai multe baze ca să selectezi un segment și să-l înlocuiești dintr-odată cu o secvență nouă.";

  // --- lista de mutații reale cunoscute ---
  const mutationsList = document.createElement("div");
  mutationsList.className = "reactions-list genetics-mutations";

  // --- editorul de secvență ---
  const editor = document.createElement("div");
  editor.className = "genetics-editor";

  const dnaRow = document.createElement("div");
  dnaRow.className = "dna-strand";
  const mrnaLabel = document.createElement("div");
  mrnaLabel.className = "rate";
  const proteinLabel = document.createElement("div");
  proteinLabel.className = "rate";
  const statusLabel = document.createElement("div");
  statusLabel.className = "rate genetics-status";

  // --- panou de înlocuire segment (apare doar când selecția are ≥2 baze) ---
  const replacePanel = document.createElement("div");
  replacePanel.className = "segment-replace-panel";
  replacePanel.style.display = "none";
  const replaceLabel = document.createElement("div");
  replaceLabel.className = "rate";
  const replaceInput = document.createElement("input");
  replaceInput.type = "text";
  replaceInput.className = "search-input";
  replaceInput.addEventListener("input", () => {
    replaceInput.value = replaceInput.value
      .toUpperCase()
      .split("")
      .filter((ch) => isValidBase(ch))
      .join("");
  });
  const replaceActions = document.createElement("div");
  replaceActions.style.marginTop = "6px";
  const applyBtn = document.createElement("button");
  applyBtn.textContent = "Înlocuiește";
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Anulează";
  applyBtn.addEventListener("click", applySegmentReplace);
  cancelBtn.addEventListener("click", clearSelection);
  replaceActions.append(applyBtn, cancelBtn);
  replacePanel.append(replaceLabel, replaceInput, replaceActions);

  const actions = document.createElement("div");
  actions.style.marginTop = "6px";
  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Golește";
  clearBtn.addEventListener("click", () => {
    store.setDnaSequence("");
    referenceLength = 0;
    statusLabel.textContent = "";
    clearSelection();
    render();
  });
  actions.append(clearBtn);

  editor.append(dnaRow, mrnaLabel, proteinLabel, statusLabel, replacePanel, actions);

  panel.append(header, hint, mutationsList, editor);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  function close(): void {
    overlay.style.display = "none";
  }
  function open(): void {
    render();
    overlay.style.display = "flex";
  }
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (evt) => {
    if (evt.target === overlay) close();
  });
  document.addEventListener("keydown", (evt) => {
    if (evt.key === "Escape" && overlay.style.display !== "none") close();
  });

  // --- selecție prin click-drag peste plăcuțe (mousedown/mousemove/mouseup) ---

  function tileIndexAt(x: number, y: number): number | null {
    const el = document.elementFromPoint(x, y);
    const tile = el?.closest(".dna-tile") as HTMLElement | null;
    if (!tile?.dataset.index) return null;
    return Number(tile.dataset.index);
  }

  function onSelectionMove(evt: MouseEvent): void {
    if (!isDragging) return;
    const idx = tileIndexAt(evt.clientX, evt.clientY);
    if (idx !== null) selectionEnd = idx;
    highlightSelection();
  }

  function onSelectionEnd(): void {
    window.removeEventListener("mousemove", onSelectionMove);
    window.removeEventListener("mouseup", onSelectionEnd);
    isDragging = false;
    if (selectionStart === null || selectionEnd === null) return;

    if (selectionStart === selectionEnd) {
      // simplu click, fără tragere — ciclare rapidă (comportamentul din M8 v1)
      const index = selectionStart;
      clearSelection();
      const before = store.dnaSequence();
      store.cycleDnaBase(index);
      const after = store.dnaSequence();
      reportSubstitution(before, after, index);
      render();
      return;
    }

    showReplacePanel();
  }

  function highlightSelection(): void {
    if (selectionStart === null || selectionEnd === null) return;
    const lo = Math.min(selectionStart, selectionEnd);
    const hi = Math.max(selectionStart, selectionEnd);
    dnaRow.querySelectorAll(".dna-tile").forEach((el) => {
      const idx = Number((el as HTMLElement).dataset.index);
      el.classList.toggle("selected", idx >= lo && idx <= hi);
    });
  }

  function clearSelection(): void {
    selectionStart = null;
    selectionEnd = null;
    replacePanel.style.display = "none";
    dnaRow.querySelectorAll(".dna-tile.selected").forEach((el) => el.classList.remove("selected"));
  }

  function showReplacePanel(): void {
    if (selectionStart === null || selectionEnd === null) return;
    const lo = Math.min(selectionStart, selectionEnd);
    const hi = Math.max(selectionStart, selectionEnd);
    const seq = store.dnaSequence();
    const segment = seq.slice(lo, hi + 1);
    replaceLabel.textContent = `Bazele ${lo + 1}–${hi + 1} (${segment}) — scrie ce le înlocuiește:`;
    replaceInput.value = segment;
    replacePanel.style.display = "";
    replaceInput.focus();
  }

  function applySegmentReplace(): void {
    if (selectionStart === null || selectionEnd === null) return;
    const lo = Math.min(selectionStart, selectionEnd);
    const hi = Math.max(selectionStart, selectionEnd);
    const ok = store.replaceDnaSegment(lo, hi + 1, replaceInput.value);
    clearSelection();
    if (ok) statusLabel.textContent = "";
    render();
  }

  // --- rânduri de mutații, create o singură dată, actualizate în loc ---
  const mutationRows = new Map<string, { row: HTMLElement; status: HTMLElement; loadBtn: HTMLButtonElement }>();

  function ensureMutationRow(m: MutationDefinition): void {
    if (mutationRows.has(m.id)) return;
    const row = document.createElement("div");
    row.className = "collection-row reaction-row";

    const top = document.createElement("div");
    top.className = "top";
    const label = document.createElement("span");
    label.textContent = `${m.name} — ${m.shortLabel}`;
    top.appendChild(label);

    const status = document.createElement("div");
    status.className = "rate";

    const rowActions = document.createElement("div");
    rowActions.style.marginTop = "6px";
    const loadBtn = document.createElement("button");
    loadBtn.textContent = "Încarcă secvența";
    loadBtn.addEventListener("click", () => {
      store.loadMutationExample(m.id);
      referenceLength = m.wildTypeSequence.length;
      statusLabel.textContent = "";
      clearSelection();
      render();
    });
    rowActions.append(loadBtn);

    const flavorEl = document.createElement("div");
    flavorEl.className = "flavor";
    flavorEl.textContent = m.flavor;

    row.append(top, status, rowActions, flavorEl);
    mutationsList.appendChild(row);
    mutationRows.set(m.id, { row, status, loadBtn });
  }

  function renderMutations(): void {
    for (const m of mutations) {
      ensureMutationRow(m);
      const { status } = mutationRows.get(m.id)!;
      const discovered = store.state.geneticsDiscovered.includes(m.id);
      const matchesNow = matchesMutation(store.dnaSequence(), m);
      status.textContent = discovered
        ? `descoperit — +${formatNumber(m.discoveryC)} C primite`
        : matchesNow
          ? "secvența curentă se potrivește — se descoperă automat"
          : "încarcă secvența și editează codonul marcat ca să reproduci mutația";
    }
  }

  // --- randare bandă ADN + ARNm + proteină, live ---
  function render(): void {
    const seq = store.dnaSequence();
    dnaRow.innerHTML = "";

    seq.split("").forEach((base, index) => {
      const tile = document.createElement("div");
      tile.className = "dna-tile";
      tile.dataset.index = String(index);
      tile.textContent = base;
      tile.addEventListener("mousedown", (evt) => {
        evt.preventDefault();
        selectionStart = index;
        selectionEnd = index;
        isDragging = true;
        highlightSelection();
        window.addEventListener("mousemove", onSelectionMove);
        window.addEventListener("mouseup", onSelectionEnd);
      });
      const delBtn = document.createElement("button");
      delBtn.className = "dna-delete";
      delBtn.textContent = "✕";
      delBtn.addEventListener("mousedown", (evt) => evt.stopPropagation());
      delBtn.addEventListener("click", (evt) => {
        evt.stopPropagation();
        store.deleteDnaBase(index);
        statusLabel.textContent = "";
        clearSelection();
        render();
      });
      tile.appendChild(delBtn);
      dnaRow.appendChild(tile);
    });

    const addBtn = document.createElement("button");
    addBtn.className = "dna-add";
    addBtn.textContent = "+";
    attachTooltip(addBtn, "Adaugă o bază nouă la capătul secvenței.");
    addBtn.addEventListener("click", () => {
      store.appendDnaBase();
      statusLabel.textContent = "";
      render();
    });
    dnaRow.appendChild(addBtn);

    const mrna = transcribe(seq);
    mrnaLabel.textContent = seq.length > 0 ? `ARNm: ${mrna}` : "ARNm: —";

    const { aminoAcids, stopIndex } = translate(mrna);
    const proteinText = aminoAcids.length > 0 ? aminoAcids.join("-") + (stopIndex !== null ? " · STOP" : "") : "—";
    proteinLabel.textContent = `Proteină: ${proteinText}`;

    if (isFrameshift(referenceLength, seq.length)) {
      statusLabel.textContent =
        "⚠ Cadru de citire decalat (frameshift) — toți codonii de după punctul editat se recitesc greșit.";
    }

    renderMutations();
  }

  function reportSubstitution(before: string, after: string, index: number): void {
    if (before.length !== after.length) return; // doar substituție, nu inserție/ștergere
    const codonIndex = Math.floor(index / 3);
    const oldCodon = transcribe(before).slice(codonIndex * 3, codonIndex * 3 + 3);
    const newCodon = transcribe(after).slice(codonIndex * 3, codonIndex * 3 + 3);
    if (oldCodon.length < 3 || newCodon.length < 3) return;
    const cls = classifySubstitution(oldCodon, newCodon);
    statusLabel.textContent = cls
      ? `Codon ${codonIndex + 1}: ${oldCodon} → ${newCodon} — mutație ${CLASS_LABEL[cls]}.`
      : "";
  }

  render();
  store.events.on("dna", render);
  store.events.on("resources", renderMutations);

  return { open, close };
}
