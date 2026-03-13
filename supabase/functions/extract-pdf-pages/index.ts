import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zone detection patterns
function detectZoneType(line: string, lineIndex: number, totalLines: number): string {
  if (lineIndex < 3 && /^[A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇÑ\s]{5,}$/.test(line)) return "header";
  if (/^(nota|notes|obs|observ|atenção|aviso|important)/i.test(line)) return "notes";
  if (lineIndex > totalLines - 4 && line.length < 60) return "footer";
  if (/[\t|]/.test(line) && line.split(/[\t|]/).length >= 3) return "table";
  if (line.length < 50 && /^[A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇÑ]/.test(line) && !line.includes("\t")) return "section_title";
  return "body_text";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const text = await fileData.text();
    const rawPages = text.split(/\f/).filter(p => p.trim().length > 0);
    const totalPages = Math.max(rawPages.length, 1);

    await supabase.from("pdf_extractions").update({ total_pages: totalPages }).eq("id", extractionId);

    // Create pdf_pages with zone segmentation
    const pages = rawPages.map((pageText, i) => {
      const lines = pageText.split("\n").filter(l => l.trim());
      const zones: any[] = [];
      let currentZone: any = null;

      for (let li = 0; li < lines.length; li++) {
        const line = lines[li].trim();
        if (!line) continue;
        const zoneType = detectZoneType(line, li, lines.length);

        if (!currentZone || currentZone.type !== zoneType) {
          if (currentZone) zones.push(currentZone);
          currentZone = { type: zoneType, start_line: li, end_line: li, content: line };
        } else {
          currentZone.end_line = li;
          currentZone.content += "\n" + line;
        }
      }
      if (currentZone) zones.push(currentZone);

      const headerZones = zones.filter(z => z.type === "header" || z.type === "section_title");
      const pageContext = {
        detected_sections: headerZones.map(z => z.content.substring(0, 100)),
        zone_types: zones.map(z => z.type),
        has_tables: zones.some(z => z.type === "table"),
        has_notes: zones.some(z => z.type === "notes"),
      };

      return {
        extraction_id: extractionId,
        page_number: i + 1,
        raw_text: pageText.trim(),
        has_tables: zones.some(z => z.type === "table"),
        has_images: false,
        confidence_score: 60,
        status: "extracted" as const,
        zones,
        layout_zones: zones,
        page_context: pageContext,
        text_result: { zones, page_context: pageContext, extraction_method: "text_layout" },
      };
    });

    if (pages.length > 0) {
      const { error: insertErr } = await supabase.from("pdf_pages").insert(pages);
      if (insertErr) throw new Error("Insert pages failed: " + insertErr.message);
    }

    // Auto-detect tables from structured content
    const { data: createdPages } = await supabase
      .from("pdf_pages")
      .select("id, page_number, raw_text, has_tables, zones")
      .eq("extraction_id", extractionId)
      .order("page_number");

    let tablesCreated = 0;
    for (const page of (createdPages || [])) {
      if (!page.has_tables || !page.raw_text) continue;

      const lines = page.raw_text.split("\n").filter((l: string) => l.trim());
      const separator = page.raw_text.includes("\t") ? "\t" : "|";
      const tableLines = lines.filter((l: string) => l.includes(separator) && l.split(separator).length >= 3);

      if (tableLines.length < 2) continue;

      const headerLine = tableLines[0];
      const headers = headerLine.split(separator).map((h: string) => h.trim()).filter(Boolean);

      // Extract section context from zones preceding the table
      const tableZoneContext = (page.zones || [])
        .filter((z: any) => z.type === "section_title" || z.type === "header")
        .map((z: any) => z.content)
        .join(" | ");

      const dataRows = tableLines.slice(1).map((line: string, idx: number) => {
        const cellValues = line.split(separator).map((c: string) => c.trim());
        return {
          row_index: idx,
          cells: cellValues.map((value: string, ci: number) => ({
            value,
            confidence: 70,
            source: "text",
            header: headers[ci] || `col_${ci}`,
            semantic_type: "unknown",
            validation_passed: true,
            reason: "text extraction - pending classification",
          })),
        };
      });

      const { data: tableRecord } = await supabase.from("pdf_tables").insert({
        page_id: page.id,
        table_index: tablesCreated,
        headers,
        rows: dataRows,
        confidence_score: 65,
        row_count: dataRows.length,
        col_count: headers.length,
        text_source_data: { headers, rows: dataRows, context: tableZoneContext },
        column_classifications: headers.map((h: string, i: number) => ({
          index: i, header: h, semantic_type: "unknown", confidence: 50, source: "text",
        })),
      }).select("id").single();

      if (tableRecord) {
        const rowInserts = dataRows.map((r: any) => ({
          table_id: tableRecord.id,
          row_index: r.row_index,
          cells: r.cells,
          text_cells: r.cells,
          row_context: { table_context: tableZoneContext, section_context: tableZoneContext },
          mapping_confidence: 0,
          status: "unmapped" as const,
        }));
        if (rowInserts.length > 0) {
          await supabase.from("pdf_table_rows").insert(rowInserts);
        }
        tablesCreated++;
      }
    }

    await supabase.from("pdf_extractions").update({
      status: "reviewing",
      processed_pages: totalPages,
    }).eq("id", extractionId);

    return new Response(JSON.stringify({
      success: true,
      extractionId,
      totalPages,
      tablesDetected: tablesCreated,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("extract-pdf-pages error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
