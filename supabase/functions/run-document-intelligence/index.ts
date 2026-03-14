import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProviderConfig {
  id: string;
  provider_name: string;
  provider_type: string;
  default_model: string | null;
  priority_order: number;
  supports_vision: boolean;
  timeout_seconds: number;
  config: Record<string, any>;
}

async function callProvider(
  provider: ProviderConfig,
  text: string,
  lovableKey: string,
): Promise<{ success: boolean; result: any; model: string; error?: string }> {
  const model = provider.default_model || "google/gemini-2.5-flash";

  const aiPrompt = `Analyze this PDF page text. Extract ALL tables with semantic column classification (sku, title, price, description, dimensions, capacity, material, weight, unknown). Classify table type (product_table, technical_specs, pricing_table, accessories). Detect zones, sections, language and supplier.

Text:
${text.substring(0, 12000)}`;

  let apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (provider.provider_type === "lovable_gateway") {
    headers["Authorization"] = `Bearer ${lovableKey}`;
  } else if (provider.provider_type === "gemini_direct") {
    const apiKey = provider.config?.api_key;
    if (!apiKey) return { success: false, result: null, model, error: "No API key configured" };
    apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    // For direct Gemini, use different format
    try {
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: aiPrompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        return { success: false, result: null, model, error: `Gemini API ${resp.status}: ${errText.substring(0, 200)}` };
      }
      const data = await resp.json();
      const text2 = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      return { success: true, result: JSON.parse(text2), model };
    } catch (e) {
      return { success: false, result: null, model, error: e.message };
    }
  } else if (provider.provider_type === "openai_direct") {
    const apiKey = provider.config?.api_key;
    if (!apiKey) return { success: false, result: null, model, error: "No API key configured" };
    apiUrl = "https://api.openai.com/v1/chat/completions";
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  // Default: Lovable Gateway or OpenAI-compatible
  headers["Authorization"] = headers["Authorization"] || `Bearer ${lovableKey}`;

  try {
    const resp = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a PDF data extraction expert. Extract tables with semantic column classification and confidence scores. Return JSON." },
          { role: "user", content: aiPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return { success: false, result: null, model, error: `API ${resp.status}: ${errText.substring(0, 200)}` };
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    return { success: true, result: JSON.parse(content), model };
  } catch (e) {
    return { success: false, result: null, model, error: e.message };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceKey);

    const { extractionId, pageId, mode, manualProvider } = await req.json();
    if (!extractionId && !pageId) throw new Error("extractionId or pageId required");

    // Determine workspace
    let workspaceId: string;
    let targetPageIds: string[] = [];

    if (pageId) {
      const { data: page } = await supabase
        .from("pdf_pages")
        .select("id, extraction_id, pdf_extractions:extraction_id(workspace_id)")
        .eq("id", pageId)
        .single();
      if (!page) throw new Error("Page not found");
      workspaceId = (page as any).pdf_extractions?.workspace_id;
      targetPageIds = [pageId];
    } else {
      const { data: ext } = await supabase
        .from("pdf_extractions")
        .select("workspace_id")
        .eq("id", extractionId)
        .single();
      if (!ext) throw new Error("Extraction not found");
      workspaceId = ext.workspace_id;
      const { data: pages } = await supabase
        .from("pdf_pages")
        .select("id")
        .eq("extraction_id", extractionId);
      targetPageIds = (pages || []).map((p: any) => p.id);
    }

    // Get providers sorted by priority
    const { data: providers } = await supabase
      .from("document_ai_providers")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("is_active", true)
      .order("priority_order");

    let activeProviders: ProviderConfig[] = (providers || []) as any[];

    // If no providers configured, use default Lovable Gateway
    if (activeProviders.length === 0) {
      activeProviders = [{
        id: "default",
        provider_name: "Lovable AI Gateway",
        provider_type: "lovable_gateway",
        default_model: "google/gemini-2.5-flash",
        priority_order: 1,
        supports_vision: true,
        timeout_seconds: 120,
        config: {},
      }];
    }

    // Mode selection
    const selectedMode = mode || "auto";
    if (selectedMode === "manual" && manualProvider) {
      activeProviders = activeProviders.filter(p => p.provider_type === manualProvider);
      if (activeProviders.length === 0) {
        throw new Error(`Provider ${manualProvider} not found or not active`);
      }
    } else if (selectedMode === "cost_optimized") {
      activeProviders.sort((a, b) => (a.config?.cost_rank || 99) - (b.config?.cost_rank || 99));
    } else if (selectedMode === "quality_optimized") {
      activeProviders.sort((a, b) => (a.config?.quality_rank || 99) - (b.config?.quality_rank || 99));
    } else if (selectedMode === "fast") {
      activeProviders.sort((a, b) => a.timeout_seconds - b.timeout_seconds);
    }

    let usedProvider = activeProviders[0];
    let fallbackUsed = false;
    let fallbackProvider: string | null = null;
    let totalProcessed = 0;

    // Process each page
    for (const pid of targetPageIds) {
      const { data: page } = await supabase.from("pdf_pages").select("raw_text").eq("id", pid).single();
      if (!page?.raw_text) continue;

      let result: any = null;
      let usedModel = "";

      // Try providers in order (fallback chain)
      for (const provider of activeProviders) {
        const res = await callProvider(provider, page.raw_text, lovableKey);
        if (res.success) {
          result = res.result;
          usedModel = res.model;
          if (provider.id !== usedProvider.id) {
            fallbackUsed = true;
            fallbackProvider = provider.provider_name;
          }
          usedProvider = provider;
          break;
        }
        console.warn(`Provider ${provider.provider_name} failed: ${res.error}`);
      }

      if (result) {
        await supabase.from("pdf_pages").update({
          vision_result: result,
          page_context: { ...result.page_context, provider: usedProvider.provider_name, model: usedModel },
          confidence_score: result.confidence || 70,
        }).eq("id", pid);
        totalProcessed++;
      }
    }

    // Update extraction metadata
    const updateData: any = {
      provider_used: usedProvider.provider_name,
      provider_model: usedProvider.default_model,
      extraction_mode: selectedMode,
      fallback_used: fallbackUsed,
      fallback_provider: fallbackProvider,
    };

    if (extractionId) {
      await supabase.from("pdf_extractions").update(updateData).eq("id", extractionId);
    } else if (targetPageIds.length > 0) {
      const { data: pg } = await supabase.from("pdf_pages").select("extraction_id").eq("id", targetPageIds[0]).single();
      if (pg) await supabase.from("pdf_extractions").update(updateData).eq("id", pg.extraction_id);
    }

    return new Response(JSON.stringify({
      success: true,
      pagesProcessed: totalProcessed,
      provider: usedProvider.provider_name,
      model: usedProvider.default_model,
      mode: selectedMode,
      fallbackUsed,
      fallbackProvider,
      processingTimeMs: Date.now() - startTime,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("run-document-intelligence error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
