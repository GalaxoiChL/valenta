// M5 — Tutorial interactiv la primul joc: afișat o singură dată (detectat în
// main.ts prin absența unui save existent), apoi dispare definitiv. Obiectivele
// ghidate (§8.3) preiau rolul de "tutorial continuu" după acest ecran de start.

const STEPS: { title: string; body: string }[] = [
  {
    title: "Bine ai venit în Valența",
    body: "Ești un demiurg care construiește materia de la zero. Nodurile tale nu sunt mașini abstracte — sunt atomi reali, iar regulile de conectare sunt valențele chimice reale."
  },
  {
    title: "1. Construiește",
    body: "Alege un element din Paletă (stânga), plasează-l pe canvas, apoi trage de la un atom la altul ca să creezi o legătură. Click pe o legătură îi ciclează ordinul: simplă → dublă → triplă."
  },
  {
    title: "2. Sintetizează",
    body: "Când molecula devine 🟢 VALIDĂ, apasă „Sintetizează”. Prima sinteză a unei molecule reale îți acordă Cunoaștere și o intrare nouă în Colecție."
  },
  {
    title: "3. Automatizează",
    body: "Din Laborator (dreapta) cumperi generatoare de atomi și re-sintetizezi molecule descoperite fără să le mai construiești manual. Obiectivele de jos îți arată următorul pas oricând nu știi ce să faci."
  }
];

export function renderTutorial(onDone: () => void): void {
  let step = 0;

  const overlay = document.createElement("div");
  overlay.className = "overlay tutorial-overlay";

  const panel = document.createElement("div");
  panel.className = "overlay-panel tutorial-panel";

  const titleEl = document.createElement("h2");
  const bodyEl = document.createElement("p");
  const dots = document.createElement("div");
  dots.className = "tutorial-dots";

  const nextBtn = document.createElement("button");
  nextBtn.className = "synthesize";

  panel.append(titleEl, bodyEl, dots, nextBtn);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  function render(): void {
    const s = STEPS[step];
    titleEl.textContent = s.title;
    bodyEl.textContent = s.body;
    dots.innerHTML = STEPS.map((_, i) => `<span class="${i === step ? "active" : ""}"></span>`).join("");
    nextBtn.textContent = step === STEPS.length - 1 ? "Am înțeles, hai să încep!" : "Înainte →";
  }

  nextBtn.addEventListener("click", () => {
    if (step < STEPS.length - 1) {
      step += 1;
      render();
      return;
    }
    overlay.remove();
    onDone();
  });

  render();
}
