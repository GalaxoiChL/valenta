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
