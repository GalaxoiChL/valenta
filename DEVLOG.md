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
