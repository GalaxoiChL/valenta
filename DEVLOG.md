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
