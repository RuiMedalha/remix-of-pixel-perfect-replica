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
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { pageId } = await req.json();
    if (!pageId) throw new Error("pageId required");

    const { data: page, error } = await supabase
      .from("pdf_pages")
      .select("*, pdf_extractions:extraction_id(*)")
      .eq("id", pageId)
      .single();
    if (error || !page) throw new Error("Page not found");

    // Use AI to parse the raw text and extract structured tables
    const prompt = `Analyze this extracted PDF page text and identify any tables or structured product data.
Return a JSON object with:
- "tables": array of tables found, each with:
  - "headers": array of column header strings
  - "rows": array of arrays (each inner array = one row of cell values)
  - "confidence": 0-100 confidence score
- "summary": brief description of what was found

Text to analyze:
${(page.raw_text || "").substring(0, 8000)}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You extract structured data from PDF text. Return valid JSON only." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_tables",
            description: "Extract structured tables from PDF text",
            parameters: {
              type: "object",
              properties: {
                tables: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      headers: { type: "array", items: { type: "string" } },
                      rows: { type: "array", items: { type: "array", items: { type: "string" } } },
                      confidence: { type: "number" },
                    },
                    required: ["headers", "rows", "confidence"],
                  },
                },
                summary: { type: "string" },
              },
              required: ["tables", "summary"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_tables" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      // Fall back to text-only parsing - already done in extract-pdf-pages
      await supabase.from("pdf_pages").update({
        vision_result: { error: "AI unavailable", fallback: "text_only" },
        confidence_score: page.confidence_score || 50,
      }).eq("id", pageId);

      return new Response(JSON.stringify({ success: true, fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let visionResult: any = { tables: [], summary: "" };

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        visionResult = JSON.parse(toolCall.function.arguments);
      } catch { /* keep default */ }
    }

    // Update page with vision result
    const newConfidence = Math.max(
      page.confidence_score || 0,
      ...((visionResult.tables || []).map((t: any) => t.confidence || 0))
    );

    await supabase.from("pdf_pages").update({
      vision_result: visionResult,
      confidence_score: newConfidence,
      has_tables: (visionResult.tables || []).length > 0,
    }).eq("id", pageId);

    // Create/update tables from vision
    for (let ti = 0; ti < (visionResult.tables || []).length; ti++) {
      const vTable = visionResult.tables[ti];
      const { data: tableRec } = await supabase.from("pdf_tables").insert({
        page_id: pageId,
        table_index: ti + 100, // offset to not conflict with text-detected tables
        headers: vTable.headers || [],
        rows: (vTable.rows || []).map((r: string[], ri: number) => ({
          row_index: ri,
          cells: r.map((value: string, ci: number) => ({
            value,
            confidence: vTable.confidence || 70,
            source: "vision",
            header: (vTable.headers || [])[ci] || `col_${ci}`,
          })),
        })),
        confidence_score: vTable.confidence || 70,
        row_count: (vTable.rows || []).length,
        col_count: (vTable.headers || []).length,
      }).select("id").single();

      if (tableRec) {
        const rowInserts = (vTable.rows || []).map((r: string[], ri: number) => ({
          table_id: tableRec.id,
          row_index: ri,
          cells: r.map((value: string, ci: number) => ({
            value,
            confidence: vTable.confidence || 70,
            source: "vision",
            header: (vTable.headers || [])[ci] || `col_${ci}`,
          })),
          mapping_confidence: 0,
          status: "unmapped" as const,
        }));
        if (rowInserts.length > 0) {
          await supabase.from("pdf_table_rows").insert(rowInserts);
        }
      }
    }

    // Update extraction model_used
    await supabase.from("pdf_extractions")
      .update({ model_used: "google/gemini-2.5-flash", extraction_method: "hybrid" })
      .eq("id", page.extraction_id);

    return new Response(JSON.stringify({
      success: true,
      tablesFound: (visionResult.tables || []).length,
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
