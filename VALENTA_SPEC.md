# VALENȚA — Document de Design & Specificație Tehnică

> **Scopul documentului:** acest fișier este atât documentul de design al jocului (GDD), cât și specificația de implementare. Este scris ca să poată fi pus direct în rădăcina proiectului (ca `SPEC.md`) și folosit de Claude Code în VS Code drept sursă de adevăr. Fiecare milestone are criterii de acceptare verificabile.

---

## 1. Pitch

**Valența** este un joc incremental / idle de construit molecule. Nodurile tale nu sunt mașini abstracte, ci **atomi reali**, iar regulile de conectare nu sunt inventate, ci sunt **valențele chimice reale**: hidrogenul acceptă o legătură, oxigenul două, carbonul patru. Fiecare moleculă validă pe care o sintetizezi devine un „modul" care produce resurse pasiv, ca o mașină în Factorio sau un nod în Upload Labs. Progresezi deblocând tabelul periodic element cu element, de la hidrogen până la chimia organică, iar finalul jocului este sinteza moleculelor vieții.

**Genuri:** incremental, idle, puzzle de construcție, automatizare.
**Inspirație:** Upload Labs (noduri + idle), Factorio (producție + optimizare), SpaceChem (chimie ca puzzle).
**Platformă:** browser (desktop întâi, responsive pentru mobil mai târziu).
**Fantezia jucătorului:** „Sunt un demiurg care construiește materia de la zero."

---

## 2. Stâlpii designului

Orice decizie de implementare se judecă după acești patru stâlpi, în această ordine:

1. **Fluiditate înainte de toate.** Construirea unei molecule trebuie să fie plăcută fizic: drag & drop, snap pe grilă, feedback instant, zero ferestre modale inutile. Dacă o interacțiune cere mai mult de 2 click-uri față de minim, e greșită.
2. **Chimia reală, simplificată onest.** Regulile sunt reale (valențe, formule, energii de legătură), dar modelul e simplificat deliberat (vezi §5.6). Nu mințim jucătorul: simplificările sunt asumate, nu ascunse.
3. **Progresie idle satisfăcătoare.** Jocul produce resurse și când jucătorul nu e atent (inclusiv offline). Întoarcerea în joc trebuie să fie mereu o mică bucurie, nu o pedeapsă.
4. **Descoperirea e recompensa.** Prima sinteză a unei molecule reale (H₂O, NH₃, cofeină) e un moment de sărbătoare: nume, animație, bonus, o propoziție despre ce face molecula în lumea reală. Jocul educă pe furiș.

---

## 3. Bucla de joc

### 3.1 Bucla de bază (secundă cu secundă)

```
Generatoarele produc ATOMI  →  Jucătorul asamblează atomi în MOLECULE
      ↑                            (Constructorul, cu reguli de valență)
      |                                        ↓
Energia cumpără generatoare      Molecula validă e SINTETIZATĂ
și upgrade-uri                   (consumă atomii stoichiometric)
      ↑                                        ↓
      └────────  Moleculele din LABORATOR produc ENERGIE/s  ←──┘
```

### 3.2 Bucla de progresie (minut cu minut)

1. Acumulezi **Energie (E)** din moleculele active în Laborator.
2. Cheltui E pe generatoare de atomi noi și upgrade-uri de viteză.
3. Prima sinteză a unei molecule noi acordă **Cunoaștere (C)** (o singură dată per moleculă).
4. Cheltui C în **Tabelul Periodic** ca să deblochezi elemente noi.
5. Elemente noi → molecule noi posibile → producție mai mare → bucla se reia la scară mai mare.

### 3.3 Bucla meta (oră cu oră / prestige)

La un prag de Energie totală acumulată, jucătorul poate declanșa **Nucleosinteza**: un reset care transformă progresul în **Stele**, fiecare Stea dând +10% producție globală permanentă. Tematic: materia ta e reciclată într-o stea care forjează elemente mai grele — exact ca în univers. (Implementare abia în M5.)

---

## 4. Resurse și economie

### 4.1 Cele trei resurse

| Resursă | Simbol | Cum se obține | Pe ce se cheltuie |
|---|---|---|---|
| **Atomi** | per element (H, O, C…) | Generatoare de atomi (rate/s per element) | Sinteza moleculelor (stoichiometric: 1×H₂O = 2H + 1O) |
| **Energie** | E | Moleculele active în Laborator produc E/s | Generatoare noi, upgrade-uri, sinteze automate |
| **Cunoaștere** | C | Bonus unic la prima sinteză a fiecărei molecule; mai târziu Analizatorul (M2) | Deblocarea elementelor în Tabelul Periodic, tehnologii |

### 4.2 Formule de echilibrare (constante de pornire, calibrabile în M5)

Toate constantele de mai jos stau într-un singur fișier `src/core/balance.ts` ca să poată fi ajustate ușor.

**Producția de Energie a unei molecule** (per copie sintetizată, per secundă):

```
E/s = K_PROD × (ΣE_leg)^0.7 × bonusDB × (1 + upgradeGlobal)
K_PROD = 0.02
ΣE_leg = suma energiilor de legătură din moleculă (kJ/mol, tabelul §5.4)
bonusDB = 1.0 pentru molecule valide necunoscute; 1.5–4.0 pentru molecule
          reale din moleculeDB.json (moleculele celebre sunt mai „stabile")
```

Exponentul 0.7 e important: face ca moleculele mari să fie mai bune, dar cu randament descrescător, ca să nu existe o singură strategie dominantă.

**Costul generatoarelor de atomi** (progresie geometrică clasică de incremental):

```
cost(n) = COST_BAZĂ_element × 1.18^n      (n = câte generatoare ai deja)
COST_BAZĂ: H = 15 E, O = 60 E, N = 90 E, C = 200 E, …
Rata de bază: 0.5 atomi/s per generator, ×2 la fiecare 10 generatoare (milestone bonus)
```

**Costul deblocării elementelor** (în Cunoaștere): H = gratis (start), O = 10 C, N = 25 C, C = 60 C, Cl = 120 C, Na = 150 C, S = 250 C, P = 400 C… (lista completă în `elements.ts`, crește ~×2 per element în cadrul unui tier).

**Bonusul de descoperire** (Cunoaștere la prima sinteză):

```
C_descoperire = 1 + floor((ΣE_leg / 200)^1.1) × multiplicatorTier
```

### 4.3 Progres offline

La revenirea în joc se calculează `Δt = min(acum − ultimaSalvare, CAP_OFFLINE)` cu `CAP_OFFLINE = 8h` (upgradabil). Se acordă `Δt × producțiaE/s × 0.5` (offline produce la 50%, upgradabil la 100%). Se afișează un panou „Bine ai revenit! Ai produs X Energie în Y ore" — moment de plăcere, conform stâlpului 3.

---

## 5. Motorul chimic

Aceasta e inima jocului și primul lucru care se implementează. Trebuie să fie **pur, fără dependențe de UI, complet testabil** (Vitest).

### 5.1 Modelul de date al unei molecule

O moleculă e un **graf neorientat**: noduri = atomi, muchii = legături cu ordin 1/2/3.

```typescript
interface Atom {
  id: string;            // uuid scurt
  element: string;       // simbol: "H", "O", "C"…
  x: number; y: number;  // poziția pe canvas (doar pentru UI; motorul o ignoră)
}

interface Bond {
  a: string;             // id atom 1
  b: string;             // id atom 2
  order: 1 | 2 | 3;      // simplă / dublă / triplă
}

interface MoleculeGraph {
  atoms: Atom[];
  bonds: Bond[];
}
```

### 5.2 Datele elementelor

```typescript
interface ElementDef {
  symbol: string;        // "C"
  name: string;          // "Carbon"
  Z: number;             // număr atomic (ordinea în tabel)
  valences: number[];    // valențe permise: H [1], O [2], C [4], S [2,4,6], P [3,5], N [3]
  mass: number;          // masă atomică (afișaj + formule)
  color: string;         // culoare CPK standard (H alb, O roșu, C negru/gri, N albastru…)
  tier: number;          // 0 = start, 1, 2… (grupare de progresie)
  unlockCost: number;    // Cunoaștere necesară pentru deblocare
  flavor: string;        // o propoziție reală despre element (tooltip educativ)
}
```

Set MVP (M0): **H, O, N**. Extindere M1: **C, Cl, Na, S, P, F, He, Ne** (gazele nobile au `valences: [0]` — nu pot lega nimic, dar au rol în colecție și humor: „Heliul refuză politicos orice legătură").

### 5.3 Validatorul — regulile jocului

`validate(graph, context) → ValidationResult`. Regulile, în ordinea verificării:

1. **Graf non-gol și conectat.** Toți atomii trebuie să fie în aceeași componentă conexă. Eroare: `"disconnected"` — „Molecula nu e legată într-o singură bucată."
2. **Fără legături duplicate** între aceeași pereche și fără legătură atom–el însuși.
3. **Valența fiecărui atom e satisfăcută exact.** Suma ordinelor legăturilor atomului trebuie să fie egală cu **una dintre** valențele permise ale elementului (S poate avea 2, 4 sau 6). Sub valență → `"unsatisfied"` cu mesaj per atom: „Oxigenul #2 mai are nevoie de 1 legătură." Peste valență → **UI-ul nu permite deloc** crearea legăturii (prevenție > eroare), dar validatorul verifică oricum defensiv.
4. **Limita de dimensiune:** max 40 de atomi per moleculă (limită de performanță și de UI, crescută în M4 pentru polimeri).

```typescript
type ValidationResult =
  | { ok: true; formula: string }                    // ex. "H2O"
  | { ok: false; reason: "empty" | "disconnected" | "unsatisfied" | "toobig";
      details: { atomId: string; missing: number }[] };  // pentru mesaje pe atom
```

### 5.4 Energii de legătură (kJ/mol) — tabelul din `bonds.ts`

Valori reale, rotunjite. Cheia e perechea de simboluri sortată alfabetic + ordinul.

| Legătură | E (kJ/mol) | | Legătură | E (kJ/mol) |
|---|---|---|---|---|
| H–H | 436 | | C–C | 348 |
| O–H | 463 | | C=C | 614 |
| C–H | 413 | | C≡C | 839 |
| N–H | 391 | | C–O | 358 |
| O=O | 498 | | C=O | 799 |
| N≡N | 945 | | C–N | 293 |
| H–Cl | 431 | | C≡N | 891 |
| C–Cl | 328 | | N–O / N=O | 201 / 607 |

Pentru perechi care lipsesc din tabel se folosește o estimare: `E ≈ 0.9 × media legăturilor cunoscute ale celor două elemente` (fallback documentat, ca jocul să nu crape la combinații exotice).

### 5.5 Formula și recunoașterea moleculelor

- **Formula Hill** (`formula.ts`): C primul, apoi H, apoi restul alfabetic; fără C → totul alfabetic. `H2O`, `CH4`, `C2H5OH → C2H6O`. Afișarea folosește indici Unicode (H₂O).
- **Identificarea în baza de date (MVP):** cheia = `formulă + multiset-ul ordinelor de legătură` (ex. `H2O|1,1`). Acoperă corect tot conținutul până la M3.
- **Izomeri (M4):** formulă identică, structură diferită (etanol vs dimetil-eter). Se introduce un hash canonic de graf (algoritm Morgan simplificat — rafinare iterativă a culorilor nodurilor). Până atunci, izomerii sunt tratați ca aceeași moleculă și e ok.

### 5.6 Simplificări asumate (afișate și în joc, într-un panou „Despre chimia din joc")

- Nu simulăm geometrie 3D, unghiuri de legătură, rezonanță sau aromaticitate (benzenul se construiește ca 3 legături duble alternante — Kekulé — și e acceptat așa).
- Valențele sunt fixe per element (cu liste multiple unde contează: S, P, N parțial). Fără radicali, fără ioni până la M3.
- Legătura ionică (M3) e modelată separat: compușii ionici (NaCl) se validează prin **echilibru de sarcini** (Na⁺ + Cl⁻ = neutru), nu prin legături desenate — mecanic nou, nu excepție la cel vechi.
- Energia „produsă" de molecule e o convenție de joc inspirată din energiile de legătură reale, nu termodinamică riguroasă.

### 5.7 Teste obligatorii pentru motor (`tests/validator.test.ts`)

Validatorul se scrie test-first. Cazuri minime:

```
✓ H singur → invalid (unsatisfied, missing 1)
✓ H–H → valid, formula "H2"
✓ H–O–H → valid, "H2O"        ✓ O=O → valid, "O2"
✓ N≡N → valid, "N2"            ✓ N cu 3×H → valid, "NH3"
✓ O cu 3 legături → imposibil de construit din UI; validatorul îl respinge defensiv
✓ două fragmente H–H  H–H nelegate → disconnected
✓ C cu 4×H → valid, "CH4"      ✓ formula Hill: C2H6O nu C2H5OH
✓ S cu 2 legături valid ȘI S cu 6 legături valid (valențe multiple)
```

---

## 6. Constructorul de molecule — specificația de fluiditate

Acesta e ecranul unde jucătorul petrece cel mai mult timp. Fiecare interacțiune de mai jos e o cerință, nu o sugestie.

### 6.1 Interacțiuni de bază

| Acțiune | Gest | Comportament |
|---|---|---|
| Plasare atom | Drag din paleta de elemente pe canvas (sau click pe element → click pe canvas) | Atomul apare cu snap pe grilă hexagonală; scade instant stocul afișat în paletă |
| Creare legătură | Drag de la un atom la alt atom | La ridicarea mouse-ului se creează legătură simplă; în timpul drag-ului se desenează o linie „fantomă" care se agață magnetic de cel mai apropiat atom valid (rază ~48px) |
| Schimbare ordin | Click pe o legătură existentă | Ciclează: simplă → dublă → triplă → ștergere. Dacă ordinul următor ar depăși valența oricărui capăt, sare direct la ștergere |
| Ștergere atom | Click-dreapta pe atom (sau tastă Delete cu atomul selectat) | Atomul și legăturile lui dispar; atomii se întorc în inventar (nimic nu se pierde niciodată în Constructor) |
| Mutare atom | Drag pe un atom existent | Se mută cu snap; legăturile îl urmează elastic |
| Pan canvas | Drag pe fundal (sau Space + drag) | Mișcare liberă |
| Zoom | Scroll (spre cursor) | 50%–200%, cu treaptă lină |
| Undo / Redo | Ctrl+Z / Ctrl+Y | Minim 20 de pași, acoperă orice modificare din Constructor |
| Curăță tot | Buton „Golește" + Ctrl+Backspace | Cu undo posibil, deci fără dialog de confirmare |

### 6.2 Prevenție, nu pedeapsă

Regula de aur: **jucătorul nu poate face o acțiune ilegală**, în loc să fie certat după.

- În timpul drag-ului de legătură, atomii care nu mai au valențe libere sunt estompați (opacitate 40%) și linia fantomă refuză să se agațe de ei.
- Paleta arată doar elementele deblocate; cele fără stoc suficient apar cu stocul în roșu, dar tot pot fi văzute (transparența informației).
- Butonul „Sintetizează" e mereu vizibil, dar inactiv până când molecula e validă — cu tooltip care spune exact ce lipsește.

### 6.3 Feedback permanent (starea moleculei, mereu vizibilă)

Un **panou de stare** fix deasupra canvas-ului arată în timp real:

1. **Formula Hill live** (H₂O se actualizează la fiecare modificare).
2. **Starea:** ⚪ goală / 🟡 în lucru („Oxigenul #2 mai are nevoie de 1 legătură" — mesajele vin din `ValidationResult.details`, iar hover pe mesaj evidențiază atomul vinovat) / 🔴 deconectată / 🟢 **VALIDĂ** — panoul pulsează discret verde, butonul „Sintetizează" se aprinde.
3. **Previzualizare producție:** „Această moleculă va produce ~X E/s" + bonusul dacă e recunoscută în DB.
4. Pe fiecare atom, un **badge mic** cu valențele rămase (O afișează „2", scade la „1", apoi dispare când e satisfăcut și atomul primește un contur verde subtil).

### 6.4 Momentul sintezei

Click pe „Sintetizează": atomii se strâng într-o animație scurtă (200ms), particule, un „pop" sonor discret, molecula zboară spre panoul Laboratorului. Dacă e **prima sinteză** a unei molecule cunoscute: banner de descoperire („Ai descoperit APA — solventul universal al vieții"), +Cunoaștere, intrare nouă în Colecție. Tot momentul durează sub 1.5s și poate fi sărit cu un click (fluiditatea bate spectacolul).

### 6.5 Colecția și re-sinteza — esențială pentru fluiditate

După prima sinteză manuală, molecula intră în **Colecție**. De acolo:

- **„Sintetizează ×1 / ×10 / ×Max"** — un click, fără reconstrucție manuală. Consumă atomii stoichiometric; ×Max calculează câte copii permit stocurile.
- **„Încarcă în Constructor"** — reconstruiește molecula pe canvas ca șablon editabil (baza pentru „vreau metanul, dar cu un Cl în loc de H").
- Fiecare intrare arată: nume real (dacă există), formulă, E/s per copie, câte copii active ai, flavor text educativ.

Fără această secțiune jocul devine corvoadă după 20 de minute. Este obligatorie din **M0** (măcar ×1) și completă în M1.

---

## 7. Laboratorul — moleculele ca mașini

- Fiecare **copie sintetizată** a unei molecule e o unitate de producție pasivă. Laboratorul le afișează grupat: `H₂O ×34 → 12.4 E/s`.
- Producția totală = Σ(copii × E/s per moleculă) — un singur număr mare, vizibil permanent în HUD: **E/s**.
- **Generatoarele de atomi** trăiesc tot aici: per element, cu buton de cumpărare (cost geometric §4.2), cu rata curentă afișată (`H: 4.5 atomi/s`).
- **M2 — Auto-sintetizatoare:** module care sintetizează automat o moleculă aleasă din Colecție, la o rată setabilă, cât timp există atomi. Acesta e pasul care transformă jocul din activ în idle adevărat — de aici încolo jucătorul proiectează *fluxuri*, nu execută click-uri, exact ca în Factorio/Upload Labs.
- **M2 — Analizatorul:** modul care *consumă* copii de molecule și produce Cunoaștere (`1 copie → C proporțional cu complexitatea`). Creează decizia centrală de economie: producție acum vs progres pe termen lung.

---

## 8. Progresie — Tabelul Periodic și tier-ele

### 8.1 Ecranul Tabelului Periodic

Un tabel periodic real, desenat complet, în care elementele nedeblocate sunt gri (cu cost de Cunoaștere vizibil), cele deblocate sunt colorate CPK, iar cele din tier-e viitoare sunt siluete cu „?". Vederea întregului tabel de la început = harta promisiunii jocului (jucătorul vede cât de departe poate ajunge). Click pe element deblocabil → panou cu preview: ce molecule noi devin posibile (3 exemple), flavor text, buton de cumpărare.

### 8.2 Tier-ele de conținut

| Tier | Elemente | Ce se deblochează mecanic | Molecule-far |
|---|---|---|---|
| 0 (start) | H | Constructorul, prima legătură | H₂ |
| 1 | O, N | Legături duble și triple | H₂O, O₂, N₂, NH₃, H₂O₂ |
| 2 | C | Valența 4 → explozie combinatorică; Auto-sintetizatoare | CH₄, CO₂, C₂H₄, HCN |
| 3 | Cl, Na, F, He, Ne | **Legături ionice** (echilibru de sarcini), gaze nobile | NaCl, HCl, NaF |
| 4 | S, P, + metale (Fe, Cu, Mg) | Valențe multiple, lanțuri organice lungi, izomeri | H₂SO₄, C₂H₆O (etanol), C₆H₆ |
| 5 | (toate) | Polimeri (unități repetitive), **Nucleosinteza** (prestige) | Glucoză, glicină, cofeină; final: adenina — „cărămida vieții" |

### 8.3 Obiective ghidate

O listă de 3 obiective active simultan („Sintetizează 10× H₂O", „Deblochează Azotul", „Atinge 50 E/s") care servesc drept tutorial continuu și ritm de progresie. Recompense mici în C. Definite ca date în `objectives.ts`, nu hardcodate în UI.

---

## 9. Baza de date de molecule (`moleculeDB.json`)

Conținutul curat al jocului. Schema unei intrări:

```json
{
  "key": "H2O|1,1",
  "formula": "H2O",
  "name": "Apă",
  "bonusMult": 2.0,
  "discoveryC": 5,
  "tier": 1,
  "tags": ["anorganic", "solvent", "viață"],
  "flavor": "Singura substanță comună care există natural în toate trei stările. Fiecare pahar conține atomi care au trecut prin dinozauri."
}
```

Ținte de conținut: **M0: 6 intrări** (H₂, O₂, N₂, H₂O, NH₃, H₂O₂), **M1: 40**, **M4: 100+**. Moleculele valide dar absente din DB primesc numele generic „Compus C₂H₇N…" și `bonusMult: 1.0` — jocul nu blochează creativitatea, doar recompensează suplimentar realitatea.

---

## 10. Interfața — layout

### 10.1 Structura ecranului (desktop, ≥1024px)

```
┌────────────────────────────────────────────────────────────────┐
│ HUD: ⚡ Energie (E/s)   🧠 Cunoaștere   [Tabel Periodic] [⚙]    │
├──────────┬──────────────────────────────────┬──────────────────┤
│ PALETA   │        CONSTRUCTOR               │  LABORATOR       │
│ elemente │  (canvas SVG, grilă hexagonală)  │  producție,      │
│ + stoc   │  [panou stare moleculă, fix sus] │  generatoare,    │
│ atomi    │                                  │  colecție (tab)  │
├──────────┴──────────────────────────────────┴──────────────────┤
│ Obiective (3 carduri discrete)                                 │
└────────────────────────────────────────────────────────────────┘
```

Totul pe **un singur ecran, fără navigare** — Tabelul Periodic și Setările sunt singurele overlay-uri (închise cu Esc/click în afară). Panourile laterale sunt colapsabile pentru a mări canvas-ul.

### 10.2 Direcție vizuală

Temă întunecată „laborator nocturn": fundal albastru-cărbune (#0e1420), grilă hexagonală abia vizibilă, atomii în culori CPK aprinse cu glow subtil, legăturile ca linii luminoase. Numere formatate scurt (`1.2K`, `3.4M`, `5.6B` — util în `ui/format.ts`). Fonturi: una geometrică pentru cifre/HUD, una lizibilă pentru text. Tooltips peste tot (hover pe orice element UI explică ce face). Accesibilitate: culorile CPK sunt dublate mereu de simbolul chimic scris pe atom, deci daltonismul nu blochează jocul.

### 10.3 Sunet (M5, dar proiectat de acum)

Click-uri discrete la plasare/legare, un ton cald la moleculă validă, „pop" la sinteză, fanfară scurtă la descoperire. Toate opționale din Setări. Web Audio API, fără fișiere externe mari.

---

## 11. Arhitectura tehnică

### 11.1 Stack

- **Vite + TypeScript**, fără framework UI. Motivație: proiectul are un singur ecran complex cu randare custom; DOM + SVG direct e mai simplu de înțeles, de testat și de extins cu Claude Code decât un framework. (Dacă pe parcurs UI-ul devine greu de sincronizat, migrarea panourilor la Preact e o decizie locală, nu o rescriere.)
- **Randare Constructor: SVG** (nu Canvas 2D). Motive: hit-testing gratuit pe atomi/legături, CSS pentru hover/animații, crisp la orice zoom. La 40 de atomi limită, performanța nu e o problemă.
- **Teste: Vitest** — obligatorii pentru `src/chem/**` (motorul e pur și perfect testabil), opționale pentru UI.
- **Persistență: `localStorage`** + export/import ca fișier JSON (buton în Setări). Salvare automată la 15s și la `beforeunload`. Câmp `version` în save + funcții de migrare de la prima schimbare de schemă.
- Zero dependențe de runtime în M0–M2 (nici măcar uuid — un contor e suficient). Dependențe doar cu justificare scrisă în PR.

### 11.2 Structura de fișiere

```
valenta/
├── index.html
├── package.json
├── vite.config.ts
├── SPEC.md                     ← acest document
├── src/
│   ├── main.ts                 // bootstrap: state → UI → gameLoop
│   ├── style.css
│   ├── chem/                   // MOTORUL — pur, fără importuri din ui/ sau core/
│   │   ├── elements.ts         // ElementDef pentru toate elementele (toate tier-ele)
│   │   ├── bonds.ts            // tabelul energiilor + fallback-ul de estimare
│   │   ├── molecule.ts         // MoleculeGraph + operații (add/remove/connect)
│   │   ├── validator.ts        // validate() conform §5.3
│   │   ├── formula.ts          // formula Hill + cheia de identificare + indici Unicode
│   │   └── moleculeDB.json
│   ├── core/                   // starea și economia — pot importa din chem/
│   │   ├── state.ts            // GameState + acțiuni (singura cale de a modifica starea)
│   │   ├── balance.ts          // TOATE constantele de echilibrare (§4.2)
│   │   ├── economy.ts          // tick(dt): producție atomi + energie
│   │   ├── unlocks.ts          // logica Tabelului Periodic
│   │   ├── objectives.ts       // obiectivele ghidate (§8.3)
│   │   ├── save.ts             // save/load/migrate/export/import
│   │   └── offline.ts          // §4.3
│   └── ui/                     // poate importa din core/ și chem/
│       ├── constructor.ts      // canvas-ul SVG + toate interacțiunile din §6
│       ├── palette.ts          // paleta de elemente
│       ├── lab.ts              // Laborator + Colecție + generatoare
│       ├── periodicTable.ts    // overlay-ul tabelului
│       ├── hud.ts              // resurse, E/s
│       ├── tooltip.ts
│       └── format.ts           // 1.2K, 3.4M…
└── tests/
    ├── validator.test.ts
    ├── formula.test.ts
    └── economy.test.ts
```

**Regula de dependențe:** `chem/` nu importă nimic din joc; `core/` nu importă `ui/`; `ui/` citește starea și apelează acțiuni din `state.ts`. Această separare permite testarea motorului izolat și, mai târziu, mutarea economiei într-un Web Worker dacă e nevoie.

### 11.3 Bucla de joc

```
requestAnimationFrame  →  doar randare/animații (interpolare)
setInterval 100ms      →  economy.tick(dt) cu dt real măsurat
                          (robust la tab inactiv: la revenire, un singur
                           tick mare cu dt-ul acumulat, apoi normal)
```

Starea e un singur obiect `GameState`; UI-ul se re-randează selectiv pe evenimente (`state.on("resources", …)`) — un mic event emitter propriu, 30 de linii, fără librărie.

### 11.4 Schema salvării

```json
{
  "version": 1,
  "savedAt": 1723190400000,
  "resources": { "energy": 1520.5, "knowledge": 42, "atoms": { "H": 120, "O": 33 } },
  "unlockedElements": ["H", "O", "N"],
  "generators": { "H": 6, "O": 2 },
  "collection": [ { "key": "H2O|1,1", "copies": 34, "discovered": true } ],
  "constructorDraft": { "atoms": [], "bonds": [] },
  "objectivesDone": ["first_h2"],
  "settings": { "sound": true, "offlineCap": 28800 }
}
```

`constructorDraft` se salvează și el: jucătorul își regăsește molecula neterminată exact cum a lăsat-o — detaliu mic, fluiditate mare.

---

## 12. Plan de implementare — milestone-uri cu criterii de acceptare

Fiecare milestone se încheie cu un commit git și cu toate criteriile bifate manual în browser. Nu se începe milestone-ul următor cu criterii picate.

### M0 — Prototipul jucabil (ținta: prima sesiune de lucru)

Conținut: elemente H, O, N; molecule DB: H₂, O₂, N₂, H₂O, NH₃, H₂O₂; fără tabel periodic (toate 3 elementele active de la început), fără offline, fără obiective.

**Criterii de acceptare:**
- [x] `npm run dev` pornește jocul; `npm test` trece toate testele din §5.7.
- [x] Pot plasa atomi din paletă, pot crea legături prin drag, click pe legătură ciclează ordinul, click-dreapta șterge; undo funcționează (≥20 pași).
- [x] Nu pot depăși valența niciunui atom prin nicio secvență de acțiuni din UI.
- [x] Panoul de stare arată formula live și mesaje corecte de eroare per atom (hover evidențiază atomul).
- [x] Sintetizarea H₂O consumă exact 2H + 1O, adaugă copia în Laborator, iar E/s totală crește conform formulei din `balance.ts`.
- [x] Generatoarele de H/O/N pot fi cumpărate cu E, costul crește geometric, atomii se acumulează pe secundă.
- [x] Colecția permite „Sintetizează ×1" pentru orice moleculă descoperită.
- [x] Prima sinteză a unei molecule din DB afișează bannerul de descoperire și acordă C (chiar dacă C nu are încă pe ce fi cheltuit).
- [x] Refresh la pagină → tot progresul + schița din Constructor se restaurează din localStorage.

**Confirmat** — verificat live în browser + suită de teste, vezi DEVLOG „[2026-08-09] M0 — Prototipul jucabil, complet".

### M1 — Progresia (Tabelul Periodic)

Tabel periodic complet ca overlay, deblocare cu C, elemente până la tier 2 (C inclus), DB extins la 40 de molecule, obiective ghidate (§8.3), export/import save, formatare numere mari.

**Criterii:** deblocarea C deschide vizibil noi posibilități (obiectiv ghidat „Sintetizează CH₄"); un jucător nou înțelege jocul fără explicații externe, doar din obiective și tooltips; save-ul exportat pe alt browser restaurează identic starea.

**Confirmat** — verificat live în browser + suită de teste, vezi DEVLOG „[2026-08-10] M1 — Progresia: Tabel Periodic, obiective, export/import".

### M2 — Idle adevărat

Auto-sintetizatoare, Analizatorul (molecule → C), progres offline cu panoul „Bine ai revenit", upgrade-uri de generatoare, echilibrare grosieră (30 min de joc activ ≈ deblocarea tier 2).

**Criterii:** jocul lăsat 10 minute nesupravegheat cu auto-sintetizatoare configurate progresează măsurabil; închis și redeschis după o oră acordă corect progresul offline plafonat.

**Confirmat** — verificat live în browser + suită de teste, vezi DEVLOG „[2026-08-10] M2 — Idle adevărat: auto-sintetizatoare, Analizator, offline plafonat".

### M3 — Chimia ionică

Mecanica de sarcini (Na⁺, Cl⁻, F⁻…), validare prin neutralitate, tier 3 complet, UI distinct pentru compuși ionici (rețea, nu graf).

**Confirmat** — verificat live în browser + suită de teste, vezi DEVLOG „[2026-08-10] M3 — Chimia ionică: tier 3, sarcini, Constructor Ionic distinct".

### M4 — Chimia organică

Limita de atomi crescută (100+ cu virtualizare dacă e nevoie), izomeri prin hash canonic Morgan (§5.5), unități polimerice repetitive, tier 4–5, DB 100+ molecule, șabloane editabile din Colecție.

**Confirmat** — verificat live în browser + suită de teste, vezi DEVLOG „[2026-08-10] M4 — Chimia organică: izomeri, șabloane, polimeri, DB 100+".

### M5 — Finisaj și meta

Nucleosinteza (prestige, §3.3), sunet, animații, tutorial interactiv la primul joc, panoul „Despre chimia din joc" (§5.6), echilibrare finală pe curbe (foaie de calcul separată), responsive pentru tabletă.

**Confirmat** — vezi DEVLOG „[2026-08-10] M5 — Nucleosinteza, Sunet, Tutorial, responsive tabletă" pentru finisaj, și „[2026-08-11] Echilibrare pe curbe — exercițiul dedicat din SPEC §12/M5, făcut prima dată" pentru „echilibrare finală pe curbe (foaie de calcul separată)": `scripts/balance-report.mjs`, rulabil cu `npm run balance-report`, confirmă monotonia costurilor de deblocare, eficiența ionică pe toate cele 15 tiere, curba generatoarelor și curba Nucleosintezei — nicio recalibrare de cod a fost necesară.

### M7 — Reacții chimice (compuși din Colecție reacționează între ei)

Bucla jocului până acum e „atomi → moleculă → Laborator". M7 adaugă o a doua transformare, la fel de reală: compuși deja descoperiți reacționează între ei, după ecuații chimice reale și echilibrate, producând alți compuși reali — nu un efect vizual fără urmări, ci consum de copii dintr-o parte a Colecției și producție de copii în alta.

**7.1 Mecanica**
- Ecran overlay nou, „Reacții" (tipar identic cu Tabelul Periodic §8.1 — buton în HUD, disponibil gratis de la început, închis cu Esc/click în afară; reactanții înșiși sunt gate-ul natural, nu un cost separat de deblocare).
- O reacție e definită static în `src/chem/reactionDB.json`: N reactanți (formulă + coeficient) → M produși (formulă + coeficient), o ecuație reală, echilibrată, verificabilă într-un manual — nu inventată.
- „Rulează ×1/×10/×Max" (tipar identic cu §6.5): consumă exact `coeficient × multiplicator` copii din fiecare reactant ales din Colecție, produce `coeficient × multiplicator` copii din fiecare produs.
- Un produs absent din Colecție e o **descoperire**, exact ca la sinteza manuală (§6.4): banner, +Cunoaștere, intrare nouă, cu producție de E/s calculată din structura reală a produsului (graf covalent validat prin `validate()`/`moleculeKey()`, sau energie de rețea ionică prin `latticeEnergy()`) — niciodată un număr inventat separat. Un produs deja cunoscut doar primește copii în plus, fără bonus repetat de Cunoaștere.
- Reacțiile nu se „deblochează" separat — lista completă e mereu vizibilă (ca la Tabelul Periodic gol — promisiunea jocului), cu reacțiile nerulabile marcate clar (ce lipsește), niciodată ascunse.

**7.2 Simplificări asumate (§5.6, aceeași filosofie)**
- Nicio cinetică: fără viteză de reacție, temperatură, presiune, pH, catalizatori cu efect mecanic, echilibru reversibil. O reacție rulează instantaneu, complet, sau deloc.
- Fără „energie de reacție" ca resursă separată — reacția în sine nu costă/produce Energie; doar produsele, odată în Colecție, produc E/s ca orice altă moleculă.
- Fără reacții inverse automate — fiecare ecuație e o intrare separată.
- Fără reacții inventate: fiecare intrare din `reactionDB.json` corespunde unei ecuații reale — la fel cum SiO₂ a fost exclus din §9 pentru că nu e o moleculă discretă, nicio reacție „de joc" nu apare aici fără fundament real.

**7.3 Conținutul inițial**
16 reacții reale, construibile integral din formule deja prezente în `moleculeDB.json` (zero intrări noi necesare pentru v1): ardere (CH₄, C₆H₆, CH₃OH, H₂S), sinteză directă (H₂+O₂, N₂+H₂, H₂+Cl₂, H₂+F₂), hidrogenare (C₂H₂→C₂H₄→C₂H₆), descompunere (H₂O₂), procesul de contact (SO₂→SO₃→H₂SO₄), hidroliză (COS), neutralizare acid-bază (MgO/CuO + HCl).

**7.4 Criterii de acceptare**
- [x] Overlay „Reacții" deschis din HUD, listă completă (rulabile ȘI nerulabile, cu mesaj clar ce lipsește).
- [x] „Rulează ×1/×10/×Max" consumă/produce exact conform coeficienților.
- [x] Produs nou → banner de descoperire + Cunoaștere + intrare nouă, cu E/s calculată din structura reală.
- [x] Produs deja cunoscut → doar copii în plus, fără bonus repetat de C.
- [x] `tsc --noEmit` curat; toată suita de teste (inclusiv `tests/reactions.test.ts`) trece, fără regresii.

**Confirmat** — vezi DEVLOG „[2026-08-11] M7 — Reacții chimice: compuși din Colecție reacționează între ei", plus verificare live suplimentară a ×10/×Max (nu doar ×1): 100 copii H₂/O₂ seedate, ×10 a scăzut disponibilul de la 50 la 40 rulări exact, ×Max a consumat tot H₂-ul rămas (40 rulări), afișând corect „lipsește: H₂" după epuizare.

**7.5 Ce NU intră în M7 v1 (risc de scope creep, §14)**
Cinetică, temperatură/presiune/pH, catalizatori mecanici, reacții reversibile/echilibru, reacții inventate fără bază reală, editor de reacții pentru jucător. Orice din acestea intră întâi ca amendament separat aici, niciodată direct în cod.

### M8 — ADN/ARN: editor de secvențe și mutații reale

Un tab nou, complet separat de motorul chimic (atomi/legături) — biologie moleculară, nu chimie. Jucătorul editează o secvență de ADN, vede live transcrierea în ARNm și traducerea în proteină, prin dogma centrală reală a biologiei — nu o simulare inventată.

**8.1 Mecanica**
- Ecran overlay nou, „ADN/ARN" (tipar `OverlayController`, ca Reacții/Tabel Periodic), gratis de la început.
- Secvența de ADN e un șir de baze (A/T/G/C), randată ca o bandă de „plăcuțe" clickabile — click pe o placă ciclează baza (A→T→G→C→A), un „✕" pe fiecare placă șterge acea bază, un buton „+" adaugă o bază nouă la capăt. Fără poziționare 3D a dublei elice — o bandă liniară simplă, suficientă pentru concept (§5.6, aceeași filosofie de simplificare asumată deschis).
- Sub bandă, două rânduri derivate, actualizate live, niciodată editabile direct: **ARNm** (transcriere: fiecare T devine U, restul neschimbat) și **Proteina** (traducere: codoni de 3 baze citiți din capătul secvenței, prin codul genetic standard, până la primul codon STOP sau capătul secvenței).
- La fiecare editare de o singură bază (substituție), un mesaj live clasifică mutația la nivelul codonului afectat: **silențioasă** (codon diferit, același aminoacid — redundanța codului genetic), **cu sens greșit** (aminoacid diferit) sau **non-sens** (apare un codon STOP prematur, proteina se scurtează).
- La orice inserție/ștergere care schimbă lungimea secvenței cu un număr ne-multiplu de 3 față de secvența încărcată inițial, un mesaj separat semnalează **decalajul cadrului de citire** (frameshift) — toți codonii de după punctul editat se recitesc greșit, exact fenomenul real.
- O listă mică de **mutații reale cunoscute** (`src/bio/mutationDB.json`, tipar identic cu `reactionDB.json`), fiecare cu un buton „Încarcă secvența" (pune secvența ei normală în bandă) și o stare de „descoperit"/nu: descoperită quando secvența curentă a jucătorului produce, la codonul relevant, exact schimbarea de aminoacid a acelei mutații reale. Prima descoperire acordă un mic bonus de Cunoaștere (tipar identic cu bonusul de primă sinteză, §4.2) — nu la fiecare editare, o singură dată per mutație.

**8.2 Simplificări asumate (§5.6, aceeași filosofie)**
- O singură catenă de ADN randată (nu dubla elice completă cu catena complementară) — transcrierea e prezentată direct ca „T→U" pe catena codantă, simplificare pedagogică standard, nu un model complet de transcriere cu ARN-polimerază/catenă șablon.
- Cadrul de citire pornește mereu de la prima bază a secvenței (fără căutarea unui codon START real AUG) — suficient pentru a demonstra conceptul de decalaj de cadru, fără complexitatea reglării reale a inițierii traducerii.
- Fragmentele din `mutationDB.json` sunt **ilustrative**, centrate pe codonul real afectat (verificat prin tabelul standard de coduri genetice) — nu revendică o secvență genomică completă, poziționată exact la coordonatele cromozomiale reale.
- Nicio simulare de expresie genică, reglare, ARN necodant, epigenetică.

**8.3 Conținutul inițial**
2 mutații reale, bine documentate, verificate direct pe tabelul de coduri genetice înainte de a fi scrise:
- **Anemia falciformă** (gena HBB): codonul 6 GAG (Glu, E) → GTG (Val, E→V) — mutație cu sens greșit, cea mai citată mutație punctiformă din manuale.
- **Fibroza chistică, ΔF508** (gena CFTR): deleție de 3 baze care elimină exact codonul fenilalaninei de la poziția 508 — deleție „în cadru" (in-frame), pierde un aminoacid întreg fără să decaleze cadrul de citire, spre deosebire de o deleție obișnuită.

**8.4 Criterii de acceptare**
- [x] Overlay „ADN/ARN" deschis din HUD; bandă de ADN editabilă (ciclare bază, ștergere, adăugare).
- [x] ARNm și Proteina se actualizează live, corect, la orice editare.
- [x] Clasificarea silențioasă/sens greșit/non-sens apare corect la substituție.
- [x] Decalajul de cadru (frameshift) semnalat corect la inserție/ștergere ne-multiplu de 3.
- [x] Ambele mutații din `mutationDB.json` se pot „descoperi" prin editare, cu banner + Cunoaștere o singură dată.
- [x] `tsc --noEmit` curat; toată suita de teste (inclusiv teste noi pentru codul genetic/traducere) trece, fără regresii.

**Confirmat** — vezi DEVLOG „[2026-08-11] M8 — ADN/ARN: editor de secvențe și mutații reale". Verificat live: încărcat secvența Anemia falciformă, editat baza corectă → banner „Ai descoperit — Anemia falciformă (HBB) (Glu₆Val)" + status live „Codon 6: GAG → GUG — mutație cu sens greșit"; încărcat ΔF508, șters exact cele 3 baze ale codonului Phe → banner de descoperire + proteina scurtată cu un aminoacid, fără decalaj de cadru (deleție multiplu de 3); ștergerea unei a 4-a baze a declanșat corect avertismentul de frameshift. Zero erori în consolă.

**8.5 Ce NU intră în M8 v1 (risc de scope creep, §14)**
Dubla elice completă cu catenă complementară, editor de poziție arbitrară pentru inserție (doar capăt + ștergere oriunde în v1), reglare genică, epigenetică, alte mutații în afara celor 2 curate, orice pretenție de coordonate genomice exacte. Orice din acestea intră întâi ca amendament separat aici, niciodată direct în cod.

---

## 13. Cum folosești documentul cu Claude Code (VS Code)

1. Creează folderul proiectului și pune acest fișier în el ca `SPEC.md`. Rulează `git init`.
2. Deschide Claude Code în VS Code, în folderul proiectului.
3. Primul prompt sugerat:
   > „Citește SPEC.md în întregime. Inițializează proiectul Vite + TypeScript conform §11 și implementează Milestone M0 complet, în ordinea: chem/ cu testele din §5.7 (test-first), apoi core/, apoi ui/. Respectă regula de dependențe din §11.2. La final, verifică fiecare criteriu de acceptare din M0 și raportează-mi ce ai bifat."
4. Testează tu în browser fiecare criteriu M0. Ce nu merge → cere reparația punctual („Criteriul X pică: …").
5. Un commit per milestone (`git commit -m "M0: prototip jucabil"`). Milestone-urile următoare: „Implementează M1 din SPEC.md".
6. Deciziile care schimbă designul se scriu întâi aici, în SPEC.md, apoi se implementează — documentul rămâne mereu sursa de adevăr.

---

## 14. Riscuri cunoscute și răspunsurile lor

| Risc | Răspuns |
|---|---|
| Construirea manuală devine plictisitoare | Colecția + re-sinteza ×Max din M0; auto-sintetizatoarele din M2 |
| Explozia combinatorică la carbon face echilibrarea imposibilă | Exponentul 0.7 pe ΣE_leg + bonusurile DB concentrează valoarea pe molecule reale |
| Chimia simplificată atrage critici de la cunoscători | Panoul „Despre chimia din joc" asumă explicit simplificările (§5.6) |
| Izomerii sunt greu de implementat corect | Amânați deliberat până în M4; cheia formulă+legături e suficientă până atunci |
| Scopul crește necontrolat („hai să adăugăm reacții/temperatură/pH…") | Orice mecanică nouă intră întâi în SPEC.md, într-un milestone viitor, niciodată direct în cod |

---

*Valența v1.0 — document de design. Următoarea revizie se face după finalizarea M0, cu lecțiile învățate.*
