import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { workspace_id, product, channel } = await req.json();
    if (!workspace_id || !product || !channel) throw new Error("workspace_id, product and channel are required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch channel config if available
    const { data: channelConfig } = await supabase
      .from("channels")
      .select("*")
      .eq("workspace_id", workspace_id)
      .eq("channel_type", channel)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

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
            content: `You are a Channel Transformation Agent. Transform a canonical product into a channel-specific payload.

TARGET CHANNEL: ${channel}

CHANNEL CONSTRAINTS:
${channel === "woocommerce" ? `- title: max 200 chars
- short_description: max 400 chars, HTML allowed
- description: HTML allowed, no inline styles
- categories: hierarchical, slash-separated
- attributes: name/value pairs, visible or hidden
- images: array of URLs
- price: numeric, no currency symbol
- sku: required, unique` : ""}
${channel === "shopify" ? `- title: max 255 chars
- body_html: HTML description
- vendor: brand name
- product_type: single category string
- tags: comma-separated
- variants: array with price, sku, inventory
- images: array of { src }` : ""}
${channel === "marketplace" ? `- title: max 150 chars, no promotional text
- description: plain text preferred, max 2000 chars
- bullet_points: array of max 5 items, 250 chars each
- brand: required
- ean/gtin: required
- category_id: marketplace category code` : ""}
${channel === "xml_feed" ? `- title: max 150 chars
- description: plain text, max 5000 chars
- link: product URL
- price: with currency (e.g. "99.99 EUR")
- availability: in stock / out of stock
- gtin: EAN/UPC
- brand: required
- google_product_category: Google taxonomy ID` : ""}
${channel === "csv_export" ? `- All fields as flat key-value pairs
- No HTML in any field
- Pipe-separated for multi-value fields
- Dates as ISO 8601` : ""}

${channelConfig ? `Channel config: ${JSON.stringify(channelConfig.channel_config || {})}` : ""}

RULES:
- Respect field length limits strictly (truncate intelligently, never mid-word)
- Transform categories to channel format
- Strip disallowed HTML/formatting
- Ensure required fields are populated
- Flag missing required data in validation_warnings

Respond with valid JSON only:
{
  "channel": "${channel}",
  "payload_fields": { ... channel-specific fields ... },
  "validation_status": "valid" | "warning" | "invalid",
  "validation_warnings": ["string"],
  "transformations_applied": ["string"]
}`,
          },
          {
            role: "user",
            content: `Transform this product for ${channel}:
${JSON.stringify({
  title: product.optimized_title || product.original_title,
  description: product.optimized_description || product.original_description,
  short_description: product.optimized_short_description || product.short_description,
  sku: product.sku,
  price: product.optimized_price || product.original_price,
  sale_price: product.optimized_sale_price || product.sale_price,
  category: product.category,
  brand: product.brand,
  attributes: product.attributes,
  tags: product.tags,
  image_urls: product.image_urls,
  meta_title: product.meta_title,
  meta_description: product.meta_description,
  seo_slug: product.seo_slug,
}, null, 2)}`,
          },
        ],
        temperature: 0.15,
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
      result = { channel, payload_fields: {}, validation_status: "invalid", validation_warnings: ["Failed to parse AI response"], transformations_applied: [] };
    }

    await supabase.from("agent_runs").insert({
      workspace_id,
      agent_name: "channel_transformation",
      status: "completed",
      input_payload: { sku: product.sku, channel },
      output_payload: result,
      confidence_score: result.validation_status === "valid" ? 0.95 : result.validation_status === "warning" ? 0.7 : 0.3,
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
