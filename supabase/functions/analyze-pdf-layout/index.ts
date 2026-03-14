import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const lovableKey = Deno.env.get("LOVABLE_API_KEY") || "";

    const { extractionId } = await req.json();
    if (!extractionId) throw new Error("extractionId required");

    // Get extraction and pages
    const { data: extraction } = await supabase
      .from("pdf_extractions")
      .select("*, uploaded_files:file_id(file_name)")
      .eq("id", extractionId)
      .single();
    if (!extraction) throw new Error("Extraction not found");

    const { data: pages } = await supabase
      .from("pdf_pages")
      .select("id, page_number, raw_text, has_tables, zones, layout_zones")
      .eq("extraction_id", extractionId)
      .order("page_number");

    if (!pages?.length) throw new Error("No pages found");

    // Build summary for AI analysis
    const pageSummaries = pages.map((p: any) => ({
      page: p.page_number,
      textLength: (p.raw_text || "").length,
      hasTables: p.has_tables,
      zonesCount: (p.zones || p.layout_zones || []).length,
      textPreview: (p.raw_text || "").substring(0, 500),
    }));

    const totalText = pages.reduce((s: number, p: any) => s + (p.raw_text || "").length, 0);
    const tablesCount = pages.filter((p: any) => p.has_tables).length;
    const totalPages = pages.length;

    // Call AI for layout analysis + engine recommendation
    const prompt = `Analyze this PDF document structure for product catalog extraction. The document has ${totalPages} pages, ${totalText} total characters, and ${tablesCount} pages with tables.

Page summaries:
${JSON.stringify(pageSummaries.slice(0, 10), null, 2)}

Return a JSON with:
1. "layout_complexity": "simple" | "moderate" | "complex"
2. "detected_zones": array of { "type": string, "description": string, "pages": number[], "confidence": number }
   Types: product_title, sku, reference, price, technical_specs, dimension, power, description, table_product_list, image, category, header, footer
3. "has_complex_tables": boolean
4. "needs_ocr": boolean  
5. "text_quality": "high" | "medium" | "low"
6. "recommended_engine": "gemini_vision" | "openai_vision" | "lovable_gateway" | "ocr_rules"
7. "engine_confidence": number (0-100)
8. "estimated_accuracy": number (0-100)
9. "estimated_cost_usd": number
10. "detected_products_estimate": number
11. "document_language": string
12. "supplier_hint": string or null`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a document analysis expert. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    let analysis: any = {};
    if (resp.ok) {
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      try { analysis = JSON.parse(content); } catch { analysis = {}; }
    }

    // Build engine recommendation
    const engineRecommendation = {
      recommended: analysis.recommended_engine || "lovable_gateway",
      confidence: analysis.engine_confidence || 70,
      estimated_accuracy: analysis.estimated_accuracy || 75,
      estimated_cost_usd: analysis.estimated_cost_usd || 0.01 * totalPages,
      alternatives: [
        { engine: "lovable_gateway", label: "Lovable AI Gateway", pros: "Sem configuração extra", cost: "Incluído" },
        { engine: "gemini_vision", label: "Google Gemini Vision", pros: "Melhor para tabelas complexas", cost: "~$0.02/page" },
        { engine: "openai_vision", label: "OpenAI Vision", pros: "Forte em OCR e texto", cost: "~$0.03/page" },
        { engine: "ocr_rules", label: "OCR + Regras", pros: "Mais rápido, sem custo AI", cost: "Grátis" },
      ],
    };

    // Save analysis to extraction
    await supabase.from("pdf_extractions").update({
      layout_analysis: {
        ...analysis,
        totalPages,
        totalCharacters: totalText,
        pagesWithTables: tablesCount,
      },
      engine_recommendation: engineRecommendation,
      status: "reviewing",
    }).eq("id", extractionId);

    return new Response(JSON.stringify({
      success: true,
      analysis,
      engineRecommendation,
      totalPages,
      pagesWithTables: tablesCount,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-pdf-layout error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
