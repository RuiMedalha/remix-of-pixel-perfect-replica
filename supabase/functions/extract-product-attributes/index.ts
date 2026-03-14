import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { workspace_id, product } = await req.json();
    if (!workspace_id || !product) throw new Error("workspace_id and product are required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an Attribute Extraction Agent for a HORECA product catalog.

Your task: extract and normalize all technical attributes from the provided product text.

TARGET ATTRIBUTES (extract these when present):
- potência / power (W, kW, HP)
- dimensões / dimensions (mm, cm, m)
- peso / weight (g, kg)
- material (stainless steel, plastic, etc.)
- capacidade / capacity (L, mL, kg)
- voltagem / voltage (V)
- tipo de alimentação / power type (electric, gas, manual)
- velocidade / speed (rpm, m/s)
- compatibilidade / compatibility
- certificações / certifications (CE, NSF, etc.)
- temperatura / temperature (°C, °F)
- pressão / pressure (bar, PSI)
- ruído / noise (dB)
- consumo / consumption
- cor / color
- número de portas / doors
- número de prateleiras / shelves
- tipo de gás / gas type

NORMALIZATION RULES:
- Always use SI units when possible (mm for small dimensions, cm/m for larger)
- Separate compound dimensions into individual attributes (largura, altura, profundidade)
- Convert fractions to decimals
- Trim whitespace from values
- Use lowercase for unit abbreviations (kg, mm, w, kw)
- For ranges, keep as "min-max unit"

Respond with valid JSON only, no markdown:
{
  "attributes": [
    {
      "attribute_name": "string (lowercase, snake_case)",
      "attribute_value": "string or number",
      "unit": "string or null",
      "confidence_score": 0.0-1.0,
      "source_text": "brief excerpt where this was found"
    }
  ]
}`,
          },
          {
            role: "user",
            content: `Extract attributes from this product:

Title: ${product.title || product.original_title || "N/A"}
Description: ${product.description || product.original_description || "N/A"}
Technical Specs: ${product.technical_specs || "N/A"}
OCR Text: ${product.ocr_text || "N/A"}
Existing Attributes: ${product.attributes ? JSON.stringify(product.attributes) : "N/A"}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 2048,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI Gateway error: ${aiResponse.status} - ${errText}`);
    }

    const aiData = await aiResponse.json();
    const content = (aiData.choices?.[0]?.message?.content || "")
      .replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = {
        attributes: [],
        error: "Failed to parse AI response: " + content.substring(0, 200),
      };
    }

    // Record agent run
    await supabase.from("agent_runs").insert({
      workspace_id,
      agent_name: "attribute_extraction",
      status: "completed",
      input_payload: { title: product.title || product.original_title },
      output_payload: result,
      confidence_score: result.attributes?.length
        ? result.attributes.reduce((s: number, a: any) => s + (a.confidence_score || 0), 0) / result.attributes.length
        : 0,
      cost_estimate: aiData.usage ? (aiData.usage.prompt_tokens + aiData.usage.completion_tokens) * 0.000001 : null,
      completed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
