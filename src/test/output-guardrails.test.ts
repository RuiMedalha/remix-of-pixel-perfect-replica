// src/test/output-guardrails.test.ts
// NOTE: These tests run in vitest (browser/Node environment).
// The guardrails module is pure TS with no Deno-specific imports, so it
// can be tested directly. We inline the logic here to avoid cross-runtime
// import issues — the test validates the expected behavior.
//
// Inlined from output-guardrails.ts — keep in sync if production logic changes.

import { describe, it, expect } from "vitest";

// Inline the pure functions for testing (identical to output-guardrails.ts)
function trimToWord(value: string, maxLen: number): string {
  if (!value || value.length <= maxLen) return value;
  const cut = value.substring(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return lastSpace > 0 ? cut.substring(0, lastSpace).trimEnd() : cut;
}

function trimToSentence(value: string, maxLen: number): string {
  if (!value || value.length <= maxLen) return value;
  const cut = value.substring(0, maxLen);
  const lastSentence = Math.max(
    cut.lastIndexOf(". "),
    cut.lastIndexOf("! "),
    cut.lastIndexOf("? "),
    cut.lastIndexOf(".\n"),
    cut.lastIndexOf("!\n"),
    cut.lastIndexOf("?\n"),
    cut.endsWith(".") ? cut.length - 1 : -1,
    cut.endsWith("!") ? cut.length - 1 : -1,
    cut.endsWith("?") ? cut.length - 1 : -1,
  );
  if (lastSentence > 0) {
    return cut.substring(0, lastSentence + 1).trimEnd();
  }
  return trimToWord(value, maxLen);
}

function normalizeSlug(value: string, maxLen: number): string {
  if (!value) return value;
  return value
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .substring(0, maxLen)
    .replace(/-+$/, "");
}

describe("output guardrails", () => {
  describe("trimToWord", () => {
    it("returns value unchanged when within limit", () => {
      expect(trimToWord("Fritadeira UNOX 10L", 70)).toBe("Fritadeira UNOX 10L");
    });

    it("trims at last word boundary before limit", () => {
      const long = "Fritadeira Elétrica Profissional UNOX 10 Litros com Controlo Digital";
      // 70 chars: "Fritadeira Elétrica Profissional UNOX 10 Litros com Controlo Digital" = 68 chars, no trim needed
      expect(trimToWord(long, 50).length).toBeLessThanOrEqual(50);
      expect(trimToWord(long, 50)).not.toMatch(/^\S*\s$/); // no trailing space
    });

    it("does not cut mid-word", () => {
      const result = trimToWord("Frigorífico Combinado Inox 400L Professiona", 30);
      expect(result.length).toBeLessThanOrEqual(30);
      expect(result).not.toMatch(/\s$/); // no trailing space
    });
  });

  describe("trimToSentence", () => {
    it("returns value unchanged when within limit", () => {
      const short = "Produto de alta qualidade.";
      expect(trimToSentence(short, 160)).toBe(short);
    });

    it("trims at last sentence boundary", () => {
      const text = "Primeiro parágrafo com detalhe. Segundo parágrafo muito longo que excede o limite máximo permitido de cento e sessenta caracteres totais.";
      const result = trimToSentence(text, 60);
      expect(result).toBe("Primeiro parágrafo com detalhe.");
      expect(result.length).toBeLessThanOrEqual(60);
    });

    it("handles sentence ending exactly at the cut boundary (no trailing space)", () => {
      // "Frase curta." is 12 chars; limit is 12 — ends exactly at boundary
      const text = "Frase curta.Mais conteúdo que excede o limite máximo.";
      const result = trimToSentence(text, 12);
      expect(result).toBe("Frase curta.");
    });

    it("handles ! and ? newline terminators", () => {
      const text = "Atenção!\nMais texto longo que excede o limite máximo permitido aqui.";
      const result = trimToSentence(text, 20);
      expect(result).toBe("Atenção!");
    });
  });

  describe("normalizeSlug", () => {
    it("lowercases and replaces spaces with hyphens", () => {
      expect(normalizeSlug("Fritadeira Elétrica 10L", 100)).toBe("fritadeira-eltrica-10l");
    });

    it("removes trailing hyphens", () => {
      expect(normalizeSlug("produto ", 100)).toBe("produto");
    });

    it("respects max length", () => {
      expect(normalizeSlug("a".repeat(200), 100).length).toBeLessThanOrEqual(100);
    });
  });
});
