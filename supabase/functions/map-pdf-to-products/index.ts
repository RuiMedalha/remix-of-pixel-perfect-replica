import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function hasMeaningfulProduct(candidate: any): boolean {
  if (!candidate || typeof candidate !== "object") return false;
  return [candidate.sku, candidate.title, candidate.description, candidate.price].some((value) => {
    if (value === null || value === undefined) return false;
    return String(value).trim() !== "";
  });
}

function flattenVisionProducts(items: any, parentSection?: string): any[] {
  const flat: any[] = [];

  const walk = (candidate: any, section?: string) => {
    if (candidate == null) return;

    if (Array.isArray(candidate)) {
      candidate.forEach((entry) => walk(entry, section));
      return;
    }

    if (typeof candidate !== "object") return;

    if (Array.isArray(candidate.products)) {
      const sectionTitle =
        typeof candidate.section_title === "string" && candidate.section_title.trim()
          ? candidate.section_title.trim()
          : section;
      candidate.products.forEach((entry: any) => walk(entry, sectionTitle));
      return;
    }

    flat.push({
      ...candidate,
      category: candidate.category || section,
    });
  };

  walk(items, parentSection);
  return flat;
}

function pickBestPageRows(rows: any[]): any[] {
  const bestByPage = new Map<number, { row: any; productCount: number; confidence: number }>();

  for (const row of rows || []) {
    const pageNumber = Number(row?.page_number);
    if (!Number.isFinite(pageNumber)) continue;

    const products = flattenVisionProducts(row?.vision_result?.products || [], row?.page_context?.section_title || "");
    const productCount = products.filter(hasMeaningfulProduct).length;
    const confidence = Number(row?.confidence_score || 0);

    const current = bestByPage.get(pageNumber);
    if (
      !current ||
      productCount > current.productCount ||
      (productCount === current.productCount && confidence > current.confidence)
    ) {
      bestByPage.set(pageNumber, { row, productCount, confidence });
    }
  }

  return [...bestByPage.values()]
    .map((entry) => entry.row)
    .sort((a, b) => (a?.page_number || 0) - (b?.page_number || 0));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { extractionId, sendToIngestion, workspaceId } = await req.json();
    if (!extractionId) throw new Error("extractionId required");

    // Get all pages with their vision results (products extracted by AI)
    const { data: pages } = await supabase
      .from("pdf_pages")
      .select("id, page_number, vision_result, page_context")
      .eq("extraction_id", extractionId)
      .order("page_number");

    if (!pages?.length) throw new Error("No pages found");

    const structuredRows: any[] = [];

    for (const page of pages) {
      const products = page.vision_result?.products || [];
      const sectionTitle = page.page_context?.section_title || "";

      for (const prod of products) {
        if (!prod.title && !prod.sku) continue; // Skip empty

        const mapped: Record<string, any> = {};
        if (prod.sku) mapped.sku = prod.sku;
        if (prod.title) mapped.original_title = prod.title;
        if (prod.description) mapped.original_description = prod.description;
        if (prod.price != null) {
          const price = typeof prod.price === "number" ? prod.price : parseFloat(String(prod.price).replace(/[^\d.,]/g, "").replace(",", "."));
          if (!isNaN(price)) mapped.original_price = price;
        }
        if (prod.category || sectionTitle) mapped.category = prod.category || sectionTitle;
        if (prod.dimensions) mapped.dimensions = prod.dimensions;
        if (prod.weight) mapped.weight = prod.weight;
        if (prod.material) mapped.material = prod.material;
        if (prod.color_options?.length) mapped.color_options = prod.color_options;
        if (prod.image_description) mapped.image_description = prod.image_description;
        if (prod.technical_specs) mapped.technical_specs = prod.technical_specs;

        structuredRows.push({
          ...mapped,
          _confidence: prod.confidence || 70,
          _pageNumber: page.page_number,
          _source: "pdf_ai_vision",
        });
      }
    }

    // Also check tables (from vision-parse-pdf or direct extraction)
    const pageIds = pages.map(p => p.id);
    const { data: tables } = await supabase
      .from("pdf_tables")
      .select("*, pdf_table_rows(*)")
      .in("page_id", pageIds)
      .order("table_index");

    // If structuredRows is empty, fallback to table-based extraction
    if (structuredRows.length === 0 && tables?.length) {
      for (const table of tables) {
        for (const row of (table.pdf_table_rows || [])) {
          const cells = row.cells || [];
          const product: Record<string, any> = {};
          let totalConf = 0;

          for (const cell of cells) {
            const field = cell.semantic_type || cell.header;
            if (cell.value && field) {
              if (field === "sku") product.sku = cell.value;
              else if (field === "title") product.original_title = cell.value;
              else if (field === "description") product.original_description = cell.value;
              else if (field === "price") {
                const num = parseFloat(cell.value.replace(/[^\d.,]/g, "").replace(",", "."));
                if (!isNaN(num)) product.original_price = num;
              }
              else if (field === "category") product.category = cell.value;
              else if (field === "image_description" || field === "image_url") product.image_description = cell.value;
            }
            totalConf += cell.confidence || 0;
          }

          if (product.original_title || product.sku) {
            structuredRows.push({
              ...product,
              _confidence: cells.length > 0 ? Math.round(totalConf / cells.length) : 50,
              _source: "pdf_table",
              _rowId: row.id,
            });

            await supabase.from("pdf_table_rows").update({
              status: "mapped",
              mapping_confidence: cells.length > 0 ? Math.round(totalConf / cells.length) : 50,
            }).eq("id", row.id);
          }
        }
      }
    }

    // Send to ingestion hub
    if (sendToIngestion && workspaceId && structuredRows.length > 0) {
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
          mapped_data: {
            sku: row.sku,
            original_title: row.original_title,
            original_description: row.original_description,
            original_price: row.original_price,
            category: row.category,
            dimensions: row.dimensions,
            weight: row.weight,
            material: row.material,
            image_description: row.image_description,
          },
          action: "insert" as const,
          match_confidence: row._confidence || 0,
        }));
        await supabase.from("ingestion_job_items").insert(items);
        await supabase.from("ingestion_jobs").update({ status: "dry_run" }).eq("id", job.id);
      }

      await supabase.from("pdf_extractions").update({
        status: "done",
        completed_at: new Date().toISOString(),
        detected_products: structuredRows,
      }).eq("id", extractionId);

      return new Response(JSON.stringify({
        success: true,
        rowsMapped: structuredRows.length,
        ingestionJobId: job?.id,
        sentToIngestion: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Always save detected_products back to the extraction record
    await supabase.from("pdf_extractions").update({ 
      status: "reviewing",
      detected_products: structuredRows,
    }).eq("id", extractionId);

    return new Response(JSON.stringify({
      success: true,
      rowsMapped: structuredRows.length,
      preview: structuredRows.slice(0, 20),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("map-pdf-to-products error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
