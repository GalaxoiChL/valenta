import type { GameStore } from "../core/state";
import { exportSave, importSave, saveGame } from "../core/save";
import type { OverlayController } from "./periodicTable";

export function renderSettings(store: GameStore): OverlayController {
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.style.display = "none";

  const panel = document.createElement("div");
  panel.className = "overlay-panel settings-panel";

  const header = document.createElement("div");
  header.className = "overlay-header";
  const title = document.createElement("h2");
  title.textContent = "Setări";
  const closeBtn = document.createElement("button");
  closeBtn.className = "overlay-close";
  closeBtn.textContent = "✕";
  header.append(title, closeBtn);

  const section = document.createElement("div");
  section.className = "settings-section";
  const label = document.createElement("div");
  label.className = "settings-label";
  label.textContent = "Salvare";

  const exportBtn = document.createElement("button");
  exportBtn.textContent = "Exportă salvarea (.json)";
  const importBtn = document.createElement("button");
  importBtn.textContent = "Importă salvare din fișier";
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "application/json";
  fileInput.style.display = "none";

  const status = document.createElement("div");
  status.className = "settings-status";

  section.append(label, exportBtn, importBtn, fileInput, status);
  panel.append(header, section);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  function close(): void {
    overlay.style.display = "none";
  }
  function open(): void {
    status.textContent = "";
    overlay.style.display = "flex";
  }

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (evt) => {
    if (evt.target === overlay) close();
  });
  document.addEventListener("keydown", (evt) => {
    if (evt.key === "Escape" && overlay.style.display !== "none") close();
  });

  exportBtn.addEventListener("click", () => {
    saveGame(store);
    const json = exportSave(store);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `valenta-save-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    status.textContent = "Salvare exportată.";
    status.classList.remove("bad");
  });

  importBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      const ok = importSave(store, text);
      status.textContent = ok ? "Salvare importată cu succes." : "Fișierul nu e o salvare Valența validă.";
      status.classList.toggle("bad", !ok);
      if (ok) saveGame(store);
      fileInput.value = "";
    });
  });

  return { open, close };
}
