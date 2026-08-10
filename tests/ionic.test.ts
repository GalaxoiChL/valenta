import { describe, it, expect } from "vitest";
import { validateIonicMix, ionicFormula } from "../src/chem/ionic";

describe("validateIonicMix — validare prin echilibru de sarcini (§5.6)", () => {
  it("respinge un mix gol", () => {
    expect(validateIonicMix({})).toEqual({ ok: false, reason: "empty" });
  });

  it("Na⁺ + Cl⁻ → NaCl, neutru, 1 copie", () => {
    const result = validateIonicMix({ Na: 1, Cl: 1 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.formula).toBe("NaCl");
      expect(result.copies).toBe(1);
      expect(result.atomsPerCopy).toEqual({ Na: 1, Cl: 1 });
    }
  });

  it("Na⁺ + F⁻ → NaF", () => {
    const result = validateIonicMix({ Na: 1, F: 1 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.formula).toBe("NaF");
  });

  it("reduce raportul la forma minimă prin GCD (2Na+2Cl → NaCl ×2 copii)", () => {
    const result = validateIonicMix({ Na: 2, Cl: 2 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.formula).toBe("NaCl");
      expect(result.copies).toBe(2);
      expect(result.atomsPerCopy).toEqual({ Na: 1, Cl: 1 });
    }
  });

  it("respinge un mix cu sarcină netă diferită de zero", () => {
    const result = validateIonicMix({ Na: 2, Cl: 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("not_neutral");
      expect(result.netCharge).toBe(1);
    }
  });

  it("respinge un mix format doar din cationi (fără anion)", () => {
    const result = validateIonicMix({ Na: 2 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("needs_both_signs");
  });

  it("respinge un mix format doar din anioni (fără cation)", () => {
    const result = validateIonicMix({ Cl: 1, F: 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("needs_both_signs");
  });

  it("respinge un element inert (gaz nobil, sarcină 0)", () => {
    const result = validateIonicMix({ Na: 1, He: 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("cannot_ionize");
  });

  it("respinge elemente fără sarcină ionică definită (H, O covalente)", () => {
    const result = validateIonicMix({ Na: 1, O: 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("cannot_ionize");
  });
});

describe("ionicFormula — cationii întâi, apoi anionii, ambii alfabetic", () => {
  it("NaCl, nu ClNa", () => {
    expect(ionicFormula({ Na: 1, Cl: 1 })).toBe("NaCl");
  });

  it("omite indicele 1, îl afișează pentru >1", () => {
    expect(ionicFormula({ Na: 2, Cl: 1 })).toBe("Na2Cl");
  });
});
