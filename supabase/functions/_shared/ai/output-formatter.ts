// supabase/functions/_shared/ai/output-formatter.ts
// Lightweight post-processing for AI-generated product fields.
// Does NOT semantically rewrite content. Only strips known weak PATTERN openings
// and normalizes whitespace. Safe to apply to any OptimizedFields object.

import type { OptimizedFields } from "./output-guardrails.ts";
import { validateProductOutput } from "./output-guardrails.ts";
export type { ValidationResult } from "./output-guardrails.ts";

// PT-PT weak opening phrase patterns to strip from description fields.
// These are EXACT prefix patterns — only removed when they start the text.
const WEAK_PHRASE_PATTERNS: RegExp[] = [
  /^Este produto é ideal para\b/i,
  /^Este produto é perfeito para\b/i,
  /^Apresentamos o\b/i,
  /^Descubra o\b/i,
  /^Conheça o\b/i,
  /^O nosso produto\b/i,
  /^De alta qualidade[,.]?\s*/i,
  /^Alta qualidade[,.]?\s*/i,
  /^Excelente desempenho[,.]?\s*/i,
  /^Produto de (alta |excelente )?qualidade[,.]?\s*/i,
];

export function stripWeakPhrases(text: string): string {
  if (!text) return text;
  for (const pattern of WEAK_PHRASE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const remainder = text.substring(match[0].length).trimStart();
      if (remainder.length > 20) {
        return remainder.charAt(0).toUpperCase() + remainder.slice(1);
      }
    }
  }
  return text;
}

export function normalizeWhitespace(text: string): string {
  if (!text) return text;
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface FormattedOutput {
  fields: OptimizedFields;
  issues: string[];
}

export function formatProductOutput(fields: OptimizedFields): FormattedOutput {
  const result = { ...fields };
  const TEXT_FIELDS = ["optimized_short_description", "optimized_description"] as const;
  for (const field of TEXT_FIELDS) {
    if (typeof result[field] === "string") {
      result[field] = stripWeakPhrases(result[field] as string);
      result[field] = normalizeWhitespace(result[field] as string);
    }
  }
  const { issues } = validateProductOutput(result);
  return { fields: result, issues };
}
