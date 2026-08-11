import { describe, it, expect } from "vitest";
import { ELEMENTS } from "../src/chem/elements";
import { PERIODIC_LAYOUT } from "../src/chem/periodicLayout";

describe("Tabelul Periodic — completitudine (§8.1)", () => {
  it("toate cele 118 poziții din layout au acum un ElementDef (niciun mai '?')", () => {
    expect(PERIODIC_LAYOUT).toHaveLength(118);
    for (const slot of PERIODIC_LAYOUT) {
      expect(ELEMENTS[slot.symbol], `lipsește ElementDef pentru ${slot.symbol}`).toBeDefined();
    }
  });

  it("elementele decorative nu au valențe, sarcină ionică sau cost de deblocare real", () => {
    for (const def of Object.values(ELEMENTS)) {
      if (!def.decorative) continue;
      expect(def.valences).toEqual([]);
      expect(def.ionicCharge).toBeUndefined();
      expect(def.unlockCost).toBe(0);
    }
  });

  it("exact 34 de elemente sunt decorative — restul (84) sunt jucabile", () => {
    const decorativeCount = Object.values(ELEMENTS).filter((def) => def.decorative).length;
    const playableCount = Object.values(ELEMENTS).filter((def) => !def.decorative).length;
    expect(decorativeCount).toBe(34);
    expect(playableCount).toBe(84);
    expect(decorativeCount + playableCount).toBe(118);
  });
});
