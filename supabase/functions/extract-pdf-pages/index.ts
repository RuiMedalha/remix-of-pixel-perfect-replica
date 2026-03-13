import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Dimension parser for expressions like 12x30x40, 12 × 30 × 40
function parseDimensions(text: string): { width?: number; height?: number; depth?: number; raw: string } | null {
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)(?:\s*[xX×]\s*(\d+(?:[.,]\d+)?))?/);
  if (!match) return null;
  const nums = [match[1], match[2], match[3]].filter(Boolean).map(n => parseFloat(n.replace(",", ".")));
  return { width: nums[0], height: nums[1], depth: nums[2], raw: match[0] };
}

// Zone detection with semantic role inference
function detectZoneType(line: string, lineIndex: number, totalLines: number): { type: string; role: string } {
  if (lineIndex < 3 && /^[A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇÑ\s]{5,}$/.test(line))
    return { type: "header", role: "context_label" };
  if (/^(nota|notes|obs|observ|atenção|aviso|important)/i.test(line))
    return { type: "note", role: "description" };
  if (lineIndex > totalLines - 4 && line.length < 60)
    return { type: "footer", role: "context_label" };
  if (/[\t|]/.test(line) && line.split(/[\t|]/).length >= 3)
    return { type: "table", role: "table_row" };
  if (line.length < 50 && /^[A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇÑ]/.test(line) && !line.includes("\t"))
    return { type: "section_title", role: "product_family" };
  return { type: "paragraph", role: "description" };
}

// Language detection heuristic
function detectLanguage(text: string): { language: string; confidence: number } {
  const ptWords = (text.match(/\b(de|do|da|em|com|para|por|uma|não|são|está|mais|sobre|entre|também)\b/gi) || []).length;
  const esWords = (text.match(/\b(de|del|en|con|para|por|una|está|más|sobre|entre|también|los|las)\b/gi) || []).length;
  const enWords = (text.match(/\b(the|and|for|with|from|this|that|have|are|but|not|was|can|will)\b/gi) || []).length;
  const total = ptWords + esWords + enWords;
  if (total < 3) return { language: "unknown", confidence: 20 };
  if (ptWords >= esWords && ptWords >= enWords) return { language: "pt", confidence: Math.min(95, 50 + ptWords * 5) };
  if (esWords >= ptWords && esWords >= enWords) return { language: "es", confidence: Math.min(95, 50 + esWords * 5) };
  return { language: "en", confidence: Math.min(95, 50 + enWords * 5) };
}

// Simple hash for layout fingerprinting
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { extractionId } = await req.json();
    if (!extractionId) throw new Error("extractionId required");

    const { data: extraction, error: extErr } = await supabase
      .from("pdf_extractions")
      .select("*, uploaded_files:file_id(*)")
      .eq("id", extractionId)
      .single();
    if (extErr || !extraction) throw new Error("Extraction not found");

    await supabase.from("pdf_extractions").update({ status: "extracting" }).eq("id", extractionId);

    const fileRecord = extraction.uploaded_files;
    if (!fileRecord?.storage_path) throw new Error("No file storage_path");

    const { data: fileData, error: dlErr } = await supabase.storage
      .from("catalogs")
      .download(fileRecord.storage_path);
    if (dlErr || !fileData) throw new Error("Cannot download file: " + dlErr?.message);

    // Load technical symbols for dimension parsing
    const { data: symbols } = await supabase.from("technical_symbol_dictionary").select("*");
    const symbolMap = new Map((symbols || []).map((s: any) => [s.symbol.toLowerCase(), s]));

    // Load supplier profiles for template matching
    const { data: supplierProfiles } = await supabase
      .from("supplier_layout_profiles")
      .select("*")
      .eq("workspace_id", extraction.workspace_id);

    const text = await fileData.text();
    const rawPages = text.split(/\f/).filter(p => p.trim().length > 0);
    const totalPages = Math.max(rawPages.length, 1);

    await supabase.from("pdf_extractions").update({ total_pages: totalPages }).eq("id", extractionId);

    let totalTablesCreated = 0;
    let totalRowsExtracted = 0;
    let confidenceSum = 0;

    // Process each page
    for (let pageIdx = 0; pageIdx < rawPages.length; pageIdx++) {
      const pageText = rawPages[pageIdx];
      const lines = pageText.split("\n").filter(l => l.trim());

      // Zone segmentation with block detection
      const zones: any[] = [];
      const blocks: any[] = [];
      let currentZone: any = null;
      let blockOrder = 0;

      for (let li = 0; li < lines.length; li++) {
        const line = lines[li].trim();
        if (!line) continue;
        const { type, role } = detectZoneType(line, li, lines.length);

        blocks.push({
          block_type: type as any,
          text_content: line,
          reading_order: blockOrder++,
          semantic_role: role as any,
          bbox: { start_line: li, end_line: li },
          confidence: 60,
        });

        if (!currentZone || currentZone.type !== type) {
          if (currentZone) zones.push(currentZone);
          currentZone = { type, start_line: li, end_line: li, content: line };
        } else {
          currentZone.end_line = li;
          currentZone.content += "\n" + line;
        }
      }
      if (currentZone) zones.push(currentZone);

      // Language detection
      const lang = detectLanguage(pageText);

      // Section detection
      const sections = zones
        .filter(z => z.type === "section_title" || z.type === "header")
        .map(z => ({ title: z.content.substring(0, 200), bbox: { start_line: z.start_line, end_line: z.end_line }, confidence: 70 }));

      // Layout signature
      const layoutFingerprint = zones.map(z => z.type).join("-");
      const pageHash = simpleHash(layoutFingerprint);

      // Supplier guess from profiles
      let supplierGuess: string | null = null;
      if (supplierProfiles) {
        for (const profile of supplierProfiles) {
          const patterns = profile.header_patterns || [];
          for (const pattern of patterns) {
            if (pageText.toLowerCase().includes((pattern as string).toLowerCase())) {
              supplierGuess = profile.supplier_name;
              break;
            }
          }
          if (supplierGuess) break;
        }
      }

      const headerZones = zones.filter(z => z.type === "header" || z.type === "section_title");
      const pageContext = {
        detected_sections: headerZones.map(z => z.content.substring(0, 100)),
        zone_types: zones.map(z => z.type),
        has_tables: zones.some(z => z.type === "table"),
        has_notes: zones.some(z => z.type === "note"),
        language: lang,
        supplier_guess: supplierGuess,
      };

      const pageConfidence = Math.round(60 + (sections.length > 0 ? 10 : 0) + (lang.confidence > 70 ? 10 : 0));
      confidenceSum += pageConfidence;

      // Insert page
      const { data: pageRecord, error: pageInsertErr } = await supabase.from("pdf_pages").insert({
        extraction_id: extractionId,
        page_number: pageIdx + 1,
        raw_text: pageText.trim(),
        has_tables: zones.some(z => z.type === "table"),
        has_images: false,
        confidence_score: pageConfidence,
        status: "extracted" as const,
        zones,
        layout_zones: zones,
        page_context: pageContext,
        text_result: { zones, page_context: pageContext, extraction_method: "text_layout", language: lang },
      }).select("id").single();

      if (pageInsertErr || !pageRecord) continue;
      const pageId = pageRecord.id;

      // Insert blocks
      if (blocks.length > 0) {
        const blockInserts = blocks.map(b => ({ ...b, page_id: pageId }));
        await supabase.from("pdf_page_blocks").insert(blockInserts);
      }

      // Insert sections
      if (sections.length > 0) {
        await supabase.from("pdf_sections").insert(sections.map(s => ({ page_id: pageId, section_title: s.title, bbox: s.bbox, confidence: s.confidence })));
      }

      // Insert language segment
      if (lang.language !== "unknown") {
        await supabase.from("pdf_language_segments").insert({ page_id: pageId, language: lang.language, confidence: lang.confidence });
      }

      // Insert layout signature
      await supabase.from("pdf_layout_signatures").insert({
        page_hash: pageHash,
        layout_structure: { zones: zones.map(z => z.type) },
        table_positions: zones.filter(z => z.type === "table").map(z => ({ start: z.start_line, end: z.end_line })),
        image_positions: [],
        column_count: 0,
        supplier_guess: supplierGuess,
      });

      // Extract tables from structured content
      if (zones.some(z => z.type === "table")) {
        const separator = pageText.includes("\t") ? "\t" : "|";
        const tableLines = lines.filter(l => l.includes(separator) && l.split(separator).length >= 3);

        if (tableLines.length >= 2) {
          const headerLine = tableLines[0];
          const headers = headerLine.split(separator).map(h => h.trim()).filter(Boolean);

          const sectionContext = sections.map(s => s.title).join(" | ");

          // Dimension detection in values
          const dataRows = tableLines.slice(1).map((line, idx) => {
            const cellValues = line.split(separator).map(c => c.trim());
            return {
              row_index: idx,
              cells: cellValues.map((value, ci) => {
                const dims = parseDimensions(value);
                return {
                  value,
                  confidence: 70,
                  source: "text",
                  header: headers[ci] || `col_${ci}`,
                  semantic_type: "unknown",
                  validation_passed: true,
                  dimensions: dims,
                  reason: "text extraction",
                };
              }),
            };
          });

          const { data: tableRecord } = await supabase.from("pdf_tables").insert({
            page_id: pageId,
            table_index: totalTablesCreated,
            headers,
            rows: dataRows,
            confidence_score: 65,
            row_count: dataRows.length,
            col_count: headers.length,
            table_type: "product_table",
            text_source_data: { headers, rows: dataRows, context: sectionContext },
            column_classifications: headers.map((h, i) => ({
              index: i, header: h, semantic_type: "unknown", confidence: 50, source: "text",
            })),
          }).select("id").single();

          if (tableRecord) {
            const rowInserts = dataRows.map(r => ({
              table_id: tableRecord.id,
              row_index: r.row_index,
              cells: r.cells,
              text_cells: r.cells,
              row_context: { table_context: sectionContext, section_context: sectionContext },
              mapping_confidence: 0,
              status: "unmapped" as const,
            }));
            if (rowInserts.length > 0) {
              await supabase.from("pdf_table_rows").insert(rowInserts);
              totalRowsExtracted += rowInserts.length;
            }
            totalTablesCreated++;
          }
        }
      }
    }

    // Update extraction status
    await supabase.from("pdf_extractions").update({
      status: "reviewing",
      processed_pages: totalPages,
    }).eq("id", extractionId);

    // Insert extraction metrics
    const processingTime = Date.now() - startTime;
    await supabase.from("pdf_extraction_metrics").insert({
      extraction_id: extractionId,
      avg_confidence: totalPages > 0 ? Math.round(confidenceSum / totalPages) : 0,
      tables_detected: totalTablesCreated,
      rows_extracted: totalRowsExtracted,
      mapping_success_rate: 0,
      processing_time: processingTime,
    });

    return new Response(JSON.stringify({
      success: true,
      extractionId,
      totalPages,
      tablesDetected: totalTablesCreated,
      rowsExtracted: totalRowsExtracted,
      processingTimeMs: processingTime,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("extract-pdf-pages error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
