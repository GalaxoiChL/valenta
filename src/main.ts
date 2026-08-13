import "./style.css";
import { createStore, startAutosave, saveGame, SAVE_KEY } from "./core/save";
import { tick, type AutopilotAction } from "./core/economy";
import { ECONOMY_TICK_MS } from "./core/balance";
import { checkObjectives } from "./core/objectives";
import { applyOfflineProgress } from "./core/offline";
import { renderHud } from "./ui/hud";
import { renderPalette } from "./ui/palette";
import { renderConstructor } from "./ui/constructor";
import { renderLab } from "./ui/lab";
import { renderObjectives } from "./ui/objectives";
import { renderPeriodicTable } from "./ui/periodicTable";
import { renderReactionsLab } from "./ui/reactions";
import { renderGeneticsLab } from "./ui/genetics";
import { renderAnatomyLab } from "./ui/anatomy";
import { renderSettings } from "./ui/settings";
import { toUnicodeSubscript } from "./chem/formula";
import { formatNumber, formatDuration } from "./ui/format";
import { playDiscovery, playGeneticsDiscovery, playAnatomyDiscovery } from "./ui/sound";
import { renderTutorial } from "./ui/tutorial";
import { burstConfetti } from "./ui/celebration";

const isFirstLaunch = localStorage.getItem(SAVE_KEY) === null;

const app = document.getElementById("app")!;

const hudEl = document.createElement("div");
const mainLayout = document.createElement("div");
mainLayout.className = "main-layout";

const paletteEl = document.createElement("div");
paletteEl.className = "panel palette-panel";
const constructorEl = document.createElement("div");
constructorEl.className = "panel";
const labEl = document.createElement("div");
labEl.className = "panel lab-panel";

const objectivesEl = document.createElement("div");

mainLayout.append(paletteEl, constructorEl, labEl);
app.append(hudEl, mainLayout, objectivesEl);

const store = createStore();

const periodicTable = renderPeriodicTable(store);
const reactionsLab = renderReactionsLab(store);
const geneticsLab = renderGeneticsLab(store);
const anatomyLab = renderAnatomyLab(store);
const settings = renderSettings(store);

// --- overlay-urile de sus (Tabel Periodic/Reacții/ADN-ARN/Anatomie/Setări) sunt
// exclusive: deschiderea unuia le închide pe celelalte, ca să nu rămână stivuite. ---
const topOverlays = [periodicTable, reactionsLab, geneticsLab, anatomyLab, settings];
function exclusiveOpen(target: { open: () => void }): () => void {
  return () => {
    for (const overlay of topOverlays) {
      if (overlay !== target) overlay.close();
    }
    target.open();
  };
}

renderHud(hudEl, store, {
  onOpenPeriodicTable: exclusiveOpen(periodicTable),
  onOpenReactionsLab: exclusiveOpen(reactionsLab),
  onOpenGeneticsLab: exclusiveOpen(geneticsLab),
  onOpenAnatomyLab: exclusiveOpen(anatomyLab),
  onOpenSettings: exclusiveOpen(settings)
});
const palette = renderPalette(paletteEl, store);
renderConstructor(constructorEl, store, palette);
renderLab(labEl, store);
renderObjectives(objectivesEl, store);

// --- obiective ghidate (§8.3): verificate la orice schimbare relevantă de stare ---
for (const event of ["resources", "collection", "generators", "unlocked"]) {
  store.events.on(event, () => checkObjectives(store));
}
checkObjectives(store);

// --- banner de descoperire (§6.4) ---
const banner = document.createElement("div");
banner.className = "discovery-banner";
document.body.appendChild(banner);
let bannerTimeout: ReturnType<typeof setTimeout> | null = null;

store.events.on("discovery", (payload: unknown) => {
  const { dbEntry, formula, kind } = payload as {
    dbEntry?: { name: string; flavor: string };
    formula: string;
    kind?: "molecule" | "genetics" | "anatomy";
  };
  const name = dbEntry?.name ?? `Compus ${toUnicodeSubscript(formula)}`;
  const flavor = dbEntry?.flavor ?? "O moleculă validă, în afara bazei de date cunoscute — la fel de reală.";
  // C9 — sunet distinct per tip de descoperire, ca jucătorul să distingă
  // molecule/mutații/părți anatomice după ureche.
  if (kind === "genetics") playGeneticsDiscovery(store);
  else if (kind === "anatomy") playAnatomyDiscovery(store);
  else playDiscovery(store);
  banner.innerHTML = `
    <div class="title">Ai descoperit</div>
    <div class="name">${name} <span style="opacity:.6">(${toUnicodeSubscript(formula)})</span></div>
    <div class="flavor">${flavor}</div>
  `;
  banner.classList.add("visible");
  if (bannerTimeout) clearTimeout(bannerTimeout);
  bannerTimeout = setTimeout(() => banner.classList.remove("visible"), 3500);
  banner.onclick = () => banner.classList.remove("visible");
});

// --- C10: confetti la deblocarea primului element dintr-un tier nou ---
store.events.on("tier-unlock", () => burstConfetti());

// --- Nucleosinteza: banner de sărbătorire (§3.3) ---
store.events.on("nucleosynthesis", (payload: unknown) => {
  const gained = payload as number;
  const nucleoBanner = document.createElement("div");
  nucleoBanner.className = "discovery-banner nucleo-banner visible";
  nucleoBanner.innerHTML = `
    <div class="title">Nucleosinteza!</div>
    <div class="name">+${gained} ${gained === 1 ? "Stea" : "Stele"} ⭐</div>
    <div class="flavor">Materia ta a fost reciclată într-o stea care forjează elemente mai grele — exact ca în univers. Producția globală crește permanent.</div>
  `;
  document.body.appendChild(nucleoBanner);
  nucleoBanner.onclick = () => nucleoBanner.remove();
  setTimeout(() => nucleoBanner.remove(), 6000);
});

// --- Autopilot: banner de rezumat (§7) — evită să afișeze un banner per
// deblocare (Autopilot poate face 8-9 deblocări în câteva secunde, vezi
// BACKLOG); acumulează acțiunile și le arată grupat, după o pauză scurtă. ---
const autopilotBanner = document.createElement("div");
autopilotBanner.className = "discovery-banner autopilot-banner";
document.body.appendChild(autopilotBanner);
let autopilotActions: AutopilotAction[] = [];
let autopilotFlushTimeout: ReturnType<typeof setTimeout> | null = null;
let autopilotHideTimeout: ReturnType<typeof setTimeout> | null = null;

function flushAutopilotBanner(): void {
  if (autopilotActions.length === 0) return;
  const elementNames = autopilotActions
    .filter((a): a is Extract<typeof a, { kind: "element" }> => a.kind === "element")
    .map((a) => a.name);
  const gotAutoSynth = autopilotActions.some((a) => a.kind === "autosynth");
  const speedLevels = autopilotActions.filter((a) => a.kind === "speedUpgrade").length;

  const parts: string[] = [];
  if (elementNames.length > 0) parts.push(`deblocat ${elementNames.join(", ")}`);
  if (gotAutoSynth) parts.push("deblocat Automatizarea");
  if (speedLevels > 0) parts.push(`Viteză generatoare +${speedLevels} nivel${speedLevels > 1 ? "e" : ""}`);

  autopilotBanner.innerHTML = `
    <div class="title">Autopilot</div>
    <div class="name">${parts.join(" · ")}</div>
  `;
  autopilotBanner.classList.add("visible");
  if (autopilotHideTimeout) clearTimeout(autopilotHideTimeout);
  autopilotHideTimeout = setTimeout(() => autopilotBanner.classList.remove("visible"), 4000);
  autopilotBanner.onclick = () => autopilotBanner.classList.remove("visible");
  autopilotActions = [];
}

store.events.on("autopilotAction", (action: unknown) => {
  autopilotActions.push(action as AutopilotAction);
  if (autopilotFlushTimeout) clearTimeout(autopilotFlushTimeout);
  autopilotFlushTimeout = setTimeout(flushAutopilotBanner, 900);
});

// --- progres offline, plafonat la 8h, 50% producție (§4.3) ---
const offlineReport = applyOfflineProgress(store);
if (offlineReport && offlineReport.energyGained > 0) {
  const welcomeBanner = document.createElement("div");
  welcomeBanner.className = "discovery-banner welcome-back-banner visible";
  welcomeBanner.innerHTML = `
    <div class="title">Bine ai revenit!</div>
    <div class="name">+${formatNumber(offlineReport.energyGained)} E</div>
    <div class="flavor">Ai lipsit ${formatDuration(offlineReport.realSeconds)} — laboratorul a produs offline, la jumătate din ritm.</div>
  `;
  document.body.appendChild(welcomeBanner);
  welcomeBanner.onclick = () => welcomeBanner.remove();
  setTimeout(() => welcomeBanner.remove(), 6000);
}

// --- bucla economiei: setInterval + dt real măsurat, robust la tab inactiv ---
let lastTick = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = (now - lastTick) / 1000;
  lastTick = now;
  tick(store, dt);
}, ECONOMY_TICK_MS);

startAutosave(store);

// --- Tutorial interactiv la primul joc (§12, M5) — o singură dată ---
if (isFirstLaunch) {
  renderTutorial(() => saveGame(store));
}
