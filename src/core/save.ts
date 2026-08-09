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

export function startAutosave(store: GameStore): () => void {
  const interval = setInterval(() => saveGame(store), AUTOSAVE_INTERVAL_MS);
  const onUnload = () => saveGame(store);
  window.addEventListener("beforeunload", onUnload);
  return () => {
    clearInterval(interval);
    window.removeEventListener("beforeunload", onUnload);
  };
}
