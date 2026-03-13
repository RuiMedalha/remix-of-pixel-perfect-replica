import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Semantic column types for classification
const SEMANTIC_TYPES = ["sku", "title", "description", "price", "dimensions", "capacity", "material", "weight", "voltage", "color", "size", "notes", "image_url", "category", "brand", "quantity", "unit", "unknown"] as const;

// Zone types for page segmentation
const ZONE_TYPES = ["header", "section_title", "table", "notes", "footer", "images", "body_text", "metadata"] as const;

// Column validation rules by semantic type
const COLUMN_VALIDATION: Record<string, (v: string) => boolean> = {
  sku: (v) => /^[A-Za-z0-9\-_.\/]{2,}$/.test(v.trim()),
  price: (v) => /[\d]+[.,]?\d*/.test(v.replace(/[€$£\s]/g, "")),
  dimensions: (v) => /\d+\s*[xX×]\s*\d+/.test(v) || /\d+\s*(mm|cm|m|pol|in)/.test(v),
  capacity: (v) => /\d+\s*(l|L|ml|mL|cl|gal)/.test(v),
  weight: (v) => /\d+\s*(g|kg|lb|oz)/.test(v),
  voltage: (v) => /\d+\s*(V|v|volt)/.test(v),
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { pageId } = await req.json();
    if (!pageId) throw new Error("pageId required");

    const { data: page, error } = await supabase
      .from("pdf_pages")
      .select("*, pdf_extractions:extraction_id(*, workspace_id)")
      .eq("id", pageId)
      .single();
    if (error || !page) throw new Error("Page not found");

    const workspaceId = page.pdf_extractions?.workspace_id;

    // Check for supplier templates
    let templates: any[] = [];
    if (workspaceId) {
      const { data: tpls } = await supabase
        .from("pdf_table_templates")
        .select("*")
        .eq("workspace_id", workspaceId);
      templates = tpls || [];
    }

    // ─── STEP 1: Zone Segmentation ───
    const rawText = (page.raw_text || "").substring(0, 10000);
    const lines = rawText.split("\n");
    const zones: any[] = [];
    let currentZone: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let zoneType = "body_text";
      if (i < 3 && /^[A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇÑ\s]{5,}$/.test(line)) zoneType = "header";
      else if (/^(nota|notes|obs|observ|atenção|aviso)/i.test(line)) zoneType = "notes";
      else if (i > lines.length - 4 && line.length < 60) zoneType = "footer";
      else if (/[\t|]/.test(line) && line.split(/[\t|]/).length >= 3) zoneType = "table";
      else if (line.length < 40 && /^[A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇÑ]/.test(line) && !line.includes("\t")) zoneType = "section_title";

      if (!currentZone || currentZone.type !== zoneType) {
        if (currentZone) zones.push(currentZone);
        currentZone = { type: zoneType, start_line: i, end_line: i, content: line };
      } else {
        currentZone.end_line = i;
        currentZone.content += "\n" + line;
      }
    }
    if (currentZone) zones.push(currentZone);

    // Build page_context from zones
    const headerZones = zones.filter(z => z.type === "header" || z.type === "section_title");
    const pageContext = {
      detected_sections: headerZones.map((z: any) => z.content.substring(0, 100)),
      zone_summary: zones.map((z: any) => z.type),
      has_tables: zones.some((z: any) => z.type === "table"),
      has_notes: zones.some((z: any) => z.type === "notes"),
    };

    // Text-based extraction result
    const textResult = {
      zones,
      page_context: pageContext,
      extraction_method: "text_layout",
    };

    // ─── STEP 2: AI Vision Extraction ───
    const aiPrompt = `Analyze this PDF page text with Hybrid Layout Intelligence.

INSTRUCTIONS:
1. Identify ALL tables/structured data on the page
2. For each table, classify each column semantically: ${SEMANTIC_TYPES.join(", ")}
3. Detect page zones: ${ZONE_TYPES.join(", ")}
4. Extract context from headers/section titles that apply to the tables

Page text:
${rawText}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a PDF data extraction expert. Extract tables with semantic column classification and confidence scores. Be precise about column types." },
          { role: "user", content: aiPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_hybrid_layout",
            description: "Extract tables with zone segmentation and semantic classification",
            parameters: {
              type: "object",
              properties: {
                zones: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: [...ZONE_TYPES] },
                      content_summary: { type: "string" },
                    },
                    required: ["type", "content_summary"],
                  },
                },
                tables: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      headers: { type: "array", items: { type: "string" } },
                      column_types: { type: "array", items: { type: "string", enum: [...SEMANTIC_TYPES] } },
                      rows: { type: "array", items: { type: "array", items: { type: "string" } } },
                      confidence: { type: "number" },
                      context: { type: "string" },
                    },
                    required: ["headers", "column_types", "rows", "confidence"],
                  },
                },
                page_context: {
                  type: "object",
                  properties: {
                    supplier_name: { type: "string" },
                    section_title: { type: "string" },
                    category_hint: { type: "string" },
                    notes: { type: "string" },
                  },
                },
                summary: { type: "string" },
              },
              required: ["tables", "summary"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_hybrid_layout" } },
      }),
    });

    let visionResult: any = { tables: [], summary: "", zones: [], page_context: {} };

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try { visionResult = JSON.parse(toolCall.function.arguments); } catch { /* keep default */ }
      }
    } else {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      visionResult = { tables: [], summary: "AI unavailable - text fallback", zones: [], page_context: {} };
    }

    // ─── STEP 3: Reconciliation Engine ───
    // Match template if supplier detected
    let matchedTemplate: any = null;
    const detectedSupplier = visionResult.page_context?.supplier_name;
    if (detectedSupplier && templates.length > 0) {
      matchedTemplate = templates.find((t: any) =>
        t.supplier_name.toLowerCase() === detectedSupplier.toLowerCase()
      );
    }

    // Reconcile text zones with vision zones
    const reconciledZones = (visionResult.zones || []).length > 0 ? visionResult.zones : zones.map((z: any) => ({
      type: z.type,
      content_summary: z.content.substring(0, 200),
    }));

    // Merge page context
    const mergedPageContext = {
      ...pageContext,
      ...(visionResult.page_context || {}),
      template_matched: matchedTemplate?.supplier_name || null,
    };

    // Update page with all layers
    const bestConfidence = Math.max(
      page.confidence_score || 0,
      ...((visionResult.tables || []).map((t: any) => t.confidence || 0))
    );

    await supabase.from("pdf_pages").update({
      text_result: textResult,
      vision_result: visionResult,
      reconciled_result: { zones: reconciledZones, page_context: mergedPageContext },
      zones: reconciledZones,
      page_context: mergedPageContext,
      layout_zones: zones,
      confidence_score: bestConfidence,
      has_tables: (visionResult.tables || []).length > 0 || zones.some((z: any) => z.type === "table"),
    }).eq("id", pageId);

    // ─── STEP 4: Create Reconciled Tables ───
    for (let ti = 0; ti < (visionResult.tables || []).length; ti++) {
      const vTable = visionResult.tables[ti];
      const columnClassifications = (vTable.column_types || []).map((ct: string, ci: number) => ({
        index: ci,
        header: (vTable.headers || [])[ci] || `col_${ci}`,
        semantic_type: ct,
        confidence: vTable.confidence || 70,
        source: "vision",
      }));

      // Apply template confidence boosts
      if (matchedTemplate) {
        for (const col of columnClassifications) {
          const alias = matchedTemplate.column_aliases?.[col.header.toLowerCase()];
          if (alias) {
            col.semantic_type = alias;
            col.confidence = Math.min(100, col.confidence + 15);
            col.source = "template";
          }
        }
      }

      // Build reconciled rows with per-cell confidence
      const reconciledRows = (vTable.rows || []).map((r: string[], ri: number) => {
        const cells = r.map((value: string, ci: number) => {
          const colType = columnClassifications[ci]?.semantic_type || "unknown";
          const validator = COLUMN_VALIDATION[colType];
          const passesValidation = validator ? validator(value) : true;
          const baseConf = vTable.confidence || 70;
          const cellConfidence = passesValidation ? Math.min(100, baseConf + 10) : Math.max(0, baseConf - 20);

          return {
            value,
            confidence: cellConfidence,
            source: "reconciled",
            header: (vTable.headers || [])[ci] || `col_${ci}`,
            semantic_type: colType,
            validation_passed: passesValidation,
            reason: passesValidation
              ? `${colType} validation passed`
              : `${colType} validation failed for value "${value}"`,
          };
        });
        return { row_index: ri, cells };
      });

      const reconciliationReasons = columnClassifications.map((c: any) => ({
        column: c.header,
        semantic_type: c.semantic_type,
        source: c.source,
        reason: c.source === "template"
          ? `Matched template alias for ${c.header}`
          : `AI classified as ${c.semantic_type} (${c.confidence}%)`,
      }));

      const { data: tableRec } = await supabase.from("pdf_tables").insert({
        page_id: pageId,
        table_index: ti + 100,
        headers: vTable.headers || [],
        rows: reconciledRows,
        confidence_score: vTable.confidence || 70,
        row_count: reconciledRows.length,
        col_count: (vTable.headers || []).length,
        column_classifications: columnClassifications,
        text_source_data: {},
        vision_source_data: { headers: vTable.headers, rows: vTable.rows, confidence: vTable.confidence },
        reconciled_data: { rows: reconciledRows, context: vTable.context || "" },
        reconciliation_reasons: reconciliationReasons,
        template_id: matchedTemplate?.id || null,
      }).select("id").single();

      if (tableRec) {
        const rowInserts = reconciledRows.map((r: any) => ({
          table_id: tableRec.id,
          row_index: r.row_index,
          cells: r.cells,
          vision_cells: (vTable.rows || [])[r.row_index]?.map((v: string, ci: number) => ({
            value: v, confidence: vTable.confidence || 70, source: "vision",
            header: (vTable.headers || [])[ci] || `col_${ci}`,
          })) || [],
          reconciled_cells: r.cells,
          row_context: { table_context: vTable.context || "", page_context: mergedPageContext },
          validation_errors: r.cells.filter((c: any) => !c.validation_passed).map((c: any) => ({
            field: c.header, message: c.reason,
          })),
          mapping_confidence: Math.round(r.cells.reduce((s: number, c: any) => s + c.confidence, 0) / Math.max(r.cells.length, 1)),
          status: "unmapped" as const,
        }));
        if (rowInserts.length > 0) {
          await supabase.from("pdf_table_rows").insert(rowInserts);
        }
      }
    }

    // Update extraction
    await supabase.from("pdf_extractions")
      .update({ model_used: "google/gemini-2.5-flash", extraction_method: "hybrid" })
      .eq("id", page.extraction_id);

    return new Response(JSON.stringify({
      success: true,
      tablesFound: (visionResult.tables || []).length,
      zonesDetected: reconciledZones.length,
      templateMatched: matchedTemplate?.supplier_name || null,
      summary: visionResult.summary,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("vision-parse-pdf error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
