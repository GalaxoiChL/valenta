export interface ElementDef {
  symbol: string;
  name: string;
  Z: number;
  valences: number[];
  mass: number;
  color: string;
  tier: number;
  unlockCost: number;
  flavor: string;
  /**
   * M3 — sarcina ionică (§5.6): elementele cu valențe covalente goale
   * (ex. Na) sunt ionice-doar; cele cu ambele (Cl, F) pot forma și legături
   * covalente (HCl, HF), și compuși ionici (NaCl, NaF). 0/absent = nu
   * formează ioni în acest model (include gazele nobile, inerte).
   */
  ionicCharge?: number;
  /**
   * Elemente radioactive/sintetice fără chimie reală, accesibilă, de adăugat
   * (fără izotop stabil, timp de înjumătățire de secunde, sau produse doar
   * artificial în laborator) — randate colorat în Tabelul Periodic (nu mai
   * ca siluetă "?"), dar NEinteractive: fără cost de deblocare, fără loc în
   * `unlockedElements`, fără compuși în DB. Pur informativ/decor.
   */
  decorative?: boolean;
}

// Set MVP (M0): H, O, N. Restul tier 1–2 e pregătit pentru M1, dar rămâne
// nefolosit până când unlocks.ts din M1 le activează.
export const ELEMENTS: Record<string, ElementDef> = {
  H: {
    symbol: "H",
    name: "Hidrogen",
    Z: 1,
    valences: [1],
    mass: 1.008,
    color: "#ffffff",
    tier: 0,
    unlockCost: 0,
    flavor: "Cel mai simplu și mai abundent element din univers — un proton și un electron."
  },
  O: {
    symbol: "O",
    name: "Oxigen",
    Z: 8,
    valences: [2],
    mass: 15.999,
    color: "#ff3b30",
    tier: 1,
    unlockCost: 10,
    flavor: "Respirăm datorită lui, dar în stare pură e și el otrăvitor peste o anumită concentrație.",
    // M6 — dual, ca Cl/F: covalent (H2O, CO2...) ȘI ionic (ionul oxid O²⁻,
    // necesar pentru oxizii metalelor din tier 4: MgO, CuO, Fe2O3).
    ionicCharge: -2
  },
  N: {
    symbol: "N",
    name: "Azot",
    Z: 7,
    valences: [3],
    mass: 14.007,
    color: "#3b82f6",
    tier: 1,
    unlockCost: 25,
    flavor: "78% din aerul pe care-l respiri e azot — dar molecula N₂ e atât de stabilă încât aproape nu reacționează."
  },
  C: {
    symbol: "C",
    name: "Carbon",
    Z: 6,
    valences: [4],
    mass: 12.011,
    color: "#4b5563",
    tier: 2,
    unlockCost: 60,
    flavor: "Singurul element care poate forma lanțuri și inele complexe — baza întregii chimii organice."
  },
  S: {
    symbol: "S",
    name: "Sulf",
    Z: 16,
    valences: [2, 4, 6],
    mass: 32.06,
    color: "#eab308",
    tier: 4,
    unlockCost: 250,
    flavor: "Mirosul de ouă stricate vine de la compușii lui de sulf — dar e esențial în multe proteine."
  },
  Cl: {
    symbol: "Cl",
    name: "Clor",
    Z: 17,
    valences: [1],
    mass: 35.45,
    color: "#1ff01f",
    tier: 3,
    unlockCost: 120,
    flavor: "Gaz galben-verzui toxic în stare pură — dar ionul său, clorura, e esențial pentru semnalele nervoase din corpul tău.",
    ionicCharge: -1
  },
  Na: {
    symbol: "Na",
    name: "Sodiu",
    Z: 11,
    valences: [],
    mass: 22.99,
    color: "#ab5cf2",
    tier: 3,
    unlockCost: 150,
    flavor: "Un metal atât de reactiv încât reacționează violent cu apa — dar combinat cu clorul devine sarea de masă, complet inofensivă.",
    ionicCharge: 1
  },
  F: {
    symbol: "F",
    name: "Fluor",
    Z: 9,
    valences: [1],
    mass: 18.998,
    color: "#90e050",
    tier: 3,
    unlockCost: 100,
    flavor: "Cel mai electronegativ element din tabelul periodic — atât de reactiv încât nu există liber în natură, doar legat în minerale.",
    ionicCharge: -1
  },
  He: {
    symbol: "He",
    name: "Heliu",
    Z: 2,
    valences: [0],
    mass: 4.003,
    color: "#d9ffff",
    tier: 3,
    unlockCost: 80,
    flavor: "Al doilea cel mai abundent element din univers — dar pe Pământ e atât de rar încât se extrage din gazul natural. Heliul refuză politicos orice legătură.",
    ionicCharge: 0
  },
  Ne: {
    symbol: "Ne",
    name: "Neon",
    Z: 10,
    valences: [0],
    mass: 20.18,
    color: "#ff99cc",
    tier: 3,
    unlockCost: 95,
    flavor: "Gazul care dă culoarea roșu-portocalie clasică reclamelor luminoase — la fel de puțin dornic să lege ca vecinul său Heliul.",
    ionicCharge: 0
  },

  // --- M6 — tier 4: metalele rămase din §8.2, notate ca gol în M4/M5 ---
  P: {
    symbol: "P",
    name: "Fosfor",
    Z: 15,
    valences: [3, 5],
    mass: 30.974,
    color: "#ff8000",
    tier: 4,
    unlockCost: 400,
    flavor: "Esențial în ADN și în oasele tale — dar forma albă a elementului pur e atât de reactivă încât ia foc singură la aer."
  },
  Mg: {
    symbol: "Mg",
    name: "Magneziu",
    Z: 12,
    valences: [],
    mass: 24.305,
    color: "#8aff00",
    tier: 4,
    unlockCost: 220,
    flavor: "Arde cu o lumină albă orbitoare — folosit istoric în primele blițuri foto. Ionul lui e esențial pentru clorofilă.",
    ionicCharge: 2
  },
  Cu: {
    symbol: "Cu",
    name: "Cupru",
    Z: 29,
    valences: [],
    mass: 63.546,
    color: "#c88033",
    tier: 4,
    unlockCost: 320,
    flavor: "Singurul metal comun cu o culoare naturală, alta decât gri/argintiu — patina lui verde e chiar oxidul de cupru.",
    ionicCharge: 2
  },
  Fe: {
    symbol: "Fe",
    name: "Fier",
    Z: 26,
    valences: [],
    mass: 55.845,
    color: "#b7410e",
    tier: 4,
    unlockCost: 300,
    flavor: "Rugina de pe orice obiect vechi de fier e literalmente oxidul lui — același proces care dă culoarea roșie a lui Marte.",
    ionicCharge: 3
  },

  // --- tier 5: al doilea lot de metale/nemetale, urmând exact modelul din M6 ---
  Al: {
    symbol: "Al",
    name: "Aluminiu",
    Z: 13,
    valences: [],
    mass: 26.982,
    color: "#a8a8a8",
    tier: 5,
    unlockCost: 450,
    flavor: "Cel mai abundent metal din scoarța terestră — dar prea reactiv ca să existe liber în natură, mereu legat în minerale.",
    ionicCharge: 3
  },
  Si: {
    symbol: "Si",
    name: "Siliciu",
    Z: 14,
    valences: [4],
    mass: 28.085,
    color: "#f0c8a0",
    tier: 5,
    unlockCost: 480,
    flavor: "Al doilea cel mai abundent element din scoarța terestră — baza sticlei, a cipurilor de calculator și a nisipului de pe orice plajă."
  },
  Br: {
    symbol: "Br",
    name: "Brom",
    Z: 35,
    valences: [1],
    mass: 79.904,
    color: "#a62929",
    tier: 5,
    unlockCost: 520,
    flavor: "Singurul nemetal lichid la temperatura camerei — un lichid roșu-brun cu vapori denși și un miros pătrunzător.",
    ionicCharge: -1
  },
  K: {
    symbol: "K",
    name: "Potasiu",
    Z: 19,
    valences: [],
    mass: 39.098,
    color: "#8f40d4",
    tier: 5,
    unlockCost: 550,
    flavor: "Esențial pentru semnalele nervoase și bătăile inimii — dar metalul pur reacționează exploziv cu apa, la fel de violent ca sodiul.",
    ionicCharge: 1
  },
  Ca: {
    symbol: "Ca",
    name: "Calciu",
    Z: 20,
    valences: [],
    mass: 40.078,
    color: "#2f9e44",
    tier: 5,
    unlockCost: 580,
    flavor: "Cel mai abundent metal din corpul tău — oasele și dinții sunt în mare parte compuși de calciu.",
    ionicCharge: 2
  },
  I: {
    symbol: "I",
    name: "Iod",
    Z: 53,
    valences: [1],
    mass: 126.904,
    color: "#940094",
    tier: 5,
    unlockCost: 650,
    flavor: "Solidul sublimază direct în vapori violeți fără să treacă prin stare lichidă — esențial pentru tiroidă, în cantități infime.",
    ionicCharge: -1
  },

  // --- tier 6: al treilea lot, la cererea utilizatorului de a continua pe loturi ---
  Li: {
    symbol: "Li",
    name: "Litiu",
    Z: 3,
    valences: [],
    mass: 6.94,
    color: "#cc80ff",
    tier: 6,
    unlockCost: 700,
    flavor: "Cel mai ușor metal solid din tabelul periodic — bateriile litiu-ion din telefonul tău îi poartă numele.",
    ionicCharge: 1
  },
  Sn: {
    symbol: "Sn",
    name: "Staniu",
    Z: 50,
    valences: [],
    mass: 118.71,
    color: "#668080",
    tier: 6,
    unlockCost: 750,
    flavor: "Amestecat cu cuprul dă bronzul, aliajul care a dat numele unei epoci întregi a civilizației umane.",
    ionicCharge: 2
  },
  Zn: {
    symbol: "Zn",
    name: "Zinc",
    Z: 30,
    valences: [],
    mass: 65.38,
    color: "#7d80b0",
    tier: 6,
    unlockCost: 800,
    flavor: "Esențial pentru sistemul imunitar și vindecarea rănilor — dar și metalul care acoperă protector oțelul galvanizat.",
    ionicCharge: 2
  },
  Ba: {
    symbol: "Ba",
    name: "Bariu",
    Z: 56,
    valences: [],
    mass: 137.327,
    color: "#4caf50",
    tier: 6,
    unlockCost: 850,
    flavor: "Sărurile lui colorează focurile de artificii într-un verde-măr caracteristic — dar în stare solubilă e toxic.",
    ionicCharge: 2
  },
  Ag: {
    symbol: "Ag",
    name: "Argint",
    Z: 47,
    valences: [],
    mass: 107.868,
    color: "#c8c8d0",
    tier: 6,
    unlockCost: 900,
    flavor: "Cel mai bun conducător electric dintre toate metalele — și baza fotografiei clasice pe peliculă, prin sărurile lui sensibile la lumină.",
    ionicCharge: 1
  },
  Pb: {
    symbol: "Pb",
    name: "Plumb",
    Z: 82,
    valences: [],
    mass: 207.2,
    color: "#575961",
    tier: 6,
    unlockCost: 950,
    flavor: "Folosit milenii la conducte și vopsele pentru maleabilitatea lui — până s-a descoperit cât de toxic e, chiar și în urme mici.",
    ionicCharge: 2
  },

  // --- tier 7: al patrulea lot ---
  Ti: {
    symbol: "Ti",
    name: "Titan",
    Z: 22,
    valences: [],
    mass: 47.867,
    color: "#bfc2c7",
    tier: 7,
    unlockCost: 1000,
    flavor: "Rezistent, ușor și inert biologic — folosit la implanturi medicale și avioane. Oxidul lui e pigmentul alb din aproape orice vopsea.",
    ionicCharge: 4
  },
  Sr: {
    symbol: "Sr",
    name: "Stronțiu",
    Z: 38,
    valences: [],
    mass: 87.62,
    color: "#00ff00",
    tier: 7,
    unlockCost: 1050,
    flavor: "Sărurile lui dau flăcărilor de artificii un roșu intens, caracteristic — vecin de grup cu calciul și bariul.",
    ionicCharge: 2
  },
  Ni: {
    symbol: "Ni",
    name: "Nichel",
    Z: 28,
    valences: [],
    mass: 58.693,
    color: "#50d050",
    tier: 7,
    unlockCost: 1100,
    flavor: "Componentă clasică a monedelor și a bateriilor reîncărcabile — dar și un alergen de contact frecvent la bijuterii ieftine.",
    ionicCharge: 2
  },
  Co: {
    symbol: "Co",
    name: "Cobalt",
    Z: 27,
    valences: [],
    mass: 58.933,
    color: "#3060c0",
    tier: 7,
    unlockCost: 1150,
    flavor: "Sursa albastrului de cobalt din ceramica și sticla colorată de secole — clorura lui schimbă culoarea cu umezeala din aer.",
    ionicCharge: 2
  },
  Cs: {
    symbol: "Cs",
    name: "Cesiu",
    Z: 55,
    valences: [],
    mass: 132.905,
    color: "#57178f",
    tier: 7,
    unlockCost: 1200,
    flavor: "Cel mai reactiv metal stabil din tabelul periodic — reacționează exploziv cu apa, chiar mai violent decât sodiul sau potasiul.",
    ionicCharge: 1
  },
  B: {
    symbol: "B",
    name: "Bor",
    Z: 5,
    valences: [3],
    mass: 10.811,
    color: "#ffb5b5",
    tier: 7,
    unlockCost: 1250,
    flavor: "Elementul-cheie din sticla borosilicată (Pyrex) — rezistentă la șocuri termice mari, spre deosebire de sticla obișnuită."
  },

  // --- tier 8: al cincilea lot ---
  Au: {
    symbol: "Au",
    name: "Aur",
    Z: 79,
    valences: [],
    mass: 196.967,
    color: "#ffd700",
    tier: 8,
    unlockCost: 1300,
    flavor: "Unul dintre cele mai puțin reactive metale — de-asta rămâne strălucitor mii de ani. Puținii compuși pe care-i formează sunt curiozități chimice.",
    ionicCharge: 3
  },
  Ge: {
    symbol: "Ge",
    name: "Germaniu",
    Z: 32,
    valences: [4],
    mass: 72.63,
    color: "#668f8f",
    tier: 8,
    unlockCost: 1350,
    flavor: "Primul semiconductor folosit în tranzistoare, înainte ca siliciul să-l înlocuiască — vecin de familie cu carbonul și siliciul."
  },
  Hg: {
    symbol: "Hg",
    name: "Mercur",
    Z: 80,
    valences: [],
    mass: 200.592,
    color: "#b8b8d0",
    tier: 8,
    unlockCost: 1400,
    flavor: "Singurul metal lichid la temperatura camerei — oxidul lui a fost exact ce a încălzit Priestley în 1774 când a descoperit oxigenul.",
    ionicCharge: 2
  },
  Cr: {
    symbol: "Cr",
    name: "Crom",
    Z: 24,
    valences: [],
    mass: 51.996,
    color: "#8a99c7",
    tier: 8,
    unlockCost: 1450,
    flavor: "Dă numele culorii «crom» pentru cromarea metalică strălucitoare — oxidul lui verde e un pigment folosit din antichitate.",
    ionicCharge: 3
  },
  Mn: {
    symbol: "Mn",
    name: "Mangan",
    Z: 25,
    valences: [],
    mass: 54.938,
    color: "#9c7ac7",
    tier: 8,
    unlockCost: 1500,
    flavor: "Esențial pentru oțelul rezistent la uzură — și pentru primele baterii uscate, sub formă de dioxid de mangan.",
    ionicCharge: 2
  },
  Cd: {
    symbol: "Cd",
    name: "Cadmiu",
    Z: 48,
    valences: [],
    mass: 112.414,
    color: "#ffd98f",
    tier: 8,
    unlockCost: 1550,
    flavor: "Un galben strălucitor folosit istoric ca pigment de pictură — dar toxic, motiv pentru care e azi strict reglementat.",
    ionicCharge: 2
  },

  // --- tier 9: al șaselea lot ---
  Be: {
    symbol: "Be",
    name: "Beriliu",
    Z: 4,
    valences: [],
    mass: 9.012,
    color: "#c2ff00",
    tier: 9,
    unlockCost: 1600,
    flavor: "Cel mai ușor metal alcalino-pământos — folosit în oglinzile telescopului spațial James Webb pentru rigiditatea lui extremă la greutate mică.",
    ionicCharge: 2
  },
  Ga: {
    symbol: "Ga",
    name: "Galiu",
    Z: 31,
    valences: [],
    mass: 69.723,
    color: "#c28f8f",
    tier: 9,
    unlockCost: 1650,
    flavor: "Se topește literalmente în palma mâinii — punctul lui de topire e sub temperatura corpului uman.",
    ionicCharge: 3
  },
  In: {
    symbol: "In",
    name: "Indiu",
    Z: 49,
    valences: [],
    mass: 114.818,
    color: "#a67573",
    tier: 9,
    unlockCost: 1700,
    flavor: "Oxidul lui de indiu-staniu (ITO) e stratul transparent și conductor din spatele fiecărui ecran tactil și LCD.",
    ionicCharge: 3
  },
  Bi: {
    symbol: "Bi",
    name: "Bismut",
    Z: 83,
    valences: [],
    mass: 208.98,
    color: "#9e4fb0",
    tier: 9,
    unlockCost: 1750,
    flavor: "Unul dintre puținele metale grele netoxice — ingredientul activ din medicamentele antiacide roz, sub formă de subsalicilat.",
    ionicCharge: 3
  },
  W: {
    symbol: "W",
    name: "Wolfram",
    Z: 74,
    valences: [],
    mass: 183.84,
    color: "#2194d6",
    tier: 9,
    unlockCost: 1800,
    flavor: "Cel mai înalt punct de topire dintre toate metalele — de-asta a fost folosit un secol întreg drept filament incandescent de bec.",
    ionicCharge: 6
  },
  V: {
    symbol: "V",
    name: "Vanadiu",
    Z: 23,
    valences: [],
    mass: 50.942,
    color: "#a68ffc",
    tier: 9,
    unlockCost: 1850,
    flavor: "Oxidul lui e catalizatorul industrial folosit la producția majorității acidului sulfuric din lume.",
    ionicCharge: 5
  },

  // --- tier 10: al șaptelea lot ---
  Rb: {
    symbol: "Rb",
    name: "Rubidiu",
    Z: 37,
    valences: [],
    mass: 85.468,
    color: "#702eb0",
    tier: 10,
    unlockCost: 1900,
    flavor: "Un metal alcalin atât de reactiv încât se aprinde spontan în aer — păstrat mereu în ulei sau atmosferă inertă.",
    ionicCharge: 1
  },
  Sc: {
    symbol: "Sc",
    name: "Scandiu",
    Z: 21,
    valences: [],
    mass: 44.956,
    color: "#e6e6e6",
    tier: 10,
    unlockCost: 1950,
    flavor: "Adăugat în cantități mici la aliaje de aluminiu pentru piese de bicicletă și echipament sportiv de performanță — ușor și rezistent.",
    ionicCharge: 3
  },
  Zr: {
    symbol: "Zr",
    name: "Zirconiu",
    Z: 40,
    valences: [],
    mass: 91.224,
    color: "#94e0e0",
    tier: 10,
    unlockCost: 2000,
    flavor: "Oxidul lui, crescut ca monocristal, e «zirconia cubică» — cea mai comună alternativă sintetică la diamant din bijuterii.",
    ionicCharge: 4
  },
  Sb: {
    symbol: "Sb",
    name: "Stibiu",
    Z: 51,
    valences: [],
    mass: 121.76,
    color: "#9e63b5",
    tier: 10,
    unlockCost: 2050,
    flavor: "Folosit din Egiptul antic ca pigment cosmetic negru (kohl) — și azi ca agent ignifug în textile și materiale plastice.",
    ionicCharge: 3
  },
  Mo: {
    symbol: "Mo",
    name: "Molibden",
    Z: 42,
    valences: [],
    mass: 95.95,
    color: "#54b5b5",
    tier: 10,
    unlockCost: 2100,
    flavor: "Crește punctul de topire al oțelului mai mult decât aproape orice alt element de aliere — esențial în oțelurile de scule.",
    ionicCharge: 6
  },
  Nb: {
    symbol: "Nb",
    name: "Niobiu",
    Z: 41,
    valences: [],
    mass: 92.906,
    color: "#43a3a3",
    tier: 10,
    unlockCost: 2150,
    flavor: "Devine supraconductor la temperaturi apropiate de zero absolut — folosit în magneții puternici ai scanerelor RMN.",
    ionicCharge: 5
  },

  // --- tier 11: al optulea lot ---
  As: {
    symbol: "As",
    name: "Arsen",
    Z: 33,
    valences: [],
    mass: 74.922,
    color: "#bd80e3",
    tier: 11,
    unlockCost: 2200,
    flavor: "Otrava clasică din romanele polițiste — trioxidul lui de arsen a fost, istoric, aproape imposibil de detectat înainte de chimia analitică modernă.",
    ionicCharge: 3
  },
  Se: {
    symbol: "Se",
    name: "Seleniu",
    Z: 34,
    valences: [],
    mass: 78.971,
    color: "#ffa100",
    tier: 11,
    unlockCost: 2250,
    flavor: "Un antioxidant esențial în cantități infime — dar toxic peste o doză mică, unul dintre elementele cu cea mai îngustă marjă sigură din nutriție.",
    ionicCharge: 4
  },
  Te: {
    symbol: "Te",
    name: "Telur",
    Z: 52,
    valences: [],
    mass: 127.6,
    color: "#d47a00",
    tier: 11,
    unlockCost: 2300,
    flavor: "Compușii lui volatili dau respirației un miros de usturoi imposibil de eliminat — chiar și urme infime, absorbite prin piele, sunt suficiente.",
    ionicCharge: 4
  },
  Y: {
    symbol: "Y",
    name: "Ytriu",
    Z: 39,
    valences: [],
    mass: 88.906,
    color: "#94ffff",
    tier: 11,
    unlockCost: 2350,
    flavor: "Oxidul lui e baza cristalelor YAG din multe lasere industriale și medicale de precizie.",
    ionicCharge: 3
  },
  Pd: {
    symbol: "Pd",
    name: "Paladiu",
    Z: 46,
    valences: [],
    mass: 106.42,
    color: "#006985",
    tier: 11,
    unlockCost: 2400,
    flavor: "Absoarbe hidrogen gazos ca un burete — până la 900 de ori propriul volum — folosit intens în convertoarele catalitice auto.",
    ionicCharge: 2
  },
  Pt: {
    symbol: "Pt",
    name: "Platină",
    Z: 78,
    valences: [],
    mass: 195.084,
    color: "#d0d0e0",
    tier: 11,
    unlockCost: 2450,
    flavor: "Dioxidul ei e «catalizatorul lui Adams» — unul dintre cei mai folosiți catalizatori din chimia organică de laborator pentru hidrogenare.",
    ionicCharge: 4
  },

  // --- tier 12: al nouălea lot ---
  Tl: {
    symbol: "Tl",
    name: "Taliu",
    Z: 81,
    valences: [],
    mass: 204.38,
    color: "#a6544d",
    tier: 12,
    unlockCost: 2500,
    flavor: "Poreclit «otrava otrăvitorilor» — incolor, inodor, fără gust, cu simptome ușor confundate cu alte boli obișnuite.",
    ionicCharge: 1
  },
  Hf: {
    symbol: "Hf",
    name: "Hafniu",
    Z: 72,
    valences: [],
    mass: 178.49,
    color: "#4dc2ff",
    tier: 12,
    unlockCost: 2550,
    flavor: "Oxidul lui a înlocuit dioxidul de siliciu ca izolator în cele mai avansate tranzistoare din cipurile moderne.",
    ionicCharge: 4
  },
  Ru: {
    symbol: "Ru",
    name: "Rutheniu",
    Z: 44,
    valences: [],
    mass: 101.07,
    color: "#248f8f",
    tier: 12,
    unlockCost: 2600,
    flavor: "Un metal din familia platinei, folosit ca aliaj de întărire pentru bijuteriile din platină și paladiu.",
    ionicCharge: 3
  },
  Ta: {
    symbol: "Ta",
    name: "Tantal",
    Z: 73,
    valences: [],
    mass: 180.948,
    color: "#4da6ff",
    tier: 12,
    unlockCost: 2650,
    flavor: "Extrem de rezistent la coroziune — folosit la condensatoarele miniaturale din aproape orice telefon mobil.",
    ionicCharge: 5
  },
  Ir: {
    symbol: "Ir",
    name: "Iridiu",
    Z: 77,
    valences: [],
    mass: 192.217,
    color: "#3d7fbf",
    tier: 12,
    unlockCost: 2700,
    flavor: "Un strat neobișnuit de bogat în iridiu marchează granița geologică exactă a extincției dinozaurilor — dovada impactului asteroidului.",
    ionicCharge: 3
  },
  Re: {
    symbol: "Re",
    name: "Reniu",
    Z: 75,
    valences: [],
    mass: 186.207,
    color: "#267dbf",
    tier: 12,
    unlockCost: 2750,
    flavor: "Atinge sarcina +7, cea mai mare din tot jocul — al doilea cel mai înalt punct de topire dintre toate metalele, după wolfram.",
    ionicCharge: 7
  },

  // --- tier 13: al zecelea lot — primele lantanide + gazele nobile grele ---
  Ar: {
    symbol: "Ar",
    name: "Argon",
    Z: 18,
    valences: [0],
    mass: 39.948,
    color: "#80d1e3",
    tier: 13,
    unlockCost: 2800,
    flavor: "A treia cea mai comună componentă a aerului pe care-l respiri — la fel de puțin dornic să lege ca He/Ne, dar mult mai ieftin de extras industrial.",
    ionicCharge: 0
  },
  La: {
    symbol: "La",
    name: "Lantan",
    Z: 57,
    valences: [],
    mass: 138.905,
    color: "#70d4ff",
    tier: 13,
    unlockCost: 2850,
    flavor: "Dă numele întregii familii a lantanidelor — oxidul lui e folosit în lentilele optice de mare precizie ale camerelor foto profesionale.",
    ionicCharge: 3
  },
  Ce: {
    symbol: "Ce",
    name: "Ceriu",
    Z: 58,
    valences: [],
    mass: 140.116,
    color: "#ffffc7",
    tier: 13,
    unlockCost: 2900,
    flavor: "Cea mai abundentă lantanidă — oxidul lui e folosit la lustruirea sticlei de precizie și în convertoarele catalitice auto.",
    ionicCharge: 4
  },
  Nd: {
    symbol: "Nd",
    name: "Neodim",
    Z: 60,
    valences: [],
    mass: 144.242,
    color: "#c7ffc7",
    tier: 13,
    unlockCost: 2950,
    flavor: "Baza celor mai puternici magneți permanenți fabricați vreodată — din căștile audio până în motoarele mașinilor electrice.",
    ionicCharge: 3
  },
  Gd: {
    symbol: "Gd",
    name: "Gadoliniu",
    Z: 64,
    valences: [],
    mass: 157.25,
    color: "#45ffc7",
    tier: 13,
    unlockCost: 3000,
    flavor: "Substanța de contrast injectată înaintea multor scanări RMN — face vizibile detalii altfel invizibile în imagistica medicală.",
    ionicCharge: 3
  },
  Xe: {
    symbol: "Xe",
    name: "Xenon",
    Z: 54,
    valences: [2, 4, 6],
    mass: 131.293,
    color: "#429eb0",
    tier: 13,
    unlockCost: 3050,
    flavor: "Contrazice mitul «gazelor nobile complet inerte» — sub fluor, formează compuși reali și stabili, o descoperire care a răsturnat manualele de chimie în 1962."
  },

  // --- tier 14: al doilea lot de lantanide ---
  Pr: {
    symbol: "Pr",
    name: "Praseodim",
    Z: 59,
    valences: [],
    mass: 140.908,
    color: "#d9ffc7",
    tier: 14,
    unlockCost: 3100,
    flavor: "Dă sticlei o culoare galben-verzuie intensă — folosit și în aliaje ultra-rezistente pentru motoarele de avion.",
    ionicCharge: 3
  },
  Sm: {
    symbol: "Sm",
    name: "Samariu",
    Z: 62,
    valences: [],
    mass: 150.36,
    color: "#8fffc7",
    tier: 14,
    unlockCost: 3150,
    flavor: "Combinat cu cobalt formează magneți care rezistă la temperaturi mult peste cele pe care le suportă magneții de neodim.",
    ionicCharge: 3
  },
  Eu: {
    symbol: "Eu",
    name: "Europiu",
    Z: 63,
    valences: [],
    mass: 151.964,
    color: "#61ffc7",
    tier: 14,
    unlockCost: 3200,
    flavor: "Fosforul roșu din ecranele CRT vechi și din multe LED-uri moderne — cel mai strălucitor roșu obținut chimic la scară comercială.",
    ionicCharge: 3
  },
  Tb: {
    symbol: "Tb",
    name: "Terbiu",
    Z: 65,
    valences: [],
    mass: 158.925,
    color: "#30ffc7",
    tier: 14,
    unlockCost: 3250,
    flavor: "Fosforul verde folosit alături de europiul roșu în tuburile fluorescente și ecranele color de generație mai veche.",
    ionicCharge: 3
  },
  Dy: {
    symbol: "Dy",
    name: "Disprosiu",
    Z: 66,
    valences: [],
    mass: 162.5,
    color: "#1fffc7",
    tier: 14,
    unlockCost: 3300,
    flavor: "Adăugat magneților de neodim ca să reziste la căldura din interiorul motoarelor electrice ale mașinilor moderne.",
    ionicCharge: 3
  },
  Yb: {
    symbol: "Yb",
    name: "Yterbiu",
    Z: 70,
    valences: [],
    mass: 173.045,
    color: "#00d452",
    tier: 14,
    unlockCost: 3350,
    flavor: "Amplificatorul din fibra optică a laserelor industriale de mare putere folosite la tăiat și sudat metal.",
    ionicCharge: 3
  },

  // --- tier 15: ultimele lantanide stabile, ultimul gaz nobil rezonabil,
  // și primele actinide reale (Th/U — chimie de manual, context civil/istoric) ---
  Kr: {
    symbol: "Kr",
    name: "Kripton",
    Z: 36,
    valences: [0],
    mass: 83.798,
    color: "#9affcc",
    tier: 15,
    unlockCost: 3400,
    flavor: "Singurul compus relativ cunoscut al lui, KrF₂, e atât de instabil încât se descompune la temperatura camerei — spre deosebire de fluorurile de xenon, mult mai robuste.",
    ionicCharge: 0
  },
  Tm: {
    symbol: "Tm",
    name: "Tuliu",
    Z: 69,
    valences: [],
    mass: 168.934,
    color: "#00d452",
    tier: 15,
    unlockCost: 3450,
    flavor: "Una dintre cele mai rare lantanide stabile — folosit în unele lasere medicale de precizie, pentru chirurgie minim invazivă.",
    ionicCharge: 3
  },
  Lu: {
    symbol: "Lu",
    name: "Lutețiu",
    Z: 71,
    valences: [],
    mass: 174.967,
    color: "#00bf38",
    tier: 15,
    unlockCost: 3500,
    flavor: "Ultima și cea mai grea dintre lantanide — folosit ca detector în unele scanere PET (tomografie cu emisie de pozitroni).",
    ionicCharge: 3
  },
  Ra: {
    symbol: "Ra",
    name: "Radiu",
    Z: 88,
    valences: [],
    mass: 226,
    color: "#007d00",
    tier: 15,
    unlockCost: 3550,
    flavor: "Descoperit de Marie și Pierre Curie — vopseaua fosforescentă cu radiu de pe cadranele de ceas vechi e motivul pentru care azi radioactivitatea e strict reglementată.",
    ionicCharge: 2
  },
  Th: {
    symbol: "Th",
    name: "Toriu",
    Z: 90,
    valences: [],
    mass: 232.038,
    color: "#00baff",
    tier: 15,
    unlockCost: 3600,
    flavor: "Oxidul lui a dat lumina alb-strălucitoare a manșoanelor de lampă cu gaz de la începutul secolului XX, folosite din plin înainte de becul electric.",
    ionicCharge: 4
  },
  U: {
    symbol: "U",
    name: "Uraniu",
    Z: 92,
    valences: [],
    mass: 238.029,
    color: "#008fff",
    tier: 15,
    unlockCost: 3650,
    flavor: "Oxidul lui, sub formă de pastile ceramice, e combustibilul din inima majorității reactoarelor nucleare civile care produc energie electrică azi.",
    ionicCharge: 4
  },

  // --- tier 16: ultimele 2 metale stabile din familia platinei, omise din
  // greșeală din loturile anterioare (Ru/Pd/Ir/Pt erau deja acoperite) —
  // acestea închid practic tot conținutul chimic real, simplu, de manual,
  // pe care Tabelul Periodic îl mai poate oferi la acest nivel de joc ---
  Rh: {
    symbol: "Rh",
    name: "Rodiu",
    Z: 45,
    valences: [],
    mass: 102.906,
    color: "#0a7d8c",
    tier: 16,
    unlockCost: 3700,
    flavor: "Cel mai scump metal prețios de pe piață — esențial în convertoarele catalitice auto pentru reducerea oxizilor de azot din gazele de eșapament.",
    ionicCharge: 3
  },
  Os: {
    symbol: "Os",
    name: "Osmiu",
    Z: 76,
    valences: [],
    mass: 190.23,
    color: "#266696",
    tier: 16,
    unlockCost: 3750,
    flavor: "Cel mai dens element natural stabil — tetroxidul lui, extrem de volatil și toxic, e folosit în microscopie pentru a colora dublele legături din țesuturi biologice.",
    ionicCharge: 8
  },

  // --- tier 17: Ho, Er — două lantanide stabile omise din loturile de la
  // tier 13-15 (recitire completă a seriei lantanidelor, aceeași metodă care
  // a găsit lacuna Rh/Os la tier 16) ---
  Ho: {
    symbol: "Ho",
    name: "Holmiu",
    Z: 67,
    valences: [],
    mass: 164.93,
    color: "#15f1a0",
    tier: 17,
    unlockCost: 3800,
    flavor: "Cel mai puternic câmp magnetic dintre toate elementele naturale — folosit în magneții din interiorul celor mai puternice electromagneți din lume.",
    ionicCharge: 3
  },
  Er: {
    symbol: "Er",
    name: "Erbiu",
    Z: 68,
    valences: [],
    mass: 167.259,
    color: "#0ae279",
    tier: 17,
    unlockCost: 3850,
    flavor: "Dopantul din inima amplificatoarelor cu fibră optică ce fac posibil internetul global pe cablu submarin.",
    ionicCharge: 3
  },

  // --- decorative: ultimele 33 de poziții din Tabelul Periodic, fără chimie
  // reală accesibilă de adăugat (fără izotop stabil, radioactive rare, sau
  // sintetice cu timp de înjumătățire de secunde/minute). Randate colorat,
  // dar neinteractive — vezi comentariul de pe `decorative` din interfață.
  // Verificate exhaustiv: nu mai lipsește niciun element real din tabel.
  Tc: {
    symbol: "Tc", name: "Tehnețiu", Z: 43, valences: [], mass: 98, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Primul element artificial produs vreodată (1937) — fără niciun izotop stabil. Izotopul Tc-99m e cel mai folosit trasor radioactiv din medicina nucleară.",
    decorative: true
  },
  Pm: {
    symbol: "Pm", name: "Promețiu", Z: 61, valences: [], mass: 145, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Singura lantanidă fără niciun izotop stabil — sursa de lumină din unele baterii nucleare miniaturale (betavoltaice), folosite acolo unde o baterie normală nu poate fi schimbată ani de zile.",
    decorative: true
  },
  Po: {
    symbol: "Po", name: "Poloniu", Z: 84, valences: [], mass: 209, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Descoperit de Marie Curie — extrem de radioactiv și toxic, un singur gram degajă suficientă căldură cât să se încingă la roșu de la sine.",
    decorative: true
  },
  At: {
    symbol: "At", name: "Astatiniu", Z: 85, valences: [], mass: 210, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Cel mai rar element natural din scoarța terestră — se estimează că mai puțin de 30 de grame există pe toată planeta la un moment dat.",
    decorative: true
  },
  Rn: {
    symbol: "Rn", name: "Radon", Z: 86, valences: [], mass: 222, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Gaz nobil radioactiv, produs natural din degradarea uraniului din sol — a doua cauză de cancer pulmonar la nivel mondial, după fumat.",
    decorative: true
  },
  Fr: {
    symbol: "Fr", name: "Franciu", Z: 87, valences: [], mass: 223, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Cel mai instabil element natural — timpul de înjumătățire al celui mai stabil izotop e de doar 22 de minute.",
    decorative: true
  },
  Ac: {
    symbol: "Ac", name: "Actiniu", Z: 89, valences: [], mass: 227, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Dă numele întregii serii a actinidelor — strălucește slab albăstrui în întuneric, din propria radioactivitate.",
    decorative: true
  },
  Pa: {
    symbol: "Pa", name: "Protactiniu", Z: 91, valences: [], mass: 231.036, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Unul dintre cele mai rare și mai scumpe elemente naturale — extrem de radioactiv și toxic, izolat pentru prima dată abia în 1934.",
    decorative: true
  },
  Np: {
    symbol: "Np", name: "Neptuniu", Z: 93, valences: [], mass: 237.048, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Primul element transuranic descoperit — numit, ca și Uraniul dinaintea lui, după o planetă (Neptun).",
    decorative: true
  },
  Pu: {
    symbol: "Pu", name: "Plutoniu", Z: 94, valences: [], mass: 244, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Al doilea element transuranic — căldura pe care o degajă constant alimentează sonde spațiale ca Voyager, aflate azi în afara Sistemului Solar.",
    decorative: true
  },
  Am: {
    symbol: "Am", name: "Americiu", Z: 95, valences: [], mass: 243, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Singurul element transuranic din uz casnic — o cantitate infimă se află în majoritatea detectoarelor de fum cu ionizare.",
    decorative: true
  },
  Cm: {
    symbol: "Cm", name: "Curiu", Z: 96, valences: [], mass: 247, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Numit în onoarea lui Marie și Pierre Curie — folosit ca sursă de energie pentru instrumente științifice ale roverelor de pe Marte.",
    decorative: true
  },
  Bk: {
    symbol: "Bk", name: "Berkeliu", Z: 97, valences: [], mass: 247, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Numit după orașul Berkeley, California, unde a fost sintetizat prima dată — produs istoric doar câțiva atomi odată.",
    decorative: true
  },
  Cf: {
    symbol: "Cf", name: "Californiu", Z: 98, valences: [], mass: 251, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Sursa de neutroni folosită la pornirea unor reactoare nucleare — unul dintre cele mai scumpe materiale din lume.",
    decorative: true
  },
  Es: {
    symbol: "Es", name: "Einsteiniu", Z: 99, valences: [], mass: 252, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Descoperit în resturile radioactive ale primului test cu bombă cu hidrogen, în 1952.",
    decorative: true
  },
  Fm: {
    symbol: "Fm", name: "Fermiu", Z: 100, valences: [], mass: 257, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Ultimul element care mai poate fi produs prin bombardarea cu neutroni a unei ținte — cele de după el se fac exclusiv prin coliziuni directe de nuclee.",
    decorative: true
  },
  Md: {
    symbol: "Md", name: "Mendeleviu", Z: 101, valences: [], mass: 258, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Numit după Dmitri Mendeleev, creatorul Tabelului Periodic — produs istoric un singur atom odată.",
    decorative: true
  },
  No: {
    symbol: "No", name: "Nobeliu", Z: 102, valences: [], mass: 259, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Numit după Alfred Nobel — timpul de înjumătățire al celui mai stabil izotop e de doar câteva ore.",
    decorative: true
  },
  Lr: {
    symbol: "Lr", name: "Lawrenciu", Z: 103, valences: [], mass: 266, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Ultimul element din seria actinidelor — încheie rândul deschis de Actiniu.",
    decorative: true
  },
  Rf: {
    symbol: "Rf", name: "Rutherfordiu", Z: 104, valences: [], mass: 267, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Primul element transactinidic, dincolo de seria actinidelor — numit după fizicianul Ernest Rutherford.",
    decorative: true
  },
  Db: {
    symbol: "Db", name: "Dubniu", Z: 105, valences: [], mass: 268, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Numit după orașul rusesc Dubna, unul dintre principalele centre mondiale de sinteză a elementelor supergrele.",
    decorative: true
  },
  Sg: {
    symbol: "Sg", name: "Seaborgiu", Z: 106, valences: [], mass: 269, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Numit după Glenn Seaborg — practic singurul om căruia i s-a dat numele unui element cât încă trăia.",
    decorative: true
  },
  Bh: {
    symbol: "Bh", name: "Bohriu", Z: 107, valences: [], mass: 270, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Numit după fizicianul danez Niels Bohr, unul dintre părinții fizicii cuantice.",
    decorative: true
  },
  Hs: {
    symbol: "Hs", name: "Hassiu", Z: 108, valences: [], mass: 269, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Numit după landul german Hessen, unde se află institutul GSI care l-a sintetizat.",
    decorative: true
  },
  Mt: {
    symbol: "Mt", name: "Meitneriu", Z: 109, valences: [], mass: 278, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Numit după fizica Lise Meitner, una dintre puținele femei onorate cu numele unui element.",
    decorative: true
  },
  Ds: {
    symbol: "Ds", name: "Darmstadtiu", Z: 110, valences: [], mass: 281, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Numit după orașul german Darmstadt, sediul institutului GSI unde a fost sintetizat.",
    decorative: true
  },
  Rg: {
    symbol: "Rg", name: "Roentgeniu", Z: 111, valences: [], mass: 282, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Numit după Wilhelm Röntgen, descoperitorul razelor X.",
    decorative: true
  },
  Cn: {
    symbol: "Cn", name: "Coperniciu", Z: 112, valences: [], mass: 285, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Numit după astronomul Nicolaus Copernicus.",
    decorative: true
  },
  Nh: {
    symbol: "Nh", name: "Nihoniu", Z: 113, valences: [], mass: 286, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Numit după Japonia („Nihon”) — primul element descoperit într-o țară asiatică.",
    decorative: true
  },
  Fl: {
    symbol: "Fl", name: "Flerroviu", Z: 114, valences: [], mass: 289, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Numit după fizicianul Gheorghi Flerov, fondatorul laboratorului rusesc dedicat sintezei elementelor supergrele.",
    decorative: true
  },
  Mc: {
    symbol: "Mc", name: "Moscoviu", Z: 115, valences: [], mass: 290, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Numit după regiunea Moscovei, unde se află laboratorul care l-a co-descoperit.",
    decorative: true
  },
  Lv: {
    symbol: "Lv", name: "Livermoriu", Z: 116, valences: [], mass: 293, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Numit după Laboratorul Național Lawrence Livermore din California.",
    decorative: true
  },
  Ts: {
    symbol: "Ts", name: "Tenessin", Z: 117, valences: [], mass: 294, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Numit după statul american Tennessee, unde se află Oak Ridge National Laboratory.",
    decorative: true
  },
  Og: {
    symbol: "Og", name: "Oganesson", Z: 118, valences: [], mass: 294, color: "#5a5f6e", tier: 99, unlockCost: 0,
    flavor: "Cel mai greu element descoperit până acum — numit după fizicianul Yuri Oganessian, onorat în timpul vieții, la fel ca Seaborg.",
    decorative: true
  }
};

export function getElement(symbol: string): ElementDef {
  const def = ELEMENTS[symbol];
  if (!def) throw new Error(`Element necunoscut: ${symbol}`);
  return def;
}

export function maxValence(symbol: string): number {
  return Math.max(...getElement(symbol).valences);
}
