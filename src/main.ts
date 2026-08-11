import "./style.css";
import { createStore, startAutosave, saveGame, SAVE_KEY } from "./core/save";
import { tick } from "./core/economy";
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
import { renderSettings } from "./ui/settings";
import { toUnicodeSubscript } from "./chem/formula";
import { formatNumber, formatDuration } from "./ui/format";
import { playDiscovery } from "./ui/sound";
import { renderTutorial } from "./ui/tutorial";

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
const settings = renderSettings(store);

renderHud(hudEl, store, {
  onOpenPeriodicTable: periodicTable.open,
  onOpenReactionsLab: reactionsLab.open,
  onOpenGeneticsLab: geneticsLab.open,
  onOpenSettings: settings.open
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
  const { dbEntry, formula } = payload as {
    dbEntry?: { name: string; flavor: string };
    formula: string;
  };
  const name = dbEntry?.name ?? `Compus ${toUnicodeSubscript(formula)}`;
  const flavor = dbEntry?.flavor ?? "O moleculă validă, în afara bazei de date cunoscute — la fel de reală.";
  playDiscovery(store);
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
