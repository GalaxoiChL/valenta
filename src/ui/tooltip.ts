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

function positionTooltip(evt: MouseEvent): void {
  const tip = ensureTooltip();
  tip.style.left = `${evt.clientX + 14}px`;
  tip.style.top = `${evt.clientY + 14}px`;
}

export function hideTooltip(): void {
  tooltipEl?.classList.remove("visible");
}
