import type { GameStore } from "./state";
import { tick } from "./economy";
import { OFFLINE_CAP_SECONDS, OFFLINE_PRODUCTION_RATE } from "./balance";

const OFFLINE_THRESHOLD_MS = 15_000;

export interface OfflineReport {
  /** Timpul real scurs de la ultima salvare, plafonat la OFFLINE_CAP_SECONDS. */
  cappedSeconds: number;
  /** Timpul real scurs, neplafonat — util pentru mesajul „ai lipsit X ore", chiar dacă producția s-a oprit la cap. */
  realSeconds: number;
  energyGained: number;
}

/**
 * Progres offline (§4.3): Δt = min(acum-ultimaSalvare, CAP), acordat la 50%
 * din producția normală. Rulează tot tick-ul economic (atomi + energie +
 * auto-sintetizatoare) la acest Δt scalat — nu doar Energia — ca să rămână
 * consistent cu felul în care M0/M1 tratau deja atomii în acest catch-up.
 */
export function applyOfflineProgress(store: GameStore): OfflineReport | null {
  const elapsedMs = Date.now() - store.state.savedAt;
  if (elapsedMs < OFFLINE_THRESHOLD_MS) return null;

  const realSeconds = elapsedMs / 1000;
  const cappedSeconds = Math.min(realSeconds, OFFLINE_CAP_SECONDS);

  const energyBefore = store.state.resources.energy;
  tick(store, cappedSeconds * OFFLINE_PRODUCTION_RATE);
  const energyGained = store.state.resources.energy - energyBefore;

  return { cappedSeconds, realSeconds, energyGained };
}
