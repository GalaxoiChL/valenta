// M8 — ADN/ARN (§8): editor de secvențe cu dogma centrală reală (transcriere +
// traducere) și mutații reale cunoscute. Tipar overlay identic cu
// periodicTable.ts/reactions.ts.

import type { GameStore } from "../core/state";
import type { OverlayController } from "./periodicTable";
import {
  transcribe,
  translate,
  classifySubstitution,
  isFrameshift,
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
    "Editează secvența de ADN (click pe o bază o ciclează, ✕ o șterge, + adaugă la capăt) și vezi live transcrierea în ARNm și traducerea în proteină.";

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

  const actions = document.createElement("div");
  actions.style.marginTop = "6px";
  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Golește";
  clearBtn.addEventListener("click", () => {
    store.setDnaSequence("");
    referenceLength = 0;
    statusLabel.textContent = "";
    render();
  });
  actions.append(clearBtn);

  editor.append(dnaRow, mrnaLabel, proteinLabel, statusLabel, actions);

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
      tile.textContent = base;
      tile.addEventListener("click", () => {
        const before = store.dnaSequence();
        store.cycleDnaBase(index);
        const after = store.dnaSequence();
        reportSubstitution(before, after, index);
        render();
      });
      const delBtn = document.createElement("button");
      delBtn.className = "dna-delete";
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", (evt) => {
        evt.stopPropagation();
        store.deleteDnaBase(index);
        statusLabel.textContent = "";
        render();
      });
      tile.appendChild(delBtn);
      dnaRow.appendChild(tile);
    });

    const addBtn = document.createElement("button");
    addBtn.className = "dna-add";
    addBtn.textContent = "+";
    attachTooltip(addBtn, "Adaugă o bază nouă la capătul secvenței (§8.1 — inserția arbitrară nu e în v1).");
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
