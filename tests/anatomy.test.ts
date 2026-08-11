import { describe, it, expect } from "vitest";
import anatomyDB from "../src/bio/anatomyDB.json";
import { BODY_SYSTEMS, type AnatomyPart } from "../src/bio/anatomy";
import { GameStore, createInitialState } from "../src/core/state";

const PARTS = anatomyDB as AnatomyPart[];

describe("anatomyDB.json — integritate de conținut (§9.3)", () => {
  it("are exact 23 de părți, fiecare cu id unic", () => {
    expect(PARTS.length).toBe(23);
    const ids = new Set(PARTS.map((p) => p.id));
    expect(ids.size).toBe(PARTS.length);
  });

  it("fiecare din cele 4 sisteme are cel puțin o parte", () => {
    for (const sys of BODY_SYSTEMS) {
      const count = PARTS.filter((p) => p.system === sys.id).length;
      expect(count, `${sys.id} nu are nicio parte`).toBeGreaterThan(0);
    }
  });

  it("fiecare parte are nume, flavor și bonus de Cunoaștere pozitiv", () => {
    for (const p of PARTS) {
      expect(p.name.length, `${p.id}: fără nume`).toBeGreaterThan(0);
      expect(p.flavor.length, `${p.id}: fără flavor`).toBeGreaterThan(10);
      expect(p.discoveryC, `${p.id}: discoveryC invalid`).toBeGreaterThan(0);
    }
  });

  it("fiecare formă are date geometrice valide (numere finite, path.d nevid)", () => {
    for (const p of PARTS) {
      const s = p.shape;
      if (s.kind === "ellipse") {
        expect(Number.isFinite(s.cx) && Number.isFinite(s.cy)).toBe(true);
        expect(s.rx).toBeGreaterThan(0);
        expect(s.ry).toBeGreaterThan(0);
      } else if (s.kind === "line") {
        expect(Number.isFinite(s.x1) && Number.isFinite(s.y1) && Number.isFinite(s.x2) && Number.isFinite(s.y2)).toBe(
          true
        );
        expect(s.strokeWidth).toBeGreaterThan(0);
      } else {
        expect(s.d.length, `${p.id}: path.d gol`).toBeGreaterThan(0);
      }
    }
  });
});

describe("GameStore.inspectAnatomyPart (§9.1)", () => {
  it("pornește fără nicio parte descoperită", () => {
    const store = new GameStore(createInitialState());
    expect(store.state.anatomyDiscovered).toEqual([]);
  });

  it("întoarce null pentru un id necunoscut, fără efecte secundare", () => {
    const store = new GameStore(createInitialState());
    const before = store.state.resources.knowledge;
    expect(store.inspectAnatomyPart("nu_exista")).toBeNull();
    expect(store.state.resources.knowledge).toBe(before);
  });

  it("prima inspectare marchează descoperit și acordă exact discoveryC", () => {
    const store = new GameStore(createInitialState());
    const skull = PARTS.find((p) => p.id === "skull")!;
    const before = store.state.resources.knowledge;

    let discovered: unknown = null;
    store.events.on("discovery", (payload) => (discovered = payload));

    const result = store.inspectAnatomyPart("skull");
    expect(result?.name).toBe("Craniu");
    expect(store.state.anatomyDiscovered).toContain("skull");
    expect(store.state.resources.knowledge).toBe(before + skull.discoveryC);
    expect(discovered).not.toBeNull();
  });

  it("a doua inspectare a aceleiași părți nu mai acordă bonus", () => {
    const store = new GameStore(createInitialState());
    store.inspectAnatomyPart("skull");
    const after1 = store.state.resources.knowledge;
    store.inspectAnatomyPart("skull");
    expect(store.state.resources.knowledge).toBe(after1);
    expect(store.state.anatomyDiscovered.filter((id) => id === "skull").length).toBe(1);
  });

  it("listAnatomyParts întoarce toate cele 23 de părți", () => {
    const store = new GameStore(createInitialState());
    expect(store.listAnatomyParts().length).toBe(23);
  });
});
