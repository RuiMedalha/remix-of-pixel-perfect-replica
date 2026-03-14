import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BATCH_SIZE = 15; // pages per AI call

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
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

    // Download PDF as binary (NOT text!)
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("catalogs")
      .download(fileRecord.storage_path);
    if (dlErr || !fileData) throw new Error("Cannot download file: " + dlErr?.message);

    const pdfBuffer = await fileData.arrayBuffer();
    const pdfBase64 = arrayBufferToBase64(pdfBuffer);
    const pdfSizeMB = pdfBuffer.byteLength / (1024 * 1024);

    console.log(`PDF loaded: ${pdfSizeMB.toFixed(2)} MB`);

    // Step 1: Get document overview (page count, structure)
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
            content: "You are a document analysis expert. Analyze this PDF catalog and return structured information about its contents.",
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:application/pdf;base64,${pdfBase64}` },
              },
              {
                type: "text",
                text: `Analyze this PDF document. Return a JSON overview with:
1. "total_pages": number of pages
2. "document_type": "product_catalog" | "price_list" | "technical_sheet" | "mixed"
3. "language": detected language
4. "supplier_name": detected supplier/brand name or null
5. "page_ranges": array of { "start": number, "end": number, "content_type": "cover" | "products" | "index" | "specs" | "notes" | "empty", "description": string }
6. "has_images": boolean - whether product images are present
7. "estimated_products": approximate number of products
8. "table_format": "tabular" | "cards" | "list" | "mixed" - how products are laid out

Return ONLY valid JSON, no markdown.`,
              },
            ],
          },
        ],
        max_tokens: 4000,
      }),
    });

    let overview: any = { total_pages: 1, page_ranges: [{ start: 1, end: 1, content_type: "products" }] };
    if (overviewResp.ok) {
      const overviewData = await overviewResp.json();
      const content = overviewData.choices?.[0]?.message?.content || "{}";
      try {
        const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        overview = JSON.parse(cleaned);
      } catch (e) {
        console.warn("Overview parse failed, using defaults:", e);
      }
    } else {
      const errText = await overviewResp.text();
      console.error("Overview AI call failed:", overviewResp.status, errText);
    }

    const totalPages = overview.total_pages || 1;
    await supabase.from("pdf_extractions").update({
      total_pages: totalPages,
      layout_analysis: overview,
    }).eq("id", extractionId);

    // Step 2: Extract products from product pages in batches
    const productRanges = (overview.page_ranges || []).filter(
      (r: any) => r.content_type === "products" || r.content_type === "specs" || r.content_type === "mixed"
    );

    // If no product ranges detected, process all pages
    if (productRanges.length === 0) {
      productRanges.push({ start: 1, end: totalPages, content_type: "products" });
    }

    let totalTablesCreated = 0;
    let totalRowsExtracted = 0;
    let totalPagesProcessed = 0;
    let confidenceSum = 0;

    for (const range of productRanges) {
      const rangeStart = range.start || 1;
      const rangeEnd = range.end || totalPages;

      // Process in batches
      for (let batchStart = rangeStart; batchStart <= rangeEnd; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, rangeEnd);

        console.log(`Processing pages ${batchStart}-${batchEnd}...`);

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
                content: `You are a product data extraction expert for commercial/technical catalogs. Extract ALL product data from the specified pages with high precision. Include product codes, names, descriptions, prices, dimensions, technical specs, categories, and image descriptions. Be thorough - every product on every page must be captured.`,
              },
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: { url: `data:application/pdf;base64,${pdfBase64}` },
                  },
                  {
                    type: "text",
                    text: `Extract ALL product data from pages ${batchStart} to ${batchEnd} of this PDF catalog.

For EACH page in this range, return:
1. Page number
2. Page type (product_listing, technical_specs, pricing, other)
3. Zone types found (header, table, images, notes, footer)
4. All products found with these fields:
   - sku / reference code
   - title / product name
   - description (full text)
   - price (with currency if visible)
   - category / section
   - dimensions (if any)
   - weight (if any)
   - material (if any)
   - color/finish options (if any)
   - technical_specs (any other specs as key-value pairs)
   - image_description (describe any product image visible on the page)
   - confidence (0-100, how confident you are in this extraction)

Return as JSON array:
{
  "pages": [
    {
      "page_number": 1,
      "page_type": "product_listing",
      "zones": ["header", "table", "images"],
      "section_title": "Category Name",
      "products": [
        {
          "sku": "ABC-123",
          "title": "Product Name",
          "description": "Full description...",
          "price": 29.99,
          "currency": "EUR",
          "category": "Category",
          "dimensions": "10x20x30 cm",
          "weight": "2.5 kg",
          "material": "Steel",
          "color_options": ["White", "Black"],
          "technical_specs": {"voltage": "220V", "power": "1500W"},
          "image_description": "Front view of white steel product",
          "confidence": 90
        }
      ]
    }
  ]
}

Return ONLY valid JSON, no markdown. Extract EVERY product visible, do not skip any.`,
                  },
                ],
              },
            ],
            max_tokens: 16000,
          }),
        });

        if (!extractionResp.ok) {
          const errText = await extractionResp.text();
          console.error(`Batch ${batchStart}-${batchEnd} failed:`, extractionResp.status, errText.substring(0, 300));
          
          // Create placeholder pages for failed batch
          for (let p = batchStart; p <= batchEnd; p++) {
            await supabase.from("pdf_pages").insert({
              extraction_id: extractionId,
              page_number: p,
              raw_text: `[Extraction failed for page ${p}]`,
              has_tables: false,
              has_images: false,
              confidence_score: 0,
              status: "error" as const,
              zones: [],
              page_context: { error: "AI extraction failed", batch: `${batchStart}-${batchEnd}` },
            });
            totalPagesProcessed++;
          }
          continue;
        }

        const batchData = await extractionResp.json();
        const content = batchData.choices?.[0]?.message?.content || "{}";
        let batchResult: any = { pages: [] };
        try {
          const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          batchResult = JSON.parse(cleaned);
        } catch (e) {
          console.warn(`Batch ${batchStart}-${batchEnd} parse failed:`, e);
          // Try to salvage partial data
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) batchResult = JSON.parse(jsonMatch[0]);
          } catch { /* give up */ }
        }

        const pages = batchResult.pages || [];

        // Also create entries for pages in range that weren't returned by AI
        const returnedPageNums = new Set(pages.map((p: any) => p.page_number));

        for (let p = batchStart; p <= batchEnd; p++) {
          const pageData = pages.find((pg: any) => pg.page_number === p);

          if (!pageData) {
            // Page wasn't in AI response - create minimal entry
            await supabase.from("pdf_pages").insert({
              extraction_id: extractionId,
              page_number: p,
              raw_text: "",
              has_tables: false,
              has_images: false,
              confidence_score: 30,
              status: "extracted" as const,
              zones: [],
              page_context: { note: "No product data detected on this page" },
            });
            totalPagesProcessed++;
            continue;
          }

          const products = pageData.products || [];
          const zones = (pageData.zones || []).map((z: string) => ({
            type: z,
            content_summary: `${z} zone detected`,
          }));

          const pageConfidence = products.length > 0
            ? Math.round(products.reduce((s: number, p: any) => s + (p.confidence || 70), 0) / products.length)
            : 40;
          confidenceSum += pageConfidence;

          // Build readable text from extracted products
          const readableText = products.map((prod: any, i: number) => {
            const parts = [`[Product ${i + 1}]`];
            if (prod.sku) parts.push(`SKU: ${prod.sku}`);
            if (prod.title) parts.push(`Title: ${prod.title}`);
            if (prod.description) parts.push(`Description: ${prod.description}`);
            if (prod.price) parts.push(`Price: ${prod.currency || "€"}${prod.price}`);
            if (prod.category) parts.push(`Category: ${prod.category}`);
            if (prod.dimensions) parts.push(`Dimensions: ${prod.dimensions}`);
            if (prod.weight) parts.push(`Weight: ${prod.weight}`);
            if (prod.material) parts.push(`Material: ${prod.material}`);
            if (prod.image_description) parts.push(`Image: ${prod.image_description}`);
            const specs = prod.technical_specs || {};
            for (const [k, v] of Object.entries(specs)) {
              parts.push(`${k}: ${v}`);
            }
            return parts.join("\n");
          }).join("\n\n");

          // Insert page
          const { data: pageRecord } = await supabase.from("pdf_pages").insert({
            extraction_id: extractionId,
            page_number: p,
            raw_text: readableText || `[Page ${p} - ${pageData.page_type || "unknown"}]`,
            has_tables: products.length > 0,
            has_images: zones.some((z: any) => z.type === "images"),
            confidence_score: pageConfidence,
            status: "extracted" as const,
            zones,
            layout_zones: zones,
            page_context: {
              page_type: pageData.page_type,
              section_title: pageData.section_title,
              product_count: products.length,
              language: overview.language,
              supplier: overview.supplier_name,
            },
            vision_result: { products, page_type: pageData.page_type },
            text_result: { extraction_method: "ai_vision", language: overview.language },
          }).select("id").single();

          if (!pageRecord) { totalPagesProcessed++; continue; }

          // Create table from products if any found
          if (products.length > 0) {
            const headers = ["sku", "title", "description", "price", "category", "dimensions", "weight", "material", "image_description"];
            const columnTypes = ["sku", "title", "description", "price", "category", "dimensions", "weight", "material", "image_url"];

            const tableRows = products.map((prod: any, ri: number) => ({
              row_index: ri,
              cells: headers.map((h, ci) => {
                let value = "";
                if (h === "price") value = prod.price ? `${prod.currency || "€"}${prod.price}` : "";
                else if (h === "image_description") value = prod.image_description || "";
                else value = (prod[h] ?? "").toString();
                
                return {
                  value,
                  confidence: prod.confidence || 70,
                  source: "ai_vision",
                  header: h,
                  semantic_type: columnTypes[ci],
                  validation_passed: !!value,
                };
              }),
            }));

            const columnClassifications = headers.map((h, i) => ({
              index: i,
              header: h,
              semantic_type: columnTypes[i],
              confidence: 85,
              source: "ai_vision",
            }));

            const { data: tableRec } = await supabase.from("pdf_tables").insert({
              page_id: pageRecord.id,
              table_index: totalTablesCreated,
              headers,
              rows: tableRows,
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
                cells: r.cells,
                vision_cells: r.cells,
                reconciled_cells: r.cells,
                row_context: {
                  section: pageData.section_title,
                  page_type: pageData.page_type,
                  supplier: overview.supplier_name,
                },
                mapping_confidence: r.cells.reduce((s: number, c: any) => s + c.confidence, 0) / Math.max(r.cells.length, 1),
                status: "unmapped" as const,
              }));
              await supabase.from("pdf_table_rows").insert(rowInserts);
              totalRowsExtracted += rowInserts.length;
            }
            totalTablesCreated++;
          }

          totalPagesProcessed++;
        }
      }
    }

    // Update extraction status
    const processingTime = Date.now() - startTime;
    await supabase.from("pdf_extractions").update({
      status: "reviewing",
      processed_pages: totalPagesProcessed,
      extraction_mode: "ai_vision",
      provider_used: "Lovable AI Gateway",
      provider_model: "google/gemini-2.5-flash",
      model_used: "google/gemini-2.5-flash",
      extraction_method: "ai_vision",
    }).eq("id", extractionId);

    // Insert extraction metrics
    await supabase.from("pdf_extraction_metrics").insert({
      extraction_id: extractionId,
      avg_confidence: totalPagesProcessed > 0 ? Math.round(confidenceSum / totalPagesProcessed) : 0,
      tables_detected: totalTablesCreated,
      rows_extracted: totalRowsExtracted,
      mapping_success_rate: 0,
      processing_time: processingTime,
    });

    return new Response(JSON.stringify({
      success: true,
      extractionId,
      totalPages,
      pagesProcessed: totalPagesProcessed,
      tablesDetected: totalTablesCreated,
      productsExtracted: totalRowsExtracted,
      processingTimeMs: processingTime,
      overview: {
        documentType: overview.document_type,
        language: overview.language,
        supplier: overview.supplier_name,
        hasImages: overview.has_images,
        estimatedProducts: overview.estimated_products,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("extract-pdf-pages error:", e);
    // Update status to error
    try {
      const { extractionId } = await req.clone().json();
      if (extractionId) {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await supabase.from("pdf_extractions").update({ status: "error" }).eq("id", extractionId);
      }
    } catch { /* ignore */ }
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
