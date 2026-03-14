import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { workspace_id, product, language } = await req.json();
    if (!workspace_id || !product) throw new Error("workspace_id and product are required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const lang = language || "pt";

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
            content: `You are an SEO Optimization Agent for a B2B HORECA e-commerce catalog.
Write in ${lang === "pt" ? "European Portuguese" : lang === "es" ? "Spanish" : lang === "fr" ? "French" : "English"}.

RULES:
- meta_title: max 60 chars, include primary keyword naturally, brand if space allows. Never cut important words mid-word.
- meta_description: max 155 chars, compelling, include primary keyword, end with benefit or call-to-action.
- seo_slug: lowercase, hyphens, no accents, max 5 words, descriptive.
- focus_keyword: the single most important search term for this product.
- seo_keywords: 5-10 relevant long-tail keywords a professional buyer would search.
- heading_structure: suggested H1 and H2s for the product page.
- NO keyword stuffing. Keep everything natural and readable.
- Prioritize commercial intent keywords (buy, professional, commercial, industrial).

Respond with valid JSON only:
{
  "meta_title": "string (max 60 chars)",
  "meta_description": "string (max 155 chars)",
  "seo_slug": "string",
  "focus_keyword": "string",
  "seo_keywords": ["string"],
  "heading_structure": { "h1": "string", "h2s": ["string"] },
  "confidence_score": 0.0-1.0
}`,
          },
          {
            role: "user",
            content: `Optimize SEO for:

Title: ${product.title || product.original_title || product.optimized_title || "N/A"}
Brand: ${product.brand || "N/A"}
Category: ${product.category || "N/A"}
Description: ${(product.optimized_description || product.original_description || "").substring(0, 500)}
Attributes: ${product.attributes ? JSON.stringify(product.attributes) : "N/A"}`,
          },
        ],
        temperature: 0.3,
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
      result = { meta_title: "", meta_description: "", seo_keywords: [], confidence_score: 0, error: "Parse failed" };
    }

    await supabase.from("agent_runs").insert({
      workspace_id,
      agent_name: "seo_optimization",
      status: "completed",
      input_payload: { title: product.title || product.original_title, language: lang },
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
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
