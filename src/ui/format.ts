const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi"];

// Prag sub care afișăm valoarea exactă (cu separator de mii) în loc de notația K/M/B —
// altfel o cheltuială mică se pierde vizual sub rotunjirea la "1.2K" (semnalat ca
// follow-up cosmetic după sesiunea M0, unde venitul mare masca vizual cumpărăturile mici).
const PRECISE_THRESHOLD = 10_000;

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs < PRECISE_THRESHOLD) return sign + formatPrecise(abs);

  let tier = 0;
  let scaled = abs;
  while (scaled >= 1000 && tier < SUFFIXES.length - 1) {
    scaled /= 1000;
    tier += 1;
  }
  return `${sign}${trimDecimals(scaled, 1)}${SUFFIXES[tier]}`;
}

function formatPrecise(value: number): string {
  const decimals = value < 10 ? 2 : value < 100 ? 1 : 0;
  const [intPart, decPart] = value.toFixed(decimals).split(".");
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decPart ? `${withThousands},${decPart}` : withThousands;
}

function trimDecimals(value: number, decimals: number): string {
  const fixed = value.toFixed(decimals);
  return fixed.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

export function formatRate(value: number): string {
  return `${formatNumber(value)}/s`;
}

/** Durată prietenoasă pentru panoul „Bine ai revenit" (§4.3): "3 h 12 min", "45 min", "20 s". */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  if (minutes > 0) return `${minutes} min`;
  return `${seconds} s`;
}
