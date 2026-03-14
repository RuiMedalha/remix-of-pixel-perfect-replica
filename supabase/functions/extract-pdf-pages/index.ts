import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHUNK_SIZE = 3;
const MAX_CHUNK_CONCURRENCY = 2;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { extractionId, chunkMode, chunkStart, chunkEnd, storagePath, overviewData } = body;

    if (!extractionId) throw new Error("extractionId required");

    // ==========================================
    // CHUNK MODE: Process a single page range
    // ==========================================
    if (chunkMode) {
      return await processChunk({
        supabase, supabaseUrl, serviceKey, lovableKey,
        extractionId, chunkStart, chunkEnd, storagePath, overviewData,
      });
    }

    // ==========================================
    // MAIN MODE: Orchestrate the full extraction
    // ==========================================
    const { data: extraction, error: extErr } = await supabase
      .from("pdf_extractions")
      .select("*, uploaded_files:file_id(*)")
      .eq("id", extractionId)
      .single();
    if (extErr || !extraction) throw new Error("Extraction not found");

    await supabase.from("pdf_extractions").update({ status: "extracting" }).eq("id", extractionId);

    const fileRecord = extraction.uploaded_files;
    if (!fileRecord?.storage_path) throw new Error("No file storage_path");
    const storagePth = fileRecord.storage_path;

    // Download PDF — keep only what we need for overview
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("catalogs")
      .download(storagePth);
    if (dlErr || !fileData) throw new Error("Cannot download file: " + dlErr?.message);

    const pdfBuffer = await fileData.arrayBuffer();
    const pdfSizeMB = pdfBuffer.byteLength / (1024 * 1024);
    console.log(`PDF loaded: ${pdfSizeMB.toFixed(2)} MB`);

    // For the overview we send the PDF once — use a lightweight prompt
    const pdfBase64 = arrayBufferToBase64(pdfBuffer);

    const overviewResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a document analysis expert. Analyze this PDF and return a concise JSON overview.",
          },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:application/pdf;base64,${pdfBase64}` } },
              {
                type: "text",
                text: `Quickly analyze this PDF. Return JSON:
{"total_pages":N,"document_type":"product_catalog"|"price_list"|"technical_sheet"|"mixed","language":"xx","supplier_name":"...","has_images":bool,"estimated_products":N,"table_format":"tabular"|"cards"|"list"|"mixed","page_ranges":[{"start":1,"end":N,"content_type":"products"|"cover"|"index"|"notes"|"empty"}]}
Return ONLY valid JSON.`,
              },
            ],
          },
        ],
        max_tokens: 2000,
      }),
    });

    // Free base64 from memory immediately
    // (JS GC will reclaim once we null the reference and move on)

    let overview: any = { total_pages: 1, page_ranges: [{ start: 1, end: 1, content_type: "products" }] };
    if (overviewResp.ok) {
      const od = await overviewResp.json();
      const content = od.choices?.[0]?.message?.content || "{}";
      try {
        overview = JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      } catch { console.warn("Overview parse failed, using defaults"); }
    } else {
      console.error("Overview failed:", overviewResp.status);
    }

    const totalPages = overview.total_pages || 1;
    await supabase.from("pdf_extractions").update({
      total_pages: totalPages,
      layout_analysis: overview,
    }).eq("id", extractionId);

    // Determine product page ranges
    const productRanges = (overview.page_ranges || []).filter(
      (r: any) => ["products", "specs", "mixed"].includes(r.content_type)
    );
    if (productRanges.length === 0) {
      productRanges.push({ start: 1, end: totalPages, content_type: "products" });
    }

    // Build chunks with low memory pressure
    const chunks: { start: number; end: number }[] = [];
    for (const range of productRanges) {
      const rs = range.start || 1;
      const re = range.end || totalPages;
      for (let s = rs; s <= re; s += CHUNK_SIZE) {
        chunks.push({ start: s, end: Math.min(s + CHUNK_SIZE - 1, re) });
      }
    }

    console.log(`Dispatching ${chunks.length} chunks for ${totalPages} pages (concurrency=${MAX_CHUNK_CONCURRENCY})`);

    // Process chunks with bounded concurrency to prevent worker pressure
    const results: Array<{ chunk: { start: number; end: number }; ok: boolean; result: any }> = [];

    for (let i = 0; i < chunks.length; i += MAX_CHUNK_CONCURRENCY) {
      const batch = chunks.slice(i, i + MAX_CHUNK_CONCURRENCY);
      const batchResults = await Promise.all(batch.map((chunk) =>
        invokeChunkExtraction({
          supabaseUrl,
          serviceKey,
          extractionId,
          chunk,
          storagePath: storagePth,
          overviewData: {
            language: overview.language,
            supplier_name: overview.supplier_name,
            document_type: overview.document_type,
          },
        })
      ));
      results.push(...batchResults);
    }

    let totalPagesProcessed = 0;
    let totalTablesCreated = 0;
    let totalRowsExtracted = 0;
    let confidenceSum = 0;

    for (const r of results) {
      if (r.ok && r.result) {
        totalPagesProcessed += r.result.pagesProcessed || 0;
        totalTablesCreated += r.result.tablesCreated || 0;
        totalRowsExtracted += r.result.rowsExtracted || 0;
        confidenceSum += r.result.confidenceSum || 0;
      } else {
        console.error(`Chunk ${r.chunk.start}-${r.chunk.end} failed:`, r.result?.error);
        // Create error page entries for failed chunks
        for (let p = r.chunk.start; p <= r.chunk.end; p++) {
          await supabase.from("pdf_pages").insert({
            extraction_id: extractionId,
            page_number: p,
            raw_text: `[Extraction failed]`,
            has_tables: false, has_images: false,
            confidence_score: 0, status: "error" as any,
            zones: [],
            page_context: { error: r.result?.error || "chunk failed" },
          });
          totalPagesProcessed++;
        }
      }
    }

    const processingTime = Date.now() - startTime;
    await supabase.from("pdf_extractions").update({
      status: "reviewing",
      processed_pages: totalPagesProcessed,
      extraction_mode: "ai_vision_chunked",
      provider_used: "Lovable AI Gateway",
      provider_model: "google/gemini-2.5-flash",
      model_used: "google/gemini-2.5-flash",
      extraction_method: "ai_vision",
    }).eq("id", extractionId);

    await supabase.from("pdf_extraction_metrics").insert({
      extraction_id: extractionId,
      avg_confidence: totalPagesProcessed > 0 ? Math.round(confidenceSum / totalPagesProcessed) : 0,
      tables_detected: totalTablesCreated,
      rows_extracted: totalRowsExtracted,
      mapping_success_rate: 0,
      processing_time: processingTime,
    });

    return new Response(JSON.stringify({
      success: true, extractionId, totalPages,
      pagesProcessed: totalPagesProcessed,
      tablesDetected: totalTablesCreated,
      productsExtracted: totalRowsExtracted,
      processingTimeMs: processingTime,
      chunksUsed: chunks.length,
      overview: {
        documentType: overview.document_type,
        language: overview.language,
        supplier: overview.supplier_name,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("extract-pdf-pages error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function invokeChunkExtraction(opts: {
  supabaseUrl: string;
  serviceKey: string;
  extractionId: string;
  chunk: { start: number; end: number };
  storagePath: string;
  overviewData: any;
}) {
  const { supabaseUrl, serviceKey, extractionId, chunk, storagePath, overviewData } = opts;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/extract-pdf-pages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        extractionId,
        chunkMode: true,
        chunkStart: chunk.start,
        chunkEnd: chunk.end,
        storagePath,
        overviewData,
      }),
    });

    const result = await response.json();
    return { chunk, ok: response.ok, result };
  } catch (e) {
    return { chunk, ok: false, result: { error: e instanceof Error ? e.message : String(e) } };
  }
}

// ==========================================
// CHUNK PROCESSOR — runs in its own worker
// ==========================================
async function processChunk(opts: {
  supabase: any; supabaseUrl: string; serviceKey: string; lovableKey: string;
  extractionId: string; chunkStart: number; chunkEnd: number;
  storagePath: string; overviewData: any;
}) {
  const { supabase, lovableKey, extractionId, chunkStart, chunkEnd, storagePath, overviewData } = opts;

  // Download the PDF in this worker's own memory
  const { data: fileData, error: dlErr } = await supabase.storage
    .from("catalogs")
    .download(storagePath);
  if (dlErr || !fileData) throw new Error("Chunk download failed: " + dlErr?.message);

  const pdfBase64 = arrayBufferToBase64(await fileData.arrayBuffer());

  console.log(`Chunk: extracting pages ${chunkStart}-${chunkEnd}`);

  const extractionResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: "You are a product data extraction expert. Extract ALL products from the specified pages with maximum precision.",
        },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:application/pdf;base64,${pdfBase64}` } },
            {
              type: "text",
              text: `Extract ALL products from pages ${chunkStart} to ${chunkEnd} of this PDF.
Language: ${overviewData?.language || "auto-detect"}
Supplier: ${overviewData?.supplier_name || "unknown"}

For each product return: sku, title, description, price (number), currency, category, dimensions, weight, material, color_options (array), technical_specs (object), image_description, confidence (0-100).

JSON format:
{"pages":[{"page_number":N,"page_type":"product_listing","zones":["header","table"],"section_title":"...","products":[{...}]}]}
Return ONLY valid JSON.`,
            },
          ],
        },
      ],
      max_tokens: 16000,
    }),
  });

  if (!extractionResp.ok) {
    const errText = await extractionResp.text();
    console.error(`Chunk ${chunkStart}-${chunkEnd} AI failed:`, extractionResp.status, errText.substring(0, 300));
    return new Response(JSON.stringify({
      error: "AI call failed", pagesProcessed: 0, tablesCreated: 0, rowsExtracted: 0, confidenceSum: 0,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const respData = await extractionResp.json();
  const content = respData.choices?.[0]?.message?.content || "{}";
  let result: any = { pages: [] };
  try {
    result = JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
  } catch {
    try {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) result = JSON.parse(m[0]);
    } catch { /* skip */ }
  }

  const pages = result.pages || [];
  let pagesProcessed = 0;
  let tablesCreated = 0;
  let rowsExtracted = 0;
  let confidenceSum = 0;

  for (let p = chunkStart; p <= chunkEnd; p++) {
    const pageData = pages.find((pg: any) => pg.page_number === p);
    const products = pageData?.products || [];
    const zones = (pageData?.zones || []).map((z: string) => ({ type: z, content_summary: `${z} zone` }));

    const pageConfidence = products.length > 0
      ? Math.round(products.reduce((s: number, pr: any) => s + (pr.confidence || 70), 0) / products.length)
      : 30;
    confidenceSum += pageConfidence;

    const readableText = products.map((prod: any, i: number) => {
      const parts = [`[Product ${i + 1}]`];
      if (prod.sku) parts.push(`SKU: ${prod.sku}`);
      if (prod.title) parts.push(`Title: ${prod.title}`);
      if (prod.description) parts.push(`Description: ${prod.description}`);
      if (prod.price) parts.push(`Price: ${prod.currency || "€"}${prod.price}`);
      if (prod.category) parts.push(`Category: ${prod.category}`);
      if (prod.dimensions) parts.push(`Dimensions: ${prod.dimensions}`);
      if (prod.material) parts.push(`Material: ${prod.material}`);
      if (prod.image_description) parts.push(`Image: ${prod.image_description}`);
      return parts.join("\n");
    }).join("\n\n");

    const { data: pageRecord } = await supabase.from("pdf_pages").insert({
      extraction_id: extractionId,
      page_number: p,
      raw_text: readableText || `[Page ${p} - no products]`,
      has_tables: products.length > 0,
      has_images: zones.some((z: any) => z.type === "images"),
      confidence_score: pageConfidence,
      status: "extracted" as any,
      zones, layout_zones: zones,
      page_context: {
        page_type: pageData?.page_type,
        section_title: pageData?.section_title,
        product_count: products.length,
        language: overviewData?.language,
        supplier: overviewData?.supplier_name,
      },
      vision_result: { products, page_type: pageData?.page_type },
      text_result: { extraction_method: "ai_vision", language: overviewData?.language },
    }).select("id").single();

    if (pageRecord && products.length > 0) {
      const headers = ["sku", "title", "description", "price", "category", "dimensions", "weight", "material", "image_description"];
      const colTypes = ["sku", "title", "description", "price", "category", "dimensions", "weight", "material", "image_url"];

      const tableRows = products.map((prod: any, ri: number) => ({
        row_index: ri,
        cells: headers.map((h, ci) => {
          let value = "";
          if (h === "price") value = prod.price ? `${prod.currency || "€"}${prod.price}` : "";
          else if (h === "image_description") value = prod.image_description || "";
          else value = (prod[h] ?? "").toString();
          return { value, confidence: prod.confidence || 70, source: "ai_vision", header: h, semantic_type: colTypes[ci], validation_passed: !!value };
        }),
      }));

      const columnClassifications = headers.map((h, i) => ({
        index: i, header: h, semantic_type: colTypes[i], confidence: 85, source: "ai_vision",
      }));

      const { data: tableRec } = await supabase.from("pdf_tables").insert({
        page_id: pageRecord.id,
        table_index: tablesCreated,
        headers, rows: tableRows,
        confidence_score: pageConfidence,
        row_count: tableRows.length,
        col_count: headers.length,
        table_type: "product_table",
        column_classifications: columnClassifications,
        vision_source_data: { products },
      }).select("id").single();

      if (tableRec) {
        const rowInserts = tableRows.map((r: any) => ({
          table_id: tableRec.id,
          row_index: r.row_index,
          cells: r.cells, vision_cells: r.cells, reconciled_cells: r.cells,
          row_context: { section: pageData?.section_title, supplier: overviewData?.supplier_name },
          mapping_confidence: r.cells.reduce((s: number, c: any) => s + c.confidence, 0) / Math.max(r.cells.length, 1),
          status: "unmapped" as any,
        }));
        await supabase.from("pdf_table_rows").insert(rowInserts);
        rowsExtracted += rowInserts.length;
      }
      tablesCreated++;
    }
    pagesProcessed++;
  }

  return new Response(JSON.stringify({
    pagesProcessed, tablesCreated, rowsExtracted, confidenceSum,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return encodeBase64(new Uint8Array(buffer));
}
