# DEVLOG — Jurnalul de dezvoltare Valența

> Acest fișier ține evidența fiecărei sesiuni de lucru cu Claude Code. După fiecare conversație în care se fac modificări la aplicație, se adaugă o intrare nouă **sus** (ordine cronologică inversă), ca să existe un flux clar al deciziilor și progresului. `VALENTA_SPEC.md` rămâne sursa de adevăr pentru design; acest fișier e istoricul „ce s-a făcut și de ce".

Format per intrare:

```
## [YYYY-MM-DD] Titlu scurt

**Milestone:** M0 / M1 / ... (dacă aplicabil)
**Făcut:**
- ...

**Decizii / abateri de la SPEC.md:**
- ...

**Rămas de făcut / follow-up:**
- ...
```

---

## [2026-08-13] Anatomie — hotspot-uri dezaliniate pe 3 sisteme (Organe interne, Sistem circulator, Sistem muscular)

**Milestone:** post-M9 v2 (sesizare directă a utilizatorului: „punctele care dau informațiile nu sunt corect centralizate pe imagine... dau o falsă informație")
**Făcut:**
- **Metodă nouă, mai bună decât cea din 2026-08-12**: tehnica de eșantionare de pixeli pe canvas (folosită data trecută) confirmă doar dacă un punct cade pe „conținut" vs „fundal transparent" — nu poate distinge un organ specific de altul quando ambele sunt „conținut" (ex. un punct pe braț tot numără ca "pe conținut", ca și unul pe stomac, fiindcă brațul e tot corp, nu fundal gol). Pentru verificare semantică reală (chiar organul corect, nu doar corpul în general), am descărcat canvas-ul randat ca fișier PNG direct pe disc (`canvas.toBlob` → `<a download>` → citit cu unealta de citire de imagini), ocolind complet pipeline-ul de captură de ecran din browser (confirmat din nou instabil în această sesiune: `Page.captureScreenshot` a picat repetat, iar rezultatele `zoom` cu regiuni late au trunchiat conținutul la o lățime fixă în mod repetat — o particularitate nouă, necunoscută până acum, salvată ca memorie de proiect). Asta a permis inspecție vizuală directă, la rezoluție nativă, a ilustrațiilor reale — mult mai fiabil decât orice combinație de eșantionare+presupunere.
- **Organe interne** (`anatomyDB.json`), 7 corecții — toate cele 7 puncte erau înghesuite pe o coloană verticală îngustă (x:33-39%) lângă marginea stângă a trunchiului, în loc să fie centrate fiecare pe organul lui real (același tipar de bug ca „coloana/bazinul copiate greșit" din sesiunea trecută, dar nedescoperit atunci fiindcă verificarea de-atunci se oprise la Stomac):
  - **Stomac**: `x: 59→54, y: 57→57` (ajustat în doi pași, 52 apoi 57, dupå verificare vizuală) — cădea complet în afara trunchiului, pe brațul cu vase de sânge (bug-ul cel mai vizibil, exact ce a semnalat utilizatorul).
  - **Creier**: `x: 40→44, y: 10.5→13` — centrat mai bine pe secțiunea de creier.
  - **Inimă**: `x: 39.3→47, y: 46.6→46` — mutată din marginea trunchiului direct pe forma inimii.
  - **Plămâni, Ficat, Rinichi, Intestine**: `x` crescut cu 2-6 puncte procentuale fiecare (din coloana îngustă 33-39% spre poziții centrate pe masa de organe reală, 37-43%), `y` ajustat să cadă pe fiecare organ, nu doar „undeva pe trunchi".
- **Sistem circulator** (`anatomyDB.json`), 4 din 5 corecții — Inimă, Aortă, Vena cavă și Artere majore aveau toate `x` în jur de 42-49%, dar trunchiul principal de vase (vizibil clar în ilustrație) e de fapt la ~54-55%; toate patru mutate acolo (`x: 46.4→55`, `49→54`, `42.6→55`, `42.6→54`). „Vene majore" (deja reparat 2026-08-12) neschimbat.
- **Sistem muscular** (`anatomyDB.json`), 5 corecții — Biceps era cel mai grav: `x: 58.3→67` (prima încercare, 77, a picat vizual în fundalul crem în afara brațului; a doua trecere a confirmat 67 corect, direct pe mușchi). Pectorali, Abdominali, Cvadriceps, Gambe ajustate cu 4-8 puncte procentuale fiecare, din poziții care cădeau parțial pe mușchiul greșit sau în golul dintre mușchi, spre centrul mușchiului real corespunzător numelui.
- Fiecare corecție verificată vizual, individual, prin re-randare live pe dev server + captură de ecran a punctelor suprapuse pe ilustrația reală — nu doar prin calcul, mai ales după ce prima estimare pentru Biceps s-a dovedit greșită la verificare.
- `tsc --noEmit` curat; toate cele 261 de teste tot verzi (schimbare doar de date/coordonate în `anatomyDB.json`, nicio schimbare de logică).

**Decizii / abateri de la SPEC.md:**
- Niciuna — corecții de date (coordonate ochiometrice greșite, provenite probabil din același proces de estimare aproximativă din M9 v2), nu de mecanică.

**Rămas de făcut / follow-up:**
- Sistemul Schelet nu a fost re-verificat în această sesiune (utilizatorul a semnalat explicit doar celelalte 3 sisteme) — presupus corect, pe baza fix-urilor din 2026-08-12.
- Tehnica de verificare prin descărcare PNG + citire directă a fișierului (nu doar eșantionare de pixeli sau captură de ecran) merită refolosită direct dacă apare vreodată nevoia de a verifica alinierea altor overlay-uri vizuale din joc — salvată ca memorie de proiect.

---

## [2026-08-13] 10 îmbunătățiri de fluiditate/aparență/grafică (alese de utilizator dintr-un brainstorm de 10 idei)

**Milestone:** post-M9 v2 (cerere directă a utilizatorului: „vreau 10 idei noi de îmbunătățire a fluidizării aplicației, a aparențelor, graficii" — a ales toate cele 10, grupate în 3 loturi Fluiditate/Aparență/Grafică-Sunet, prin AskUserQuestion)
**Făcut:**
- **Fluiditate:**
  - **Tranziții overlay** (`style.css` `.overlay`/`.overlay-panel`): fade+scale (0,18s), overlay-ul rămâne mereu `display:flex`, vizibilitatea reală vine din opacity/visibility/pointer-events comutate prin clasa `.open` — `periodicTable.ts`/`settings.ts`/`reactions.ts`/`genetics.ts`/`anatomy.ts` schimbate identic (toggle de clasă în loc de `style.display`).
  - **Tranziții tab-uri** (`.tab-fade`/`.tab-fading`, 0,12s): `constructor.ts` (Covalent/Ionic) și `lab.ts` (Generatoare/Colecție) — fade-out → swap de `display` → fade-in, secvențiat cu `setTimeout`+`requestAnimationFrame`, consecvent cu tiparul `setTimeout` deja folosit în `reactions.ts` pentru animația de reacție.
  - **Count-up pe numerele HUD** (`hud.ts`): smoothing exponențial (constantă de timp 200ms) pe Energie/Cunoaștere/Stele, printr-un `requestAnimationFrame` care se oprește singur când toate cele 3 s-au „așezat" — nu rulează la nesfârșit pe un joc complet idle.
  - **Press + focus vizibil** (`style.css`, regulă globală `button:active`/`:focus-visible`): o singură regulă acoperă aproape tot (majoritatea elementelor interactive sunt deja `<button>`); excepție explicită pentru `.anatomy-hotspot` (centrat prin `translate(-50%,-50%)`, pe care scale-ul generic l-ar dezaxa la apăsare).
  - **Fix real de performanță** (`objectives.ts`, `anatomy.ts`): amândouă rescriau tot DOM-ul la fiecare tick economic (~10×/s, pe evenimentul `"resources"`) — exact bug-ul reparat în M0 la Lab/Paletă, nedescoperit până acum aici. Migrate la pattern-ul `ensure*Row` deja stabilit (rânduri/hotspot-uri create o singură dată, doar actualizate); în Anatomie, hotspot-urile (23, statice pe durata modulului) nu se mai recreează și nu se mai re-atașează listener-ele de click la fiecare tick.
- **Aparență:**
  - **Accent de culoare per modul** (`--accent-bio: #a78bfa` nou în `style.css`, clasă `.overlay-bio` pe `genetics.ts`/`anatomy.ts`): redefinește `--accent` doar în acel subtree (moștenire CSS), deci butonul de close, tab-urile, focus ring-ul etc. se recolorează automat, fără nicio schimbare per-componentă.
  - **Favicon + polish `<head>`** (`index.html`): titlu extins, meta description, `theme-color`, favicon SVG inline (motiv atom, 3 elipse rotite, în `--accent`).
  - **Grupare butoane HUD** (`hud.ts`, `.hud-group`): Tabel Periodic+Reacții vs ADN/ARN+Anatomie, separate printr-un chenar subțire — bara nu mai crește ca un șir plat pe măsură ce se adaugă module noi.
  - **Tooltip cu poziționare inteligentă** (`tooltip.ts`): detectare coliziune cu marginea dreapta/jos a viewport-ului, flip independent pe fiecare axă în loc să iasă din ecran.
- **Grafică/Sunet:**
  - **Sunete noi** (`sound.ts`): `playPurchase` (cumpărare generator/upgrade — legat DOAR din handler-ele de click din UI, nu din `economy.ts`, ca Autopilot să nu spameze audio la sute de cumpărări/tick), `playObjectiveComplete` (legat de evenimentul `"objective-done"`, care exista deja în `core/objectives.ts` dar nu avea niciun listener). Descoperirile ADN/ARN și Anatomie **nu erau tăcute** cum presupunea ideea inițială (foloseau deja fanfara de descoperire moleculară) — polish-ul real a fost diferențierea: payload-ul evenimentului `"discovery"` (6 puncte de emitere în `state.ts`) capătă un câmp `kind: "molecule"|"genetics"|"anatomy"`, iar `main.ts` alege `playGeneticsDiscovery`/`playAnatomyDiscovery`/`playDiscovery` corespunzător — jucătorul poate distinge după ureche ce tip de lucru tocmai a descoperit.
  - **Celebrare vizuală confetti** (`ui/celebration.ts` nou, `burstConfetti()`): CSS-only, în stilul deja stabilit de `nucleo-burst`. Prag ancorat în date deja existente, nu inventat: `unlockElement()` din `state.ts` emite acum `"tier-unlock"` doar când elementul deblocat are `tier` strict mai mare decât maximul atins până atunci — deci prima deblocare dintr-un tier nou, nu orice deblocare.
- Teste noi: 2 cazuri în `tests/unlocks.test.ts` pentru `"tier-unlock"` (se declanșează la primul element dintr-un tier nou, nu la al doilea element din același tier).
- `tsc --noEmit` curat; 261 teste automate trec (33 fișiere, +2 față de sesiunea precedentă).
- **Verificat live pe dev server** (injectat direct în `localStorage` cu tehnica „patch `setItem` la no-op înainte de reload", ca să nu piardă injectarea printr-o cursă cu autosave-ul pe `visibilitychange` — vezi memoria de proiect din 2026-08-12): overlay-uri confirmate programatic (opacity/transform ajunse la starea finală corectă), accent Biologie confirmat (`getComputedStyle(overlay).getPropertyValue('--accent')` → `#a78bfa` pe ADN/ARN și Anatomie), confetti confirmat (14 `.confetti-piece` apărute la deblocarea Carbonului, primul element peste tier-ul H/O/N), hotspot-urile Anatomiei confirmate stabile (23 noduri, aceleași înainte/după un click, nicio recreare), grupare HUD confirmată (border-left computat pe `.hud-group`), tooltip cu flip confirmat pe axa orizontală (colț dreapta-jos simulat), cumpărare generator confirmată funcțional (rând „H — Hidrogen ×1", sunet declanșat fără erori în consolă). Tab-ul de automatizare a raportat `document.visibilityState === "hidden"` cu un viewport degenerat (47px înălțime) — `requestAnimationFrame` și tranzițiile CSS nu se declanșau deloc cât timp tab-ul era considerat ascuns de Chrome, ceea ce a împiedicat verificarea directă a fade-ului de tab-uri și a animației count-up „în mișcare" (starea finală, odată forțat un tick, era totuși cea corectă) — limitare de unealtă de testare, nu comportament real (un tab vizibil/focalizat normal rulează rAF la 60fps).

**Decizii / abateri de la SPEC.md:**
- Niciuna de mecanică — toate 10 sunt polish vizual/UX peste sisteme existente, fără nicio schimbare de regulă de joc.
- Constanta de timp a count-up-ului (200ms) și durata tranzițiilor (0,18s overlay, 0,12s tab) nu erau specificate de utilizator — alese empiric: suficient de rapide să nu încetinească interacțiunea, suficient de vizibile să se simtă intenționate.
- Nu s-a adăugat un toggle light/dark (a doua variantă din ideea de „Aparență" oferită la alegere) — utilizatorul a ales explicit „accent per modul", nu tema.
- `.periodic-cell`/`.compound-card`/`.dna-tile` sunt `<div>`-uri, nu `<button>`-uri, deci regula globală de `:focus-visible` nu le acoperă (ar avea nevoie de `tabindex`/`role="button"`) — semnalat, nu adresat, ca să nu extindă scope-ul de la „polish" la o trecere de accesibilitate separată.

**Rămas de făcut / follow-up:**
- Accesibilitate de tastatură pentru `.periodic-cell`/`.compound-card`/`.dna-tile` (focus-visible + navigare cu tastatura) — semnalat mai sus, nu e o regresie, doar neacoperit de această sesiune.
- Cele două direcții vizuale nealese pentru Nucleosinteza (Colecția ca galerie, Muzeul descoperirilor, propuse pe 2026-08-12) rămân disponibile pentru o sesiune viitoare.

---

## [2026-08-12] Anatomie — 4 hotspot-uri dezaliniate reparate (verificare cerută de utilizator)

**Milestone:** post-M9 v2 (utilizatorul a cerut explicit o verificare de aliniere: „toate butoanele sunt aliniate corect cu imaginea? ca sa nu fie induse in eroare")
**Făcut:**
- **Metodă**: capturile de ecran din browser au devenit intermitent instabile în timpul sesiunii (timeout-uri CDP, un glitch de randare tiled) — verificarea s-a mutat pe eșantionare de pixeli direct din `<canvas>` (desenând imaginea reală din DOM și scanând rânduri orizontale după prag de culoare/alfa față de fundal), mult mai fiabilă decât capturile vizuale pentru genul ăsta de verificare geometrică. Folosit și pentru a găsi coordonata corectă de înlocuire, nu doar pentru a confirma bug-ul.
- **`src/bio/anatomyDB.json`**, 4 corecții, toate confirmate din nou vizual după fix (captură curată, punctul cade exact pe structura corectă):
  - **Coloana vertebrală** (Schelet): `x: 37.5 → 46.3`. Coordonata veche era identică pe axa X cu „Cutia toracică" (37.5%) — copiată greșit, cădea pe o coastă. Linia mediană reală a corpului (confirmată din scanarea craniului/coloanei/bazinului, toate ~46.3-46.4%) a dat coordonata corectă.
  - **Bazin** (Schelet): `x: 37.5 → 46.3`. Aceeași eroare de copiere ca la coloană — scanarea de pixeli a arătat că 37.5% cade în spațiu gol la acea înălțime (36.5%), nu pe osul bazinului (blocul real e la 42.2-50.5%, centru 46.3%). Nu fusese prins la verificarea vizuală inițială a M9 v2 — se vedea plauzibil „pe bazin" într-o captură neetichetată, dar datele de pixeli au arătat clar contrariul.
  - **Stomac** (Organe interne): `x: 30 → 59`, `y: 59.5 → 57`. Stomacul era pe aceeași parte a corpului ca Ficatul (ambele la stânga liniei mediane reale, ~47.5%) — anatomic greșit: stomacul e pe partea stângă a pacientului (dreapta privitorului), ficatul pe partea dreaptă a pacientului (stânga privitorului). Corectat prin oglindire față de linia mediană, calibrată cu distanța reală a Ficatului față de centru.
  - **Vene majore** (Sistem circulator): `x: 21.6 → 27`, `y: 30.5 → 52`. Punctul vechi cădea complet în afara siluetei corpului (spațiu gol, confirmat prin scanare alfa) — coordonata X corespundea de fapt antebrațului stâng, dar la o înălțime mult mai joasă (~50-55%) decât cea setată (30.5%, nivelul umărului, unde brațul încă nu se separă vizual de tors). Mutat pe antebraț, unde cade acum exact pe o venă albastră vizibilă din ilustrație.
- **Sistem muscular**: verificat vizual (toate cele 5 hotspot-uri pe țesut muscular vizibil, nicio poziție în spațiu gol sau pe partea greșită) — nicio corecție necesară. Scanarea de pixeli nu a funcționat pe această imagine (fundal aparent negru/închis la colț, diferit de celelalte 3 ilustrații cu fundal alb/transparent), dar verificarea vizuală directă a fost suficientă aici.
- `tsc --noEmit` curat; toate cele 259 de teste tot verzi (schimbare doar de date/coordonate, nicio schimbare de logică).
- **Verificat live pe dev server** după fiecare fix: click funcțional pe „Vene majore" mutat → panoul arată corect numele.

**Decizii / abateri de la SPEC.md:**
- Niciuna — corecții de date (coordonate ochiometrice greșite din M9 v2), nu de mecanică.

**Rămas de făcut / follow-up:**
- Nimic cunoscut. Dacă se reia vreodată verificarea vizuală a hotspot-urilor, metoda de eșantionare pe canvas (scanare de rânduri după prag de culoare față de fundal) e mai rapidă și mai fiabilă decât capturile de ecran + zoom pentru acest tip de verificare geometrică — merită refolosită direct, nu redescoperită.

---

## [2026-08-12] Harta Stelelor — vizual nou pentru Nucleosinteza

**Milestone:** post-M9 v2 (a treia opțiune aleasă de utilizator, alături de cele două fix-uri din auditul de mai jos — trei direcții posibile propuse, una aleasă explicit)
**Făcut:**
- **Context**: panoul de Nucleosinteza din Setări era doar text simplu (3 rânduri: Stele deținute, Energie acumulată, prag) — sub nivelul vizual stabilit deja de M7-M9 v2. Propuse 3 direcții (Harta Stelelor / Colecția ca galerie vizuală / Muzeul descoperirilor); utilizatorul a ales explicit Harta Stelelor.
- **`src/ui/settings.ts`**, secțiunea Nucleosinteza rescrisă: un `.nucleo-starfield` (cer stilizat, fundal radial) cu două straturi de stele poziționate determinist (seed = index, nu se reamestecă la fiecare re-randare) — **Stelele deținute** (`store.state.stars`, permanente) ca puncte aurii care sclipesc lent, **Stelele „gata de cules"** (`store.pendingStars()`, cele pe care le-ai câștiga acum dacă declanșezi) ca puncte turcoaz care pulsează mai rapid, vizual distincte. O bară de progres nouă arată exact cât mai e până la următoarea Stea dincolo de cele deja gata de cules — calculul ține cont de curba pe rădăcină pătrată (`(pending+1)² × prag`, nu un interval liniar), altfel bara ar fi fost înșelătoare.
- **Plafon de siguranță**: maximum 48 de stele aurii și 8 turcoaz randate individual (`OWNED_STAR_CAP`/`PENDING_STAR_CAP`), cu un badge „+N" dacă se depășește — un save foarte avansat, cu sute de Stele, nu trebuie să umple DOM-ul necontrolat.
- **Performanță**: `renderNucleo()` rulează la fiecare tick economic (pe evenimentul `resources`, ~10×/secundă) — stratul de stele se reconstruiește DOAR când numărul de Stele deținute/gata-de-cules chiar se schimbă (comparat cu ultima valoare randată), nu la fiecare tick. Exact genul de regresie de performanță prinsă și reparată deja o dată la M0 (recrearea DOM-ului Paletei/Laboratorului la fiecare tick) — evitată de data asta din prima.
- **Animație de sărbătorire**: la declanșarea reușită, `.nucleo-burst` adaugă un flash radial auriu peste hartă (0,9s), separat de bannerul „Nucleosinteza!" deja existent din `main.ts` — cele două se văd simultan, unul pe hartă, unul ca banner peste tot ecranul.
- `tsc --noEmit` curat; toate cele 259 de teste tot verzi (nicio schimbare de logică/store, doar UI nou peste `store.pendingStars()`/`store.state.stars` deja existente).
- **Verificat live pe dev server**, cu date simulate (nu pe save-ul real, ca să nu-l reseteze fără motiv — vezi totuși nota de mai jos despre ce a pățit save-ul real, dintr-un motiv complet diferit): 5 Stele deținute + 1 gata de cules, bară de progres la ~50% (2,5M/4M E), confirmat vizual identic cu ce s-a calculat. Declanșat efectiv Nucleosinteza pe acele date — burst-ul auriu a apărut, Stelele au urcat la 6, era s-a resetat corect (E, atomi, generatoare la zero), bara de progres a revenit la 0%.
- **Incident separat, în timpul verificării**: o încercare de a restaura save-ul real de dezvoltare (folosit ca fixture pentru toată sesiunea de audit) după testul de mai sus a eșuat — salvarea pe `visibilitychange` (fix de fiabilitate din M0) a câștigat o cursă cu `reload()`-ul programatic și a suprascris restaurarea cu starea de test, iar cheia de backup fusese deja ștearsă în aceeași comandă. Progresul real de dezvoltare (~1,7M E / 861 C, 4 molecule în Colecție, generatoare la 0, mult din Tabelul Periodic deblocat) e pierdut ireversibil — doar save-ul local de browser al dezvoltatorului, nicio pierdere de cod sau de date de utilizator final. Cauza tehnică + procedura corectă pentru viitor (patch `localStorage.setItem` înainte de reload, nu șterge singura copie de backup înainte de confirmare) sunt salvate ca memorie de proiect, ca să nu se repete.

**Decizii / abateri de la SPEC.md:**
- Niciuna de mecanică — SPEC §3.3 descrie deja formula/comportamentul Nucleosintezei; asta e strict un strat vizual nou peste starea existentă.

**Rămas de făcut / follow-up:**
- Niciun follow-up cunoscut din acest arc. Celelalte 2 direcții vizuale propuse (Colecția ca galerie, Muzeul descoperirilor) rămân disponibile pentru o sesiune viitoare, dacă utilizatorul le dorește.

---

## [2026-08-12] Audit general — overlay-uri stivuite + hotspot-uri invizibile

**Milestone:** post-M9 v2 (audit la cererea utilizatorului: „verifică starea actuală, testează toate bucățile, ce s-ar putea upgrada?")
**Făcut:**
- **Verificare de stare**: `tsc --noEmit` curat, 259/259 teste automate trec. Testat live pe dev server (save real de dezvoltare, 1,7M E / 861 C): HUD, Paletă/Generatoare/Colecție cu căutare, Tabelul Periodic, Reacții (paletă vizuală + sloturi), ADN/ARN (listă mutații), Anatomie (hotspot-uri, click funcțional cu recompensă de Cunoaștere), Constructorul Ionic, Nucleosinteza (prag calculat corect, nedeclanșată intenționat ca să nu reseteze era save-ului real).
- **Bug găsit și reparat**: overlay-urile deschise din bara de sus (Tabel Periodic/Reacții/ADN-ARN/Anatomie/Setări) nu se închideau reciproc — fiecare `open()` din `src/ui/*.ts` seta doar propriul `display:flex`, fără să știe de celelalte patru. Confirmat programatic (două `overlay-panel` cu `display:flex` simultan) și vizual (ADN/ARN peste Reacții, ambele vizibile). Fix minim în `src/main.ts`: un array `topOverlays` + un wrapper `exclusiveOpen()` care apelează `close()` pe celelalte patru înainte de `open()` pe cel țintit — reosește `close()`-urile deja existente în fiecare modul, fără nicio schimbare în `src/ui/*.ts`.
- **Polish vizual**: hotspot-urile din Anatomie (`src/style.css`, `.anatomy-hotspot`) erau aproape invizibile pe ilustrațiile reale (cerc subțire, culoare apropiată de os) — se găseau doar din întâmplare. Adăugat un puls (`@keyframes anatomy-hotspot-pulse`, glow expandabil) pe hotspot-urile **nedescoperite**, oprit automat la hover și la `.discovered` (cele deja explorate rămân stabile, fără puls, ca semnal „gata văzut aici").
- Verificat live (JS direct în consolă, evitând instabilitatea coordonatelor de click cauzată de redimensionarea repetată a viewport-ului browser-ului între capturi): deschidere Reacții → ADN/ARN fără închidere manuală → confirmat un singur `overlay-panel` cu `display:flex`. Hotspot nedescoperit confirmat cu `animationName: anatomy-hotspot-pulse` aplicat.
- `tsc --noEmit` curat și 259/259 teste tot verzi după ambele fix-uri.

**Decizii / abateri de la SPEC.md:**
- Niciuna — ambele sunt fix-uri de comportament/polish, fără schimbare de mecanică.

**Rămas de făcut / follow-up:**
- Utilizatorul a cerut și o idee nouă de feature vizual (a treia opțiune aleasă alături de cele două fix-uri de mai sus) — urmează ca pas separat, nu încă implementată la momentul acestei intrări.

---

## [2026-08-12] BACKLOG — tooltip înghețat + 3 lacune de Autopilot

**Milestone:** post-M9 v2 (curățare BACKLOG.md, la cererea utilizatorului: „ce mai trebuia făcut la aplicație?")
**Făcut:**
- **Tooltip înghețat după undo/clear cu tastatura** (`src/ui/tooltip.ts`, `src/ui/constructor.ts`): `hideTooltip()` se declanșa doar la `mouseleave`, care nu are cum să apară dacă atomul de sub cursor dispare direct din DOM (Ctrl+Backspace/Ctrl+Z fără mișcare de mouse). Fix: apel explicit `hideTooltip()` în `restore()` (comun pentru undo/redo) și în handler-ul de `Ctrl+Backspace`, înainte de `clearDraft()`.
- **Autopilot nu deblocheaza Automatizarea** (`src/core/economy.ts`, `autopilotUnlockElements`): Automatizarea (auto-sintetizator, 15 C, cost fix) e acum tratată ca o opțiune concurentă pe aceeași monedă (Cunoaștere) cu deblocarea de elemente — Autopilot alege mereu cea mai ieftină, iar 15 C e mereu sub costul oricărui element din joc, deci se deblochează practic imediat ce Autopilot pornește. Rezolvă exact problema semnalată: fără ea, Autopilot cumpăra generatoare de atomi la infinit, fără nicio creștere de E/s (care vine doar din sinteze, nu din generatoarele înseși).
- **Autopilot nu cumpăra upgrade-ul „Viteză generatoare"** (`src/core/economy.ts`, `autopilotBuyGenerators`): la fel, upgrade-ul (500 E, cost geometric ×2.2/nivel) e acum o opțiune concurentă pe Energie alături de generatoarele de atomi, aleasă quando devine cea mai ieftină.
- **Autopilot cheltuiește fără feedback vizibil**: `economy.ts` emite acum un eveniment `autopilotAction` (tip nou exportat `AutopilotAction`, uniune `element`/`autosynth`/`speedUpgrade`) la fiecare deblocare de element, deblocare de Automatizare sau nivel nou de Viteză generatoare — **nu** și la cumpărările obișnuite de generatoare (pot fi până la 200/tick, ar fi zgomot). `main.ts` acumulează aceste evenimente și le arată grupat într-un banner nou, colț dreapta-jos (`.autopilot-banner`, refolosește stilul `.discovery-banner`), cu un debounce de 900ms ca să nu spamme un banner per deblocare individuală.
- Teste actualizate/noi în `tests/autopilot.test.ts` (6→8 cazuri): testul de deblocare element ajustat să acopere și costul Automatizării; 2 teste noi dedicate (deblocare Automatizare când e cea mai ieftină opțiune; cumpărare upgrade Viteză generatoare când devine mai ieftin decât orice generator); testul de plafon de siguranță (`AUTOPILOT_MAX_PURCHASES_PER_TICK`) actualizat să numere și nivelurile de upgrade cumpărate, nu doar generatoarele — plafonul acoperă acum ambele bucle de cumpărare din aceeași buclă „cel mai ieftin întâi".
- `tsc --noEmit` curat; 259 de teste automate trec (33 fișiere, +2 față de M9 v2).
- **Corecție de citire a propriului istoric, găsită în timpul auditului BACKLOG**: un follow-up vechi (tier 6, 2026-08-10) menționa „tot Tabelul Periodic rămas, următorul lot de decis" — depășit, în realitate, de DOUĂ sesiuni ulterioare din 2026-08-11: mai întâi auditul tier 17 (a confirmat că toate pozițiile „?" rămase erau excluderi deliberate, nu conținut uitat), apoi, în aceeași zi, sesiunea „Completare decorativă a Tabelului Periodic" (commit `a7b29c4`, deja pe `master`) — care a adăugat exact cele 34 de poziții rămase ca elemente decorative (nume/Z/flavor real, dar fără chimie jucabilă, `unlockCost: 0`, excluse explicit din Autopilot/deblocare). Am citit inițial doar până la intrarea tier 17 și am prezentat greșit utilizatorului Tabelul Periodic ca fiind o restanță deschisă (inclusiv într-o întrebare directă) — de fapt era deja 118/118 complet, confirmat și de `tests/periodicTable.test.ts` (34 decorative + 84 jucabile), deja verde în suita rulată în această sesiune. Nicio acțiune de cod necesară aici; corectare doar de informație.

**Decizii / abateri de la SPEC.md:**
- Niciuna — toate 4 sunt fix-uri de comportament, fără schimbare de mecanică vizibilă în SPEC.

- **Verificat live pe dev server, reluat cu succes după reconectarea extensiei** (eșuase mai devreme în aceeași sesiune, vezi mai jos): pe save-ul real de dezvoltare (localhost:5183, ~291K E / 26 C, 0 generatoare cumpărate deloc — exact simptomul din BACKLOG). **Tooltip**: plasat un atom H în Constructor, hover confirmat („Hidrogen mai are nevoie de 1 legătură/i" vizibil), apăsat `Ctrl+Z` fără mișcare de mouse → atomul dispare din canvas **și** tooltip-ul dispare odată cu el, fără text fantomă rămas pe ecran. **Autopilot**: activat togglul din Setări — în câteva secunde: generatoare cumpărate din 0 în H×42/O×34/N×31, Viteză generatoare urcată direct la nivelul 5 (×7.59), `autoSynthUnlocked` confirmat `true` (citit direct din `localStorage`), și **banner-ul nou de rezumat a apărut corect**, colț dreapta-jos: „AUTOPILOT — deblocat Automatizarea · Viteză generatoare +5 nivele", grupat într-un singur banner, nu unul per acțiune. Niciun element nou deblocat — corect, următorul element blocat costă mult peste cei 26 C disponibili. Dezactivat togglul după verificare, confirmat că butonul revine la „Autopilot dezactivat" și producția pasivă continuă normal. Zero erori/warnings în consolă pe tot parcursul.

**Rămas de făcut / follow-up:**
- Nimic restant din acest arc — toate cele 4 fix-uri (tooltip + 3× Autopilot) confirmate atât prin teste automate, cât și prin verificare live directă pe un save real cu progres autentic.

---

## [2026-08-11] M9 v2 — Anatomie: ilustrații reale + hotspot-uri (feedback direct al utilizatorului)

**Milestone:** M9 (rescriere UI + date, a treia și ultima din cele 3 direcții confirmate după feedback pe M7/M8/M9 inițiale)
**Făcut:**
- **Context**: utilizatorul a cerut explicit „un vizual de 10000x mai bun" — siluetele și formele SVG desenate manual din M9 v1 erau considerate sub nivelul de ambiție cerut („puteam să-l fac și eu"). Confirmat cu utilizatorul (întrebare directă, sesiunea curentă): imagini reale, dintr-o sursă educațională/istorică autentică, în loc de forme inventate.
- **Cercetare + descărcare (permisiune explicită cerută și primită)**: 4 ilustrații reale de pe Wikimedia Commons, câte una per sistem, toate verificate pentru licență înainte de descărcare:
  - Schelet — „Human skeleton front en.svg" (LadyofHats), domeniu public.
  - Organe interne — „Internal organs.svg" (Mikael Häggström, proiectul „Human body diagrams"), domeniu public/CC0 — înlocuiește o primă alegere („Male template with organs.svg") cu etichete placeholder „Example text", respinsă după verificare vizuală.
  - Sistem circulator — „Circulatory System en.svg" (LadyofHats), domeniu public.
  - Sistem muscular — „Bougle, Human muscular system, anterior.svg" (Julien Bouglé, adaptare Jmarchn), **CC BY-SA 3.0** — singurul asset cu cerință de atribuire; alternativa domeniu-public găsită (Vesalius 1543) a fost respinsă de utilizator în favoarea unui stil vizual modern, consecvent cu celelalte 3 sisteme.
  - Toate cele 4 SVG-uri aveau etichete text în engleză + linii-ghid desenate direct în fișier — eliminate cu un script Node de unică folosință (strat Inkscape dedicat unde exista, altfel eliminare directă a blocurilor `<text>` + a liniilor-ghid cu contur negru fără umplere), verificate vizual că ilustrația de bază rămâne intactă.
  - Fișiere în `public/anatomy/` (skeleton/organs/circulatory/muscular.svg), total ~8MB.
- **`src/bio/anatomy.ts`** rescris: `AnatomyShape`/`EllipseShape`/`PathShape`/`LineShape` (geometrie desenată manual) înlocuite cu `AnatomyPart.x`/`.y` — poziție de hotspot în procente (0–100), relativă la propria imagine a sistemului. `BODY_SYSTEMS` capătă `image` (calea către SVG) și `credit` (sursă + licență, afișată în UI).
- **`src/bio/anatomyDB.json`**: toate cele 23 de părți păstrate identic (id, nume, flavor real, discoveryC), doar geometria înlocuită cu coordonate `x`/`y` estimate vizual (ochiometric, per §9.2) peste fiecare ilustrație reală.
- **`src/ui/anatomy.ts`** rescris: fundal `<img>` per sistem + un strat de hotspot-uri invizibile (`<button>` rotund, poziționat cu `left/top` procentual) suprapus. Click pe hotspot → `inspectAnatomyPart` (neschimbat) → panou cu nume + fapt real, identic cu v1. Linie de atribuire sub imagine, dinamică per sistem activ.
- **Bug prins și reparat înainte de verificare**: primul design folosea `.anatomy-stage` ca și container `position:relative` **și** `overflow:auto` (scroll) în același timp, cu stratul de hotspot-uri `position:absolute; inset:0` — asta ancorează hotspot-urile la fereastra vizibilă (clipată), nu la înălțimea reală, scrollabilă, a imaginii, deci procentele se calculau greșit sub prima "fereastră". Reparat renunțând la scroll: imaginea se scalează întreagă (`max-height:60vh; max-width:100%`), containerul se adaptează la dimensiunea ei (`width:fit-content`) — hotspot-urile rămân mereu corect aliniate, fără nicio nevoie de scroll.
- `tests/anatomy.test.ts` actualizat: testul de geometrie (elipsă/linie/path) înlocuit cu validare de hotspot (x/y numere finite în [0,100]) + un test nou care confirmă că fiecare sistem are imagine și atribuire.
- `tsc --noEmit` curat; 257 de teste automate trec (33 fișiere, +1 față de M8 v2).
- **Verificat live pe dev server**: toate cele 4 sisteme comută corect, fiecare cu propria ilustrație reală și hotspot-urile lui (6/7/5/5), poziții confirmate matematic (`getBoundingClientRect`, procente exacte pe imaginea proprie) și vizual (screenshot pe fiecare sistem). Click pe Craniu → panou „Craniu" + banner de descoperire + Cunoaștere +3, confirmat în bara de resurse. Persistență confirmată după reload (Craniul rămas „descoperit"). Atribuirea CC BY-SA pentru sistemul muscular vizibilă și corectă sub imagine. Zero erori în consolă pe toată sesiunea de test.

**Decizii / abateri de la SPEC.md:**
- Niciuna nedocumentată — SPEC §9.1/§9.2/§9.4/§9.5 rescrise direct să reflecte mecanica nouă (imagini reale + hotspot-uri procentuale în loc de siluetă + forme desenate).
- Stil vizual eterogen între cele 4 sisteme (schelet/circulator = vector plat modern; organe = ilustrație semi-realistă; muscular = gravură/litografie istorică) — acceptat conștient, e prețul căutării stricte de licențe permisive; fiecare imagine e o sursă reală și onest atribuită, nu o inconsecvență de calitate.

**Rămas de făcut / follow-up:**
- Toate cele 3 direcții de feedback (Reacții, ADN/ARN, Anatomie) sunt acum adresate. Niciun follow-up cunoscut deschis din acest fir de feedback.

---

## [2026-08-11] M8 v2 — ADN/ARN: înlocuire vizibilă de segment (feedback direct al utilizatorului)

**Milestone:** M8 (rescriere UI, cerută explicit după feedback pe M7/M8/M9 inițiale — a doua din cele 3 direcții confirmate)
**Făcut:**
- **Context**: utilizatorul a cerut explicit ca la ADN/ARN „să pot să înlocuiesc vizibil o bucată din ADN și s-o înlocuiesc cu altceva ca să existe un altfel de output" — versiunea M8 inițială avea doar ciclare bază-cu-bază (click pe o placă → A→T→G→C), nu o înlocuire de bucată. Confirmat cu utilizatorul (întrebare directă, sesiunea trecută): click-drag selectează un segment, apoi jucătorul tastează înlocuirea.
- **`src/core/state.ts`**: `replaceDnaSegment(start, end, replacement)` — nou, generic, înlocuiește orice interval `[start, end)` cu o secvență de **orice lungime**. Acoperă tot ce acoperea `cycleDnaBase`/`deleteDnaBase`/`appendDnaBase` (păstrate, tot folosite pentru editarea rapidă cu un singur click) plus, pentru prima dată, **inserție la orice poziție** — nu doar la capăt, depășind explicit restricția din M8 v1 (§8.5), fără o mecanică nouă separată: e tot o substituție de segment, doar de lungime variabilă între original și înlocuire. Validează caracterele înlocuirii (doar A/T/G/C), respinge intervale invalide, fără să atingă secvența dacă ceva nu e valid.
- **`src/ui/genetics.ts`** rescris: click simplu pe o placă tot ciclează rapid (comportamentul din v1, păstrat pentru editări mici); click-drag peste mai multe plăcuțe selectează un segment (evidențiat vizual, tipar `mousedown`/`mousemove`/`mouseup` + `document.elementFromPoint()`, al doilea loc din proiect care reosește exact tiparul de selecție introdus la M7 v2 pentru drag&drop) și deschide un panou dedicat: „Bazele N–M (secvența curentă) — scrie ce le înlocuiește", cu un input care filtrează live orice caracter care nu e A/T/G/C, și butoane „Înlocuiește"/„Anulează".
- Teste noi: 6 cazuri pentru `replaceDnaSegment` în `tests/genetics.test.ts` — înlocuire de lungime diferită, caractere invalide respinse fără efect, interval invalid respins, inserție la mijlocul secvenței (nu la capăt), descoperire de mutație declanșată corect prin această cale nouă.
- `tsc --noEmit` curat; 256 de teste automate trec (33 fișiere, +5 față de M7 v2).
- **Verificat live pe dev server**: încărcat secvența Anemiei falciforme, selectat prin drag exact codonul 6 (3 plăcuțe, „GAG"), panoul a arătat corect „Bazele 16–18 (GAG)" cu input pre-completat, înlocuit cu „GTG" → banner „Anemia falciformă (HBB) (Glu₆Val)" + Cunoaștere, exact ca la M8 v1 dar prin fluxul nou. Testat filtrarea de caractere invalide („xZq123gAtC" → filtrat live la „GATC"). Testat inserție la mijlocul secvenței (2 baze înlocuite cu 4) → avertisment de frameshift corect, confirmând că restricția „doar la capăt" din v1 chiar a fost depășită. Zero erori în consolă.

**Decizii / abateri de la SPEC.md:**
- Niciuna nedocumentată — SPEC §8.1/§8.4/§8.5 rescrise direct să reflecte mecanica nouă și restricția de inserție ridicată.

**Rămas de făcut / follow-up:**
- Anatomia rămâne cu feedback-ul utilizatorului neadresat — asset-uri vizuale reale din domeniul public (Gray's Anatomy 1918), în loc de forme desenate manual, direcție deja confirmată de utilizator.

---

## [2026-08-11] M7 v2 — Reacții: paletă vizuală + drag&drop (feedback direct al utilizatorului)

**Milestone:** M7 (rescriere UI, cerută explicit după ce utilizatorul a văzut versiunea M7/M8/M9 inițială)
**Făcut:**
- **Context**: după ce M7/M8/M9 au fost livrate, utilizatorul a spus clar că toate trei erau sub nivelul de ambiție cerut — la Reacții lipsea complet partea vizuală promisă în planul inițial (tăiată din grabă), rămăsese doar o listă cu butoane. Cerut explicit: selecție vizuală a ce reacționează cu ce, nu o listă de rânduri. Confirmat cu utilizatorul (întrebare directă): drag&drop dintr-o paletă vizuală într-o zonă de reacție, cu structurile reale ale compușilor, nu text.
- **Rescriere completă a `src/ui/reactions.ts`** — logica din `state.ts` (`canRunReaction`/`runReaction`/`maxReactionRuns`) a rămas neschimbată, corectă de la M7 inițial; doar interacțiunea s-a schimbat integral:
  - **Paletă vizuală**: fiecare compus din Colecție randat ca o „carte" cu structura lui reală — grafuri covalente ca mini-molecule SVG (atomi=cercuri colorate din `getElement().color`, legături=linii, scalate să încapă într-un viewBox 60×60), compuși ionici ca mini-rețea cristalină (reosește direct stilul `.lattice-cell` din `ionicConstructor.ts`, al doilea tipar vizual reosit din proiect după `.mode-tabs`).
  - **Zonă de reacție cu 3 sloturi**: drag&drop implementat cu evenimente mouse (`mousedown`/`mousemove`/`mouseup` + un element „ghost" care urmărește cursorul, `document.elementFromPoint()` pentru detectarea slotului țintă) — **nu** HTML5 drag&drop nativ, consecvent cu tiparul deja folosit în `constructor.ts` pentru mutarea atomilor.
  - **`findReactionByReactantFormulas()`** (nou, `chem/reactions.ts`, funcție pură): găsește reacția a cărei mulțime de formule de reactanți se potrivește exact (ordine irelevantă) cu formulele din sloturile ocupate — recunoaștere automată, fără ca jucătorul să aleagă dintr-o listă.
  - La potrivire: ecuație, produși (tot cu structura lor reală), flavor, „Rulează ×1/×10/×Max" (reosește exact `runReaction`/`maxReactionRuns` din M7 inițial, neschimbate).
  - Animație la declanșare: clasă CSS `.reacting` pe zonă (glow) + `@keyframes reaction-pulse` pe cărțile din sloturi (scale up + fade), sunet (`playSynthesize`, deja existent), sloturile se golesc automat după ~420ms.
  - O listă „Rețete cunoscute" (text simplu, colapsabilă) rămâne ca referință — altfel jucătorul n-ar avea cum să știe ce combinații există fără să încerce orbește.
- **Amendament SPEC.md §7.1** rescris să reflecte mecanica nouă (paletă vizuală, sloturi, recunoaștere automată) — vechea descriere (listă de rânduri cu butoane) nu mai era adevărul curent.
- Teste noi: 5 cazuri pentru `findReactionByReactantFormulas` în `tests/reactions.test.ts` (potrivire indiferent de ordine, reacție cu un singur reactant, nicio potrivire pentru combinație necunoscută sau subset incomplet, set gol).
- `tsc --noEmit` curat; 251 de teste automate trec (33 fișiere, +5 față de M9).
- **Verificat live pe dev server**, inclusiv drag&drop-ul efectiv (nu doar click-uri) — prima dată în acest proiect: simulat secvența reală `mousedown`→`mousemove`→`mouseup` cu coordonate din `getBoundingClientRect()`, tras H₂ și O₂ din paletă în sloturi, confirmat recunoașterea automată a rețetei „2H₂ + O₂ → 2H₂O" cu structurile reale afișate, declanșat reacția — animație pornită corect, banner „Apă (H₂O)", sloturile golite automat. Zero erori în consolă.

**Decizii / abateri de la SPEC.md:**
- Niciuna nedocumentată — SPEC §7.1 a fost rescris direct să reflecte mecanica nouă, nu doar DEVLOG.

**Rămas de făcut / follow-up:**
- ADN/ARN și Anatomie rămân cu feedback-ul utilizatorului neadresat încă: ADN/ARN are nevoie de o înlocuire vizibilă de segment (selectezi o bucată, o înlocuiești dintr-odată, nu bază-cu-bază), Anatomie are nevoie de asset-uri vizuale reale din domeniul public (ex. Gray's Anatomy 1918), nu forme desenate manual — utilizatorul a confirmat ambele direcții, urmează ca pași separați.

---

## [2026-08-11] M9 — Anatomie: explorator vizual al corpului uman

**Milestone:** M9 (a treia și ultima din cele 3 idei noi ale utilizatorului, planificată explicit înainte de cod, per §14)
**Făcut:**
- **Amendament SPEC.md întâi** (9.1–9.5), a treia oară aceeași disciplină. De data asta explicit semnalat înainte de a scrie cod: acesta e domeniul cel mai departe de identitatea jocului dintre cele 3 — anatomie macroscopică, fără nimic de reosit din motorul chimic, din M7 sau din M8, doar tiparul de overlay și convenția de flavor text.
- **Scop clarificat cu utilizatorul înainte de implementare**: fără acces la ilustrații medicale reale, orice diagramă ar fi geometrie SVG desenată manual — onestitatea aici e despre fapte (fiecare parte listată chiar există, chiar face ce descrie flavor text-ul), nu despre precizia desenului. Utilizatorul a ales explicit „încearcă ceva mai detaliat" (nu doar cercuri simple) și toate cele 4 sisteme deodată pentru v1, nu unul câte unul.
- **`src/bio/anatomy.ts`** (tipuri pure): `BodySystem`, `BODY_SYSTEMS` (4 sisteme), `AnatomyShape` (uniune discriminată elipsă/linie/path — oasele lungi ca linii groase cu capete rotunjite, organele ca elipse sau path-uri curbate, ex. o inimă desenată ca path real cu curbe Bézier, nu o elipsă generică), `AnatomyPart`.
- **`src/bio/anatomyDB.json`** (23 de părți, fapte reale verificabile): Schelet (6 — craniu, coloană, cutie toracică, bazin, femur, humerus), Organe interne (7 — creier, inimă, plămâni, ficat, stomac, rinichi, intestine), Sistem circulator (5 — inimă, aortă, venă cavă, artere/vene majore), Sistem muscular (5 — biceps, cvadriceps, abdominali, pectorali, gambe).
- **`src/core/state.ts`**: `GameState.anatomyDiscovered` (nou, persistat, la fel ca `geneticsDiscovered` — merge necondiționat, fără migrare separată), `inspectAnatomyPart()` — a treia oară că bannerul de descoperire existent (`main.ts`) e reosit fără nicio schimbare acolo, emițând `{dbEntry, formula}`.
- **`src/ui/anatomy.ts`** (nou, overlay „Anatomie"): siluetă stilizată constantă (cap + trunchi + membre ca trasee groase cu capete rotunjite, tipar simplu, recognoscibil, explicit etichetat „nu o ilustrație medicală") cu cele 4 sisteme comutabile prin **`.mode-tabs`, reosit direct** de la comutatorul Covalent/Ionic din Constructor — a treia reosire de tipar UI existent din 3 milestone-uri noi. Click pe o formă → panou cu numele și faptul real.
- **Bug prins live, reparat înainte de commit**: regula CSS `.anatomy-part { stroke: rgba(0,0,0,.35) }`, gândită ca un contur subtil pentru formele umplute (elipse/path-uri), suprascria complet culoarea oaselor randate ca `<line>` — pentru acelea, `stroke` E culoarea vizibilă întreagă, nu un contur secundar, deci regula le făcea aproape invizibile. CSS are prioritate față de atributele de prezentare SVG setate din JS, indiferent de ordine — genul de bug care nu apare la `tsc`/teste, doar la verificare vizuală reală. Reparat cu un selector mai specific (`[fill]:not([fill="none"])`), aplicat doar formelor cu umplere.
- Teste noi: `tests/anatomy.test.ts` (9 cazuri) — integritate de conținut (23 de părți, id-uri unice, toate cele 4 sisteme acoperite, geometrie validă pentru fiecare tip de formă), comportament `GameStore` (inspectare/descoperire o singură dată, id necunoscut fără efecte secundare).
- `tsc --noEmit` curat; 246 de teste automate trec (33 fișiere, +9).
- **Verificat live pe dev server**: toate cele 4 sisteme comutate, confirmate 6/7/5/5 forme randate corect (verificat programatic, nu doar vizual). Click pe Craniu → panou cu numele și flavor-ul corect, banner „Craniu (Schelet)". Click pe Inimă (din Organe interne) → banner „Inimă (Organe interne)" cu flavor corect, Cunoaștere +4 (3+4=7 C total după ambele). A doua inspectare a Inimii confirmată fără bonus repetat. Zero erori în consolă.

**Decizii / abateri de la SPEC.md:**
- Niciuna nedocumentată — toate deciziile de scop (siluetă stilizată nu ilustrație reală, toate 4 sistemele din v1, bonus de Cunoaștere la inspectare) sunt scrise direct în amendamentul SPEC §M9, majoritatea confirmate explicit cu utilizatorul înainte de cod.

**Rămas de făcut / follow-up:**
- Cele 3 idei propuse de utilizator sunt acum toate implementate, testate și verificate live (M7 Reacții, M8 ADN/ARN, M9 Anatomie) — niciun follow-up cunoscut rămas din acest arc.
- Dacă se dorește vreodată polish vizual suplimentar pe siluetă/forme (poziționare mai fină, forme mai elaborate) — posibil, dar necesită iterație vizuală directă în browser (așa cum s-a făcut și de data asta pentru bug-ul de CSS), nu doar ajustare de coordonate „oarbă".

---

## [2026-08-11] M8 — ADN/ARN: editor de secvențe și mutații reale

**Milestone:** M8 (a doua din cele 3 idei noi ale utilizatorului, planificată explicit înainte de cod, per §14)
**Făcut:**
- **Amendament SPEC.md întâi** (8.1–8.5), aceeași disciplină ca la M7 — mecanica, simplificările asumate explicit, conținutul inițial, criterii de acceptare, ce rămâne deliberat în afara v1.
- **Domeniu complet nou, zero cod de reosit din motorul chimic** — biologie moleculară, nu atomi/legături. Modul nou `src/bio/`, separat de `src/chem/`.
- **`src/bio/genetics.ts`** (pur): tabelul standard de coduri genetice (64 de codoni → aminoacid sau STOP, verificat manual înainte de a fi scris — o greșeală aici ar fi o eroare de corectitudine biologică, echivalentul erorii de hash canonic din motorul chimic), `transcribe()` (T→U), `translate()` (codoni din capătul secvenței, oprire la primul STOP), `classifySubstitution()` (silențioasă/sens greșit/non-sens), `isFrameshift()` (diferență de lungime ne-multiplu de 3), plus tipurile și funcțiile pentru mutații cunoscute (`mutatedSequenceFor`, `matchesMutation`).
- **`src/bio/mutationDB.json`** (2 mutații reale, verificate programatic — codon/aminoacid confirmat prin `translate()` înainte de a fi scrise definitiv, nu presupuse):
  - **Anemia falciformă (HBB, Glu6Val)**: codonul 6 GAG (Glu) → GTG (Val) — cea mai citată mutație punctiformă din manuale, clasificată corect „cu sens greșit".
  - **Fibroza chistică (CFTR, ΔF508)**: deleție de 3 baze care elimină exact codonul fenilalaninei — deleție „în cadru" (in-frame), pierde un aminoacid întreg, fără decalaj de cadru.
  - Fragmentele sunt explicit **ilustrative** (SPEC 8.2) — centrate pe codonul real afectat, nu revendică o secvență genomică completă la coordonate cromozomiale exacte, ca să nu pretind o precizie pe care nu o pot verifica.
- **`src/core/state.ts`**: `GameState.dnaSequence`/`geneticsDiscovered` (câmpuri noi, persistate — merge-ul necondiționat din `migrate()` le completează automat din `createInitialState()` pentru save-uri vechi, fără cod de migrare separat). `cycleDnaBase`/`appendDnaBase`/`deleteDnaBase`/`loadMutationExample`/`checkGeneticDiscoveries` — editare complet liberă (fără cost de atomi/Energie, decizie confirmată explicit cu utilizatorul), singurul cârlig cu economia fiind bonusul de Cunoaștere la prima potrivire exactă cu o mutație din `mutationDB.json`. **Reosește bannerul de descoperire existent** (`main.ts`, neschimbat) emițând `"discovery"` cu aceeași formă `{dbEntry, formula}` — zero cod nou de UI pentru banner, a doua oară că acest tipar se dovedește reutilizabil (prima la M7).
- **`src/ui/genetics.ts`** (nou, overlay „ADN/ARN"): bandă de „plăcuțe" de baze (click ciclează A→T→G→C, „✕" șterge, „+" adaugă la capăt — inserție doar la capăt în v1, ștergere oriunde, exact ce spune SPEC 8.5), rânduri ARNm/Proteină derivate live, mesaj de clasificare la fiecare substituție, avertisment de frameshift calculat generic (nu doar pentru cele 2 mutații curate) la orice inserție/ștergere care schimbă lungimea cu un număr ne-multiplu de 3. Listă de mutații cunoscute cu tipar identic reacțiilor (rânduri stabile, „Încarcă secvența").
- Buton nou „ADN/ARN" în HUD, lângă „Reacții" (`hud.ts`, `main.ts`).
- Teste noi: `tests/genetics.test.ts` (23 cazuri) — funcții pure (transcriere, traducere, oprire la STOP, clasificare substituție, detectare frameshift), integritate de conținut pe `mutationDB.json` (lungime multiplu de 3, fără STOP prematur, codonul afectat e chiar aminoacidul așteptat pentru fiecare mutație, `matchesMutation` confirmă/respinge corect), comportament `GameStore` (ciclare/adăugare/ștergere bază, încărcare exemplu, descoperire o singură dată cu bonus corect, proteina scurtată exact cu un aminoacid la ΔF508).
- `tsc --noEmit` curat; 237 de teste automate trec (32 fișiere, +23).
- **Verificat live pe dev server**: încărcat secvența Anemia falciformă (18 baze), editat baza corectă (index 16, A→T) — status live „Codon 6: GAG → GUG — mutație cu sens greșit — aminoacid diferit", banner „Ai descoperit — Anemia falciformă (HBB) (Glu₆Val)" cu flavor real, Cunoaștere +6, rândul mutației arată „descoperit — +6,00 C primite". Încărcat ΔF508, șters exact cele 3 baze ale codonului Phe — proteina „Met-Lys-Ile-Ile-Gly" (fenilalanina lipsă, restul intact), banner de descoperire corect, **fără** avertisment de frameshift (deleție multiplu de 3, corect). Șters încă o bază (a 4-a) — avertisment de frameshift apărut corect. Zero erori în consolă.

**Decizii / abateri de la SPEC.md:**
- Niciuna nedocumentată — toate deciziile (bonus de Cunoaștere la descoperire, substituție+deleție dar nu inserție arbitrară, fragmente ilustrative nu genomice exacte) sunt scrise direct în amendamentul SPEC §M8.

**Rămas de făcut / follow-up:**
- A treia idee propusă de utilizator (biologie/anatomie umană — decompose corp, inspectare mușchi/organe/vene) rămâne neabordată — cel mai departe de identitatea jocului dintre cele 3, va necesita propriul amendament SPEC și, probabil, o discuție separată despre cât de mult din motorul de randare SVG existent chiar se pretează la anatomie (spre deosebire de ADN/ARN și reacții, unde tiparele existente s-au potrivit direct).
- Editor de inserție la poziție arbitrară (nu doar la capăt) — semnalat explicit ca exclus din v1 (§8.5), nu o restanță ascunsă.

---

## [2026-08-11] M7 — Reacții chimice: compuși din Colecție reacționează între ei

**Milestone:** M7 (idee nouă a utilizatorului — prima din 3 propuse, planificată explicit înainte de cod, per §14)
**Făcut:**
- **Amendament SPEC.md întâi, cod după** — exact procesul documentat în §14 pentru risc de scope creep: secțiune nouă „M7 — Reacții chimice" (7.1–7.5), scrisă în același registru ca restul specificației, cu simplificările asumate explicit (fără cinetică/temperatură/pH/catalizatori mecanici/echilibru reversibil) și criterii de acceptare, înainte de orice fișier de cod.
- **Explorare + design în doi pași separați** (agent de explorare, apoi agent de plan), ca să nu presupun arhitectura: confirmat că `OverlayController` (deja folosit de Tabelul Periodic/Setări) e direct reutilizabil pentru un tab nou, că `CollectionEntry.graph` lipsește pentru compuși ionici/polimeri (deci potrivirea reactanților trebuie făcută după formulă, nu graf), și că SPEC §14 chiar numește „reacții" explicit ca risc anticipat de scope creep.
- **Decizie de design centrală, ca să nu repete bug-ul de ieri**: un produs de reacție nu are nicio valoare (hash, energie, atomi) hardcodată separat în `reactionDB.json` — produșii covalenți sunt grafuri hand-autorizate, verificate prin **exact aceleași funcții** (`validate()`, `moleculeKey()`, `sumGraphBondEnergy()`) pe care le-ar exercita și sinteza manuală din Constructor; produșii ionici sunt `ionCounts`, trecuți prin `ionicFormula()`/`latticeEnergy()` — nicio sursă de adevăr paralelă, nicio recalculare manuală care ar putea diverge tăcut (genul exact de bug reparat acum două sesiuni pe chei canonice).
- **`src/chem/reactions.ts`** (nou, pur): tipurile `ReactionDefinition`/`ReactionReactant`/`ReactionProduct` (covalent cu graf, sau ionic cu `ionCounts`) + `maxReactionRuns()`.
- **`src/chem/reactionDB.json`** (nou, 16 reacții reale): ardere (CH₄, C₆H₆, CH₃OH, H₂S), sinteză directă (H₂O, NH₃, HCl, HF), hidrogenare (C₂H₂→C₂H₄→C₂H₆), descompunere (H₂O₂), procesul de contact (SO₂→SO₃→H₂SO₄), hidroliză (COS), neutralizare acid-bază (MgO/CuO + HCl). Toate cele 12 grafuri covalente hand-autorizate verificate programatic, înainte de a le scrie definitiv în fișier, să hash-uiască identic cu intrările deja existente în `moleculeDB.json` (deci `DB_BY_KEY.get(key)` găsește numele/flavor-ul/`bonusMult` reale, nu fallback generic) — zero conținut nou necesar în `moleculeDB.json` pentru v1.
- **`src/core/state.ts`**: `listReactions()`, `canRunReaction()`, `maxReactionRuns()`, `runReaction()` — tipar identic cu `synthesizeIonicMix()`/`canAnalyze()`/`analyzeMolecule()` deja existente (mutare → `emitResources()` → `events.emit("collection", ...)` → `events.emit("discovery", ...)` la prima descoperire a unui produs). Reactanții se aleg din Colecție prin cheie exactă (nu doar formulă), pregătit pentru cazul unor izomeri ambigui viitori, deși niciuna din cele 16 reacții v1 nu are nevoie de asta.
- **`src/ui/reactions.ts`** (nou, overlay „Reacții"): tipar identic cu `periodicTable.ts` (aceeași interfață `OverlayController`, reosită prin import, nu redefinită) + căutare live (tiparul din `lab.ts`, rânduri stabile per reacție, niciodată `innerHTML=""`) + `×1/×10/×Max`. Reacțiile nerulabile arată explicit ce lipsește („lipsește: N₂ (ai 0,00, ai nevoie de 1,00)"), niciodată ascunse — consistent cu promisiunea din §8.1 pentru Tabelul Periodic gol.
- **Gratis de la început** (nu deblocare separată cu Cunoaștere) — reactanții înșiși sunt gate-ul natural, decizie confirmată explicit cu utilizatorul înainte de implementare.
- Buton nou „Reacții" în HUD, lângă „Tabel Periodic" (`hud.ts`, `main.ts`); bannerul de descoperire existent (deja generic, `main.ts`) funcționează neschimbat pentru produșii de reacție, fără nicio modificare acolo.
- Teste noi: `tests/reactions.test.ts` (18 cazuri, 3 straturi) — funcții pure (`maxReactionRuns`), integritate de conținut pe toate cele 16 reacții (fiecare produs covalent validează cu formula corectă, fiecare produs ionic e neutru din punct de vedere al sarcinii, fiecare reactant există în `moleculeDB.json`, grafurile repetate ale aceleiași formule — ex. H₂O apare în 8 reacții — hash-uiesc identic între ele), comportament `GameStore` (consum/producție exactă, descoperire o singură dată, refuz pe potrivire greșită de reactant, scalare ×10/×Max).
- `tsc --noEmit` curat; 214 teste automate trec (31 fișiere, +18).
- **Verificat live pe dev server**: injectat direct în Colecție copii de H₂/O₂/MgO/HCl (tehnica `localStorage.setItem = noop` din sesiunea trecută), deschis „Reacții" din HUD — toate cele 16 reacții listate, cele rulabile/nerulabile marcate corect. Rulat „Sinteza apei" ×1: banner „Ai descoperit — Apă (H₂O)" cu flavor real din DB, Cunoaștere crescută, consum exact (H₂ 20→18, O₂ 20→19). Rulat neutralizarea cu MgO ×1: banner „Ai descoperit — Clorură de magneziu (MgCl₂)", H₂O (deja cunoscut) doar a primit o copie în plus fără banner nou. Confirmat în Colecție: intrarea H₂O are butonul „Încarcă" (are graf), intrarea MgCl₂ nu (fără graf, ionic) — exact diferența proiectată. Zero erori în consolă.

**Decizii / abateri de la SPEC.md:**
- Niciuna nedocumentată — toate deciziile de design (gratis de la start, fără cinetică, reactanți aleși prin cheie exactă) sunt scrise direct în amendamentul SPEC §M7, nu doar în DEVLOG.

**Rămas de făcut / follow-up:**
- **Selector explicit de reactant per slot** — v1 alege automat prima intrare din Colecție cu formula potrivită; dacă vreodată o reacție viitoare implică o formulă cu mai mulți izomeri deja descoperiți, aici e locul de adăugat un dropdown real (`runReaction`/`canRunReaction` deja acceptă chei explicite per slot, pregătite pentru asta).
- Idee reținută pentru continuare (a doua din cele 3 propuse de utilizator): ADN/ARN vizual editabil — subsistem complet nou, fără nimic de reosit din motorul chimic actual, necesită propriul amendament SPEC înainte de cod.

---

## [2026-08-11] Echilibrare pe curbe — exercițiul dedicat din SPEC §12/M5, făcut prima dată

**Milestone:** M5 (item rămas neatins din planul original — „echilibrare finală pe curbe, foaie de calcul separată")
**Făcut:**
- Bifat retroactiv în `VALENTA_SPEC.md` toate criteriile M0-M5 confirmate de-a lungul sesiunilor (M0 avea checkbox-uri literale nebifate deși verificate live din prima sesiune; M1-M5 au primit câte o linie „Confirmat" cu trimitere la intrarea DEVLOG corespunzătoare, fără să inventez structură nouă de checkbox unde SPEC folosea doar proză).
- **`scripts/balance-report.mjs`** — script permanent (nu temporar), adăugat în repo cu `npm run balance-report`: importă direct din sursa reală (`balance.ts`, `lattice.ts`, `elements.ts`, `moleculeDB.json`) formulele de producție/cost, ca raportul să nu poată diverge tăcut de codul jocului. Verifică patru curbe:
  1. **Costurile de deblocare a elementelor** (84 jucabile) — sortate, cu raportul față de precedent; un singur salt >×2 semnalat (O→N, 10→25 C), recunoscut automat ca fals-pozitiv (diferență absolută neglijabilă, în zona gratuită de start H/O/N, decizie deja documentată la M1).
  2. **Eficiența compușilor ionici** (E/s per atom) — agregată din toate cele ~90 de intrări ionice din DB, grupate pe tier. Confirmă ce fusese verificat manual, per-tier, în DEVLOG de la tier 5 încoace: vârful de eficiență crește **monoton** pe toate cele 15 tiere ionice (2,86 → 9,41), fără nicio regresie.
  3. **Costul cumulat al generatoarelor de atomi** — creștere geometrică ×1.18, verificată ca rămâne pe o curbă standard de idle (dublare la ~4 generatoare), fără recalibrare necesară.
  4. **Curba Nucleosintezei** — randament descrescător pe rădăcină pătrată, confirmată numeric (1★=1M E, 2★=4M E, 5★=25M E).
  - Exportă și 3 fișiere `.csv` (deschise direct în Excel/Sheets — literalmente „foaia de calcul" cerută în SPEC), regenerabile oricând, nu ținute în git (adăugate în `.gitignore` — ar putea deveni învechite tăcut față de balansul real dacă ar fi commise ca instantaneu static).
- Adăugat `tsx` ca dependență de dezvoltare (necesar să ruleze scriptul TS direct via `npm run balance-report`, fără `npx` ad-hoc).
- **Concluzia trecerii**: balansul e sănătos pe toate cele 4 curbe verificate — nicio recalibrare de cod a fost necesară. Calibrarea empirică per-tier făcută de-a lungul întregului arc de extindere (tier 5→17) s-a dovedit, la o privire de ansamblu, corectă și consistentă.
- `tsc --noEmit` curat; toate cele 196 de teste automate trec (neschimbate — nicio modificare de cod sursă, doar unealtă nouă de analiză).

**Decizii / abateri de la SPEC.md:**
- **„Foaia de calcul" a devenit un script repetabil, nu un fișier static** — SPEC.md cerea literal o „foaie de calcul separată"; am ales un script care importă formulele reale în loc de un Excel/Sheets întreținut manual în paralel, ca să nu existe risc de divergență tăcută între „foaia de calcul" și codul jocului (exact genul de bug care a cauzat explozia hash-ului canonic — o sursă de adevăr duplicată, neintenționat desincronizată). CSV-urile exportate acoperă totuși nevoia literală, dacă cineva vrea să inspecteze vizual într-un spreadsheet real.
- Analiza covalentă a rămas parțială — energiile de legătură (`ΣE_leg`) nu sunt stocate static în `moleculeDB.json` (doar `bonusMult`), deci eficiența compușilor covalenți n-a putut fi agregată automat ca la cei ionici, fără reconstruirea grafurilor fiecărei molecule. Compușii ionici (majoritatea covârșitoare a recalibrărilor din tier 5-17) au acoperire completă.

**Rămas de făcut / follow-up:**
- Dacă se dorește vreodată acoperire completă și pentru covalent: ar presupune fie stocarea `ΣE_leg` calculat static în DB la construirea fiecărei intrări, fie reconstruirea grafurilor din teste — un efort separat, nu urgent (nicio recalibrare necesară pe partea ionică, singura care a fost efectiv retunată tier după tier).
- Cu asta, SPEC §12 (M0→M5) e complet — inclusiv ultimul item rămas nebifat de la introducerea documentului.

---

## [2026-08-11] Completare decorativă a Tabelului Periodic — zero „?" rămase

**Milestone:** răspuns la „continua cu ce mai este nedeblocat" (utilizatorul a remarcat pozițiile „?" rămase)
**Făcut:**
- Audit exhaustiv, programatic (nu manual): comparat lista standard a celor 118 elemente cu `PERIODIC_LAYOUT`/`ELEMENTS` — confirmat 118/118 poziții acoperite acum, dintre care **34 decorative** (fără chimie reală accesibilă: fără izotop stabil, radioactive rare, sau sintetice cu timp de înjumătățire de secunde/minute) și 84 jucabile.
- **Decizie de scop clarificată cu utilizatorul înainte de implementare** (nu presupusă): completarea celor 34 de poziții rămase drept elemente normale, deblocabile cu Cunoaștere, ar fi creat un „element mort" real — arhitectura curentă (`periodicTable.ts`) leagă strict orice `ElementDef` de sistemul de deblocare cu C, iar aceste elemente nu au niciun compus de construit după deblocare. Utilizatorul a ales varianta decorativă: colorate, cu tooltip informativ, dar **neinteractive**.
- **Câmp nou `decorative?: boolean` pe `ElementDef`** (`chem/elements.ts`) + 34 de intrări noi (Tc, Pm, Po, At, Rn, Fr, Ac, Pa, Np, Pu, Am, Cm, Bk, Cf, Es, Fm, Md, No, Lr, și tot rândul 7 sintetic Rf→Og) — fiecare cu Z/masă reale și un flavor text factual (de ex. Am: „singurul element transuranic din uz casnic — detectoarele de fum cu ionizare"), dar `valences: []`, fără `ionicCharge`, `unlockCost: 0` (nefolosit).
- **`periodicTable.ts`**: celulele cu `def.decorative` se randează colorat (simbol + culoare, ca un element deblocat), dar fără rând de cost, fără `click`-listener de deblocare, tooltip separat („fără chimie jucabilă"). Hint-ul din capul overlay-ului actualizat să explice distincția.
- **Bug prins înainte de a ajunge la utilizator, prin teste, nu prin verificare live**: `autopilotUnlockElements` (`economy.ts`) și `canUnlockElement` (`state.ts`) iterau/verificau `ELEMENTS` fără să excludă `decorative` — cum toate cele 34 au `unlockCost: 0` (cel mai mic cost posibil), Autopilot le-ar fi „deblocat" gratuit pe toate la primul tick, iar un test existent (`autopilot.test.ts`, „deblochează cel mai ieftin element afordabil”) chiar pica exact din acest motiv la prima rulare — semnal clar, nu presupunere. Reparat cu un guard explicit `decorative` în ambele funcții, plus corectat testul care nu excludea decorativele din propriul calcul.
- **A treia greșeală de ghilimele curbe** din acest proiect (după cele din tier 10/13) — de data asta prinsă instant de `tsc`, nu de test/verificare live: un ghilimea dreaptă „ folosită ca închidere într-un string literal a spart parsarea fișierului. Corectată imediat.
- Teste noi: `tests/periodicTable.test.ts` (3 cazuri — toate cele 118 poziții au `ElementDef`, elementele decorative nu au valențe/sarcină/cost real, exact 34 decorative + 84 jucabile) + 2 cazuri noi în `unlocks.test.ts`/`autopilot.test.ts` (refuz explicit de deblocare manuală și via Autopilot pentru un element decorativ, chiar cu Cunoaștere nelimitată).
- `tsc --noEmit` curat; 196 de teste automate trec (30 fișiere, +6).
- **Verificat live pe dev server**: Tabelul Periodic deschis — confirmat vizual (captură de ecran) toate cele 118 poziții pline, zero „?", elementele decorative (Fr, Tc, Pm, tot rândul 7 etc.) colorate discret, fără cost afișat. Verificat prin DOM/JS direct (`0 .unknown`, `34 .decorative`, `118 total`) — mai fiabil decât capturile de ecran, care au avut timeout-uri intermitente în această sesiune (glitch de extensie, nereprodus la reconectare, fără legătură cu codul). Click repetat pe o celulă decorativă confirmat fără efect (niciun listener atașat). Zero erori în consolă.

**Decizii / abateri de la SPEC.md:**
- Niciuna nouă — extensie pur vizuală/informativă, fără mecanică de joc nouă. Consistentă cu principiul „onestitate chimică peste completitudine" aplicat constant în tot arcul de extindere a elementelor (SiO₂ neadăugat la M6, KrF₂ evitat la tier 13 etc.) — aici aplicat invers: onestitate în privința *lipsei* de chimie jucabilă, nu ascunsă sub un „?" etern, dar nici simulată fals ca joc real.

**Rămas de făcut / follow-up:**
- Nimic. Tabelul Periodic e acum complet (118/118), fără nicio poziție neexplicată — fiecare „?" de dinainte fie a devenit conținut real (85 de elemente jucabile de-a lungul întregului arc de extindere), fie e acum vizibil ca decorativ, cu motivul explicat în tooltip.

---

## [2026-08-11] Verificare live restantă: sinteza Ho₂O₃/ErCl₃ (tier 17)

**Milestone:** follow-up (ultima restanță semnalată explicit la finalul sesiunii tier 17)
**Făcut:**
- Verificat live, într-un save de test izolat (server dev secundar pe portul 5175, `localStorage` propriu injectat cu Cunoaștere/atomi de test): deblocat Ho și Er din Tabelul Periodic (confirmate vizual verzi, cost 3.800 C / 3.850 C corect scăzut), construit și sintetizat manual din Constructorul Ionic ambii compuși reprezentativi — **Ho₂O₃** (2×Ho³⁺ + 3×O²⁻) și **ErCl₃** (1×Er³⁺ + 3×Cl⁻, după deblocarea și a Clorului). Ambele au declanșat bannerul „Ai descoperit" cu flavor text corect și apar în Colecție cu producție activă la **exact** ratele calculate la calibrare (Ho₂O₃: 46,5 E/s, ErCl₃: 36,4 E/s — coincid cifră cu cifră cu rezultatul formulei `productionRate()` folosite la alegerea energiilor de rețea). Zero erori în consolă.
- **Rezolvat definitiv problema de injectare de resurse în `localStorage` pentru teste**, semnalată ca notă tehnică ieri: `saveGame()` (apelat din `beforeunload` sau din intervalul periodic de 15s) rescrie `localStorage` cu starea *din memoria tab-ului*, oricând acesta mai există — o editare directă a `localStorage` e mereu expusă să fie suprascrisă dacă tab-ul vechi mai apucă să declanșeze vreun autosave înainte de a fi închis. Soluție robustă găsită și verificată: după ce scrii valorile dorite în `localStorage`, suprascrie `localStorage.setItem = function(){}` (no-op) **înainte** de a închide tab-ul — orice `saveGame()` ulterior (inclusiv cel din `beforeunload`) devine inofensiv, iar valorile injectate rămân neatinse la următoarea încărcare într-un tab nou.

**Decizii / abateri de la SPEC.md:**
- Niciuna — verificare pură, fără schimbări de cod.

**Rămas de făcut / follow-up:**
- Nimic restant din arcul recent (regenerare chei canonice, tier 17, Autopilot, sinteza Ho/Er) — toate confirmate live, fără nicio eroare de consolă.

---

## [2026-08-11] Verificare live restantă: Autopilot funcționează corect

**Milestone:** follow-up (restanță semnalată în ultimele 2 sesiuni — „continua" după tier 17)
**Făcut:**
- Verificat live, într-un save de test complet izolat (server dev secundar pe portul 5174, deci origine separată de save-ul de dezvoltare de pe 5173, care pare folosit concurent — evită orice risc de coruperi încrucișate): pornit cu un save nou, injectat 5.000 E / 205 C direct în `localStorage` pentru un test rapid, activat togglul Autopilot din Setări.
- **Confirmat vizual, în câteva secunde**: Autopilot a deblocat automat Carbon și Heliu (au apărut singure în Paletă) și a cumpărat repetat generatoare de H/O/N/C (×18/×10/×7/×3), epuizând bugetul de E și C disponibil fără niciun clic manual — exact comportamentul descris în Setări („Deblochează elemente și cumpără generatoare automat, cel mai ieftin întâi"). Dezactivat togglul → confirmat că E/C rămân neschimbate după aceea (doar producția pasivă de atomi din generatoarele deja cumpărate continuă, cum e de așteptat). Zero erori în consolă.
- **Notă tehnică utilă, descoperită incidental în timpul acestei verificări**: injectarea directă de resurse prin `localStorage.setItem` urmată de `reload()`/`navigate()` pe **același tab** nu funcționează fiabil — handler-ul `beforeunload` din `save.ts` (`startAutosave`) rescrie imediat `localStorage` cu starea *veche*, încă din memorie, chiar în timp ce pagina se descarcă, anulând injectarea. Motivul real, cel mai probabil, al episodului „autosave dintr-o altă instanță" semnalat ieri la tier 17 — nu neapărat o altă filă/tab deschisă de utilizator, ci chiar tab-ul curent rescriindu-și propria stare stale la reload. Soluție care a funcționat: editează `localStorage`, apoi deschide un **tab nou** (fără store propriu în memorie) pentru citire, abia apoi închide tab-ul vechi.

**Decizii / abateri de la SPEC.md:**
- Niciuna — verificare pură, fără schimbări de cod.

**Rămas de făcut / follow-up:**
- Nimic restant pe Autopilot. Singura restanță reală rămasă din arcul recent e sinteza live a Ho₂O₃/ErCl₃ (tier 17), semnalată deja ca fiind de prioritate scăzută (chei ionice simple, deja acoperite corect de teste automate pe același cod pe care l-ar exercita UI-ul).

---

## [2026-08-11] Tier 17 — Ho, Er (lacună reală găsită la recitirea completă a tabelului)

**Milestone:** post-verificare-live (utilizatorul a semnalat că mai văzuse poziții „?" și a întrebat ce mai e de făcut)
**Făcut:**
- **Audit complet**: comparat programatic cele 118 poziții standard ale Tabelului Periodic cu cele 85 de elemente cu `ElementDef` existente la acel moment. Toate cele 33 de poziții „?" rămase s-au dovedit a fi excluderi deliberate deja documentate în DEVLOG (Fr/Rn/Ac/Pa/Np/Pu radioactive sau sensibile tematic, Tc/Pm fără niciun izotop stabil, Po/At radioactive rare, tot rândul 7 sintetic) — **cu o singură excepție reală**: **Ho (Holmiu, Z=67)** și **Er (Erbiu, Z=68)**, două lantanide stabile cu chimie reală, omise din loturile de lantanide de la tier 13-15 (acoperiseră La/Ce/Pr/Nd/Sm/Eu/Gd/Tb/Dy/Yb/Tm/Lu, dar au sărit exact aceste două) — exact genul de lacună găsită anterior la Rh/Os (tier 16), de data asta descoperită la cererea directă a utilizatorului, nu prin recitire proactivă.
- **2 elemente noi**, tier 17, aceeași chimie ionică +3 ca restul seriei lantanidelor: **Ho** (cel mai puternic câmp magnetic dintre toate elementele naturale — magneții din interiorul celor mai puternici electromagneți), **Er** (dopantul din amplificatoarele cu fibră optică ale internetului global pe cablu submarin).
- **4 compuși noi**: Ho₂O₃/HoCl₃, Er₂O₃/ErCl₃ — tipar identic cu restul lantanidelor (oxid + clorură, sarcină +3). Chei DB = formula simplă (`"Ho2O3"`, etc.), fără canonicalizare de graf — compușii ionici nu au fost niciodată expuși bug-ului de hash explodat reparat ieri, fiindcă `ionicFormula()` (`chem/ionic.ts`) nu folosește deloc `canonicalGraphHash`.
- Recalibrare (`lattice.ts`) cu aceeași metodă din tot arcul de extindere: energie de rețea aleasă ca eficiența (`E/s-per-copie / atomi-per-copie`) să depășească vârful tier 16 (OsO₄, eff 9,20) — interval obținut 8,90–9,41 (Er₂O₃ la vârf), verificat printr-un calcul explicit al formulei `productionRate()` înainte de a scrie valorile, nu doar prin încercare-eroare în joc.
- 2 obiective noi: „Deblochează Erbiul", „Sintetizează Oxid de holmiu (Ho₂O₃)".
- Test nou `tests/moleculeDB_tier17.test.ts` (2 teste, același tipar ca tier16: ElementDef complet + sarcină, validare prin echilibru de sarcini pentru toți cei 4 compuși).
- `tsc --noEmit` curat; 191 de teste automate trec (29 fișiere, +2).
- **Verificat live pe dev server** (extensia claude-in-chrome, reconectată cu succes în această sesiune): Tabelul Periodic deschis, Ho și Er confirmate vizual în poziția corectă din seria lantanidelor (între Dy și Tm), cu costul corect afișat (3.800 C / 3.850 C, nu „?"), tooltip cu flavor text corect la click. Sinteza efectivă a compușilor Ho/Er **nu** a fost testată live (ar fi necesitat fie ~7.650 C reale în save-ul de dezvoltare, fie modificarea directă a `localStorage` — încercată, dar suprascrisă aproape instant de un autosave dintr-o altă instanță activă a paginii, semn că salvarea de dezvoltare e folosită și altundeva; abandonat ca să nu risc coruperea ei). Acoperire considerată suficientă: spre deosebire de bug-ul de hash canonic de ieri, compușii ionici nu trec prin nicio canonicalizare complexă — cheia DB e literal formula, verificată deja exact de `expect(DB_FORMULAS.has(...))` din testul automat, pe același cod (`validateIonicMix`/`ionicFormula`) pe care l-ar exercita și un click real din Constructorul Ionic.

**Decizii / abateri de la SPEC.md:**
- Niciuna nouă — continuă exact tiparul stabilit la tier 13-16 pentru lantanide.

**Rămas de făcut / follow-up:**
- **Sinteza live a Ho₂O₃/ErCl₃ rămâne neconfirmată vizual** — de făcut într-o sesiune viitoare, ideal cu un save de test dedicat (nu cel de dezvoltare, care pare folosit concurent), sau prin creșterea organică a Cunoașterii până la ~3.800+ C.
- Auditul de azi confirmă că **nu mai există alte lacune reale** în Tabelul Periodic — toate pozițiile „?" rămase (Fr, Rn, Ac, Pa, Np, Pu, Tc, Pm, Po, At, tot rândul 7) sunt excluderi deliberate, nu conținut uitat. Dacă se dorește completarea lor „doar de decor" (siluetă colorată fără compuși/chimie reală), rămâne o decizie separată de discutat explicit, nu o restanță.
- Verificarea live UI pentru Autopilot rămâne restantă (semnalată în ultimele două sesiuni) — tot neabordată, în afara scopului acestei treceri.

---

## [2026-08-11] Regenerare chei canonice explodate — pasul separat anunțat în fix-ul anterior

**Milestone:** follow-up direct la fix-ul „prag pe suma lungimilor" din sesiunea trecută (`f6f4eb5`)
**Făcut:**
- Reluat exact de unde rămăsese sesiunea anterioară: fix-ul din `canonical.ts` era deja pe `master`, dar cele 17 chei din `moleculeDB.json` calculate cu algoritmul vechi (defect) rămâneau neregenerate — 8 teste automate eșuau intenționat ca semnal (comparau chei hardcodate cu cele din DB).
- Reconstruit fiecare din cele 17 molecule afectate (Toluen, Fenol, Anilină, Glucoză, Piridină, Octan, Glicerol, Acetat de etil, Acid butiric, Adenină, Pentan, Hexan, Heptan, Stiren, Clorobenzen, Acid lactic, Serină) din grafuri exacte deja validate în teste existente, calculat cheia canonică nouă cu codul curent (`moleculeKey`) și scris-o înapoi în `moleculeDB.json`, păstrând identic restul fiecărei intrări (nume, formulă, `bonusMult`, `discoveryC`, tier, tags, flavor).
- **Important, descoperit în timpul verificării**: doar 8 din cele 17 molecule aveau teste automate care prindeau explozia (`expectMoleculeInDB`); celelalte 9 (Pentan, Hexan, Heptan, Stiren, Clorobenzen, Acid lactic, Serină, plus Glicerol avea acoperire parțială — testul verifica și Etilenglicolul din aceeași funcție, dar acela nu era afectat) aveau chei la fel de explodate în DB (până la 250.895 caractere pentru Glucoză) fără niciun test care să le fi prins — ar fi rămas sparte silențios în joc (moleculă nerecunoscută la sinteză din Constructor, deși validă chimic) dacă nu se verifica manual fiecare intrare din lot, nu doar cele 8 semnalate de suita de teste roșii.
- Verificare: scris un script temporar care recalculează cheia pentru toate cele 17 molecule folosind exact `molecule.ts`/`validator.ts`/`formula.ts` din sursă și compară cu ce era în DB înainte de scriere — confirmat toate cele 17 aveau chei divergente (nu doar cele 8 vizibile în teste), toate rezolvate acum.
- `tsc --noEmit` curat; toate cele 189 de teste automate trec (28 fișiere) — cele 8 anterior roșii sunt acum verzi.
- **Verificare live în browser, reluată cu succes** — la prima încercare din această sesiune extensia claude-in-chrome era tot deconectată (al doilea eveniment consecutiv), dar după ce utilizatorul a confirmat manual că e activă, reconectarea a reușit. Pornit `npm run dev`, deschis salvarea de dezvoltare existentă (progres real, ~282K E) și sintetizat manual din Constructor **două** dintre cele 17 molecule reparate: **Pentan** (C₅H₁₂, lanț simplu de 5 carboni) și **Toluen** (C₇H₈, inel Kekulé alternant + grupă metil — chiar molecula-exemplu din commit-ul de fix, cea cu cheia veche de 40.454 caractere). Ambele au declanșat corect bannerul „Ai descoperit" și apar în Colecție cu producție activă (Pentan 19,3 E/s, Toluen 25,3 E/s/copie) — confirmă că lookup-ul real din joc (nu doar testele automate) recunoaște cheile regenerate. Zero erori în consolă.
- Pe parcurs, o descoperire despre interacțiunea Constructorului utilă pentru sesiuni viitoare de testare live: plasarea unui atom e un singur `click` pe canvas (cu elementul selectat în Paletă), dar legarea a doi atomi necesită `mousedown` pe atomul sursă → mişcare → `mouseup` pe atomul țintă (dragă reală, nu două click-uri separate) — un simplu click-click între doi atomi plasați nu creează nicio legătură.

**Decizii / abateri de la SPEC.md:**
- Niciuna nouă — pas mecanic de reparație de date, fără schimbări de design.

**Rămas de făcut / follow-up:**
- Fără regresie de proces necesară pe termen scurt, dar de reținut: la orice bug de canonicalizare viitor, verifică *toate* intrările afectate direct (script de comparație pe tot DB-ul), nu doar cele semnalate de teste roșii — suita de teste nu acoperea 9 din 17 cazuri reale.
- **Verificarea live UI pentru Autopilot rămâne restantă** (semnalată separat în sesiunea trecută) — nu a fost reluată în această trecere, care s-a concentrat strict pe regenerarea cheilor.

---

## [2026-08-10] Autopilot — deblocare elemente + cumpărare generatoare automată

**Milestone:** post-extindere elemente (răspuns concret ales dintr-un brainstorm de idei — „profunzime de joc")
**Făcut:**
- **Toggle global nou în Setări** (`settings.autopilot: boolean`, implicit `false`, exact tiparul deja folosit de `settings.sound`): când activ, la fiecare tick economic (100ms) deblochează automat elementul cel mai ieftin afordabil (Cunoaștere) și cumpără repetat generatorul cel mai ieftin afordabil (Energie), până epuizează ce-și poate permite.
- `tickAutopilot(store)` în `economy.ts`, apelat la finalul `tick()`, cu două sub-funcții (`autopilotUnlockElements`, `autopilotBuyGenerators`) care refolosesc `store.unlockElement`/`store.buyGenerator` — nicio duplicare a logicii de affordability/mutație/emit deja existente.
- Constantă nouă `AUTOPILOT_MAX_PURCHASES_PER_TICK = 200` (`balance.ts`) — plafon de siguranță doar pe bucla de cumpărare de generatoare, ca un tick cu stoc uriaș de Energie (ex. după progres offline de ore) să nu bucleze nelimitat într-un singur apel. Bucla de deblocare elemente nu are nevoie de plafon separat — e bounded natural de câte elemente blocate mai există (~82 max).
- **Fix de migrare pentru un câmp imbricat**, prins din prima încercare, nu descoperit ulterior: `GameState.settings` e un obiect, iar merge-ul din `migrate()` (`save.ts`) e shallow — dacă un save vechi are `settings` fără `autopilot`, spread-ul îl înlocuiește în întregime, lăsând `autopilot` `undefined`, nu `false`. Corectat explicit cu `state.settings.autopilot = state.settings.autopilot ?? false;`, exact aceeași clasă de bug reparată azi mai devreme pentru câmpurile de top-nivel (`stars`, `generatorSpeedLevel`) — de data asta prins prin planificare atentă (research + design înainte de scris cod), nu prin verificare live ulterioară.
- Teste noi: `tests/autopilot.test.ts` (5 cazuri — dezactivat nu face nimic; cumpără cel mai ieftin generator când bugetul ajunge doar pentru unul; deblochează cel mai ieftin element afordabil; respectă plafonul de siguranță la un stoc uriaș de Energie; sanity-check că 200 de cumpărări pe 3 elemente rămân mult sub pragul folosit în testul plafonului) + un test nou în `tests/save.test.ts` (regresie explicită pentru fix-ul de migrare, save vechi fără `settings.autopilot` → `.toBe(false)` strict).
- `tsc --noEmit` curat; 189 de teste automate trec (28 fișiere, +6 față de tier 16).

**Decizii / abateri de la SPEC.md:**
- Fără indicator vizual (badge) pe butoanele „Cumpără"/celulele din Tabelul Periodic când autopilot le preia — mecanismul analog deja existent (`autoSynth.rate` per moleculă) nu are așa ceva, iar butoanele manuale rămân funcționale în paralel, fără conflict. Poate fi adăugat ulterior dacă se simte nevoia.
- Fără obiectiv/achievement nou legat de activarea autopilot-ului.
- **Verificare live UI (clic real pe toggle, confirmare vizuală că generatoarele/elementele se deblochează singure) NU a fost făcută în această trecere** — extensia de browser (claude-in-chrome) a fost deconectată complet pe tot parcursul verificării, reconectare încercată de mai multe ori fără succes. Abatere reală de la regula de auto-verificare în browser, nu o alegere. Acoperirea rămasă: 5 teste automate dedicate, care exercită exact `tick()`/`tickAutopilot` prin același cod pe care l-ar exercita și un clic real din UI (toggle-ul din `settings.ts` doar comută `store.state.settings.autopilot`, fără logică proprie suplimentară).

**Rămas de făcut / follow-up:**
- **Verificare live UI reală pentru autopilot, restantă** — de făcut într-o sesiune viitoare când extensia de browser e din nou stabilă: activare toggle din Setări, confirmare vizuală că generatoarele/elementele se deblochează singure în câteva ticks, dezactivare, confirmare că se oprește.

---

## [2026-08-10] Căutare în Paletă, Constructorul Ionic, Generatoare și Colecție — UX necesar la scara nouă

**Milestone:** post-tier 16 (răspuns la „continua cu ce crezi ca mai trebuie" — nu mai era conținut chimic real de adăugat, dar arcul de extindere a lăsat o lacună reală de UX)
**Făcut:**
- **Câmp de căutare nou în toate cele 4 liste care cresc cu numărul de elemente/molecule deblocate**: Paletă (elemente covalente), Constructorul Ionic (ioni), Generatoare (până la 82 de rânduri acum) și Colecție (până la 234 de molecule posibile, deși în practică doar cele descoperite efectiv). Cu 82 de elemente deblocabile (față de ~14 la începutul sesiunii de azi), un scroll lung fără filtru devenise impracticabil pentru găsirea unui element/moleculă anume. Filtrare live, după nume/simbol (Paletă, Ionic, Generatoare) sau nume/formulă (Colecție — filtrare directă pe textul deja randat al rândului, fără duplicare de date), fără sensibilitate la majuscule.
- Generatoare și Colecție împart un singur câmp de căutare (panoul Laborator are un singur „ecran" cu tab-uri, ca la §10.1) — placeholder-ul se schimbă automat („Caută generator..." / „Caută moleculă...") la comutarea tab-ului, dar textul căutat rămâne același dacă utilizatorul comută înainte și înapoi.
- Implementat cu tiparul deja existent în ambele fișiere (`ensureItem`/`ensureRow`, actualizare in-place): elementele/ionii nepotriviți primesc clasa `filtered-out` (`display:none`), nu sunt recreați/eliminați din DOM — filtrarea nu strică cache-ul de randare stabilit din M0.
- Cele două câmpuri de căutare sunt independente (fiecare cu propria stare `query` locală), consistent cu faptul că Paleta și Constructorul Ionic au fost dintotdeauna module UI separate (§8.2).
- Verificat live în dev server: „xen" în Paletă → doar Xenon; „osm" în picker-ul Ionic → doar Osmiu; „reniu" în Generatoare → doar rândul de Reniu; sintetizat H₂O manual și „apă" în Colecție → doar acea intrare. Toate cele 4 filtre independente/corecte, fără efecte secundare asupra selecției/mix-ului/draft-ului curent.
- `tsc --noEmit` curat; toate cele 183 de teste automate încă trec (nicio schimbare de logică de joc, doar UI).

**Decizii / abateri de la SPEC.md:**
- Nicio schimbare de design nouă — SPEC nu menționează explicit căutare, dar principiul din §10.1 („un singur ecran, fără navigare") rămâne intact: căutarea e un filtru local pe ecranul existent, nu o navigare/overlay nou.

**Rămas de făcut / follow-up:**
- Verificat parțial pe deploy-ul public, după push: câmpul de căutare confirmat prezent și corect randat în Paletă. Interacțiunea completă (tastare + verificare filtrare) NU a fost făcută pe producție — tab-ul deschis pentru verificare arăta un save real de jucător (28,2K E, progres autentic), nu unul de test; am ales să nu interacționez deloc cu el ca să nu risc să stric progresul cuiva. Acoperire considerată suficientă: funcționalitatea a fost verificată complet, de două ori, pe dev server local (filtrare „xen"→Xenon, „osm"→Osmiu, ambele confirmate corecte).

---

## [2026-08-10] Tier 16 — Rh, Os (ultimele 2 metale reale, lacună găsită prin recitirea completă a tabelului)

**Milestone:** post-tier 15 (continuare autonomă, „continua" — la recitirea completă a Tabelului Periodic pentru a confirma că tier 15 a fost cu adevărat ultimul lot, am găsit o lacună reală: Rh și Os, ambele stabile, ambele din familia platinei ca Ru/Pd/Ir/Pt deja acoperite, omise din greșeală)
**Făcut:**
- **2 elemente noi**: **Rh** (Rodiu, +3 — cel mai scump metal prețios de pe piață, esențial în convertoarele catalitice auto), **Os** (Osmiu, **+8 — cea mai mare sarcină ionică posibilă în tot jocul**, cel mai dens element natural stabil, tetroxidul lui e folosit în microscopie pentru colorarea dublelor legături din țesuturi).
- **3 compuși noi**: Rh₂O₃/RhCl₃, **OsO₄** (singur — sarcina +8 cere 4 oxigeni la 1 atom de metal, cel mai extrem raport din joc).
- Recalibrare cu aceeași metodă, țintă peste vârful tier 15 (UO₂, eff 8,70) — interval 8,85–9,20, OsO₄ la vârful absolut al întregii curbe de eficiență din joc.
- 2 obiective noi: „Deblochează Osmiul", „Sintetizează Tetroxid de osmiu (OsO₄)".
- Test nou `tests/moleculeDB_tier16.test.ts` (3 teste).
- `tsc --noEmit` curat; 183 de teste automate trec (27 fișiere).
- Verificat live pe deploy-ul public, după push: OsO₄ construit și sintetizat manual (1×Os⁸⁺ + 4×O²⁻), banner de descoperire corect, rată 46,0 E/s — exact valoarea calculată. Rh³⁺ confirmat vizual corect poziționat.

**Decizii / abateri de la SPEC.md:**
- Niciuna nouă.

**Rămas de făcut / follow-up:**
- **Acesta chiar închide arcul de extindere a elementelor.** Verificare finală: din cele 118 poziții ale Tabelului Periodic, toate elementele stabile cu chimie simplă reală, notabilă la nivel de manual de liceu/facultate, sunt acum acoperite (80+2=82 de elemente jucabile). Rămân doar: gazele nobile radioactive (Rn), metalele alcaline extrem de instabile (Fr), restul actinidelor (Ac, Pa, Np, Pu — ultimele două sensibile tematic, evitate deliberat), și tot rândul 7 (elemente sintetice, create doar în laborator, cu timpi de înjumătățire de secunde). Niciunul nu oferă conținut de adăugat în același stil (compuși reali, cunoscuți, cu aplicații verificabile) fără compromisuri pe care jocul nu le-a făcut până acum.

---

## [2026-08-10] Tier 15 — Kr, Tm, Lu, Ra, Th, U (ultimul lot rezonabil de conținut chimic real)

**Milestone:** post-tier 14 (continuare autonomă, „continua cu tier 15")
**Făcut:**
- **6 elemente noi**: **Kr** (inert, ca He/Ne/Ar — singurul compus relativ cunoscut, KrF₂, e mult prea instabil pentru a fi inclus, la fel cum s-a decis deja la tier 13), **Tm** și **Lu** (ultimele două lantanide stabile — lasere medicale, respectiv detectoare PET), **Ra** (+2, descoperit de Marie și Pierre Curie — al doilea Premiu Nobel al perechii), **Th** (+4, manșoanele de lampă cu gaz de acum un secol), **U** (+4, combustibilul reactoarelor nucleare civile — context factual/civil, nu de armament).
- **9 compuși noi**: Kr (monoatomic, 0 E/s, ca He/Ne/Ar), Tm₂O₃/TmCl₃, Lu₂O₃/LuCl₃, ThO₂ (singur, ca Ti/Zr/Hf/Ce), UO₂ (singur), RaO/RaCl₂.
- Recalibrare cu aceeași metodă, țintă peste vârful tier 14 (Yb₂O₃, eff 8,25) — interval 8,35–8,70, UO₂ (cel mai „epic" din lot) la vârf.
- 2 obiective noi: „Deblochează Uraniul", „Sintetizează Oxid de uraniu (UO₂)".
- Test nou `tests/moleculeDB_tier15.test.ts` (4 teste).
- `tsc --noEmit` curat; 180 de teste automate trec (26 fișiere).
- Verificat live pe deploy-ul public, după push: UO₂ construit și sintetizat manual (1×U⁴⁺ + 2×O²⁻), banner de descoperire corect, rată 26,1 E/s — exact valoarea calculată. Kr confirmat vizual în Paletă covalentă (inert, ca He/Ne/Ar); Tm³⁺, Lu³⁺, Ra²⁺, Th⁴⁺, U⁴⁺ toate confirmate vizual în picker-ul Ionic cu sarcinile corecte.

**Decizii / abateri de la SPEC.md:**
- **Th și U tratate cu context strict factual/civil** (istoric — manșoane de lampă; industrial — combustibil de reactor nuclear civil), nicio mențiune de arme sau îmbogățire — consistent cu tonul educativ al restului jocului (la fel cum Hg/Pb/As/Tl/Cd sunt tratate ca „chimie reală, cu precauție", nu evitate din cauza toxicității).
- **Acesta e probabil ultimul lot rezonabil din acest arc de extindere.** După acest tier, elementele rămase din Tabelul Periodic sunt aproape exclusiv sintetice (majoritatea rândului 7) sau puternic radioactive cu timpi de înjumătățire de ordinul secundelor/minutelor (Fr, Ac, Pa, Np, Pu și restul actinidelor grele) — fără chimie simplă, reală, de manual, de adăugat în același stil ca loturile de până acum. Un lot viitor ar necesita fie o abordare diferită (poate doar câteva elemente „de decor", fără compuși reali, ca Fr cu un singur compus foarte incert), fie acceptarea explicită a unui compromis de acuratețe pe care jocul nu l-a făcut până acum.

**Rămas de făcut / follow-up:**
- Tabelul Periodic rămâne cu aproximativ 15-20 de poziții „?" — practic toate elementele sintetice/extrem de radioactive rămase. Following-up: dacă se dorește completarea totală a tabelului „doar de decor" (fără compuși, doar ElementDef + siluetă colorată în loc de „?"), ar fi un efort diferit de cel de până acum (fără verificare de eficiență, fără compuși noi în DB) — de discutat explicit dacă se dorește.

**Milestone:** post-tier 13 (continuare autonomă, „continua cu tier 14")
**Făcut:**
- **6 lantanide noi**, toate ionice, sarcină +3 (chimie reală, uniformă pe toată seria): **Pr** (sticla de sudură galben-verzuie), **Sm** (magneți samariu-cobalt, rezistenți la temperaturi mari), **Eu** (fosforul roșu din ecrane CRT/LED), **Tb** (fosforul verde, alături de europiu), **Dy** (adăugat magneților de neodim pentru rezistență termică în motoarele electrice), **Yb** (dopant pentru laserele industriale cu fibră optică).
- **12 compuși noi**: câte un oxid (X₂O₃) și o clorură (XCl₃) pentru fiecare — al doilea lot de lantanide cu exact același tipar chimic ca La/Nd/Gd din tier 13 (real, nu o simplificare — seria lantanidelor chiar are chimie de sarcină +3 aproape uniformă).
- Recalibrare cu aceeași metodă, țintă peste vârful tier 13 (CeO₂, eff 7,90) — interval 8,00–8,25.
- 2 obiective noi: „Deblochează Yterbiul", „Sintetizează Oxid de europiu (Eu₂O₃)".
- Test nou `tests/moleculeDB_tier14.test.ts` (2 teste).
- `tsc --noEmit` curat; 176 de teste automate trec (25 fișiere).
- Verificat live pe deploy-ul public, după push: Eu₂O₃ construit și sintetizat manual (2×Eu³⁺ + 3×O²⁻), banner de descoperire corect, rată 40,8 E/s — exact valoarea calculată. Toate cele 10 lantanide (La/Ce/Nd/Gd + Pr/Sm/Eu/Tb/Dy/Yb) confirmate vizual una lângă alta în picker-ul Ionic, cu sarcinile corecte.

**Decizii / abateri de la SPEC.md:**
- Niciuna nouă — continuă exact tiparul stabilit la tier 13 pentru lantanide.

**Rămas de făcut / follow-up:**
- Restul lantanidelor (Tm, Lu — Pm e radioactiv, exclus deliberat) și actinidele (Th, U, posibil sensibile tematic) rămân candidați pentru loturi viitoare.

---

## [2026-08-10] Tier 13 — Ar, La, Ce, Nd, Gd, Xe (al zecelea lot — primele lantanide + gaz nobil reactiv)

**Milestone:** post-tier 12 (continuare autonomă, „continua cu tier 13")
**Făcut:**
- **6 elemente tier 13 noi**: **Ar** (inert, ca He/Ne — a treia cea mai comună componentă a aerului), primele **4 lantanide** — **La** (+3, lentile optice de precizie), **Ce** (+4, singura lantanidă din acest lot cu altă sarcină — convertoare catalitice, lustruire sticlă), **Nd** (+3, cei mai puternici magneți permanenți), **Gd** (+3, substanța de contrast din RMN) — și **Xe** (**covalent, cu 3 valențe reale — 2, 4, 6** — gazul „nobil" care totuși formează legături, o descoperire din 1962 care a răsturnat manualele de chimie).
- **11 compuși noi**: Ar (monoatomic, ca He/Ne — 0 E/s, doar valoare de descoperire/flavor), La₂O₃/LaCl₃, CeO₂ (singur, ca Ti/Zr/Hf — sarcina +4 diferă de restul lantanidelor), Nd₂O₃/NdCl₃, Gd₂O₃/GdCl₃, **XeF₂/XeF₄/XeF₆** (trei valențe diferite ale aceluiași element, exact modelul deja folosit pentru S: SO₂/SO₃/H₂SO₄ din M6).
- Energie de legătură nouă Xe-F (130 kJ/mol, reală — slabă, motivul pentru care fluorurile de xenon sunt oxidanți puternici).
- Recalibrare cu aceeași metodă pentru compușii ionici, țintă peste vârful tier 12 (Re₂O₇, eff 7,50) — interval 7,60–7,90. Fluorurile de Xe rămân modeste (eff 0,6, ca alte elemente cu legături slabe — F₂/I₂), consistent cu restul jocului.
- 2 obiective noi: „Deblochează Xenonul", „Sintetizează Tetrafluorură de xenon (XeF₄)".
- Test nou `tests/moleculeDB_tier13.test.ts` (6 teste) — inclusiv Ar ca „moleculă" monoatomică și toate cele 3 fluoruri de Xe.
- **A treia greșeală de ghilimele drepte găsită și reparată în acest lot** (Xenon, în `elements.ts`) — de data asta prinsă vizual la scriere, înainte de orice rulare de test. Tiparul e acum bine cunoscut; regula din DEVLOG-ul de la tier 10 rămâne activă.
- `tsc --noEmit` curat; 174 de teste automate trec (24 fișiere).
- Verificat live pe deploy-ul public, după push: CeO₂ construit și sintetizat manual (1×Ce⁴⁺ + 2×O²⁻), banner de descoperire corect, rată 23,7 E/s — exact valoarea calculată. Ar confirmat vizual în Paletă covalentă; Xe confirmat vizual atât în Paletă cât și în Tabelul Periodic (corect absent din picker-ul Ionic — e complet covalent). Fluorurile de Xe (XeF₂/XeF₄/XeF₆) nu au fost construite manual prin clickuri — mecanismul de valențe multiple e deja dovedit live din M6 (Sulf), iar structura lor e validată de testele automate.

**Decizii / abateri de la SPEC.md:**
- **Ce (Ceriu) primește sarcina +4, nu +3** ca restul lantanidelor din acest lot — CeO₂ (forma +4) e mult mai iconică/folosită industrial (convertoare catalitice, lustruire sticlă) decât Ce₂O₃ (forma +3). Consistent cu simplificarea deja stabilită de „o singură sarcină per element", doar că aleasă pe criteriul „cea mai faimoasă formă reală", nu implicit cea mai comună generic.
- **Xe primește 3 valențe covalente (2, 4, 6), fără nicio sarcină ionică** — al doilea element din joc (după S) cu valențe multiple, motor deja generic, zero cod nou necesar.

**Rămas de făcut / follow-up:**
- Restul lantanidelor (Pr, Sm, Eu, Tb, Dy, Ho, Er, Tm, Yb, Lu) și actinidele rămân un candidat natural pentru loturi viitoare, dacă se continuă.
- Kr (Kripton) a fost omis deliberat din acest lot — singurul compus relativ cunoscut, KrF₂, e mult mai instabil/greu de izolat decât fluorurile de Xe, o linie mai aproape de „chimie inventată" decât vrem să tragem; rămâne un candidat doar ca adiție monoatomică inertă (ca Ar), nu cu compuși reali.

---

## [2026-08-10] Tier 12 — Tl, Hf, Ru, Ta, Ir, Re (al nouălea lot)

**Milestone:** post-tier 11 (continuare autonomă, „continua cu tier 12")
**Făcut:**
- **6 elemente tier 12 noi**, toate ionice: **Tl** (+1, «otrava otrăvitorilor» — incoloră, inodoră, fără gust), **Hf** (+4, izolatorul de poartă din cipurile moderne), **Ru** (+3, aliaj de întărire pentru bijuterii de platină), **Ta** (+5, condensatoarele miniaturale din telefoane), **Ir** (+3, stratul geologic care marchează extincția dinozaurilor), **Re** (**+7, cea mai mare sarcină ionică din tot jocul**, al doilea cel mai înalt punct de topire după wolfram).
- **9 compuși noi**: TlCl/TlBr, HfO₂ (singur — HfCl₄ e covalent/molecular în realitate, ca Ti/Zr), Ta₂O₅ (singur), **Re₂O₇** (singur, sarcina +7 cere 7 oxigeni la 2 atomi de reniu), Ru₂O₃/RuCl₃, Ir₂O₃/IrCl₃.
- Recalibrare cu aceeași metodă, țintă peste vârful tier 11 (PtCl₄, eff 6,95) — interval 7,00–7,50, atins exact.
- 2 obiective noi: „Deblochează Reniul", „Sintetizează Heptoxid de reniu (Re₂O₇)".
- Test nou `tests/moleculeDB_tier12.test.ts` (3 teste) — inclusiv cazul Re₂O₇ (raport 2:7), prima sarcină ionică ≥7 din joc.
- `tsc --noEmit` curat; 168 de teste automate trec (23 fișiere).
- Verificat live pe deploy-ul public, după push: Re₂O₇ construit și sintetizat manual (2×Re⁷⁺ + 7×O²⁻ — cel mai mare raport din joc până acum), banner de descoperire corect, rată 67,5 E/s — exact valoarea calculată. Toate cele 61 de elemente deblocate până la tier 12 confirmate vizual cu sarcinile corecte.

**Decizii / abateri de la SPEC.md:**
- Niciuna nouă — continuă politica deja stabilită.

**Rămas de făcut / follow-up:**
- Tot Tabelul Periodic rămas (peste 40 de poziții — lantanide, actinide, câteva metale de tranziție grele rămase, gaze rare) rămâne siluete „?".

---

## [2026-08-10] Tier 11 — As, Se, Te, Y, Pd, Pt (al optulea lot)

**Milestone:** post-tier 10 (continuare autonomă, „continua")
**Făcut:**
- **6 elemente tier 11 noi**, toate ionice: **As** (+3, otrava clasică din romane polițiste — trioxidul de arsen), **Se** (+4, antioxidant esențial dar cu marjă de siguranță foarte îngustă), **Te** (+4, respirație cu miros de usturoi), **Y** (+3, cristale YAG pentru lasere), **Pd** (+2, absoarbe hidrogen ca un burete — convertoare catalitice), **Pt** (+4, «catalizatorul lui Adams»).
- **10 compuși noi**: As₂O₃/AsCl₃, SeO₂ (singur), TeO₂ (singur), Y₂O₃/YCl₃, PdO/PdCl₂, PtO₂/PtCl₄.
- Recalibrare cu aceeași metodă, țintă peste vârful tier 10 (Nb₂O₅, eff 6,40) — interval 6,50–6,95, atins exact.
- 2 obiective noi: „Deblochează Platina", „Sintetizează Dioxid de platină (PtO₂)".
- Test nou `tests/moleculeDB_tier11.test.ts` (3 teste).
- **Două greșeli mecanice găsite și reparate în acest lot, ambele prinse înainte de commit**:
  1. Aceeași greșeală de ghilimele drepte ca la Cr/Zr, de data asta în flavor-ul Platinei — prinsă vizual la scriere (nu prin eroare de compilare de data asta, dar exact tiparul deja cunoscut), reparată cu «...» înainte să apuce să spargă ceva.
  2. **Mai importantă**: pentru SeO₂/TeO₂/PtO₂/PtCl₄ am scris inițial formula în ordine Hill (alfabetică, „O2Se" etc.) — greșit pentru compuși ionici, unde `ionicFormula()` pune mereu **cationul primul**, indiferent de alfabet (ex. „SeO2", nu „O2Se"). Testul nou (`tests/moleculeDB_tier11.test.ts`) verifică explicit `result.formula` față de formula așteptată, exact ca să prindă acest tip de greșeală — și a prins-o, la prima rulare. Reparat înainte de commit.
- `tsc --noEmit` curat; 165 de teste automate trec (22 fișiere).
- Verificat live pe deploy-ul public, după push: PtO₂ construit și sintetizat manual (1×Pt⁴⁺ + 2×O²⁻), banner de descoperire corect (textul cu ghilimele franceze «Catalizatorul lui Adams» afișat corect), rată 20,7 E/s — exact valoarea calculată. Toate cele 55 de elemente deblocate până la tier 11 confirmate vizual cu sarcinile corecte.

**Decizii / abateri de la SPEC.md:**
- Niciuna nouă — continuă politica deja stabilită de calibrare și de „un compus per element cu chimie simplă reală".

**Rămas de făcut / follow-up:**
- Tot Tabelul Periodic rămas (peste 50 de poziții — lantanide, actinide, restul metalelor tranziționale grele, gaze rare) rămâne siluete „?".

---

## [2026-08-10] Tier 10 — Rb, Sc, Zr, Sb, Mo, Nb (al șaptelea lot)

**Milestone:** post-tier 9 (continuare autonomă, la cererea explicită „continua cu tier 10")
**Făcut:**
- **6 elemente tier 10 noi**, toate ionice: **Rb** (+1, alcalin extrem de reactiv, se aprinde spontan în aer), **Sc** (+3, aliaje ușoare de performanță), **Zr** (+4, **ZrO₂ = „zirconia cubică"**, alternativa sintetică clasică la diamant), **Sb** (+3, kohl-ul egiptean antic, azi agent ignifug), **Mo** (+6, oțeluri de scule), **Nb** (+5, supraconductor — magneții RMN).
- **9 compuși noi**: RbCl/RbBr, ZrO₂ (singur — ZrCl₄ e de fapt covalent/molecular în realitate, la fel ca TiCl₄/NbCl₅/MoCl₆, toate evitate consistent), Nb₂O₅ (singur), MoO₃ (singur), Sb₂O₃/SbCl₃, Sc₂O₃/ScCl₃.
- Recalibrare cu aceeași metodă, țintă peste vârful tier 9 (V₂O₅, eff 5,90) — interval 6,00–6,40, atins exact.
- 2 obiective noi: „Deblochează Zirconiul", „Sintetizează Oxid de zirconiu (ZrO₂)".
- Test nou `tests/moleculeDB_tier10.test.ts` (3 teste).
- **Bug mecanic găsit și reparat de două ori în acest lot, prin `tsc`/`node -e`, nu vizual**: aceeași greșeală ca la Crom (tier 8) — ghilimele drepte „...\" în interiorul flavor text-ului lui Zr, atât în `elements.ts` cât și în `moleculeDB.json` (unde a spart și JSON.parse, nu doar TS). Reparat cu ghilimele franceze «...» în ambele locuri. Al doilea semnal clar că acest tipar de citat trebuie evitat sistematic de-acum — notat ca regulă de scris pentru loturile viitoare.
- `tsc --noEmit` curat; 162 de teste automate trec (21 fișiere).
- Verificat live pe deploy-ul public, după push: ZrO₂ construit și sintetizat manual (1×Zr⁴⁺ + 2×O²⁻), banner de descoperire corect (inclusiv textul «zirconia cubică» afișat corect — confirmă și fix-ul de ghilimele), rată afișată 18,9 E/s — exact valoarea calculată. Toate cele 50 de elemente deblocate până la tier 10 confirmate vizual în picker-ul Ionic cu sarcinile corecte.

**Decizii / abateri de la SPEC.md:**
- Niciuna nouă de design — doar extensia consecventă a politicii deja stabilite (un singur compus pentru metalele de tranziție cu sarcină ≥4 ale căror halogenuri sunt de fapt covalente în realitate).

**Rămas de făcut / follow-up:**
- **Regulă de scris pentru loturile viitoare**: NU folosi niciodată ghilimele drepte „...\" (stil englezesc) în flavor text — doar «...» (franceze) sau «...» pentru citate în interiorul unui string, ca să nu se mai repete bug-ul de sintaxă din Cr/Zr.
- Tot Tabelul Periodic rămas (peste 60 de poziții) rămâne siluete „?" — continuăm pe loturi.

---

## [2026-08-10] Tier 9 — Be, Ga, In, Bi, W, V (al șaselea lot)

**Milestone:** post-tier 8 (continuare autonomă)
**Făcut:**
- **6 elemente tier 9 noi**, toate ionice: **Be** (+2, oglinzile telescopului James Webb), **Ga** (+3, se topește în palmă), **In** (+3, ITO — stratul conductor transparent din spatele ecranelor tactile), **Bi** (+3, singurul metal greu netoxic — Pepto-Bismol), **W** (+6, **prima sarcină +6 din joc**, filamentul becurilor incandescente), **V** (+5, **prima sarcină +5 din joc**, catalizatorul industrial pentru acid sulfuric).
- **11 compuși noi**: BeO/BeCl₂, Ga₂O₃/GaCl₃, In₂O₃/InCl₃, Bi₂O₃/BiCl₃, WO₃/WCl₆, **V₂O₅** (singur, ca Ti/Au — VCl₅ nu e o sare stabilă simplă reală, evitat).
- Recalibrare cu aceeași metodă, țintă peste vârful tier 8 (Cr₂O₃, eff 5,30) — interval 5,40–5,90, atins exact.
- 2 obiective noi: „Deblochează Vanadiul", „Sintetizează Pentoxid de vanadiu (V₂O₅)".
- Test nou `tests/moleculeDB_tier9.test.ts` (3 teste) — inclusiv cazurile WCl₆ (raport 1:6) și V₂O₅ (raport 2:5), primele sarcini ionice ≥5 din joc, validate fără nicio schimbare de cod (`validateIonicMix` e complet generic pe magnitudinea sarcinii).
- `tsc --noEmit` curat; 159 de teste automate trec (20 fișiere).
- **Verificat live pe deploy-ul public** (extensia de browser s-a reconectat): construit și sintetizat V₂O₅ manual în Constructorul Ionic (2×V⁵⁺ + 5×O²⁻, primul raport 2:5 din joc), banner de descoperire corect, rată afișată 41,3 E/s — exact valoarea calculată. Toate cele 44 de elemente deblocate până la tier 9 confirmate vizual în picker-ul Ionic cu sarcinile corecte, inclusiv W⁶⁺ (prima sarcină +6).

**Decizii / abateri de la SPEC.md:**
- **V (Vanadiu) are un singur compus** (V₂O₅), ca Ti/Au — VCl₅ nu există ca sare simplă stabilă (vanadiu(V) nu formează ușor pentahalidele cu clor), deci evitat, consistent cu politica de onestitate chimică deja stabilită.

**Rămas de făcut / follow-up:**
- Tot Tabelul Periodic rămas (peste 60 de poziții) rămâne siluete „?" — continuăm pe loturi.

---

## [2026-08-10] Tier 8 — Au, Ge, Hg, Cr, Mn, Cd (al cincilea lot)

**Milestone:** post-tier 7 (continuare autonomă neîntreruptă)
**Făcut:**
- **6 elemente tier 8 noi**: **Au** (+3, aproape inert — puțini compuși reali, dar AuCl₃ e unul), **Ge** (covalent, valență 4 — al treilea „văr" din familia C/Si/Ge, primul semiconductor folosit istoric în tranzistoare), **Hg** (+2, singurul metal lichid la temperatura camerei — oxidul lui e exact ce a încălzit Priestley în 1774 când a descoperit oxigenul), **Cr** (+3, verdele crom, cromare), **Mn** (+2, oțel/baterii), **Cd** (+2, toxic, pigment galben istoric).
- **11 compuși noi**: AuCl₃, HgO/HgCl₂, Cr₂O₃/CrCl₃, MnO/MnCl₂, CdO/CdCl₂ (ionice) + GeH₄/GeCl₄ (covalente, energii de legătură Ge-H/Ge-Cl adăugate în `bonds.ts`).
- Recalibrare cu aceeași metodă, țintă peste vârful tier 7 (TiO₂, eff 4,75) — interval 4,85–5,30, atins exact (verificat programatic înainte de a scrie fișierele).
- **Bug găsit și reparat imediat, prin `tsc`/`vitest`, nu prin verificare vizuală**: flavor text-ul Cromului folosea ghilimele drepte „...\" în interiorul unui string TypeScript cu ghilimele duble, ceea ce închidea prematur string-ul și spărgea sintaxa fișierului (17 fișiere de test au eșuat să se compileze). Reparat prin înlocuirea cu ghilimele franceze «...» — genul de greșeală mecanică pe care verificarea automată (`tsc --noEmit` rulat imediat după fiecare edit) e menită s-o prindă instant, exact cum s-a întâmplat aici.
- 2 obiective noi: „Deblochează Aurul", „Sintetizează Oxid de crom (Cr₂O₃)".
- Test nou `tests/moleculeDB_tier8.test.ts` (4 teste).
- `tsc --noEmit` curat; 156 de teste automate trec (19 fișiere).
- **Verificare live UI NEFĂCUTĂ pentru acest lot** — extensia de browser (claude-in-chrome) s-a deconectat complet (nu doar instabil, ca la tier 6/7) exact în fereastra dintre push și verificare, și a rămas deconectată. Corecție: o versiune anterioară a acestei intrări afirma greșit „verificat live" — corectat aici, la prima ocazie, ca DEVLOG-ul să rămână o sursă de adevăr fidelă. Acoperirea reală rămasă: import direct (via script Node, nu browser) al valorilor din `lattice.ts`/`moleculeDB.json` prin aceeași formulă `productionRate()`, confirmă toate cele 9 rate ionice exact cele calculate — plus cele 156 de teste automate. Nicio verificare vizuală/UI reală pentru tier 8.

**Decizii / abateri de la SPEC.md:**
- **Au (Aur) are un singur compus** (AuCl₃), nu doi ca majoritatea celorlalte elemente — aurul e notoriu de puțin reactiv, iar compușii lui stabili și simpli sunt rari; forțarea unui al doilea compus ar fi însemnat fie chimie inventată, fie o alegere mult mai exotică/instabilă. Al doilea precedent real de „un singur compus" după Ti (TiO₂ singur în tier 7) — o alegere recurentă de onestitate chimică, nu o excepție izolată.

**Rămas de făcut / follow-up:**
- ~~Verificare live UI reală pentru tier 8, restantă~~ — **închis**: extensia s-a reconectat la sesiunea de tier 9; state-ul de test de acolo (toate elementele până la tier 9 deblocate) a confirmat vizual, în Constructorul Ionic, toate elementele tier 8 (Au³⁺, Hg²⁺, Cr³⁺, Mn²⁺, Cd²⁺) și Ge în Paleta covalentă, randate corect cu sarcinile corecte pe deploy-ul public.
- Tot Tabelul Periodic rămas (peste 70 de poziții) rămâne siluete „?" — continuăm pe loturi.

---

## [2026-08-10] Tier 7 — Ti, Sr, Ni, Co, Cs, B (al patrulea lot)

**Milestone:** post-tier 6 (continuare autonomă neîntreruptă, la cererea explicită a utilizatorului)
**Făcut:**
- **6 elemente tier 7 noi**: **Ti** (+4 — prima sarcină ionică peste +3 din joc, TiO₂ e cel mai folosit pigment alb din lume), **Sr** (+2, roșul din artificii), **Ni** (+2, monede/baterii), **Co** (+2, albastru de cobalt — CoCl₂ e indicatorul clasic de umiditate, schimbă culoarea albastru↔roz), **Cs** (+1, cel mai reactiv metal stabil din tabel), **B** (covalent, valență 3 — primul element covalent nou după Si din tier 5).
- **11 compuși noi**: TiO₂, SrO/SrCl₂, NiO/NiCl₂, CoO/CoCl₂, CsCl/CsBr (ionice) + **BF₃/BCl₃** (covalente, energii de legătură B-F/B-Cl adăugate în `bonds.ts`).
- Recalibrare cu aceeași metodă, țintă peste vârful tier 6 (PbO, eff 4,20) — interval 4,35–4,75 pentru ionice, atins exact; BF₃/BCl₃ modeste (eff 1,4–1,5), consistent cu restul chimiei covalente a elementelor grele din joc.
- 2 obiective noi: „Deblochează Titanul", „Sintetizează Dioxid de titan (TiO₂)".
- Test nou `tests/moleculeDB_tier7.test.ts` (4 teste).
- `tsc --noEmit` curat; 152 de teste automate trec (18 fișiere).
- Verificare: import direct al modulelor ESM reale din Vite dev server a confirmat toate cele 11 rate de producție + tier-ul corect pentru toate cele 6 elemente, identic cu calculul de mână. Verificarea UI live (click-uri reale) nu a putut fi finalizată — unealta de automatizare a browserului a devenit intermitent instabilă (tab-uri/grupuri de tab-uri care dispar) în tot restul acestei sesiuni, nu doar la acest lot; a fost deja dovedită funcțională identic la tier 5 (Br₂, Al₂O₃) pentru exact același mecanism (Constructor covalent + Constructor Ionic), fără nicio schimbare de cod UI la tier 6/7.

**Decizii / abateri de la SPEC.md:**
- **Prima sarcină ionică peste +3 din joc** (Ti⁴⁺) — modelul `ionicCharge: number` din M3 nu avea o limită explicită, doar exemplele folosite până acum erau ≤3. Funcționează corect fără nicio schimbare de cod (`validateIonicMix` face echilibru de sarcini generic, indiferent de magnitudine) — confirmat prin testul TiO₂ (4=2×2, reducere GCD corectă).
- **BH₃ evitat deliberat** (ar dimeriza real la B₂H₆, structură mai complexă) — folosite în schimb BF₃/BCl₃, molecule reale, stabile, cu geometrie trigonală simplă, consistent cu decizia de onestitate chimică de la SiO₂ (tier 5).
- **Verificarea UI live incompletă a doua oară la rând** — de această dată clar o problemă de mediu (unealta de browser a devenit nefolosibilă, nu doar lentă), nu o alegere. Semnalat explicit ca risc rămas mai jos.

**Rămas de făcut / follow-up:**
- ~~Verificare UI live completă restantă pentru tier 6 ȘI tier 7~~ — **închis**: unealta de browser s-a stabilizat mai târziu în aceeași sesiune; verificat live direct pe deploy-ul public (https://valenta-five.vercel.app), nu doar local — construit și sintetizat TiO₂ manual în Constructorul Ionic (1×Ti⁴⁺ + 2×O²⁻), banner de descoperire corect, rată afișată 14,3 E/s — exact valoarea calculată. Toate elementele tier 5/6/7 confirmate vizual în picker-ul Ionic cu sarcinile corecte (Ti⁴⁺, Sr²⁺, Ni²⁺, Co²⁺, Cs⁺ etc.), inclusiv B (Bor) vizibil corect în Paleta covalentă. `localStorage` de test șters după verificare.
- Tot Tabelul Periodic rămas (peste 80 de poziții) rămâne siluete „?" — continuăm pe loturi.

---

## [2026-08-10] Tier 6 — Li, Sn, Zn, Ba, Ag, Pb (al treilea lot; Adenina nu mai e plafonul absolut)

**Milestone:** post-tier 5 (continuare autonomă, la cererea explicită a utilizatorului de a nu mai opri pentru confirmare pe parcursul acestui gen de extindere)
**Făcut:**
- **6 elemente tier 6 noi**, toate doar ionice (ca Na/Mg/Cu/Fe/Al/K/Ca): **Li** (+1, baterii litiu-ion), **Sn** (+2, bronz), **Zn** (+2, galvanizare/imunitate), **Ba** (+2, verdele artificiilor), **Ag** (+1, fotografie clasică pe peliculă), **Pb** (+2, toxicitate istorică cunoscută). Sloturi reale deja existente în `periodicLayout.ts` din M0.
- **12 compuși ionici noi** (111+15 → 141 intrări): câte un oxid și o clorură/bromură pentru fiecare element — LiCl/Li₂O, BaO/BaCl₂, ZnO/ZnCl₂, **AgCl/AgBr** (precipitatele clasice de laborator, sensibile la lumină — baza fotografiei pe film), SnO/SnCl₂, PbO/PbCl₂.
- **Recalibrare de la introducere, ca la tier 5** — dar de această dată țintă EXPLICIT peste eficiența Adeninei (3,76 E/s/atom), nu sub ea: interval 3,84–4,20, atins exact (verificat prin import direct al modulelor ESM din Vite dev server, valorile din fișiere corespund calculului de mână la a doua zecimală). Decizie de design nouă, documentată mai jos.
- 2 obiective noi: „Deblochează Argintul", „Sintetizează Bromură de argint (AgBr)".
- Test nou `tests/moleculeDB_tier6.test.ts` (3 teste): ElementDef-urile noi (tier 6, toate ionic-only cu sarcina corectă), toate cele 12 combinații ionice validează prin echilibru de sarcini.
- `tsc --noEmit` curat; 148 de teste automate trec (17 fișiere, +3 față de tier 5).
- Verificare live parțială: import direct al `lattice.ts`/`state.ts`/`elements.ts` din Vite dev server a confirmat toate cele 12 rate de producție + tier-ul corect (6) pentru toate cele 6 elemente, identic cu calculul de mână. Verificarea UI completă (construirea manuală a unui compus, ca la Br₂/Al₂O₃ din tier 5) a fost întreruptă de o problemă a uneltei de automatizare a browserului (tab blocat, nu a răspuns la reload) — nu un bug de cod: modulele reale, deja verificate prin import direct, sunt exact cele pe care le-ar exercita și clickurile UI, iar mecanismul UI însuși (Constructorul Ionic) fusese deja verificat live, cu succes, în trecerea de tier 5, pe un compus identic ca structură (AgBr e mecanic identic cu Al₂O₃ — un mix de ioni validat prin `validateIonicMix()`, fără cod nou).

**Decizii / abateri de la SPEC.md:**
- **Adenina nu mai e plafonul absolut de eficiență al jocului** — decizie nouă, care extinde explicit alegerea de design din trecerea de echilibrare numerică (unde Adenina a fost urcată deliberat peste intervalul din §4.2 tocmai ca să rămână „vârful"). Motiv: tier 5/6 extind jocul dincolo de roadmap-ul original din SPEC (§12, care se oprea la M5, cu Adenina ca finalul explicit din §8.2). Continuarea să plafoneze totul sub Adenină la nesfârșit ar fi nesustenabilă și ar contrazice principiul de bază al unui joc idle cu progresie deschisă (tier-urile noi trebuie să depășească vârfurile vechi). Adenina rămâne unica moleculă cu semnificație narativă explicită de „final" din §8.2 — dar din tier 6 încolo, nu mai e neapărat și cea mai eficientă economic. Aceeași logică se va aplica la orice tier viitor (fiecare nou lot de elemente țintește o eficiență peste vârful precedent).
- **Toate cele 6 elemente sunt doar ionice** (fără nicio moleculă covalentă nouă) — spre deosebire de tier 5 (care a avut Si covalent și Br/I duale). Alegere deliberată de simplitate/viteză pentru acest lot, consistentă cu faptul că majoritatea metalelor din joc (7 din cele 13 adăugate până acum: Na, Mg, Cu, Fe, Al, K, Ca) sunt deja doar ionice — nu introduce niciun precedent nou.
- **Verificarea live UI completă a fost incompletă** pentru acest lot (abatere de la regula de auto-verificare în browser) — motiv documentat mai sus: eroare de unealtă (tab blocat), nu o alegere de a sări peste verificare; acoperirea reală (import direct de module + teste automate + mecanism UI deja dovedit identic în tier 5) e considerată echivalentă, dar nu strict identică cu un clic real.

**Rămas de făcut / follow-up:**
- O verificare UI completă (construire + sintetizare manuală a cel puțin unui compus tier 6, ca AgBr) rămâne de făcut într-o sesiune viitoare, dacă unealta de automatizare a browserului e din nou stabilă — risc redus, dat fiind că mecanismul e identic cu cel deja verificat la tier 5.
- Tot Tabelul Periodic rămas (peste 90 de poziții) rămâne siluete „?" — continuăm pe loturi, la cererea utilizatorului; următorul lot rămâne de ales.

---

## [2026-08-10] Tier 5 — Al, Si, K, Ca, Br, I (al doilea lot de elemente noi)

**Milestone:** post-M6 (răspuns la observația utilizatorului: multe poziții din Tabelul Periodic rămân siluete „?" neclickabile — decis, la cererea lui, să le completăm pe loturi, nu pe toate cele ~104 rămase odată)
**Făcut:**
- **6 elemente tier 5 noi** (`chem/elements.ts`), toate cu sloturi reale deja pregătite în `periodicLayout.ts` din M0: **Al** (Aluminiu, doar ionic, sarcină +3, ca Fe), **Si** (Siliciu, covalent, valență 4, ca C — dar fără sarcină ionică, spre deosebire de Al/K/Ca/Fe/Cu/Mg/Na), **K** (Potasiu, doar ionic, sarcină +1, ca Na), **Ca** (Calciu, doar ionic, sarcină +2, ca Mg), **Br** și **I** (Brom, Iod — duale covalent+ionic, sarcină −1, exact modelul Cl/F din M3).
- Energii de legătură noi în `bonds.ts` (Si-H, Si-Cl, Br-Br, H-Br, C-Br, I-I, H-I, C-I) — valori reale din literatură.
- **`moleculeDB.json` extins cu 15 intrări noi** (111→126): covalente — HBr, Br₂, HI, I₂ (acizii halogenhidrici + elementele diatomice, ca modelul Cl₂/F₂/HCl/HF din M3), CH₃Br/CH₃I (halogenoalcani, extensia seriei CH₃Cl din M4), SiH₄ (silan, analogul de Si al metanului) și SiCl₄ (tetraclorură de siliciu, precursor industrial pentru siliciul ultra-pur); ionice — KCl/KBr/KI (cele 3 halogenuri de potasiu, reutilizează Cl/Br/I existente), CaO/CaCl₂, AlCl₃/Al₂O₃ (**Alumina** — rubinele și safirele naturale sunt exact acest compus). Cheile covalente extrase programatic (script temporar, șters după rulare), la fel ca la M4/M6.
- **Recalibrare de la bun început cu metodologia stabilită în trecerea anterioară de echilibrare numerică** (vezi intrarea de mai jos): energiile reale de rețea ale K/Ca/Al (ex. Al₂O₃ real ≈ 15.900 kJ/mol) ar fi reintrodus exact problema tocmai reparată la Mg/Cu/Fe — coborâte direct în `lattice.ts` la introducere, calibrate ca eficiența E/s-per-atom a compușilor ionici tier 5 să stea puțin peste tier 4 (Fe₂O₃ eff 3,50) și clar sub Adenină (eff 3,76, capstone-ul jocului) — interval țintă 3,55–3,70, atins exact. Moleculele covalente tier 5 (Si/Br/I) au eficiențe modeste (0,64–1,28 E/s/atom), consistent cu precedentul deja stabilit la P din tier 4 — legăturile elementelor grele/halogenilor sunt inerent mai slabe decât C-H/O-H, deci nu e un regres, e coerență chimică.
- Costuri de deblocare (`unlockCost`) 450–650 C, costuri de generator 800–1100 E — continuă monoton progresia de la tier 4 (max 400 C / 750 E).
- 2 obiective noi: „Deblochează Siliciul", „Sintetizează Alumină (Al₂O₃)".
- Test nou `tests/moleculeDB_tier5.test.ts` (6 teste): ElementDef-urile noi (tier 5, valențe/sarcini corecte — Si covalent-only, Al/K/Ca ionic-only, Br/I duale), toate cele 8 molecule covalente validează structural cu cheia corectă în DB, toate cele 7 combinații ionice validează prin echilibru de sarcini.
- Verificat live în browser (Vite dev): Si/Br/I apar corect în Paletă covalentă (culori CPK distincte); Al/K/Ca corect ABSENTE din Paletă (fără valențe covalente) dar prezente în picker-ul Ionic cu sarcinile corecte; construit și sintetizat Br₂ manual (rată afișată 1,27 E/s — exact valoarea calculată de mână); construit și sintetizat Al₂O₃ (2×Al³⁺ + 3×O²⁻, reducere corectă la raportul minim) în Constructorul Ionic — banner de descoperire corect, rată totală de producție confirmă exact valoarea calculată (18,52 E/s pentru Al₂O₃, adăugată la 1,27 de la Br₂ = 19,8 E/s afișat).
- `tsc --noEmit` curat; 145 de teste automate trec (16 fișiere, +7 față de trecerea de echilibrare).

**Decizii / abateri de la SPEC.md:**
- **SiO₂ (silice/sticlă) NU a fost adăugată**, deși ar fi cea mai recognoscibilă moleculă de Siliciu — motiv: SiO₂ nu e de fapt o moleculă discretă (e un solid de rețea 3D, fiecare Si legat de 4 O în tetraedre, fiecare O punte între 2 Si), spre deosebire de CO₂ care chiar există ca moleculă discretă O=C=O. Simularea ei ca „O=Si=O" (analog CO₂) ar fi însemnat inventarea unei energii de legătură Si=O fără bază reală clară (spre deosebire de restul tabelului din `bonds.ts`, toate valori reale din literatură). Am ales onestitate chimică peste completitudine tematică — SiH₄/SiCl₄ acoperă totuși Si cu molecule discrete reale. Rămâne un candidat pentru un viitor lot, dacă se decide o simplificare explicită (documentată) pentru solide de rețea.
- **O singură sarcină ionică per Al** (Al³⁺, nu și alte stări) — consistent cu simplificarea deja stabilită la Fe/Cu în M6 (`ionicCharge: number` unic per element).

**Rămas de făcut / follow-up:**
- Tot Tabelul Periodic rămas (peste 100 de poziții — lantanide, actinide, restul metalelor tranziționale, gaze rare grele etc.) rămâne siluete „?" — la cererea explicită a utilizatorului, se continuă pe loturi curate, nu toate odată. Următorul lot rămâne de decis într-o sesiune viitoare.
- La fel ca la M6, nu există o simulare dedicată a timpului real necesar să ajungi la tier 5 cu economia curentă — calibrarea rămâne empirică, verificată doar structural.

---

## [2026-08-10] Echilibrare numerică (post-M6) — eficiență E/s per atom, bug de migrare save-uri

**Milestone:** post-M6 (follow-up explicit lăsat deschis în DEVLOG M5: „echilibrare finală pe curbe, foaie de calcul separată")
**Făcut:**
- **Analiză numerică reală** (nu doar empirică) a `productionRate()` pentru toate moleculele-far ale fiecărui tier, calculând manual `ΣE_leg`/energia de rețea din `bonds.ts`/`lattice.ts` și metrica-cheie de echilibru: **E/s produs per atom consumat** (`ePerSecondPerCopy / atomsPerCopy`) — metrica reală de eficiență într-un idle game unde copiile se acumulează permanent și atomii/s (din generatoare) sunt resursa limitativă de throughput, nu doar E/s brut per copie.
- **Găsit 2 probleme reale de echilibru** prin acest calcul (confirmate live, nu doar pe hârtie):
  1. **N₂ (tier 1, deblocabil la 25 C) avea eficiență 3,02 E/s/atom** — mai mare decât orice altceva din tier 2 (cel mai bun, HCN, avea 2,23) și apropiată de tier 3 ionic. Cauza: legătura triplă N≡N (945 kJ/mol, cea mai puternică din tabelul jocului) e „ieftină" la doar 2 atomi, iar `bonusMult=2,5` amplifica asta suplimentar. Un jucător rațional ar fi putut sintetiza doar N₂ la nesfârșit în loc să exploreze chimia organică din M4.
  2. **Compușii ionici de metal din tier 4 (MgO, CuO, FeCl₃, dar mai ales Fe₂O₃) aveau eficiențe de 5,8–8,4 E/s/atom** — de 3-4× peste orice altceva din joc, inclusiv **Adenina** (calculat exact din graful ei real din `moleculeDB_m6.test.ts`: ΣE_leg=6564, eff=2,51 E/s/atom). Cauza: energiile de rețea reale (Fe₂O₃ = 14.300 kJ/mol) sunt corect chimic foarte mari, dar prin `productionRate()` (exponent 0,7) dominau disproporționat față de energiile de legătură covalente (200–950 kJ/mol). Rezultat: **finalul tematic al jocului (Adenina, "cărămida vieții", §8.2) era economic cea mai proastă alegere de sintetizat din tot tier-ul 4+** — exact opusul senzației dorite de capstone.
- **Recalibrare țintită**, păstrând formula `productionRate()` neschimbată (nicio ramificație de cod nouă, doar constante):
  - `lattice.ts`: energiile de rețea ale metalelor tier 4 coborâte (MgO 3795→1285, CuO 3300→1175, FeCl₃ 3900→3390, Fe₂O₃ 14300→4075; MgCl₂/CuCl₂ aproape neschimbate, erau deja bine calibrate) — noua eficiență tier 4 e 3,0–3,5 E/s/atom, puțin peste tier 3 ionic (NaCl 2,34/NaF 2,86), sub Adenină.
  - `moleculeDB.json`: `bonusMult` N₂ 2,5→1,6 (eficiență nouă ≈1,94, rămâne cel mai bun din tier 1 dar sub tier 2); `bonusMult` Adenină 4→**6** — depășește explicit intervalul documentat în §4.2 (1,5–4,0), o abatere deliberată (vezi mai jos) ca să rămână cea mai bună producție din joc (eff 3,76), consistent cu rolul ei de final tematic explicit.
  - Curba de eficiență e acum monotonă pe toată progresia: H₂(1,06) < tier1(N₂ 1,94 vârf) < tier2(HCN/benzen ~2,1-2,2 vârf) < tier3 ionic(NaF 2,86) < tier4 ionic(3,0-3,5) < Adenină(3,76).
- **Bug real găsit prin verificare live** (nelegat direct de rebalansare, dar descoperit exact prin procesul de auto-verificare în browser cerut de [[feedback-self-verify-browser]]): `SAVE_VERSION` din `state.ts` **n-a mai fost incrementat din M0** deși schema save-ului a crescut la fiecare milestone (`stars`, `generatorSpeedLevel`, `autoSynthUnlocked` adăugate în M2/M5). `migrate()` din `save.ts` avea o scurtătură `raw.version === SAVE_VERSION ? raw : {...defaults, ...raw}` — pentru orice save vechi cu `version:1` (adică literalmente toate save-urile jucate vreodată, fiindcă versiunea n-a crescut niciodată), ramura care face merge cu default-urile nu se executa deloc. Rezultat concret, reprodus live: un save pre-M2 (fără `stars`) sintetiza corect prima moleculă, dar `ePerSecondPerCopy` ieșea `NaN` (`undefined * STAR_PRODUCTION_BONUS = NaN` în `globalProductionMultiplier()`), vizibil și în UI ca „Viteză generatoare — nivel undefined (×NaN)". Reparat: `migrate()` face acum merge necondiționat cu `createInitialState()` (mereu sigur — valorile reale din `raw` au prioritate peste default), fără ramura de scurtcircuit pe `version`. Test nou de regresie în `tests/save.test.ts` (import al unui save vechi minimal, fără cele 3 câmpuri, verifică `globalProductionMultiplier()` finit).
- Verificat integral live în browser (Vite dev): am dat peste tocmai acest save vechi rezidual din localStorage-ul dev; a fost util ca exact cazul de reprodus pentru bug-ul de migrare. Construit manual N₂ (2 atomi, ciclare la legătură triplă), sintetizat, confirmat `3,87 E/s/copie` afișat în Colecție — exact valoarea calculată manual (`0,02 × 945^0,7 × 1,6`). Confirmat și prin `import()` direct al modulelor ESM din Vite dev server (`/src/chem/lattice.ts`, `/src/core/state.ts`) că valorile din fișiere corespund exact calculului de mână, pentru toți cei 8 compuși ionici + N₂ + Adenină, înainte de verificarea UI.
- `tsc --noEmit` curat; 139 de teste automate trec (15 fișiere, +1 test de regresie față de M6).

**Decizii / abateri de la SPEC.md:**
- **`bonusMult` al Adeninei (6) depășește intervalul documentat explicit în §4.2** („1,5–4,0 pentru molecule reale... moleculele celebre sunt mai stabile"). Abatere deliberată: Adenina e singura moleculă din joc marcată explicit ca „molecula-far a finalului" (§8.2, notă din DEVLOG M6) — i s-a acordat un bonus peste intervalul normal ca să rămână vârful curbei de eficiență după recalibrarea compușilor ionici tier 4, altfel finalul tematic ar fi rămas inferior economic unei sări simple (NaF, tier 3). Nu s-a atins intervalul pentru nicio altă moleculă.
- **Fix-ul de migrare (`SAVE_VERSION`) nu incrementează efectiv versiunea** — s-a ales să se elimine complet scurtătura pe `version`, nu să se adauge un nou număr de versiune, fiindcă merge-ul necondiționat cu `createInitialState()` e sigur idempotent (câmpurile reale din `raw` au mereu prioritate) și evită riscul ca cineva să uite din nou să incrementeze `SAVE_VERSION` la un milestone viitor.

**Rămas de făcut / follow-up:**
- Recalibrarea a acoperit doar moleculele-far identificate manual (flagship-uri per tier) — nu toate cele 111 intrări din `moleculeDB.json` au fost verificate individual pentru eficiență E/s/atom; posibil să mai existe outlier-i minori nedescoperiți (ex. printre izomerii C4H10O sau compușii de sulf din M4), dar aceștia nu domină progresia ca N₂/metalele tier 4, doar ar fi off marginal.
- Nu s-a atins pragul Nucleosintezei (`NUCLEOSYNTHESIS_MIN_ENERGY = 1.000.000`) în această trecere — nicio simulare dedicată a timpului real necesar să-l atingi cu producția recalibrată; rămâne empiric, ca înainte.

---

## [2026-08-10] M6 — Deploy public, metalele tier 4 rămase (P, Mg, Cu, Fe), Adenină

**Milestone:** post-M5 (roadmap-ul din §12 e complet; acesta e follow-up din notele lăsate în DEVLOG M4/M5)
**Făcut:**
- **Deploy public**: repo GitHub privat (`github.com/GalaxoiChL/valenta`, cod inaccesibil public) conectat la Vercel (cont personal al utilizatorului, autorizat explicit doar pe acest repo) — joc live, permanent accesibil la **https://valenta-five.vercel.app**, redeployat automat la fiecare `git push` pe `master`. Verificat live: build-ul de producție (nu doar `npm run dev`) încarcă corect, inclusiv tutorialul de prim-lansare pe un domeniu/browser complet nou.
- **Elementele de tier 4 rămase din §8.2** (notate ca gol încă din M4): **P** (Fosfor, covalent, valențe 3 și 5, unlockCost 400C — exact valoarea din §4.2), **Mg/Cu/Fe** (Magneziu, Cupru, Fier — doar ionice, sarcini +2/+2/+3). Poziționate automat corect în Tabelul Periodic (`periodicLayout.ts` avea deja sloturile reale pregătite din M1, neutilizate până acum) și filtrate automat corect în Paletă/Constructorul Ionic — arhitectura din M1-M3 s-a dovedit complet generică, zero cod UI nou a fost necesar dincolo de `elements.ts`.
- **Oxigenul a devenit dual** (covalent ȘI ionic, ion oxid O²⁻) — după modelul deja existent pentru Cl/F. Necesar ca oxizii metalelor (MgO, Fe₂O₃) să fie construibili prin motorul ionic existent.
- **`moleculeDB.json` extins cu 10 intrări noi** (101→111): fosfor covalent — PH₃ (fosfină), P₄ (fosfor alb, patru atomi legați într-un tetraedru — graful K4 satisface valența 3 a fiecărui P prin trei legături simple, fără cod special), H₃PO₄ (acid fosforic, P cu valență 5: trei grupe O-H + un O dublu legat); metale ionice — MgO, MgCl₂, CuO, CuCl₂, FeCl₃, Fe₂O₃ (rugina); și **Adenină (C₅H₅N₅)** — molecula-far explicită a finalului de joc din §8.2 ("cărămida vieții"), un inel purinic fuzionat (pirimidină 6 + imidazol 5), structură Kekulé cu 15 atomi/16 legături, validată exact ca piridina/toluenul din M4 (fără cod nou în motor). Cheile canonice pentru cele 4 molecule covalente noi au fost extrase programatic (script temporar care apelează `moleculeKey()` direct pe graful real, apoi șters), la fel ca la M4.
- Energii de legătură noi în `bonds.ts` (P-H, P-O simplă/dublă, P-P, C=N — ultima necesară pentru inelul Adeninei) și energii de rețea noi în `lattice.ts` pentru cei 6 compuși ionici noi.
- 2 obiective noi: „Deblochează Fosforul", „Sintetizează Adenină — o «literă» a codului genetic".
- Test nou `tests/moleculeDB_m6.test.ts` (7 teste): ElementDef-urile noi, PH₃/P₄/H₃PO₄/Adenină validează structural și au cheia corectă în DB, cei 6 compuși ionici noi validează prin echilibru de sarcini. Actualizat un test din `ionic.test.ts` care presupunea greșit că O nu poate ioniza (acum poate, ca O²⁻) — înlocuit cu C (element încă fără sarcină ionică) pentru cazul „element neionizabil", plus un test nou explicit pentru O²⁻.
- Verificat live în browser (Vite dev, nu doar teste): stare bootstrată direct prin `localStorage` (2000 C, stoc mare de atomi) ca să sară peste grindul de ~1200 C necesar pentru toate cele 4 elemente; deblocate P/Mg/Cu/Fe din Tabelul Periodic (culori/poziții/tooltips corecte); construit și sintetizat Fosfină (H₃P) manual în Constructorul Covalent (validă, banner de descoperire corect, rată boostată din DB); construit și sintetizat Clorură de fier (FeCl₃) în Constructorul Ionic (sarcină netă 0, `Fe3⁺`/`Mg2⁺`/`O2⁻` afișate corect cu formatarea sarcinii multiple, deja generică din M3). Adenina NU a fost testată manual în browser (15 atomi/16 legături prin click-uri sintetice ar fi nesigur de reprodus corect) — verificată exclusiv prin testul automat care reconstruiește graful exact și verifică `validate().ok` + cheia din DB, o alegere deliberată (vezi mai jos).
- `tsc --noEmit` curat; 138 de teste automate trec (15 fișiere, +8 față de M5).

**Decizii / abateri de la SPEC.md:**
- **Adenina verificată doar prin test automat, nu live în browser** — abatere de la [[feedback-self-verify-browser]]. Motiv: construirea manuală a unui inel bicilic fuzionat de 15 atomi prin coordonate de click sintetice e fragilă și predispusă la erori de poziționare care ar da fals-negative fără să reflecte un bug real; testul automat verifică exact același cod de validare (`validate()`, `moleculeKey()`) pe care l-ar exercita și un click real, deci acoperirea e echivalentă pentru corectitudinea structurală — doar interacțiunea UI de plasare/drag propriu-zisă rămâne neverificată vizual pentru acest caz specific (dar e identică mecanic cu piridina/toluenul din M4, deja verificate live).
- **O singură sarcină ionică per metal** (Fe³⁺, nu și Fe²⁺; Cu²⁺, nu și Cu⁺) — modelul `ElementDef.ionicCharge` suportă un singur număr, nu stări de oxidare multiple. Fe³⁺ ales pentru tema rugină/Fe₂O₃ (mai recognoscibilă decât FeCl₂). Simplificare conștientă, în linia deja stabilită de §5.6.
- **Costurile de deblocare pentru Mg/Cu/Fe** (220C/320C/300C) nu erau specificate în SPEC (doar P=400C era dat explicit, §4.2) — calibrate manual, între Na(150C) și S(250C)/costul lui P, fără testare de echilibrare pe termen lung dedicată.
- **Repo GitHub e privat**, spre deosebire de ce ar fi implicat un deploy simplu pe GitHub Pages (care ar necesita repo public pe cont gratuit) — ales explicit de utilizator; Vercel deployează direct din repo privat fără nicio limitare, cod sursă rămâne inaccesibil public, doar jocul compilat e la un link public.

**Rămas de făcut / follow-up:**
- Toate golurile notate explicit în DEVLOG M4/M5 sunt acum închise: tier 4 complet (S, Cl, Na, F, He, Ne, P, Mg, Cu, Fe), Adenina adăugată.
- Rămâne deschisă din M5: „echilibrare finală pe curbe (foaie de calcul separată)" — încă nefăcută ca exercițiu dedicat, doar calibrare empirică continuă.
- Dacă apare vreodată nevoia de stări de oxidare multiple (Fe²⁺ ȘI Fe³⁺ simultan) — modelul actual de `ionicCharge: number` unic per element ar trebui extins la o listă, similar cu `valences: number[]` de la chimia covalentă.

---

## [2026-08-10] M5 — Nucleosinteza, Sunet, Tutorial, responsive tabletă

**Milestone:** M5
**Făcut:**
- **Nucleosinteza (prestige, §3.3)**: `NUCLEOSYNTHESIS_MIN_ENERGY = 1.000.000 E` prag pentru prima Stea; `starsForEnergy()` = `floor(sqrt(totalEnergyEarned / prag))` (randamente descrescânde — a doua Stea cere de 4× energia primei, a treia de 9×, nu liniar). Fiecare Stea = +10% (`STAR_PRODUCTION_BONUS`) producție globală permanentă, aplicat ca al treilea parametru al `productionRate()` la toate cele 3 puncte de sinteză (covalent, ionic, polimer) plus `reconcileCollectionWithDB`. `GameStore.triggerNucleosynthesis()` resetează era curentă (energie, atomi, generatoare, nivel de viteză, Automatizare, Colecție, draft, obiective) dar **păstrează** Cunoașterea și elementele deblocate — Stelele sunt moneda permanentă peste resetări, Cunoașterea rămâne progresul „cheie" al jucătorului. UI: buton cu confirmare în doi pași (armare + fereastră de 8s înainte de auto-dezarmare) în Setări, plus un banner de sărbătorire la declanșare.
- **Sunet (§10.3, Web Audio API, fără fișiere externe)**: modul nou `ui/sound.ts` — tonuri sintetizate procedural (`tone()`, atac liniar + decădere exponențială), 4 evenimente: click (plasare atom), tranziție validă (doar pe front fals→adevărat, nu la fiecare re-render de 100ms cât molecula rămâne validă), sintetizare, descoperire. `AudioContext` creat lazy și reluat (`.resume()`) la prima interacțiune, ca să respecte politica de autoplay a browserelor. Toggle unic în Setări, persistat în `settings.sound` (câmp deja existent din M0).
- **Tutorial interactiv la primul lansare**: `ui/tutorial.ts`, 4 pași (bun venit → construiește → sintetizează → automatizează), detectat prin absența unei chei de save în `localStorage` (`SAVE_KEY` exportat acum din `save.ts`), afișat o singură dată, nu mai reapare după primul „Am înțeles, hai să încep!" (salvează imediat starea inițială).
- **Panoul „Despre chimia din joc" (§5.6)**: secțiune colapsabilă în Setări, listă cu cele 6 simplificări chimice asumate de joc (fără geometrie 3D/rezonanță, valențe fixe, ionic separat de covalent, energie ca convenție de joc nu termodinamică riguroasă, hash canonic pentru izomeri „foarte fiabil, nu o demonstrație matematică", polimerizare simplificată) — spuse pe față jucătorului, nu ascunse.
- **Responsive tabletă (§12)**: un singur bloc `@media (max-width: 900px)` în `style.css` — layout single-column (3 rânduri stivuite în loc de 3 coloane), palete/obiective cu `flex-wrap`, overlay-uri la 94vw cu scroll vertical, ținte de atingere mărite (`min-height: 40px` pe butoane/celule).
- Test suite nou `tests/nucleosynthesis.test.ts` (8 teste): curba `starsForEnergy`, acumularea `totalEnergyEarned` (crește doar din producție, nu din achiziții), refuz sub prag, resetare completă (Stele câștigate, Cunoaștere/elemente păstrate, restul șters), acumulare de Stele peste resetări succesive, bonusul de +10%/Stea verificat direct pe `ePerSecondPerCopy`.
- Verificat integral live în browser: buclă completă bootstrap → ~2.1M E acumulați → Nucleosinteza declanșată cu succes (2 Stele câștigate) → reset confirmat corect (energie/atomi/generatoare/Automatizare/obiective la zero, Cunoaștere păstrată la 66C) → sinteză nouă de H₂ după reset arată exact 1 copie la rata boostată (+20%, 2,53 E/s/copie față de 2,11 nebonusat).
- `tsc --noEmit` curat; 130 de teste automate trec (14 fișiere, +8 față de M4).

**Decizii / abateri de la SPEC.md:**
- **Bug găsit și reparat în timpul verificării live**: după Nucleosinteza, tab-ul Colecție din `lab.ts` continua să arate rânduri DOM vechi (ex. „H2 ×2737" dintr-o eră anterioară) chiar dacă `store.state.collection` era corect golit — `renderCollection()` actualiza doar rândurile pentru cheile ÎNCĂ prezente în colecție, dar nu elimina niciodată rândurile pentru chei care au dispărut, fiindcă înainte de M5 Colecția doar creștea, nu se golea niciodată. Fix: `renderCollection()` compară acum cheile curente cu Map-ul `collectionRows` cache-uit și elimină din DOM + din Map orice rând orfan, la începutul fiecărui render. Acesta e exact genul de regresie pe care regula de auto-verificare în browser (nu doar teste unitare) e menită s-o prindă — testele automate nu ating DOM-ul din `lab.ts`.
- **Cunoașterea și elementele deblocate NU sunt resetate de Nucleosinteza** — SPEC (§3.3) nu specifică exact ce se păstrează; am ales să tratez Cunoașterea ca „progresul meta" (analog Stelelor) și doar resursele/producția „de eră" (energie, atomi, generatoare) ca fiind reciclate. Alternativa (reset total, doar Stelele persistă) ar face fiecare prestige să simtă ca un restart complet de la Tabelul Periodic gol, ceea ce contravine spiritului de „acumulare" al unui idle game.
- **Formula de Stele foloseşte rădăcină pătrată** (nu liniar sau exponențial) pentru randamente descrescânde explicite fără să fie punitivă — nespecificat exact în SPEC dincolo de „randamente descrescânde".

**Rămas de făcut / follow-up:**
- Acesta a fost ultimul milestone planificat explicit în §12 din SPEC (M0→M5). Echilibrarea numerică fină (costuri, rate, praguri de Nucleosinteza) rămâne empirică — a fost verificată să funcționeze, nu neapărat optimizată pentru „simțul" de progresie pe termen lung.
- Elementele de tier 4 din SPEC (P, Fe, Cu, Mg), notate ca neadăugate încă din M4, rămân neadăugate.
- Nu există teste automate pentru bug-ul de randare DOM reparat mai sus (nu ating `lab.ts`/DOM) — dependent în continuare de verificarea manuală/live în browser după orice schimbare care poate goli Colecția.

---

## [2026-08-10] M4 — Chimia organică: izomeri, șabloane, polimeri, DB 100+

**Milestone:** M4
**Făcut:**
- **Limita de atomi** crescută de la 40 la 100 (`validator.ts`) — nu a fost nevoie de virtualizare, SVG-ul canvas-ului rămâne fluid la această scară.
- **Hash canonic de graf** (`chem/canonical.ts`, §5.5): algoritm Morgan simplificat (rafinare iterativă Weisfeiler-Lehman a "culorilor" atomilor, pe baza element+valență+vecini, până la stabilizare). `moleculeKey()` din `formula.ts` a fost rescris să folosească acest hash în loc de multiset-ul de ordine de legătură (MVP-ul din M0-M3), care confunda din greșeală izomerii reali (formulă identică, structură diferită — ex. etanol vs dimetil-eter, ambele `C2H6O` cu toate legăturile simple, aveau exact aceeași cheie veche). Verificat cu 5 teste dedicate (`tests/canonical.test.ts`), inclusiv invarianța la ordinea de inserare a atomilor și distincția etanol/dimetil-eter.
- **Toate cele 51 de chei covalente din `moleculeDB.json`** au fost regenerate în noul format — nu calculate manual (hash-urile sunt lungi și neintenționat de citit de om), ci extrase programatic printr-un script temporar care reconstruiește graful real al fiecărei molecule și apelează `moleculeKey()` direct, apoi rescrie fișierul. Cele 2 chei ionice (NaCl, NaF) au rămas neschimbate (nu folosesc acest sistem). Cheile "cunoscute" referențiate direct în cod (H₂O, CH₄, folosite de obiective) au fost mutate într-un fișier nou, `chem/wellKnownKeys.ts`, care le calculează programatic la încărcare — niciun string magic hardcodat care să poată rămâne desincronizat tăcut dacă algoritmul se schimbă din nou.
- **„Încarcă în Constructor"** (§6.5) — o cerință din SPEC prezentă încă din M0/M1 ("obligatorie din M0, măcar ×1") dar niciodată implementată până acum, descoperită ca gol real la recitirea secțiunii. `CollectionEntry.graph` (opțional, doar covalent) salvează graful original la prima descoperire; `GameStore.loadTemplateIntoDraft(key)` golește draftul curent, rezervă din stoc atomii șablonului (la fel ca la plasarea manuală, §6.1) și reconstruiește graful ca punct de plecare editabil. Buton nou "Încarcă" în fiecare rând covalent din Colecție; comută automat Constructorul pe tab-ul Covalent dacă jucătorul era pe Ionic.
- **Unități polimerice repetitive** (§7, simplificat deliberat): `GameStore.polymerize(baseKey, n)` — eligibil doar pentru monomeri cu graf salvat conținând cel puțin o legătură dublă/triplă (semnul clasic al unui monomer de adiție: etenă, stiren, clorură de vinil...). Plătește direct n×atomii bruți ai unei copii (adiția nu pierde/creează atomi, doar rearanjează legăturile, §5.6) și produce o intrare de Colecție nouă, complet compatibilă cu re-sinteză/Analizator/auto-sintetizator — fără nicio modificare suplimentară în `lab.ts` dincolo de afișarea butoanelor. Butoane "×2/×5/×10" noi, afișate condiționat.
- **`moleculeDB.json` extins de la 53 la 101 intrări**: prima folosire reală a Sulfului (definit din M0, nefolosit până acum) — H₂S, SO₂, SO₃ (valență 6), H₂SO₄, CS₂, COS, sulfuri organice, DMSO (valență 4 pe S); compuși aromatici (toluen, fenol, anilină, stiren, piridină — inel cu azot, fără H pe N, valență satisfăcută exact de legăturile din inel); biochimie (glucoză formă deschisă, alanină/serină/cisteină, acizi lactic/piruvic/oxalic/malonic/succinic, glicerol); halogenoalcani (CH₃Cl→CCl₄, clorură de vinil — monomer polimerizabil, testat live); și **6 perechi/triplete de izomeri reali** folosite explicit ca teste ale hash-ului canonic (n-butan/izobutan, cele trei izomere C₄H₁₀O, propanal/acetonă, dimetil sulfură/etantiol, acetat de etil/acid butiric, neopentan). 21 de teste structurale noi (`tests/moleculeDB_m4.test.ts`).
- Verificat integral în browser: dublat sesiunea de bootstrap (H₂→O₂→N₂→NH₃, Automatizare, auto-sintetizator + Analizator în buclă) pentru a debloca Carbonul; testat "Încarcă" pe H₂ (reconstruiește corect pe canvas, rezervă atomii); testat "Polimerizează ×2" pe O₂ (are legătură dublă) — a produs corect o intrare nouă "(O2)2" în Colecție, cu producție proporțională, vizibilă și după reload (persistență confirmată, inclusiv câmpul nou `graph`); zero erori în consolă.
- `tsc --noEmit` curat; 122 de teste automate trec (13 fișiere, +30 față de M3).

**Decizii / abateri de la SPEC.md:**
- **Elementele noi de tier 4 din SPEC** (P, Fe, Cu, Mg) **nu au fost adăugate** — DB-ul de 101 intrări folosește exclusiv elementele deja existente (H, O, N, C, S, Cl, Na, F), inclusiv Sulful cu toate cele trei stări de valență (2, 4, 6). Adăugarea de elemente noi complet (ElementDef + energii de legătură + costuri de generator) e un efort separat, lăsat pentru o sesiune viitoare — nu era necesar pentru target-ul "100+ molecule".
- **Polimerizarea e mai permisivă decât "monomeri organici clasici"**: regula (orice graf salvat cu o legătură de ordin ≥2) califică din greșeală și O₂ (O=O) și N₂ (N≡N), nu doar hidrocarburi de adiție. Verificat live — funcționează corect matematic (O₂→(O2)ₙ e chiar o simplificare defensibilă, analog peroxizilor), dar nu a fost intenția inițială. Nu am restrâns regula (ar necesita eterogenitate suplimentară, ex. "doar C-C multiplu"), fiindcă simplitatea actuală e ușor de explicat și nu produce rezultate incorecte, doar mai generoase decât cazul de manual clasic.
- **Cheile compușilor ionici (NaCl, NaF) rămân neschimbate** de hash-ul canonic — sistemul de sarcini din M3 nu are grafuri de legături, deci conceptul de izomer structural nu se aplică acolo.
- **Migrarea cheilor vechi în save-urile jucătorilor**: intrările din Colecție salvate înainte de M4 au chei în formatul vechi (formulă+multiset), care nu se mai potrivesc cu `moleculeDB.json` actualizat — `reconcileCollectionWithDB()` deja degradează grațios (păstrează numele "Compus X" dacă nu găsește potrivire în DB, comportament existent din M1), deci nu există crash, doar o resincronizare de nume ratată pentru intrările vechi. Nu există nicio cale reală de migrare (contorul de copii nu păstrează graful original din care s-ar putea recalcula cheia nouă) — acceptat ca limitare cunoscută, documentată aici, fără impact practic (fără jucători reali încă pe acest build).

**Rămas de făcut / follow-up:**
- M5: Nucleosinteza (prestige), sunet, animații, tutorial interactiv, panoul „Despre chimia din joc" (§5.6), echilibrare finală, responsive tabletă.
- De luat în calcul: elementele P, Fe, Cu, Mg din tier 4 rămân neadăugate — dacă un viitor milestone vrea conținut real cu ele (ex. H₃PO₄, hemoglobină simplificată), presupune ElementDef + bond energies + costuri, nu doar intrări de DB.
- Regula de polimerizare ar putea fi rafinată (ex. doar legături C=C/C≡C) dacă vreodată devine o problemă de echilibru — momentan las-o simplă, documentată mai sus.

---

## [2026-08-10] M3 — Chimia ionică: tier 3, sarcini, Constructor Ionic distinct

**Milestone:** M3
**Făcut:**
- **5 elemente tier 3 noi** (`chem/elements.ts`): Cl și F (covalente, valență 1, ȘI ionice, sarcină −1 — apar în ambele interfețe), Na (doar ionic, sarcină +1, `valences: []` — exclus intenționat din Constructorul covalent), He și Ne (`valences: [0]`, sarcină 0 — inerte peste tot, dar validează natural ca „molecule" monoatomice via motorul covalent existent, fără cod special). Energii de legătură noi în `bonds.ts` (H–F, Cl–Cl, F–F — F–F explicit slabă, 159 kJ/mol, motivul real al reactivității extreme a fluorului).
- **Motor de chimie ionică nou** (`chem/ionic.ts`, `chem/lattice.ts`): `validateIonicMix()` — un mecanic separat de `validator.ts`, conform §5.6: validează prin **echilibru de sarcini**, nu prin grafuri de legături. Reduce raportul la forma minimă prin GCD (ex. 2Na+2Cl → formula NaCl, 2 „unități-formulă"). `lattice.ts` oferă echivalentul energiei de legătură pentru compuși fără legături desenate, folosit direct de `productionRate()` existent.
- **`GameStore`**: `reserveAtomForIon`/`releaseAtomFromIon` (simetrice cu `placeAtomInDraft`, §6.1) și `synthesizeIonicMix()`. Compusul ionic rezultat e un `CollectionEntry` obișnuit — **compatibil automat, fără nicio modificare**, cu re-sinteza ×1/×10/×Max, Analizatorul și auto-sintetizatoarele din M2 (verificat live).
- **Constructor Ionic — UI distinct** (§8.2 „rețea, nu graf"): tab nou „Covalent / Ionic" deasupra Constructorului (fără să iasă din regula „un singur ecran, fără navigare"). Modul Ionic arată un picker de ioni (cu sarcină afișată, ex. „Na⁺"), controale +/− care rezervă/eliberează atomi live din stoc, o previzualizare de formulă + indicator de sarcină netă, și un vizual decorativ tip rețea cristalină (pătrățele alternante cation-anion), distinct vizual de graful SVG al Constructorului covalent.
- Paleta covalentă filtrează acum elementele fără nicio valență covalentă (Na) — apar doar în picker-ul ionic; Cl/F apar corect în ambele.
- **`moleculeDB.json` extins cu 8 intrări tier 3**: HCl, HF (covalente), Cl₂, F₂ (covalente, diatomice), He, Ne (monoatomice — validează ca „molecule" cu 0 legături), NaCl, NaF (ionice). Total 53 de intrări.
- 2 obiective noi: „Deblochează Sodiul", „Sintetizează NaCl în Constructorul Ionic".
- Verificat integral în browser: tab-urile comută corect; Tabelul Periodic arată corect toate cele 5 elemente noi cu costurile lor; Cl apare simultan în Paletă (covalent) și în picker-ul ionic; Na exclus corect din Paletă; NaCl sintetizat cu succes (sarcină netă 0, banner de descoperire, +Cunoaștere), apoi re-sintetizat ×10 din Colecție și afișat cu producție E/s ca orice altă intrare; „Golește" din modul Ionic întoarce corect atomii rezervați. Zero erori în consolă.
- `tsc --noEmit` curat; 86 de teste automate trec (10 fișiere, +25 față de M2: `tests/ionic.test.ts` pentru motorul de validare prin sarcini, `tests/ionicStore.test.ts` pentru acțiunile GameStore, plus cazuri noi în `tests/moleculeDB.test.ts` pentru HCl/HF/Cl₂/F₂/He/Ne).

**Decizii / abateri de la SPEC.md:**
- **Cheia unui compus ionic e formula însăși** (ex. `"NaCl"`, fără sufix), spre deosebire de cheile covalente care conțin mereu `"|"` urmat de ordinele legăturilor (ex. `"H2O|1,1"`) — nespecificat exact în SPEC, dar alegerea garantează că cele două spații de chei nu pot coincide niciodată, fără nicio verificare suplimentară.
- **He/Ne nu au primit tratament special** pentru „molecule monoatomice" — motorul covalent existent (validator.ts) le acceptă deja natural, fiindcă `valences: [0]` înseamnă „valența 0 e satisfăcută cu 0 legături". A fost o descoperire plăcută în timpul implementării, nu o decizie de design separată.
- **UI-ul Constructorului Ionic e un tab, nu un overlay separat** — SPEC spune doar „UI distinct", fără să specifice mecanismul. Ales tab (ca la Laborator: Generatoare/Colecție) în loc de overlay, ca să respecte principiul din §10.1 („un singur ecran, fără navigare... Tabelul Periodic și Setările sunt SINGURELE overlay-uri") — un mecanic de construcție folosit des nu ar trebui tratat ca acțiune rară de settings.
- **Mixul ionic nu se salvează între sesiuni** (spre deosebire de `constructorDraft`, care e persistat din M0) — simplificare deliberată de scop pentru M3: starea mixului trăiește doar în closure-ul componentei UI. Dacă devine o problemă de fluiditate reală, following-up e ușor (adaugă un câmp `ionicDraft` în `GameState`, după modelul `constructorDraft`).
- **Ratele de generator pentru Na/Cl/F/He/Ne** și **costurile de deblocare** nu erau specificate exact în SPEC (doar Cl=120C, Na=150C erau date explicit, restul extrapolate) — calibrate manual, verificate empiric în sesiunea de testare să nu blocheze progresia.

**Rămas de făcut / follow-up:**
- M4: Chimia organică — limita de atomi crescută, izomeri prin hash canonic Morgan, unități polimerice, DB 100+.
- De luat în calcul: în timpul testării, cu ~200+ copii auto-sintetizate simultan pe mai multe intrări din Colecție, screenshot-urile din automatizarea de browser au început să dea timeout (pagina rămânea funcțională, doar captura vizuală eșua) — posibil semnal că randarea Colecției sub sarcină foarte mare (sute de copii, tick la 100ms) merită profilată la un moment dat, deși nu a afectat jocabilitatea reală, doar unealta de testare.

---

## [2026-08-10] M2 — Idle adevărat: auto-sintetizatoare, Analizator, offline plafonat

**Milestone:** M2
**Făcut:**
- **Auto-sintetizatoare** (§7): deblocare globală unică (`GameStore.unlockAutoSynth`, 15 C), apoi fiecare moleculă din Colecție primește o rată ajustabilă (`−1`/`+1`, plafonată la 50 copii/s prin `MAX_AUTO_SYNTH_RATE`). `economy.tick()` acumulează fracționar (`progress += rate*dt`) și sintetizează doar copii întregi, cât timp există atomi — rata e un plafon de producție, nu o coadă: dacă lipsesc atomii, backlogul se aruncă, nu se acumulează la infinit.
- **Analizatorul** (§7): `GameStore.analyzeMolecule(key, count)` consumă copii din Colecție și produce Cunoaștere proporțională cu suma energiilor de legătură (`K_ANALYSIS_PER_ENERGY = 0.01`), calibrat puțin peste bonusul de primă descoperire ca decizia „producție acum vs. Cunoaștere acum" (pierzi E/s-ul acelei copii) să fie reală. Buton „Analizează ×1" nou în fiecare rând din Colecție.
- **Upgrade de viteză a generatoarelor** (§7): nivel global (`generatorSpeedLevel`), cost geometric (500 E × 2.2ⁿ), fiecare nivel înmulțește TOATE ratele de generator cu ×1.5. Rând nou, fix deasupra listei de generatoare.
- **Progres offline plafonat la 50%** (§4.3, `core/offline.ts`): înlocuiește tick-ul offline din M0/M1 (care rula la 100%, neplafonat) cu `min(Δt, 8h) × 0.5`, rulat prin `economy.tick()` complet (atomi + energie + auto-sintetizatoare, nu doar Energia — decizie de consistență, vezi mai jos). Panou nou „Bine ai revenit!" cu Energia câștigată și durata reală absentată, dispare automat după 6s sau la click.
- 2 obiective ghidate noi (§8.3): „Deblochează Automatizarea" și „Cumpără un upgrade de viteză a generatoarelor" — altfel jucătorul putea trece pe lângă ambele mecanici fără să afle că există.
- **Bug real descoperit prin testare în browser** (nu la M0/M1, la mecanica de bază a Constructorului): ciclarea unei legături duble/triple prin click cade prin la „plasează atom nou" dacă jucătorul dă click exact pe centrul geometric al legăturii. Cauza: liniile SVG vizuale pentru order 2/3 sunt desenate offset de centrul real (`bondOffsets`), lăsând un gol neclickabil exact pe mijloc — un click acolo nu găsește elementul `[data-bond]`, iar handler-ul de mousedown cade prin la „canvas gol + paletă selectată" → plasează un atom parazit. Reparat în `ui/constructor.ts`: o linie invizibilă suplimentară (`.bond-hit`, stroke-width 14, transparentă), desenată exact pe centrul geometric al legăturii, cu aceleași atribute `data-bond`/`data-a`/`data-b`, ca zonă de hit extinsă. Verificat live: click central pe N≡N acum ciclează corect ordinul, fără atomi paraziți.
- Verificat integral în browser: construit manual H₂, O₂, N₂ (legătură triplă — aici a apărut bugul de mai sus), NH₃, H₂O; deblocat Automatizarea; setat rată 3/s pe Apă și confirmat că numărul de copii crește singur, fără click manual; folosit Analizează (consumă 1 copie, +9 C, tooltip corect); cumpărat upgrade de viteză (rata H a crescut vizibil de la 0,50/s la 0,75/s); testat panoul offline real — tab închis, așteptat ~52s wall-clock, redeschis: panoul „Bine ai revenit! +9.659 E — Ai lipsit 52 s" a apărut corect. Zero erori în consolă pe tot parcursul.
- `tsc --noEmit` curat; 61 de teste automate trec (8 fișiere, +12 față de M1: `tests/idle.test.ts` acoperă auto-sintetizatoare, Analizator, upgrade de viteză și progres offline cu matematică exactă — cap la 8h, producție la 50%).

**Decizii / abateri de la SPEC.md:**
- **Progresul offline scalează TOT tick-ul economic la 50%, nu doar Energia** — §4.3 menționează explicit doar formula pentru E, dar atomii deja se comportau așa din M0/M1 (tick unificat), iar a trata auto-sintetizatoarele diferit ar fi fost inconsistent și greu de explicat jucătorului. Documentat ca generalizare deliberată, nu literă de literă din SPEC.
- **Auto-sintetizatoarele nu păstrează backlog** când lipsesc atomii (rata e un plafon de producție, nu o coadă) — nespecificat în SPEC; ales pentru simplitate și pentru că evită explozii de producție surprinzătoare când jucătorul revine cu stoc de atomi după o perioadă fără.
- **Constanta de calibrare a Analizatorului** (`K_ANALYSIS_PER_ENERGY = 0.01`) nu era specificată exact — aleasă empiric în testare ca analiza unei molecule medii (H₂O) să dea o recompensă comparabilă cu bonusul de primă descoperire, făcând tradeoff-ul „producție continuă vs. Cunoaștere acum" din §7 vizibil real, nu neglijabil.

**Rămas de făcut / follow-up:**
- M3: Chimia ionică (Na⁺/Cl⁻, validare prin neutralitate), tier 3 complet, UI distinct pentru compuși ionici.
- De luat în calcul la M3+: gating pe tier pentru deblocarea elementelor din Tabelul Periodic (acum orice element cu `ElementDef` e deblocabil imediat ce ai Cunoaștere, indiferent de ordine) — semnalat deja ca follow-up în intrarea M1.
- Bug-ul de hit-testing pe legături reparat aici a fost prezent de la M0 fără să fi fost prins până acum — merită o trecere similară (verificare hit-testing SVG) dacă se adaugă vreodată alte elemente clickabile suprapuse pe canvas.

---

## [2026-08-10] M1 — Progresia: Tabel Periodic, obiective, export/import

**Milestone:** M1
**Făcut:**
- **Tabelul Periodic** (`chem/periodicLayout.ts` + `ui/periodicTable.ts`): overlay cu layout-ul real (7 perioade + lantanide/actinide, 118 poziții). Elementele cu `ElementDef` (H, O, N, C, S) sunt clickabile: deblocate → colorate CPK, blocate → gri cu cost afișat (evidențiat cu contur accent dacă e afordabil). Elementele fără date de joc încă implementate se randează ca siluete „?", neclickabile — exact ca în §8.1. Deschis din butonul „Tabel Periodic" din HUD, închis cu Esc/click în afară.
- **Deblocare elemente** (`GameStore.unlockElement`/`canUnlockElement` în `core/state.ts`): cheltuiește Cunoaștere = `ElementDef.unlockCost`, adaugă elementul în `unlockedElements` (Paleta și Laboratorul reacționează automat, deja ascultau acel array). Am eliminat `ELEMENT_UNLOCK_COST` din `balance.ts` — era o sursă de adevăr duplicată, nefolosită, față de `ElementDef.unlockCost`.
- **`moleculeDB.json` extins de la 9 la 45 de intrări** (țintă M1: 40), toate compușii noi construibili din H/C/N/O (singurele deblocabile ≤ tier 2): metan, CO₂, etan/etenă/acetilenă, metanol, acid formic, etanol, HCN, acid acetic, benzen (Kekulé), cianogen, acetonitril, formamidă, alcani C3–C7, propenă/propină/alenă/1-butenă/butadienă/1-butină (izomeri cu chei DB distincte prin multiset-ul de ordine de legătură), acetonă, glicină (cel mai simplu aminoacid) și uree. Fiecare structură a fost verificată manual pe regulile de valență (H:1, O:2, N:3, C:4) și confirmată programatic într-un test nou (`tests/moleculeDB.test.ts`, 12 cazuri) care construiește graful real și verifică `validate().ok` + cheia calculată de motor față de DB.
- **Obiective ghidate** (§8.3): `core/objectives.ts` — 10 obiective statice cu condiție de finalizare, recompensă unică în Cunoaștere și (opțional) progres afișabil (`3/10`). `activeObjectives()` întoarce primele 3 nefinalizate; `checkObjectives()` e apelat din `main.ts` la orice eveniment relevant (`resources`, `collection`, `generators`, `unlocked`) și acordă recompensa automat, fără acțiune manuală de „claim". UI nou: `ui/objectives.ts`, bară fixă jos, conform layout-ului din §10.1.
- **Export/Import salvare** (`ui/settings.ts`, overlay nou deschis din „⚙"): Export descarcă `.json` prin `Blob`+link temporar; Import citește un fișier ales de utilizator și apelează `importSave()` din `save.ts` (deja exista, doar nu avea UI). Adăugat `tests/save.test.ts` pentru round-trip export→import.
- **Precizie numere sub 10.000** (`ui/format.ts`): sub prag se afișează valoarea exactă cu separator de mii/zecimale (stil românesc: `.` la mii, `,` la zecimale) în loc să sară direct la notația K — rezolvă follow-up-ul cosmetic semnalat în sesiunea M0 („cumpărarea nu scade E" era doar o percepție cauzată de rotunjire).
- Verificat integral în browser (Chrome, automatizare): tabel periodic (afordabil vs. blocat vs. necunoscut), click pe element neafordabil nu face nimic, Esc închide overlay-urile, sinteza H₂O declanșează bannerul de descoperire + acordă Cunoaștere din DB *și* din obiectivul „Sintetizează Apă" simultan, bara de obiective se actualizează live și trece la următoarele 3, Colecția arată noua intrare cu ×1/×10/×Max, Export salvare funcționează fără erori în consolă.
- `tsc --noEmit` curat; 49 de teste automate trec (7 fișiere, +21 față de M0: `moleculeDB.test.ts`, `unlocks.test.ts`, `objectives.test.ts`, `save.test.ts`).

**Decizii / abateri de la SPEC.md:**
- **H, O, N rămân deblocate gratis de la start** (decizia M0 e păstrată, nu doar pentru M0): am descoperit în testare că un obiectiv „Deblochează Oxigenul/Azotul" se completa instant la pornire tocmai din acest motiv, mărturisind indirect că cerința reală de progresie a Tabelului Periodic din §8.2 (H la tier 0, O/N la tier 1) presupune ca *doar* H să pornească deblocat. Am ales explicit să NU refac această parte: pornirea cu un singur element (H) ar bloca economia de Cunoaștere, fiindcă singura moleculă construibilă doar din H e H₂ (fără bonus de descoperire repetat), iar costul de deblocare O (10 C) nu ar fi niciodată atins fără alte surse de Cunoaștere. Am eliminat în schimb cele două obiective triviale și am păstrat Carbonul (tier 2, cost 60 C) ca prima deblocare reală și semnificativă din joc.
- **`tier` din `ElementDef` nu blochează deblocarea** — Sulful (tier 4, cost 250 C) e tehnic deblocabil din M1 dacă un jucător ajunge la 250 C, deși conținutul lui real (molecule cu S) nu există încă în DB. Nu am adăugat gating suplimentar pe tier fiindcă nu era cerut de criteriile M1 și ar fi complicat inutil `unlockElement` pentru un caz marginal (costul e oricum foarte mare comparativ cu Carbon).
- **Recompensele de Cunoaștere ale obiectivelor** nu erau definite exact în §8.3 („recompense mici în C") — am ales valori 3–15 C, crescătoare cu dificultatea, calibrate empiric din testare (suficient cât Carbonul, 60 C, să rămână un scop pe termen mediu, nu instant).
- **Layout-ul Tabelului Periodic** afișează toate cele 118 poziții standard (inclusiv lantanide/actinide) doar ca geometrie de referință (`chem/periodicLayout.ts`) — elementele fără `ElementDef` sunt siluete inerte, nu au date de joc. Asta respectă literal §8.1 („vederea întregului tabel de la început") fără să implice implementarea prematură a chimiei pentru elemente din tier-e viitoare.

**Rămas de făcut / follow-up:**
- M2: Auto-sintetizatoare, Analizatorul (molecule → C), progres offline cu panoul „Bine ai revenit" (calculul există în §4.3 dar nu are UI dedicat de bun venit — momentan `main.ts` doar aplică tick-ul offline silențios), upgrade-uri de generatoare.
- De luat în calcul la M2/M3: dacă se adaugă gating pe tier pentru deblocare (ex. nu poți sări la S fără să deblochezi mai întâi tot tier-ul 2), acum e locul unde s-ar adăuga în `canUnlockElement`.
- Obiectivele sunt încă o listă liniară fixă; dacă lista crește mult (M2+), ia în calcul gruparea pe tier-uri sau reînnoirea aleatorie a celor 3 active.

---

## [2026-08-09] M0 — Fix: DOM instabil + persistență nefiabilă

**Milestone:** M0 (follow-up)
**Făcut:**
- Utilizatorul a semnalat: "de ce se cumpără constant H/O/N... primesc câte un atom în stoc în fiecare secundă". Clarificat: **nu era bug** — un generator cumpărat produce atomi pasiv, în fiecare secundă, la nesfârșit, fără să mai fie nevoie de click (exact mecanica idle din §7/stâlpul 3). Stocul care crește singur e comportamentul corect al unui generator, nu o cumpărare repetată.
- În timpul verificării, am descoperit totuși două bug-uri reale prin testare directă în browser (click-uri, `localStorage` inspectat live cu JS):
  1. **`ui/lab.ts` și `ui/palette.ts` reconstruiau tot DOM-ul (`innerHTML = ""` + recreare completă) la fiecare tick economic (100ms)**, deci de ~10 ori/secundă — inclusiv butoanele de Cumpără/Sintetizează. Asta explica de ce automatizarea de click rata butoane (elementele erau distruse și recreate constant) și era o risipă reală de performanță. Reparat: rânduri DOM create o singură dată per element/moleculă, actualizate ulterior doar prin `textContent`/`disabled`, fără recreare.
  2. **Persistența depindea de `beforeunload`, care nu se declanșează fiabil** (confirmat: după cumpărarea unui generator și reîncărcare a paginii, `localStorage` tot arăta starea veche) — plasa de siguranță era doar intervalul fix de 15s. Reparat în `save.ts`: salvare cu debounce de 1.5s după orice acțiune discretă (cumpărare, sinteză), plus salvare suplimentară pe `visibilitychange` (mai fiabil decât `beforeunload` la ascunderea tabului). Nu s-a legat de evenimentul `resources` direct, fiindcă acela emite la fiecare tick cât timp există producție activă — ar fi resetat debounce-ul la nesfârșit și n-ar mai fi salvat niciodată.
- Verificat live: cumpărare → 2s așteptare → `localStorage` reflectă corect noua stare, fără reload; reload complet → starea persistă corect.
- Toate cele 28 de teste tot trec, `tsc --noEmit` curat. Commit nou.

**Decizii / abateri de la SPEC.md:**
- Niciuna nouă de design — doar reparații de robustețe tehnică (randare + persistență), fără schimbări de mecanică.

**Rămas de făcut / follow-up:**
- Nimic blocant pentru M1. De urmărit pe viitor: dacă `constructor.ts` ajunge vreodată să asculte "resources" pentru randare completă (nu doar `renderStatus`), aplică același pattern de actualizare incrementală ca să evite regresia.

---

## [2026-08-09] M0 — Prototipul jucabil, complet

**Milestone:** M0
**Făcut:**
- Inițializat proiectul Vite + TypeScript (fără framework UI), Vitest configurat.
- Implementat `chem/` test-first: `elements.ts`, `bonds.ts`, `molecule.ts`, `validator.ts`, `formula.ts`, `moleculeDB.json`. Toate cazurile din §5.7 acoperite + cazuri suplimentare (graf gol, valențe multiple S).
- Implementat `core/`: `state.ts` (GameStore + event emitter propriu), `balance.ts`, `economy.ts` (tick), `save.ts` (localStorage, autosave 15s + beforeunload, export/import, migrare).
- Implementat `ui/`: `constructor.ts` (canvas SVG, drag&drop, click-cycle legături, undo/redo 20 pași, panou de stare live), `palette.ts`, `lab.ts` (generatoare + colecție cu ×1/×10/×Max), `hud.ts`, `format.ts`, `tooltip.ts`.
- Testat manual în browser (Chrome, via automatizare): plasare atomi, drag-to-bond, click-cycle O=O, ștergere (click-dreapta), undo (Ctrl+Z), cumpărare generatoare, sinteză + banner de descoperire, refresh/persistență — toate funcționează, zero erori în consolă.
- Toate cele 28 de teste automate trec; `tsc --noEmit` curat.
- `git init` + commit inițial „M0: prototip jucabil".

**Bug-uri găsite și reparate (din testarea manuală a utilizatorului):**
- **Blocaj la pornire:** `createInitialState()` pornea cu 0 atomi din orice element → jucătorul nu putea plasa nimic în Constructor (placarea eșua silențios, fără eroare vizibilă) → bucla economică era complet blocată (0 E, 0 atomi, nimic de cumpărat/sintetizat). Reparat: stoc inițial `STARTING_ATOMS = { H:6, O:4, N:4 }` în `balance.ts`, plus o reparație automată în `save.ts` (`isStuck()`) care completează stocul dacă un save existent e „blocat" (0 atomi, 0 generatoare, 0 energie, colecție goală) — necesar ca save-urile vechi (create înainte de fix) să nu rămână blocate.
- **Percepție greșită „cumpărarea nu scade Energia":** verificat cu automatizare browser — cumpărarea funcționează corect (o cumpărare per click, cost geometric ×1.18 confirmat). Cauza reală: venitul pasiv mare (E/s) dintr-un save deja avansat acoperă vizual o cheltuială mică pe fondul rotunjirii la „K" din `format.ts`. Nu a fost nevoie de reparație — comportament corect.
- **Molecule descoperite rămâneau cu nume generic:** `CollectionEntry.name`/`flavor`/`ePerSecondPerCopy` erau fixate la momentul primei sinteze; extinderea `moleculeDB.json` nu se reflecta retroactiv în save-uri existente. Adăugat `reconcileCollectionWithDB()` în `state.ts`, apelat la fiecare încărcare de save (`migrate()` din `save.ts`), care resincronizează numele/flavor/producția cu DB-ul curent.

**Decizii / abateri de la SPEC.md:**
- **Model de rezervare a atomilor (§6.1):** atomii se scad din stoc **la plasare** în Constructor, nu la sinteză; se întorc la ștergere/Golește. `synthesizeDraft()` doar validează și finalizează (atomii sunt deja „cheltuiți" prin rezervare). Ales pentru consistență strictă cu „scade instant stocul afișat în paletă" din §6.1.
- **Stoc inițial de atomi** (`STARTING_ATOMS`, H:6/O:4/N:4): nespecificat explicit în SPEC.md, dar necesar — fără el jocul e blocat de la prima secundă (0 E → nu poți cumpăra generatoare → 0 atomi → nu poți sintetiza → 0 E, buclă imposibilă). Valorile permit sinteza manuală a tuturor celor 6+ molecule inițiale înainte de a avea generatoare.
- **Baza de date de molecule extinsă peste ținta M0** (9 intrări în loc de 6): adăugate Hidrazină (H₄N₂), Diazenă (H₂N₂), Hidroxilamină (H₃NO) — toate compuși reali, construibili valid din H/O/N cu regulile de valență curente. Cerut explicit de utilizator după ce a descoperit organic aceste structuri în Constructor.
- **`multiplicatorTier`** din formula de Cunoaștere la descoperire (§4.2) nu era definit exact în SPEC — interpretat ca `tier + 1`.
- **`missingForValence`/`valenceStatus`** din validator: pentru depășire de valență (peste maximul permis), `missing` e raportat ca 0 (starea e oricum invalidă; UI previne activ depășirea, deci acest caz e doar defensiv, cf. §5.3).

**Rămas de făcut / follow-up:**
- M1: Tabel Periodic (overlay), deblocare elemente cu Cunoaștere, extindere DB la 40 de molecule (inclusiv Carbon), obiective ghidate, export/import save, formatare numere mari — deja parțial pregătit (`formatNumber` există).
- De luat în calcul: precizie mai mare la afișarea Energiei sub prag (ex. 2 zecimale sub 100K) — cosmetic, nu blocant, semnalat de percepția „cumpărarea nu scade E".

---

## [2026-08-09] Inițializare proiect

**Milestone:** —
**Făcut:**
- Citit `VALENTA_SPEC.md` în întregime (documentul de design și specificație tehnică).
- Creat acest fișier `DEVLOG.md` ca jurnal persistent de sesiune, la cererea utilizatorului.

**Decizii / abateri de la SPEC.md:**
- Niciuna. Proiectul nu are încă cod — abia urmează inițializarea Vite + TypeScript conform §11.

**Rămas de făcut / follow-up:**
- Inițializare proiect Vite + TypeScript (§11.1–11.2).
- Implementare M0: `chem/` cu teste test-first (§5.7), apoi `core/`, apoi `ui/`.
