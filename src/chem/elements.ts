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
