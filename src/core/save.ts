import type { GameState, GameStore } from "./state";
import { SAVE_VERSION, createInitialState, GameStore as Store, reconcileCollectionWithDB } from "./state";
import { AUTOSAVE_INTERVAL_MS, STARTING_ATOMS } from "./balance";

const SAVE_KEY = "valenta-save";

export function saveGame(store: GameStore): void {
  store.state.savedAt = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(store.state));
}

/** Un save "blocat": 0 atomi, 0 generatoare, 0 energie, nimic în colecție — nu poate progresa nicicum. */
function isStuck(state: GameState): boolean {
  const noAtoms = Object.values(state.resources.atoms).every((n) => n <= 0);
  const noGenerators = Object.values(state.generators).every((n) => n <= 0);
  const noCollection = Object.keys(state.collection).length === 0;
  return noAtoms && noGenerators && noCollection && state.resources.energy <= 0;
}

/** Migrează un save mai vechi la schema curentă. Pentru M0 există o singură versiune. */
function migrate(raw: GameState): GameState {
  const state = raw.version === SAVE_VERSION ? raw : { ...createInitialState(), ...raw, version: SAVE_VERSION };
  if (isStuck(state)) {
    state.resources.atoms = { ...state.resources.atoms, ...STARTING_ATOMS };
  }
  reconcileCollectionWithDB(state);
  return state;
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GameState;
    return migrate(parsed);
  } catch {
    return null;
  }
}

export function createStore(): GameStore {
  const loaded = loadGame();
  return new Store(loaded ?? createInitialState());
}

export function exportSave(store: GameStore): string {
  return JSON.stringify(store.state, null, 2);
}

export function importSave(store: GameStore, json: string): boolean {
  try {
    const parsed = migrate(JSON.parse(json) as GameState);
    store.state = parsed;
    store.events.emit("resources");
    store.events.emit("collection");
    store.events.emit("generators");
    store.events.emit("draft");
    return true;
  } catch {
    return false;
  }
}

const ACTION_SAVE_DEBOUNCE_MS = 1500;

/**
 * Salvează la interval fix (15s) ȘI, mai important, la scurt timp după orice
 * acțiune discretă a jucătorului (cumpărare, sinteză) — `beforeunload` singur
 * nu e suficient de fiabil (nu se declanșează mereu, mai ales la navigare
 * programatică sau la închiderea rapidă a tabului), deci nu putem conta doar
 * pe "salvează la ieșire". Nu ascultăm "resources" direct: acela emite la
 * fiecare tick (100ms) cât timp există producție activă, ceea ce ar reseta
 * un debounce la nesfârșit și n-ar mai salva niciodată.
 */
export function startAutosave(store: GameStore): () => void {
  const interval = setInterval(() => saveGame(store), AUTOSAVE_INTERVAL_MS);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const scheduleSave = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => saveGame(store), ACTION_SAVE_DEBOUNCE_MS);
  };
  const offGenerators = store.events.on("generators", scheduleSave);
  const offCollection = store.events.on("collection", scheduleSave);

  const onUnload = () => saveGame(store);
  window.addEventListener("beforeunload", onUnload);
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") saveGame(store);
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    clearInterval(interval);
    if (debounceTimer) clearTimeout(debounceTimer);
    offGenerators();
    offCollection();
    window.removeEventListener("beforeunload", onUnload);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
