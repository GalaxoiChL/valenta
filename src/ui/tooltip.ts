let tooltipEl: HTMLDivElement | null = null;

function ensureTooltip(): HTMLDivElement {
  if (tooltipEl) return tooltipEl;
  tooltipEl = document.createElement("div");
  tooltipEl.className = "tooltip";
  document.body.appendChild(tooltipEl);
  return tooltipEl;
}

export function attachTooltip(el: HTMLElement | SVGElement, textOrFn: string | (() => string)): void {
  el.addEventListener("mouseenter", (evt) => {
    const text = typeof textOrFn === "function" ? textOrFn() : textOrFn;
    if (!text) return;
    const tip = ensureTooltip();
    tip.textContent = text;
    tip.classList.add("visible");
    positionTooltip(evt as MouseEvent);
  });
  el.addEventListener("mousemove", (evt) => positionTooltip(evt as MouseEvent));
  el.addEventListener("mouseleave", hideTooltip);
}

// B8 — poziționare cu detectare de coliziune: lângă marginea dreapta/jos a
// viewport-ului, tooltip-ul se răstoarnă pe partea opusă cursorului în loc
// să iasă din ecran. Axele se verifică independent (flip pe orizontală nu
// implică automat flip pe verticală).
function positionTooltip(evt: MouseEvent): void {
  const tip = ensureTooltip();
  const margin = 14;
  const edgePad = 8;
  const rect = tip.getBoundingClientRect();
  let left = evt.clientX + margin;
  let top = evt.clientY + margin;
  if (left + rect.width > window.innerWidth - edgePad) left = evt.clientX - margin - rect.width;
  if (top + rect.height > window.innerHeight - edgePad) top = evt.clientY - margin - rect.height;
  tip.style.left = `${Math.max(edgePad, left)}px`;
  tip.style.top = `${Math.max(edgePad, top)}px`;
}

export function hideTooltip(): void {
  tooltipEl?.classList.remove("visible");
}
