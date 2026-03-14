import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { workspace_id, image_url, product_context } = await req.json();
    if (!workspace_id || !image_url) throw new Error("workspace_id and image_url are required");

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
            content: `You are an Image Understanding Agent for a HORECA product catalog.

Analyze the product image and extract:
- detected_product_type: what kind of product (e.g. "commercial oven", "stainless steel table")
- color: dominant color(s)
- material: visible material (stainless steel, plastic, glass, wood, etc.)
- style: product style (industrial, commercial, compact, professional)
- visible_parts: list of identifiable components
- usage_context: where/how this would be used in HORECA
- alt_text: SEO-optimized alt text in Portuguese (max 125 chars), descriptive and specific

Respond with valid JSON only:
{
  "detected_product_type": "string",
  "color": "string",
  "material": "string",
  "style": "string",
  "visible_parts": ["string"],
  "usage_context": "string",
  "alt_text": "string",
  "confidence_score": 0.0-1.0
}`,
          },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: image_url } },
              { type: "text", text: product_context ? `Product context: ${JSON.stringify(product_context)}` : "Analyze this product image." },
            ],
          },
        ],
        temperature: 0.15,
        max_tokens: 1024,
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
        detected_product_type: "unknown",
        color: "unknown",
        material: "unknown",
        style: "unknown",
        visible_parts: [],
        usage_context: "unknown",
        alt_text: "",
        confidence_score: 0,
        error: "Failed to parse AI response",
      };
    }

    await supabase.from("agent_runs").insert({
      workspace_id,
      agent_name: "image_understanding",
      status: "completed",
      input_payload: { image_url },
      output_payload: result,
      confidence_score: result.confidence_score,
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
