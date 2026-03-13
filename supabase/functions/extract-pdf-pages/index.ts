import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { extractionId } = await req.json();
    if (!extractionId) throw new Error("extractionId required");

    // Get extraction
    const { data: extraction, error: extErr } = await supabase
      .from("pdf_extractions")
      .select("*, uploaded_files:file_id(*)")
      .eq("id", extractionId)
      .single();
    if (extErr || !extraction) throw new Error("Extraction not found");

    // Update status
    await supabase.from("pdf_extractions").update({ status: "extracting" }).eq("id", extractionId);

    const fileRecord = extraction.uploaded_files;
    if (!fileRecord?.storage_path) throw new Error("No file storage_path");

    // Download file from storage
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("catalogs")
      .download(fileRecord.storage_path);
    if (dlErr || !fileData) throw new Error("Cannot download file: " + dlErr?.message);

    const text = await fileData.text();

    // For text-based extraction: split by form feeds or estimate pages
    const rawPages = text.split(/\f/).filter(p => p.trim().length > 0);
    const totalPages = Math.max(rawPages.length, 1);

    await supabase.from("pdf_extractions").update({ total_pages: totalPages }).eq("id", extractionId);

    // Create pdf_pages
    const pages = rawPages.map((pageText, i) => ({
      extraction_id: extractionId,
      page_number: i + 1,
      raw_text: pageText.trim(),
      has_tables: /\t/.test(pageText) || /\|/.test(pageText),
      has_images: false,
      confidence_score: 60,
      status: "extracted" as const,
    }));

    if (pages.length > 0) {
      const { error: insertErr } = await supabase.from("pdf_pages").insert(pages);
      if (insertErr) throw new Error("Insert pages failed: " + insertErr.message);
    }

    // Auto-detect tables from tab-separated or pipe-separated content
    const { data: createdPages } = await supabase
      .from("pdf_pages")
      .select("id, page_number, raw_text, has_tables")
      .eq("extraction_id", extractionId)
      .order("page_number");

    let tablesCreated = 0;
    for (const page of (createdPages || [])) {
      if (!page.has_tables || !page.raw_text) continue;

      const lines = page.raw_text.split("\n").filter((l: string) => l.trim());
      const separator = page.raw_text.includes("\t") ? "\t" : "|";
      const tableLines = lines.filter((l: string) => l.includes(separator));

      if (tableLines.length < 2) continue;

      const headerLine = tableLines[0];
      const headers = headerLine.split(separator).map((h: string) => h.trim()).filter(Boolean);
      const dataRows = tableLines.slice(1).map((line: string, idx: number) => {
        const cells = line.split(separator).map((c: string) => c.trim());
        return { row_index: idx, cells: cells.map((value: string, ci: number) => ({
          value,
          confidence: 70,
          source: "text",
          header: headers[ci] || `col_${ci}`,
        }))};
      });

      const { data: tableRecord } = await supabase.from("pdf_tables").insert({
        page_id: page.id,
        table_index: 0,
        headers,
        rows: dataRows,
        confidence_score: 65,
        row_count: dataRows.length,
        col_count: headers.length,
      }).select("id").single();

      if (tableRecord) {
        const rowInserts = dataRows.map((r: any) => ({
          table_id: tableRecord.id,
          row_index: r.row_index,
          cells: r.cells,
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
