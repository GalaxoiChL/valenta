import "./style.css";
import { createStore, startAutosave } from "./core/save";
import { tick } from "./core/economy";
import { ECONOMY_TICK_MS } from "./core/balance";
import { renderHud } from "./ui/hud";
import { renderPalette } from "./ui/palette";
import { renderConstructor } from "./ui/constructor";
import { renderLab } from "./ui/lab";
import { toUnicodeSubscript } from "./chem/formula";

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

mainLayout.append(paletteEl, constructorEl, labEl);
app.append(hudEl, mainLayout);

const store = createStore();

renderHud(hudEl, store);
const palette = renderPalette(paletteEl, store);
renderConstructor(constructorEl, store, palette);
renderLab(labEl, store);

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

// --- progres offline (§4.3) ---
const OFFLINE_THRESHOLD_MS = 15_000;
const elapsedSinceSave = Date.now() - store.state.savedAt;
if (elapsedSinceSave > OFFLINE_THRESHOLD_MS) {
  tick(store, elapsedSinceSave / 1000);
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
