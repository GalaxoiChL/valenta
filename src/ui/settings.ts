import type { GameStore } from "../core/state";
import { exportSave, importSave, saveGame } from "../core/save";
import { NUCLEOSYNTHESIS_MIN_ENERGY, STAR_PRODUCTION_BONUS } from "../core/balance";
import { formatNumber } from "./format";
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

  // --- M5 — Sunet (§10.3): toggle unic, settings.sound există deja în GameState. ---
  const soundSection = document.createElement("div");
  soundSection.className = "settings-section";
  const soundLabel = document.createElement("div");
  soundLabel.className = "settings-label";
  soundLabel.textContent = "Sunet";
  const soundBtn = document.createElement("button");
  function renderSoundBtn(): void {
    soundBtn.textContent = store.state.settings.sound ? "🔊 Sunet activat" : "🔇 Sunet dezactivat";
  }
  soundBtn.addEventListener("click", () => {
    store.state.settings.sound = !store.state.settings.sound;
    renderSoundBtn();
    saveGame(store);
  });
  renderSoundBtn();
  soundSection.append(soundLabel, soundBtn);

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

  // --- M5 — Nucleosinteza (§3.3): prestige. Reciclează era curentă în Stele permanente. ---
  const nucleoSection = document.createElement("div");
  nucleoSection.className = "settings-section nucleo-section";
  const nucleoLabel = document.createElement("div");
  nucleoLabel.className = "settings-label";
  nucleoLabel.textContent = "Nucleosinteza";
  const nucleoInfo = document.createElement("div");
  nucleoInfo.className = "nucleo-info";
  const nucleoBtn = document.createElement("button");
  const nucleoStatus = document.createElement("div");
  nucleoStatus.className = "settings-status";
  nucleoSection.append(nucleoLabel, nucleoInfo, nucleoBtn, nucleoStatus);

  let armed = false;
  let disarmTimer: ReturnType<typeof setTimeout> | null = null;

  function disarm(): void {
    armed = false;
    if (disarmTimer) clearTimeout(disarmTimer);
    disarmTimer = null;
    renderNucleo();
  }

  function renderNucleo(): void {
    const stars = store.state.stars;
    const pending = store.pendingStars();
    nucleoInfo.innerHTML = `
      Stele deținute: <strong>${stars}</strong> (+${(stars * STAR_PRODUCTION_BONUS * 100).toFixed(0)}% producție globală)<br>
      Energie acumulată în această eră: ${formatNumber(store.state.totalEnergyEarned)} E<br>
      Prag pentru prima Stea: ${formatNumber(NUCLEOSYNTHESIS_MIN_ENERGY)} E
    `;
    if (pending < 1) {
      nucleoBtn.textContent = "Nucleosinteza (indisponibilă încă)";
      nucleoBtn.disabled = true;
      armed = false;
      return;
    }
    nucleoBtn.disabled = false;
    nucleoBtn.textContent = armed
      ? `Ești sigur? Click din nou pentru a confirma (ireversibil)`
      : `Declanșează Nucleosinteza (+${pending} ${pending === 1 ? "Stea" : "Stele"})`;
    nucleoBtn.classList.toggle("armed", armed);
  }

  nucleoBtn.addEventListener("click", () => {
    if (store.pendingStars() < 1) return;
    if (!armed) {
      armed = true;
      renderNucleo();
      disarmTimer = setTimeout(disarm, 8000);
      return;
    }
    if (disarmTimer) clearTimeout(disarmTimer);
    const gained = store.triggerNucleosynthesis();
    armed = false;
    nucleoStatus.textContent =
      gained > 0 ? `Nucleosinteza declanșată — ai câștigat ${gained} ${gained === 1 ? "Stea" : "Stele"}.` : "";
    nucleoStatus.classList.remove("bad");
    saveGame(store);
    renderNucleo();
  });

  store.events.on("resources", renderNucleo);

  // --- §5.6 — Panoul "Despre chimia din joc": simplificările asumate, spuse
  // pe față jucătorului, nu ascunse. Colapsat implicit ca să nu aglomereze
  // overlay-ul de Setări la fiecare deschidere. ---
  const aboutSection = document.createElement("div");
  aboutSection.className = "settings-section";
  const aboutToggle = document.createElement("button");
  aboutToggle.textContent = "Despre chimia din joc ▾";
  const aboutBody = document.createElement("div");
  aboutBody.className = "about-chem-body";
  aboutBody.style.display = "none";
  aboutBody.innerHTML = `
    <ul>
      <li>Nu simulăm geometrie 3D, unghiuri de legătură, rezonanță sau aromaticitate — benzenul e desenat cu legături duble alternante (Kekulé) și e acceptat așa.</li>
      <li>Valențele sunt fixe per element (cu liste multiple unde contează chimic: S poate avea 2, 4 sau 6). Fără radicali, fără sarcini formale.</li>
      <li>Legăturile ionice (Na⁺Cl⁻ etc.) sunt modelate separat, prin echilibru de sarcini — nu sunt legături desenate ca cele covalente.</li>
      <li>Energia „produsă" de o moleculă e o convenție de joc inspirată din energiile reale de legătură, nu un calcul termodinamic riguros.</li>
      <li>Izomerii (molecule cu aceeași formulă, structură diferită) sunt distinși printr-un hash canonic de graf simplificat — foarte fiabil pentru molecule mici, dar nu o demonstrație matematică perfectă.</li>
      <li>Polimerii sunt simplificați: orice legătură dublă/triplă poate „deschide" un lanț, fără o modelare completă a mecanismelor reale de polimerizare.</li>
    </ul>
  `;
  aboutToggle.addEventListener("click", () => {
    const showing = aboutBody.style.display !== "none";
    aboutBody.style.display = showing ? "none" : "block";
    aboutToggle.textContent = showing ? "Despre chimia din joc ▾" : "Despre chimia din joc ▴";
  });
  aboutSection.append(aboutToggle, aboutBody);

  panel.append(header, soundSection, section, nucleoSection, aboutSection);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  function close(): void {
    overlay.style.display = "none";
    disarm();
  }
  function open(): void {
    status.textContent = "";
    nucleoStatus.textContent = "";
    renderNucleo();
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
