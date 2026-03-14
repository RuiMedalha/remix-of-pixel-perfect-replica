import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function hasMeaningfulProduct(candidate: any): boolean {
  if (!candidate || typeof candidate !== "object") return false;

  return [
    candidate.sku,
    candidate.title,
    candidate.original_title,
    candidate.description,
    candidate.original_description,
    candidate.price,
    candidate.original_price,
  ].some((value) => {
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

function toNumberPrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const parsed = parseFloat(String(value).replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function mapProductRow(product: any, fallbackCategory = "", source = "pdf_ai_vision", pageNumber?: number): Record<string, any> {
  const mapped: Record<string, any> = {};

  const sku = product?.sku ?? product?.SKU;
  const title = product?.original_title ?? product?.title ?? product?.name;
  const description = product?.original_description ?? product?.description;
  const category = product?.category || fallbackCategory;
  const price = toNumberPrice(product?.original_price ?? product?.price);

  if (sku) mapped.sku = sku;
  if (title) mapped.original_title = title;
  if (description) mapped.original_description = description;
  if (price !== null) mapped.original_price = price;
  if (category) mapped.category = category;
  if (product?.dimensions) mapped.dimensions = product.dimensions;
  if (product?.weight) mapped.weight = product.weight;
  if (product?.material) mapped.material = product.material;
  if (product?.color_options?.length) mapped.color_options = product.color_options;
  if (product?.image_description) mapped.image_description = product.image_description;
  if (product?.technical_specs) mapped.technical_specs = product.technical_specs;

  for (const [key, value] of Object.entries(product || {})) {
    if (key.startsWith("_")) continue;
    if ([
      "sku",
      "SKU",
      "title",
      "name",
      "original_title",
      "description",
      "original_description",
      "price",
      "original_price",
      "category",
      "dimensions",
      "weight",
      "material",
      "color_options",
      "image_description",
      "technical_specs",
      "confidence",
      "currency",
    ].includes(key)) {
      continue;
    }

    if (value !== null && value !== undefined && value !== "") {
      mapped[key] = value;
    }
  }

  return {
    ...mapped,
    _confidence: Number(product?._confidence ?? product?.confidence ?? 70),
    _pageNumber: pageNumber ?? product?._pageNumber ?? null,
    _source: product?._source || source,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { extractionId, sendToIngestion, workspaceId, mergeStrategy } = await req.json();
    if (!extractionId) throw new Error("extractionId required");

    const { data: extractionRow, error: extractionError } = await supabase
      .from("pdf_extractions")
      .select("detected_products")
      .eq("id", extractionId)
      .single();

    if (extractionError) throw extractionError;

    const reviewedProducts = flattenVisionProducts(extractionRow?.detected_products || []);

    const structuredRows: any[] = reviewedProducts
      .map((product: any) => mapProductRow(product, product?.category || "", product?._source || "pdf_review", product?._pageNumber))
      .filter(hasMeaningfulProduct);

    if (structuredRows.length === 0) {
      const { data: allPages } = await supabase
        .from("pdf_pages")
        .select("id, page_number, confidence_score, vision_result, page_context")
        .eq("extraction_id", extractionId)
        .order("page_number");

      if (!allPages?.length) throw new Error("No pages found");

      const pages = pickBestPageRows(allPages);

      for (const page of pages) {
        const sectionTitle = page.page_context?.section_title || "";
        const products = flattenVisionProducts(page.vision_result?.products || [], sectionTitle);

        for (const product of products) {
          const mappedProduct = mapProductRow(product, sectionTitle, "pdf_ai_vision", page.page_number);
          if (!hasMeaningfulProduct(mappedProduct)) continue;
          structuredRows.push(mappedProduct);
        }
      }

      const pageIds = pages.map((page) => page.id);
      const { data: tables } = await supabase
        .from("pdf_tables")
        .select("*, pdf_table_rows(*)")
        .in("page_id", pageIds)
        .order("table_index");

      if (structuredRows.length === 0 && tables?.length) {
        for (const table of tables) {
          for (const row of table.pdf_table_rows || []) {
            const cells = row.cells || [];
            const product: Record<string, any> = {};
            let totalConfidence = 0;

            for (const cell of cells) {
              const field = cell.semantic_type || cell.header;
              if (cell.value && field) {
                if (field === "sku") product.sku = cell.value;
                else if (field === "title") product.original_title = cell.value;
                else if (field === "description") product.original_description = cell.value;
                else if (field === "price") {
                  const num = toNumberPrice(cell.value);
                  if (num !== null) product.original_price = num;
                } else if (field === "category") {
                  product.category = cell.value;
                } else if (field === "image_description" || field === "image_url") {
                  product.image_description = cell.value;
                }
              }

              totalConfidence += Number(cell.confidence || 0);
            }

            if (hasMeaningfulProduct(product)) {
              const rowConfidence = cells.length > 0 ? Math.round(totalConfidence / cells.length) : 50;
              structuredRows.push({
                ...product,
                _confidence: rowConfidence,
                _source: "pdf_table",
                _rowId: row.id,
              });

              await supabase
                .from("pdf_table_rows")
                .update({ status: "mapped", mapping_confidence: rowConfidence })
                .eq("id", row.id);
            }
          }
        }
      }
    }

    if (sendToIngestion && workspaceId && structuredRows.length > 0) {
      const { data: job } = await supabase
        .from("ingestion_jobs")
        .insert({
          workspace_id: workspaceId,
          source_type: "api",
          file_name: `pdf_extraction_${extractionId}`,
          status: "mapping",
          mode: "dry_run",
          merge_strategy: mergeStrategy || "merge",
          total_rows: structuredRows.length,
          parsed_rows: structuredRows.length,
        })
        .select("id")
        .single();

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

      await supabase
        .from("pdf_extractions")
        .update({
          status: "done",
          completed_at: new Date().toISOString(),
          detected_products: structuredRows,
          sent_to_ingestion: true,
        })
        .eq("id", extractionId);

      return new Response(
        JSON.stringify({
          success: true,
          rowsMapped: structuredRows.length,
          ingestionJobId: job?.id,
          sentToIngestion: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await supabase
      .from("pdf_extractions")
      .update({
        status: "reviewing",
        detected_products: structuredRows,
      })
      .eq("id", extractionId);

    return new Response(
      JSON.stringify({
        success: true,
        rowsMapped: structuredRows.length,
        preview: structuredRows.slice(0, 20),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("map-pdf-to-products error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
