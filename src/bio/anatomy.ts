// M9 — Anatomie (§9 din SPEC.md): explorator vizual, stilizat, al corpului
// uman — fără nimic de reosit din motorul chimic sau din M8 (ADN/ARN).

export type BodySystem = "skeletal" | "organs" | "circulatory" | "muscular";

export const BODY_SYSTEMS: { id: BodySystem; label: string }[] = [
  { id: "skeletal", label: "Schelet" },
  { id: "organs", label: "Organe interne" },
  { id: "circulatory", label: "Sistem circulator" },
  { id: "muscular", label: "Sistem muscular" }
];

export interface EllipseShape {
  kind: "ellipse";
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotate?: number;
}

export interface PathShape {
  kind: "path";
  d: string;
}

export interface LineShape {
  kind: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeWidth: number;
  dashed?: boolean;
}

export type AnatomyShape = EllipseShape | PathShape | LineShape;

export interface AnatomyPart {
  id: string;
  system: BodySystem;
  name: string;
  shape: AnatomyShape;
  color: string;
  /** Randată doar cu contur (fără umplere) — ex. cutia toracică, ca să nu ascundă organele de dedesubt. */
  outlineOnly?: boolean;
  discoveryC: number;
  flavor: string;
}
