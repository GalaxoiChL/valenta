# Valența ⚛️

Un joc idle de browser în care construiești materia de la zero: din atomi reali, după reguli chimice reale.

**Joacă online:** [valenta-five.vercel.app](https://valenta-five.vercel.app)

---

## Despre joc

În Valența, atomii sunt piesele de construcție, iar valențele chimice sunt regulile. Hidrogenul face o legătură, oxigenul două, carbonul patru. Fiecare moleculă validă pe care o sintetizezi intră în laborator și produce energie, chiar și când nu ești în joc.

Cu energia cumperi generatoare de atomi. Cu cunoașterea câștigată din descoperiri deblochezi elemente noi din tabelul periodic. Elementele noi aduc molecule noi, iar ciclul se reia la o scară tot mai mare.

Fiecare moleculă reală descoperită (apă, amoniac, etanol, acid sulfuric...) vine cu numele ei și o scurtă informație despre rolul ei în lumea reală. Jocul te învață chimie fără să-ți dai seama.

## Ce conține

- **Constructor de molecule:** drag & drop, legături simple, duble și triple, cu validare de valență în timp real
- **Chimie ionică și organică:** de la sare de bucătărie la compuși organici
- **Tabel periodic:** elemente deblocate treptat, pe 17 niveluri
- **Peste 230 de molecule reale** de descoperit
- **Reacții chimice:** compușii descoperiți reacționează între ei după ecuații reale, echilibrate
- **ADN/ARN:** editor de secvențe cu mutații reale
- **Anatomie:** explorator vizual al corpului uman (schelet, mușchi, organe, sistem circulator)
- **Progres idle și offline:** producția continuă și când jocul e închis
- **Nucleosinteza:** reset de tip prestige care îți transformă progresul în stele cu bonusuri permanente
- **Salvare automată** în browser, plus export și import de salvări

## Rulare locală

Ai nevoie de [Node.js](https://nodejs.org) 18 sau mai nou.

```bash
npm install
npm run dev
```

Apoi deschide adresa afișată în terminal (de obicei `http://localhost:5173`).

| Comandă | Ce face |
|---|---|
| `npm run dev` | Pornește jocul în modul de dezvoltare |
| `npm run build` | Creează versiunea finală în `dist/` |
| `npm test` | Rulează testele automate |

## Tehnologii

TypeScript și Vite, fără framework de UI. Testele sunt scrise cu Vitest.

## Structura proiectului

```
src/
  chem/   motorul chimic: elemente, legături, validare, reacții
  bio/    ADN/ARN și anatomie
  core/   economie, progres, salvare
  ui/     interfața jocului
tests/    teste automate
```

Designul complet al jocului e descris în [`VALENTA_SPEC.md`](VALENTA_SPEC.md), iar istoricul dezvoltării în [`DEVLOG.md`](DEVLOG.md).

## Credite

Ilustrațiile anatomice provin de pe Wikimedia Commons. Detaliile de autor și licență se găsesc în metadatele fiecărui fișier SVG din `public/anatomy/`.
