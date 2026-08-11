// M9 — Anatomie (§9 din SPEC.md): explorator vizual al corpului uman, cu
// ilustrații reale (Wikimedia Commons) ca fundal pe sistem — fără nimic de
// reosit din motorul chimic sau din M8 (ADN/ARN).

export type BodySystem = "skeletal" | "organs" | "circulatory" | "muscular";

export const BODY_SYSTEMS: {
  id: BodySystem;
  label: string;
  /** Fișier SVG din public/anatomy/, folosit ca fundal pentru acest sistem. */
  image: string;
  credit: string;
}[] = [
  {
    id: "skeletal",
    label: "Schelet",
    image: "/anatomy/skeleton.svg",
    credit: "LadyofHats, Wikimedia Commons — domeniu public"
  },
  {
    id: "organs",
    label: "Organe interne",
    image: "/anatomy/organs.svg",
    credit: "Mikael Häggström, Wikimedia Commons — domeniu public / CC0"
  },
  {
    id: "circulatory",
    label: "Sistem circulator",
    image: "/anatomy/circulatory.svg",
    credit: "LadyofHats, Wikimedia Commons — domeniu public"
  },
  {
    id: "muscular",
    label: "Sistem muscular",
    image: "/anatomy/muscular.svg",
    credit: "Julien Bouglé, adaptare Jmarchn, Wikimedia Commons — CC BY-SA 3.0"
  }
];

/** Poziția unui hotspot invizibil, în procente (0-100) relative la imaginea sistemului lui. */
export interface AnatomyPart {
  id: string;
  system: BodySystem;
  name: string;
  x: number;
  y: number;
  discoveryC: number;
  flavor: string;
}
