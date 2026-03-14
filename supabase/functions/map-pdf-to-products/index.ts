import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Common header-to-field mappings
const FIELD_MAP: Record<string, string> = {
  title: "original_title", name: "original_title", product: "original_title", produto: "original_title", nome: "original_title", designação: "original_title",
  description: "original_description", descrição: "original_description", desc: "original_description",
  price: "original_price", preço: "original_price", pvp: "original_price", valor: "original_price", "preço s/iva": "original_price",
  sku: "sku", ref: "sku", referência: "sku", código: "sku", reference: "sku", code: "sku",
  category: "category", categoria: "category",
  image: "image_urls", imagem: "image_urls", foto: "image_urls",
};

function mapHeader(header: string): string | null {
  const normalized = header.toLowerCase().trim().replace(/[^a-záàâãéèêíìîóòôõúùûçñ\w]/g, "");
  return FIELD_MAP[normalized] || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { extractionId, sendToIngestion, workspaceId } = await req.json();
    if (!extractionId) throw new Error("extractionId required");

    // Get all tables for this extraction
    const { data: pages } = await supabase
      .from("pdf_pages")
      .select("id")
      .eq("extraction_id", extractionId);

    if (!pages?.length) throw new Error("No pages found");

    const pageIds = pages.map(p => p.id);
    const { data: tables } = await supabase
      .from("pdf_tables")
      .select("*, pdf_table_rows(*)")
      .in("page_id", pageIds)
      .order("table_index");

    if (!tables?.length) throw new Error("No tables found");

    const structuredRows: any[] = [];

    for (const table of tables) {
      const headers = table.headers || [];
      const fieldMap: Record<number, string> = {};
      headers.forEach((h: string, i: number) => {
        const mapped = mapHeader(h);
        if (mapped) fieldMap[i] = mapped;
      });

      for (const row of (table.pdf_table_rows || [])) {
        const cells = row.cells || [];
        const product: Record<string, any> = {};
        let totalConfidence = 0;
        let cellCount = 0;

        for (const cell of cells) {
          const headerIdx = cells.indexOf(cell);
          const fieldName = fieldMap[headerIdx] || mapHeader(cell.header || "");
          if (fieldName && cell.value) {
            if (fieldName === "original_price") {
              const numVal = parseFloat(cell.value.replace(/[^\d.,]/g, "").replace(",", "."));
              if (!isNaN(numVal)) product[fieldName] = numVal;
            } else if (fieldName === "image_urls") {
              product[fieldName] = [cell.value];
            } else {
              product[fieldName] = cell.value;
            }
          }
          totalConfidence += cell.confidence || 0;
          cellCount++;
        }

        const mappingConf = cellCount > 0 ? Math.round(totalConfidence / cellCount) : 0;
        const hasTitle = !!product.original_title;

        if (hasTitle) {
          structuredRows.push({ ...product, _mappingConfidence: mappingConf, _rowId: row.id });

          await supabase.from("pdf_table_rows").update({
            status: "mapped",
            mapping_confidence: mappingConf,
          }).eq("id", row.id);
        }
      }
    }

    // Optionally send to ingestion hub
    if (sendToIngestion && workspaceId && structuredRows.length > 0) {
      const authHeader = req.headers.get("Authorization") || "";

      // Create ingestion job via parse-ingestion-like flow
      const { data: job } = await supabase.from("ingestion_jobs").insert({
        workspace_id: workspaceId,
        source_type: "api",
        file_name: `pdf_extraction_${extractionId}`,
        status: "mapping",
        mode: "dry_run",
        merge_strategy: "merge",
        total_rows: structuredRows.length,
        parsed_rows: structuredRows.length,
      }).select("id").single();

      if (job) {
        const items = structuredRows.map((row, i) => ({
          job_id: job.id,
          status: "mapped" as const,
          source_row_index: i,
          source_data: row,
          mapped_data: row,
          action: "insert" as const,
          match_confidence: row._mappingConfidence || 0,
        }));
        await supabase.from("ingestion_job_items").insert(items);
        await supabase.from("ingestion_jobs").update({ status: "dry_run" }).eq("id", job.id);
      }

      await supabase.from("pdf_extractions").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", extractionId);

      return new Response(JSON.stringify({
        success: true,
        rowsMapped: structuredRows.length,
        ingestionJobId: job?.id,
        sentToIngestion: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.from("pdf_extractions").update({ status: "reviewing" }).eq("id", extractionId);

    return new Response(JSON.stringify({
      success: true,
      rowsMapped: structuredRows.length,
      preview: structuredRows.slice(0, 10),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("map-pdf-to-products error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
