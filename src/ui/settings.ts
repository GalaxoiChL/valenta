import type { GameStore } from "../core/state";
import { exportSave, importSave, saveGame } from "../core/save";
import { NUCLEOSYNTHESIS_MIN_ENERGY, STAR_PRODUCTION_BONUS } from "../core/balance";
import { formatNumber } from "./format";
import type { OverlayController } from "./periodicTable";

export function renderSettings(store: GameStore): OverlayController {
  const overlay = document.createElement("div");
  overlay.className = "overlay";

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

  // --- Autopilot: deblochează elemente și cumpără generatoare automat, cel mai
  // ieftin întâi — settings.autopilot e un boolean global, la fel ca settings.sound. ---
  const autopilotSection = document.createElement("div");
  autopilotSection.className = "settings-section";
  const autopilotLabel = document.createElement("div");
  autopilotLabel.className = "settings-label";
  autopilotLabel.textContent = "Autopilot";
  const autopilotHint = document.createElement("div");
  autopilotHint.className = "settings-status";
  autopilotHint.textContent = "Deblochează elemente și cumpără generatoare automat, cel mai ieftin întâi.";
  const autopilotBtn = document.createElement("button");
  function renderAutopilotBtn(): void {
    autopilotBtn.textContent = store.state.settings.autopilot ? "🤖 Autopilot activat" : "🤖 Autopilot dezactivat";
  }
  autopilotBtn.addEventListener("click", () => {
    store.state.settings.autopilot = !store.state.settings.autopilot;
    renderAutopilotBtn();
    saveGame(store);
  });
  renderAutopilotBtn();
  autopilotSection.append(autopilotLabel, autopilotHint, autopilotBtn);

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

  // --- Harta Stelelor: vizual, nu doar text — Stelele deținute (permanente) apar
  // ca puncte fixe pe un cer, cele "gata de cules" (pendingStars) pulsează separat,
  // iar bara arată progresul spre următoarea. Rescrisă la cererea utilizatorului
  // (audit 2026-08-12) care a ales explicit această direcție dintre 3 propuse. ---
  const starfield = document.createElement("div");
  starfield.className = "nucleo-starfield";
  const progressWrap = document.createElement("div");
  progressWrap.className = "nucleo-progress";
  const progressFill = document.createElement("div");
  progressFill.className = "nucleo-progress-fill";
  progressWrap.appendChild(progressFill);
  const progressLabel = document.createElement("div");
  progressLabel.className = "nucleo-progress-label";

  const nucleoInfo = document.createElement("div");
  nucleoInfo.className = "nucleo-info";
  const nucleoBtn = document.createElement("button");
  const nucleoStatus = document.createElement("div");
  nucleoStatus.className = "settings-status";
  nucleoSection.append(nucleoLabel, starfield, progressWrap, progressLabel, nucleoInfo, nucleoBtn, nucleoStatus);

  const OWNED_STAR_CAP = 48;
  const PENDING_STAR_CAP = 8;

  // Poziții pseudo-aleatoare dar deterministe (seed = indexul stelei) — nu se
  // reamestecă la fiecare re-randare, doar când se schimbă efectiv numărul.
  function starPos(i: number, salt: number): number {
    const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function buildStars(count: number, cap: number, cls: string): DocumentFragment {
    const frag = document.createDocumentFragment();
    const shown = Math.min(count, cap);
    for (let i = 0; i < shown; i++) {
      const star = document.createElement("span");
      star.className = `nucleo-star ${cls}`;
      star.style.left = `${4 + starPos(i, 1) * 92}%`;
      star.style.top = `${12 + starPos(i, 2) * 72}%`;
      star.style.animationDelay = `${starPos(i, 3) * 3}s`;
      star.textContent = "★";
      frag.appendChild(star);
    }
    if (count > cap) {
      const badge = document.createElement("span");
      badge.className = "nucleo-star-overflow";
      badge.textContent = `+${count - cap}`;
      frag.appendChild(badge);
    }
    return frag;
  }

  let lastOwnedCount = -1;
  let lastPendingCount = -1;
  let ownedLayer: HTMLElement | null = null;
  let pendingLayer: HTMLElement | null = null;

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

    // Reconstruiește stratul de stele doar când numărul chiar s-a schimbat —
    // renderNucleo() rulează la fiecare tick economic (eveniment "resources"),
    // deci recrearea necondiționată ar repeta bug-ul de perf reparat la M0.
    if (stars !== lastOwnedCount) {
      ownedLayer?.remove();
      ownedLayer = document.createElement("div");
      ownedLayer.className = "nucleo-star-layer owned";
      ownedLayer.appendChild(buildStars(stars, OWNED_STAR_CAP, "owned"));
      starfield.appendChild(ownedLayer);
      lastOwnedCount = stars;
    }
    if (pending !== lastPendingCount) {
      pendingLayer?.remove();
      pendingLayer = document.createElement("div");
      pendingLayer.className = "nucleo-star-layer pending";
      pendingLayer.appendChild(buildStars(pending, PENDING_STAR_CAP, "pending"));
      starfield.appendChild(pendingLayer);
      lastPendingCount = pending;
    }

    // Progres spre următoarea stea dincolo de cele deja "gata de cules" —
    // curba e sqrt, deci pragul următor nu e la un interval fix de energie.
    const lowerThreshold = pending * pending * NUCLEOSYNTHESIS_MIN_ENERGY;
    const upperThreshold = (pending + 1) * (pending + 1) * NUCLEOSYNTHESIS_MIN_ENERGY;
    const progress = Math.min(
      1,
      (store.state.totalEnergyEarned - lowerThreshold) / (upperThreshold - lowerThreshold)
    );
    progressFill.style.width = `${(progress * 100).toFixed(1)}%`;
    progressLabel.textContent = `${formatNumber(store.state.totalEnergyEarned)} / ${formatNumber(upperThreshold)} E spre următoarea Stea`;

    nucleoInfo.innerHTML = `
      Stele deținute: <strong>${stars}</strong> (+${(stars * STAR_PRODUCTION_BONUS * 100).toFixed(0)}% producție globală)${
      pending > 0 ? `<br>Gata de cules acum: <strong>${pending}</strong>` : ""
    }
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
    if (gained > 0) {
      starfield.classList.remove("nucleo-burst");
      void starfield.offsetWidth; // restart animația dacă se declanșează de mai multe ori la rând
      starfield.classList.add("nucleo-burst");
    }
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

  panel.append(header, soundSection, autopilotSection, section, nucleoSection, aboutSection);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  function close(): void {
    overlay.classList.remove("open");
    disarm();
  }
  function open(): void {
    status.textContent = "";
    nucleoStatus.textContent = "";
    renderNucleo();
    overlay.classList.add("open");
  }

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (evt) => {
    if (evt.target === overlay) close();
  });
  document.addEventListener("keydown", (evt) => {
    if (evt.key === "Escape" && overlay.classList.contains("open")) close();
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
