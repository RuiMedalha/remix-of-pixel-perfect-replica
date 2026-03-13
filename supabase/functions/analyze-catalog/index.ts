import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const { workspace_id, limit = 50 } = await req.json();
    if (!workspace_id) throw new Error("workspace_id required");

    // Load products
    const { data: products } = await supabase.from("products").select("id, sku, original_title, optimized_title, optimized_description, optimized_short_description, meta_title, meta_description, seo_slug, category, category_id, attributes, tags, image_urls, optimized_price, original_price, sale_price, product_type, parent_product_id, seo_score, upsell_skus, crosssell_skus").eq("workspace_id", workspace_id).limit(limit);

    if (!products?.length) return new Response(JSON.stringify({ insights: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Load schemas
    const { data: schemas } = await supabase.from("category_schemas").select("*").eq("workspace_id", workspace_id).eq("is_active", true);

    // Load rejections
    const { data: rejections } = await supabase.from("channel_rejections").select("product_id, rejection_type, field_impacted").eq("workspace_id", workspace_id).eq("resolved", false);

    const rejectionMap: Record<string, any[]> = {};
    for (const r of rejections || []) {
      if (!rejectionMap[r.product_id]) rejectionMap[r.product_id] = [];
      rejectionMap[r.product_id].push(r);
    }

    const insights: any[] = [];
    const completenessScores: any[] = [];
    const bundleCandidates: Record<string, string[]> = {};

    for (const p of products) {
      const title = p.optimized_title || p.original_title || "";
      const desc = p.optimized_description || "";
      const shortDesc = p.optimized_short_description || "";

      // SEO insights
      if (!p.meta_title || p.meta_title.length < 10) {
        insights.push({ workspace_id, product_id: p.id, insight_type: "seo_improvement", confidence: 90, priority: 80, insight_payload: { field: "meta_title", reason: "Meta título ausente ou muito curto" } });
      }
      if (!p.meta_description || p.meta_description.length < 50) {
        insights.push({ workspace_id, product_id: p.id, insight_type: "seo_improvement", confidence: 85, priority: 70, insight_payload: { field: "meta_description", reason: "Meta description ausente ou curta" } });
      }
      if (!p.seo_slug) {
        insights.push({ workspace_id, product_id: p.id, insight_type: "seo_improvement", confidence: 95, priority: 90, insight_payload: { field: "seo_slug", reason: "Slug SEO ausente" } });
      }
      if (title.length > 0 && title.length < 20) {
        insights.push({ workspace_id, product_id: p.id, insight_type: "title_optimization", confidence: 75, priority: 60, insight_payload: { current_length: title.length, reason: "Título muito curto para SEO" } });
      }
      if (desc.length < 100 && desc.length > 0) {
        insights.push({ workspace_id, product_id: p.id, insight_type: "description_improvement", confidence: 70, priority: 50, insight_payload: { current_length: desc.length, reason: "Descrição curta" } });
      }

      // Missing attributes
      const attrs = typeof p.attributes === "object" && p.attributes ? p.attributes : {};
      const schema = schemas?.find((s: any) => s.category_id === p.category_id) || schemas?.find((s: any) => !s.category_id);
      if (schema) {
        const required = schema.required_fields || [];
        const present = required.filter((f: string) => {
          if (f === "title") return !!title;
          if (f === "description") return !!desc;
          if (f === "price") return !!(p.optimized_price || p.original_price);
          if (f === "images") return p.image_urls?.length > 0;
          return !!(attrs as any)[f];
        });
        const missing = required.filter((f: string) => !present.includes(f));
        for (const m of missing) {
          insights.push({ workspace_id, product_id: p.id, insight_type: "missing_attribute", confidence: 95, priority: 85, insight_payload: { attribute: m, schema: schema.name } });
        }
        completenessScores.push({
          workspace_id, product_id: p.id, category_id: p.category_id,
          required_attributes: required.length, present_attributes: present.length,
          completeness_score: required.length > 0 ? Math.round((present.length / required.length) * 100) : 100,
        });
      }

      // Image quality
      if (!p.image_urls || p.image_urls.length === 0) {
        insights.push({ workspace_id, product_id: p.id, insight_type: "image_quality_issue", confidence: 95, priority: 90, insight_payload: { reason: "Produto sem imagens" } });
      }

      // Upsell/cross-sell opportunities
      if (!p.upsell_skus || (Array.isArray(p.upsell_skus) && p.upsell_skus.length === 0)) {
        insights.push({ workspace_id, product_id: p.id, insight_type: "upsell_opportunity", confidence: 60, priority: 40, insight_payload: { reason: "Sem upsells configurados" } });
      }
      if (!p.crosssell_skus || (Array.isArray(p.crosssell_skus) && p.crosssell_skus.length === 0)) {
        insights.push({ workspace_id, product_id: p.id, insight_type: "cross_sell_opportunity", confidence: 60, priority: 40, insight_payload: { reason: "Sem cross-sells configurados" } });
      }

      // Channel rejection risk
      if (rejectionMap[p.id]?.length) {
        insights.push({ workspace_id, product_id: p.id, insight_type: "channel_rejection_risk", confidence: 90, priority: 85, insight_payload: { rejections: rejectionMap[p.id].length, types: rejectionMap[p.id].map((r: any) => r.rejection_type) } });
      }

      // Bundle candidates by category
      if (p.category && p.product_type !== "variation") {
        if (!bundleCandidates[p.category]) bundleCandidates[p.category] = [];
        bundleCandidates[p.category].push(p.id);
      }
    }

    // Generate bundle suggestions for categories with 3+ products
    const bundles: any[] = [];
    for (const [cat, ids] of Object.entries(bundleCandidates)) {
      if (ids.length >= 3) {
        bundles.push({
          workspace_id, bundle_type: "starter_kit",
          primary_product_id: ids[0], suggested_products: ids.slice(1, 5),
          bundle_reason: `${ids.length} produtos na categoria "${cat}" podem formar kit`,
          confidence: 65,
        });
      }
    }

    // Batch insert insights
    if (insights.length > 0) {
      // Clear old open insights first
      await supabase.from("product_insights").delete().eq("workspace_id", workspace_id).eq("status", "open");
      const batchSize = 50;
      for (let i = 0; i < insights.length; i += batchSize) {
        await supabase.from("product_insights").insert(insights.slice(i, i + batchSize));
      }
    }

    // Insert completeness scores
    if (completenessScores.length > 0) {
      await supabase.from("attribute_completeness_scores").delete().eq("workspace_id", workspace_id);
      for (let i = 0; i < completenessScores.length; i += 50) {
        await supabase.from("attribute_completeness_scores").insert(completenessScores.slice(i, i + 50));
      }
    }

    // Insert bundles
    if (bundles.length > 0) {
      await supabase.from("bundle_suggestions").delete().eq("workspace_id", workspace_id).eq("accepted", false);
      await supabase.from("bundle_suggestions").insert(bundles);
    }

    // Use AI for SEO recommendations on top products (limited)
    const topProducts = products.filter(p => (p.seo_score || 0) < 60 && p.optimized_title).slice(0, 5);
    if (LOVABLE_API_KEY && topProducts.length > 0) {
      const productSummaries = topProducts.map(p => `SKU: ${p.sku}, Title: ${p.optimized_title || p.original_title}, Category: ${p.category || "N/A"}, Meta: ${p.meta_title || "N/A"}`).join("\n");

      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "You are an SEO expert for e-commerce product catalogs in the hospitality/HORECA industry. Return JSON array only." },
              { role: "user", content: `Analyze these products and suggest SEO improvements. Return a JSON array with objects: {sku, recommended_title, recommended_meta_description, recommended_keywords: string[], confidence: number}.\n\n${productSummaries}` }
            ],
            tools: [{
              type: "function",
              function: {
                name: "seo_recommendations",
                description: "Return SEO recommendations for products",
                parameters: {
                  type: "object",
                  properties: {
                    recommendations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          sku: { type: "string" },
                          recommended_title: { type: "string" },
                          recommended_meta_description: { type: "string" },
                          recommended_keywords: { type: "array", items: { type: "string" } },
                          confidence: { type: "number" }
                        },
                        required: ["sku", "recommended_title", "recommended_meta_description", "recommended_keywords", "confidence"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["recommendations"],
                  additionalProperties: false
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "seo_recommendations" } },
          }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall) {
            const parsed = JSON.parse(toolCall.function.arguments);
            const recs = parsed.recommendations || [];
            for (const rec of recs) {
              const product = topProducts.find(p => p.sku === rec.sku);
              if (product) {
                await supabase.from("seo_recommendations").insert({
                  workspace_id, product_id: product.id, locale: "pt-PT",
                  recommended_title: rec.recommended_title,
                  recommended_meta_description: rec.recommended_meta_description,
                  recommended_keywords: rec.recommended_keywords,
                  confidence: rec.confidence || 70,
                });
              }
            }
          }
        }
      } catch (aiErr) {
        console.error("AI SEO error:", aiErr);
      }
    }

    return new Response(JSON.stringify({
      insights_generated: insights.length,
      completeness_scored: completenessScores.length,
      bundles_suggested: bundles.length,
      seo_analyzed: topProducts.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
