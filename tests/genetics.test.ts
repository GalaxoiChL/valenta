import { describe, it, expect } from "vitest";
import {
  transcribe,
  translate,
  codonAt,
  aminoAcidForCodon,
  classifySubstitution,
  isFrameshift,
  mutatedSequenceFor,
  matchesMutation,
  type MutationDefinition
} from "../src/bio/genetics";
import mutationDB from "../src/bio/mutationDB.json";
import { GameStore, createInitialState } from "../src/core/state";

const MUTATIONS = mutationDB as MutationDefinition[];

describe("transcribe / translate (dogma centrală, §8.1)", () => {
  it("transcrie ADN → ARNm, T devine U", () => {
    expect(transcribe("ATGCAT")).toBe("AUGCAU");
  });

  it("traduce codoni cunoscuți corect", () => {
    expect(translate("AUGGUGCAU").aminoAcids).toEqual(["Met", "Val", "His"]);
  });

  it("se oprește la primul codon STOP, fără să-l includă în proteină", () => {
    const result = translate("AUGUAAGGG");
    expect(result.aminoAcids).toEqual(["Met"]);
    expect(result.stopIndex).toBe(1);
  });

  it("fără STOP → stopIndex null, traduce tot ce încape în codoni întregi", () => {
    const result = translate("AUGGUG");
    expect(result.stopIndex).toBeNull();
    expect(result.aminoAcids).toEqual(["Met", "Val"]);
  });

  it("codonAt/aminoAcidForCodon — acces direct la un codon", () => {
    const mrna = transcribe("ATGGTGCATCTGACTGAG");
    expect(codonAt(mrna, 5)).toBe("GAG");
    expect(aminoAcidForCodon("GAG")).toBe("Glu");
    expect(aminoAcidForCodon("GUG")).toBe("Val");
  });
});

describe("classifySubstitution", () => {
  it("silențioasă — codon diferit, același aminoacid", () => {
    expect(classifySubstitution("GAA", "GAG")).toBe("silent"); // ambii Glu
  });

  it("cu sens greșit — aminoacid diferit", () => {
    expect(classifySubstitution("GAG", "GUG")).toBe("missense"); // Glu → Val
  });

  it("non-sens — apare STOP", () => {
    expect(classifySubstitution("GAG", "UAG")).toBe("nonsense");
  });

  it("codon invalid → null", () => {
    expect(classifySubstitution("XXX", "GAG")).toBeNull();
  });
});

describe("isFrameshift", () => {
  it("diferență multiplu de 3 → în cadru, nu frameshift", () => {
    expect(isFrameshift(18, 18)).toBe(false);
    expect(isFrameshift(18, 15)).toBe(false);
    expect(isFrameshift(18, 21)).toBe(false);
  });

  it("diferență ne-multiplu de 3 → frameshift", () => {
    expect(isFrameshift(18, 17)).toBe(true);
    expect(isFrameshift(18, 19)).toBe(true);
  });
});

describe("mutationDB.json — integritate de conținut (2 mutații reale, verificate pe codul genetic)", () => {
  it("fiecare mutație are wildTypeSequence lungime multiplu de 3, fără STOP prematur înainte de codonIndex", () => {
    for (const m of MUTATIONS) {
      expect(m.wildTypeSequence.length % 3, `${m.id}: lungime nemultiplu de 3`).toBe(0);
      const { stopIndex } = translate(transcribe(m.wildTypeSequence));
      if (stopIndex !== null) {
        expect(stopIndex, `${m.id}: STOP prematur înainte de codonul afectat`).toBeGreaterThan(m.codonIndex);
      }
    }
  });

  it("sickle_cell_hbb: codonul 6 (index 5) e GAG (Glu), mutantul GTG e Val — clasificat missense", () => {
    const m = MUTATIONS.find((x) => x.id === "sickle_cell_hbb")!;
    expect(m.kind).toBe("substitution");
    if (m.kind !== "substitution") return;
    const wtCodon = codonAt(transcribe(m.wildTypeSequence), m.codonIndex)!;
    expect(aminoAcidForCodon(wtCodon)).toBe("Glu");
    const mutCodon = transcribe(m.mutatedCodon);
    expect(aminoAcidForCodon(mutCodon)).toBe("Val");
    expect(classifySubstitution(wtCodon, mutCodon)).toBe("missense");
  });

  it("cftr_delta_f508: codonul afectat e Phe, deleția rămâne în cadru (multiplu de 3)", () => {
    const m = MUTATIONS.find((x) => x.id === "cftr_delta_f508")!;
    expect(m.kind).toBe("deletion");
    if (m.kind !== "deletion") return;
    const wtCodon = codonAt(transcribe(m.wildTypeSequence), m.codonIndex)!;
    expect(aminoAcidForCodon(wtCodon)).toBe("Phe");
    expect(m.deletedBases % 3).toBe(0);
    const mutated = mutatedSequenceFor(m);
    expect(mutated.length).toBe(m.wildTypeSequence.length - m.deletedBases);
  });

  it("matchesMutation confirmă secvența mutantă calculată, respinge secvența sălbatică", () => {
    for (const m of MUTATIONS) {
      expect(matchesMutation(mutatedSequenceFor(m), m)).toBe(true);
      expect(matchesMutation(m.wildTypeSequence, m)).toBe(false);
    }
  });

  it("fiecare mutație are un bonus de Cunoaștere pozitiv", () => {
    for (const m of MUTATIONS) expect(m.discoveryC).toBeGreaterThan(0);
  });
});

describe("GameStore — ADN/ARN (§8)", () => {
  it("pornește cu secvență goală, fără mutații descoperite", () => {
    const store = new GameStore(createInitialState());
    expect(store.dnaSequence()).toBe("");
    expect(store.state.geneticsDiscovered).toEqual([]);
  });

  it("cycleDnaBase ciclează A→T→G→C→A", () => {
    const store = new GameStore(createInitialState());
    store.setDnaSequence("A");
    store.cycleDnaBase(0);
    expect(store.dnaSequence()).toBe("T");
    store.cycleDnaBase(0);
    expect(store.dnaSequence()).toBe("G");
    store.cycleDnaBase(0);
    expect(store.dnaSequence()).toBe("C");
    store.cycleDnaBase(0);
    expect(store.dnaSequence()).toBe("A");
  });

  it("appendDnaBase adaugă la capăt, deleteDnaBase șterge la orice index", () => {
    const store = new GameStore(createInitialState());
    store.appendDnaBase();
    store.appendDnaBase();
    expect(store.dnaSequence()).toBe("AA");
    store.deleteDnaBase(0);
    expect(store.dnaSequence()).toBe("A");
  });

  it("replaceDnaSegment înlocuiește o bucată dintr-odată, cu o secvență de altă lungime", () => {
    const store = new GameStore(createInitialState());
    store.setDnaSequence("AAAATTTTGGGG");
    const ok = store.replaceDnaSegment(4, 8, "CC"); // scoate "TTTT", pune "CC"
    expect(ok).toBe(true);
    expect(store.dnaSequence()).toBe("AAAACCGGGG");
  });

  it("replaceDnaSegment respinge caractere invalide, fără să modifice secvența", () => {
    const store = new GameStore(createInitialState());
    store.setDnaSequence("AAAA");
    const ok = store.replaceDnaSegment(1, 3, "XZ");
    expect(ok).toBe(false);
    expect(store.dnaSequence()).toBe("AAAA");
  });

  it("replaceDnaSegment respinge un interval invalid (start >= end, sau în afara secvenței)", () => {
    const store = new GameStore(createInitialState());
    store.setDnaSequence("AAAA");
    expect(store.replaceDnaSegment(2, 2, "T")).toBe(false);
    expect(store.replaceDnaSegment(0, 10, "T")).toBe(false);
    expect(store.dnaSequence()).toBe("AAAA");
  });

  it("replaceDnaSegment poate insera baze suplimentare la mijlocul secvenței (segment mai scurt înlocuit cu unul mai lung) — depășește restricția \"doar la capăt\" din M8 v1", () => {
    const store = new GameStore(createInitialState());
    store.setDnaSequence("AATT");
    const ok = store.replaceDnaSegment(2, 3, "GGGG"); // scoate un singur "T" (index 2), pune "GGGG"
    expect(ok).toBe(true);
    expect(store.dnaSequence()).toBe("AAGGGGT");
  });

  it("replaceDnaSegment declanșează o descoperire dacă rezultatul reproduce o mutație cunoscută", () => {
    const store = new GameStore(createInitialState());
    store.loadMutationExample("sickle_cell_hbb");
    const before = store.state.resources.knowledge;
    // codonul 6 (index 5, bazele 15-17) GAG → GTG: înlocuiește baza din mijloc (index 16)
    const ok = store.replaceDnaSegment(16, 17, "T");
    expect(ok).toBe(true);
    expect(store.state.geneticsDiscovered).toContain("sickle_cell_hbb");
    expect(store.state.resources.knowledge).toBeGreaterThan(before);
  });

  it("loadMutationExample încarcă secvența sălbatică a unei mutații cunoscute", () => {
    const store = new GameStore(createInitialState());
    const ok = store.loadMutationExample("sickle_cell_hbb");
    expect(ok).toBe(true);
    const m = MUTATIONS.find((x) => x.id === "sickle_cell_hbb")!;
    expect(store.dnaSequence()).toBe(m.wildTypeSequence);
  });

  it("refuză un id de mutație necunoscut", () => {
    const store = new GameStore(createInitialState());
    expect(store.loadMutationExample("nu_exista")).toBe(false);
  });

  it("reproducerea exactă a mutației Glu6Val o descoperă o singură dată, cu bonus de Cunoaștere", () => {
    const store = new GameStore(createInitialState());
    const before = store.state.resources.knowledge;
    let discovered: unknown = null;
    store.events.on("discovery", (payload) => (discovered = payload));

    store.loadMutationExample("sickle_cell_hbb");
    // codonul 6 (index 5, bazele 15-17) GAG → GTG: schimbă baza din mijloc A→T
    store.cycleDnaBase(16); // A -> T (GAG -> GTG)

    expect(store.state.geneticsDiscovered).toContain("sickle_cell_hbb");
    expect(store.state.resources.knowledge).toBeGreaterThan(before);
    expect(discovered).not.toBeNull();

    const knowledgeAfterFirst = store.state.resources.knowledge;
    store.cycleDnaBase(16);
    store.cycleDnaBase(16); // revine la T (GTG) după 2 cicluri (T->G->C->A ar fi 3; T e deja acolo, 2 pași te duc la C apoi A, deci nu revine — folosim un ciclu complet)
    store.cycleDnaBase(16);
    store.cycleDnaBase(16);
    expect(store.state.resources.knowledge).toBe(knowledgeAfterFirst); // fără bonus repetat
  });

  it("reproducerea deleției ΔF508 o descoperă, cu proteina scurtată cu exact un aminoacid", () => {
    const store = new GameStore(createInitialState());
    store.loadMutationExample("cftr_delta_f508");
    // codonul 4 (index 4, bazele 12-14) e "TTT" — șterge cele 3 baze, în ordine
    store.deleteDnaBase(12);
    store.deleteDnaBase(12);
    store.deleteDnaBase(12);

    expect(store.state.geneticsDiscovered).toContain("cftr_delta_f508");
    const { aminoAcids } = translate(transcribe(store.dnaSequence()));
    expect(aminoAcids).toEqual(["Met", "Lys", "Ile", "Ile", "Gly"]); // Phe lipsă, restul intact
  });
});
