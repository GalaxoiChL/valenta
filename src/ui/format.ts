const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi"];

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs < 1000) return sign + trimDecimals(abs, abs < 10 ? 2 : 1);

  let tier = 0;
  let scaled = abs;
  while (scaled >= 1000 && tier < SUFFIXES.length - 1) {
    scaled /= 1000;
    tier += 1;
  }
  return `${sign}${trimDecimals(scaled, 1)}${SUFFIXES[tier]}`;
}

function trimDecimals(value: number, decimals: number): string {
  const fixed = value.toFixed(decimals);
  return fixed.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

export function formatRate(value: number): string {
  return `${formatNumber(value)}/s`;
}
