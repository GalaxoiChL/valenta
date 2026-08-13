// C10 — celebrare vizuală CSS-only, în stilul deja stabilit de nucleo-burst
// (style.css) și de bannerele efemere din main.ts: un nod creat dinamic,
// atașat la body, care se șterge singur după animație.

const PIECE_COUNT = 14;
const COLORS = ["var(--accent)", "var(--good)", "var(--warn)", "var(--accent-bio)"];

export function burstConfetti(): void {
  const wrap = document.createElement("div");
  wrap.className = "confetti-burst";
  for (let i = 0; i < PIECE_COUNT; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    const angle = (i / PIECE_COUNT) * 360 + Math.random() * 20;
    const dist = 70 + Math.random() * 50;
    piece.style.setProperty("--dx", `${Math.cos((angle * Math.PI) / 180) * dist}px`);
    piece.style.setProperty("--dy", `${Math.sin((angle * Math.PI) / 180) * dist}px`);
    piece.style.setProperty("--rot", `${Math.random() * 360}deg`);
    piece.style.background = COLORS[i % COLORS.length];
    piece.style.animationDelay = `${Math.random() * 0.06}s`;
    wrap.appendChild(piece);
  }
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 1000);
}
