// Deterministic HTML assembly for product descriptions (no LLM).
// Resolves known {{placeholders}}, strips unknown tokens, removes empty markup shells.

const PLACEHOLDER_TOKEN = /\{\{[a-zA-Z0-9_]+\}\}/;

export function hasUnresolvedPlaceholders(text: string | null | undefined): boolean {
  if (!text || typeof text !== "string") return false;
  return PLACEHOLDER_TOKEN.test(text);
}

function stripTagsVisibleLen(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** FAQ entries from AI tool output */
export function buildFaqHtml(faq: unknown): string {
  if (!Array.isArray(faq) || faq.length === 0) return "";
  const parts: string[] = [];
  for (const item of faq) {
    const row = item as { question?: string; answer?: string };
    const q = (row?.question ?? "").trim();
    const a = (row?.answer ?? "").trim();
    if (!q || !a) continue;
    parts.push(`<details><summary>${q}</summary><p>${a}</p></details>`);
  }
  return parts.join("\n");
}

/** technical_specs may be HTML fragment, plain text, or JSON-like string */
export function buildSpecsTableHtml(technicalSpecs: unknown): string {
  if (technicalSpecs == null) return "";
  if (typeof technicalSpecs === "string") {
    const t = technicalSpecs.trim();
    if (!t) return "";
    if (/<tr[\s>]/i.test(t)) {
      return `<table class="he-specs-table"><tbody>${t}</tbody></table>`;
    }
    return `<table class="he-specs-table"><tbody><tr><td>${t}</td></tr></tbody></table>`;
  }
  if (typeof technicalSpecs === "object") {
    try {
      const s = JSON.stringify(technicalSpecs);
      if (!s || s === "{}" || s === "[]") return "";
      return `<table class="he-specs-table"><tbody><tr><td>${s}</td></tr></tbody></table>`;
    } catch {
      return "";
    }
  }
  return "";
}

/** Collapse tables whose visible text is effectively empty */
function removeEmptyTables(html: string): string {
  return html.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (block) => {
    const vis = stripTagsVisibleLen(block);
    return vis.length < 2 ? "" : block;
  });
}

/** Remove empty <details> blocks (no real answer body) */
function removeEmptyDetails(html: string): string {
  return html.replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi, (block) => {
    const withoutSummary = block.replace(/<summary\b[^>]*>[\s\S]*?<\/summary>/gi, "");
    const vis = stripTagsVisibleLen(withoutSummary);
    return vis.length < 2 ? "" : block;
  });
}

/** Remove common empty wrapper divs left after stripping */
function removeEmptySectionDivs(html: string): string {
  return html.replace(
    /<div\b[^>]*(?:class="[^"]*(?:spec|faq|product-faq|tabela)[^"]*")[^>]*>[\s\S]*?<\/div>/gi,
    (block) => {
      const vis = stripTagsVisibleLen(block);
      return vis.length < 3 ? "" : block;
    },
  );
}

/**
 * Resolve {{faq}} / {{tabela_specs}}, strip unknown {{tokens}}, remove empty shells.
 */
export function finalizeOptimizedDescriptionHtml(
  raw: string,
  opts: { faq?: unknown; technicalSpecs?: unknown },
): string {
  if (!raw || typeof raw !== "string") return "";
  let html = raw;

  const faqHtml = buildFaqHtml(opts.faq);
  const specsHtml = buildSpecsTableHtml(opts.technicalSpecs);

  html = html.replace(/\{\{faq\}\}/gi, faqHtml);
  html = html.replace(/\{\{tabela_specs\}\}/gi, specsHtml);
  html = html.replace(PLACEHOLDER_TOKEN, "");

  for (let pass = 0; pass < 3; pass++) {
    const prev = html;
    html = removeEmptyTables(html);
    html = removeEmptyDetails(html);
    html = removeEmptySectionDivs(html);
    html = html.replace(/\n{3,}/g, "\n\n").trim();
    if (html === prev) break;
  }

  return html;
}

export interface PublishValidationResult {
  ok: boolean;
  reasons: string[];
}

/**
 * Block Woo publish when payload fields would contain placeholders or empty critical HTML.
 * `has` matches publish-woocommerce: true when that field is included in the job.
 */
export function validateWooPublishPayload(
  product: Record<string, unknown>,
  has: (fieldKey: string) => boolean,
): PublishValidationResult {
  const reasons: string[] = [];

  const title = String(
    has("title") ? (product.optimized_title || product.original_title || "") : "",
  );
  const shortD = String(
    has("short_description")
      ? (product.optimized_short_description || product.short_description || "")
      : "",
  );
  const longD = String(
    has("description") ? (product.optimized_description || product.original_description || "") : "",
  );

  if (has("title")) {
    if (!title.trim()) reasons.push("Título em falta para publicação");
    if (hasUnresolvedPlaceholders(title)) reasons.push("Marcadores {{...}} no título");
  }
  if (has("short_description")) {
    if (hasUnresolvedPlaceholders(shortD)) {
      reasons.push("Marcadores {{...}} na descrição curta");
    }
  }
  if (
    product.status === "needs_review" &&
    (has("description") || has("short_description") || has("title"))
  ) {
    reasons.push("Produto em revisão (needs_review): conclua a otimização antes de publicar conteúdo");
  }

  if (has("description")) {
    if (hasUnresolvedPlaceholders(longD)) {
      reasons.push("Marcadores {{...}} na descrição — conclua a revisão antes de publicar");
    }
    if (longD && /<table\b/i.test(longD)) {
      const tables = longD.match(/<table\b[^>]*>[\s\S]*?<\/table>/gi) || [];
      for (const t of tables) {
        if (stripTagsVisibleLen(t).length < 2) {
          reasons.push("Tabela de especificações vazia na descrição");
          break;
        }
      }
    }
    if (longD && /<details\b/i.test(longD)) {
      const details = longD.match(/<details\b[^>]*>[\s\S]*?<\/details>/gi) || [];
      for (const d of details) {
        const body = d.replace(/<summary\b[^>]*>[\s\S]*?<\/summary>/gi, "");
        if (stripTagsVisibleLen(body).length < 2) {
          reasons.push("Secção FAQ vazia na descrição");
          break;
        }
      }
    }
  }

  return { ok: reasons.length === 0, reasons };
}
