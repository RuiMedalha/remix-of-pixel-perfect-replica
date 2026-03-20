// supabase/functions/_shared/ai/output-guardrails.ts
// Post-processing guardrails for AI-generated product fields.
// All functions are pure (no side effects). Never throws.

/** Trim a string to maxLen characters at the last word boundary before the limit. */
function trimToWord(value: string, maxLen: number): string {
  if (!value || value.length <= maxLen) return value;
  const cut = value.substring(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return lastSpace > 0 ? cut.substring(0, lastSpace).trimEnd() : cut;
}

/** Trim a string to maxLen characters at the last sentence boundary (. ! ?). */
function trimToSentence(value: string, maxLen: number): string {
  if (!value || value.length <= maxLen) return value;
  const cut = value.substring(0, maxLen);
  // Find the last sentence-ending punctuation before the cut point.
  // Check both "punct+space" and "punct+newline" patterns so sentences that
  // end right at or near the boundary are not missed.
  const lastSentence = Math.max(
    cut.lastIndexOf(". "),
    cut.lastIndexOf("! "),
    cut.lastIndexOf("? "),
    cut.lastIndexOf(".\n"),
    cut.lastIndexOf("!\n"),
    cut.lastIndexOf("?\n"),
    // Also handle sentence ending exactly at the cut boundary (no trailing space)
    cut.endsWith(".") ? cut.length - 1 : -1,
    cut.endsWith("!") ? cut.length - 1 : -1,
    cut.endsWith("?") ? cut.length - 1 : -1,
  );
  if (lastSentence > 0) {
    // Keep the punctuation character
    return cut.substring(0, lastSentence + 1).trimEnd();
  }
  // Fall back to word boundary if no sentence boundary found
  return trimToWord(value, maxLen);
}

/** Normalize an SEO slug: lowercase, trim, replace spaces/underscores with hyphens. */
function normalizeSlug(value: string, maxLen: number): string {
  if (!value) return value;
  return value
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .substring(0, maxLen)
    .replace(/-+$/, ""); // remove trailing hyphens
}

export interface OptimizedFields {
  optimized_title?: string;
  meta_title?: string;
  meta_description?: string;
  seo_slug?: string;
  optimized_short_description?: string;
  [key: string]: unknown;
}

/**
 * Apply field-level length guardrails to AI-generated product fields.
 * Returns a new object — does not mutate the input.
 *
 * Limits:
 *   optimized_title              → 70 chars (word boundary)
 *   meta_title                   → 60 chars (word boundary)
 *   meta_description             → 160 chars (sentence boundary)
 *   seo_slug                     → 100 chars (slug normalization)
 *   optimized_short_description  → 500 chars (sentence boundary)
 */
export function enforceFieldLimits(fields: OptimizedFields): OptimizedFields {
  const result = { ...fields };

  if (typeof result.optimized_title === "string") {
    result.optimized_title = trimToWord(result.optimized_title, 70);
  }
  if (typeof result.meta_title === "string") {
    result.meta_title = trimToWord(result.meta_title, 60);
  }
  if (typeof result.meta_description === "string") {
    result.meta_description = trimToSentence(result.meta_description, 160);
  }
  if (typeof result.seo_slug === "string") {
    result.seo_slug = normalizeSlug(result.seo_slug, 100);
  }
  if (typeof result.optimized_short_description === "string") {
    result.optimized_short_description = trimToSentence(result.optimized_short_description, 500);
  }

  return result;
}
