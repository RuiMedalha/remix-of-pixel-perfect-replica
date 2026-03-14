import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { taskType, workspaceId, messages, systemPrompt, options } = await req.json();
    if (!taskType || !workspaceId) throw new Error("taskType and workspaceId required");

    // 1. Resolve routing rule
    const { data: route } = await supabase
      .from("ai_routing_rules")
      .select("*, provider:provider_id(*), fallback_provider:fallback_provider_id(*), prompt:prompt_template_id(*)")
      .eq("workspace_id", workspaceId)
      .eq("task_type", taskType)
      .eq("is_active", true)
      .single();

    // 2. Resolve provider (from route or first active)
    let provider = route?.provider;
    let model = route?.model_override || route?.recommended_model || provider?.default_model;
    let prompt = route?.prompt?.content || systemPrompt || "";

    if (!provider) {
      const { data: defaultProvider } = await supabase
        .from("ai_providers")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("is_active", true)
        .order("priority_order")
        .limit(1)
        .single();
      provider = defaultProvider;
      if (!model && provider) model = provider.default_model;
    }

    if (!provider) {
      // Ultimate fallback: use Lovable Gateway directly
      provider = { provider_type: "lovable_gateway", default_model: "google/gemini-3-flash-preview" };
      model = model || "google/gemini-3-flash-preview";
    }

    // 3. Build messages
    const finalMessages = [
      ...(prompt ? [{ role: "system", content: prompt }] : []),
      ...(messages || []),
    ];

    // 4. Execute with provider
    const startMs = Date.now();
    let result: any = null;
    let usedProvider = provider.provider_type;
    let usedModel = model;
    let fallbackUsed = false;

    const executeCall = async (prov: any, mod: string) => {
      if (prov.provider_type === "lovable_gateway") {
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: mod,
            messages: finalMessages,
            ...(options?.tools ? { tools: options.tools, tool_choice: options.tool_choice } : {}),
            ...(options?.max_tokens ? { max_tokens: options.max_tokens } : {}),
          }),
        });
        if (!resp.ok) {
          const t = await resp.text();
          throw new Error(`Gateway ${resp.status}: ${t}`);
        }
        return await resp.json();
      } else if (prov.provider_type === "openai_direct") {
        const apiKey = prov.config?.api_key;
        if (!apiKey) throw new Error("OpenAI API key missing");
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: mod, messages: finalMessages, ...(options || {}) }),
        });
        if (!resp.ok) throw new Error(`OpenAI ${resp.status}: ${await resp.text()}`);
        return await resp.json();
      } else if (prov.provider_type === "gemini_direct") {
        const apiKey = prov.config?.api_key;
        if (!apiKey) throw new Error("Gemini API key missing");
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${mod}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: finalMessages
                .filter((m: any) => m.role !== "system")
                .map((m: any) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
              systemInstruction: prompt ? { parts: [{ text: prompt }] } : undefined,
            }),
          }
        );
        if (!resp.ok) throw new Error(`Gemini ${resp.status}: ${await resp.text()}`);
        const gResult = await resp.json();
        // Normalize to OpenAI format
        return {
          choices: [{
            message: {
              role: "assistant",
              content: gResult.candidates?.[0]?.content?.parts?.[0]?.text || "",
            },
          }],
        };
      } else if (prov.provider_type === "anthropic_direct") {
        const apiKey = prov.config?.api_key;
        if (!apiKey) throw new Error("Anthropic API key missing");
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: mod,
            max_tokens: options?.max_tokens || 4096,
            system: prompt || undefined,
            messages: finalMessages.filter((m: any) => m.role !== "system"),
          }),
        });
        if (!resp.ok) throw new Error(`Anthropic ${resp.status}: ${await resp.text()}`);
        const aResult = await resp.json();
        return {
          choices: [{
            message: {
              role: "assistant",
              content: aResult.content?.[0]?.text || "",
            },
          }],
        };
      }
      throw new Error(`Unsupported provider type: ${prov.provider_type}`);
    };

    try {
      result = await executeCall(provider, model || provider.default_model || "google/gemini-3-flash-preview");
    } catch (primaryErr: any) {
      console.warn("Primary provider failed:", primaryErr.message);
      // Try fallback
      const fbProvider = route?.fallback_provider || null;
      const fbModel = route?.fallback_model || provider?.fallback_model;
      if (fbProvider) {
        try {
          result = await executeCall(fbProvider, fbModel || fbProvider.default_model);
          usedProvider = fbProvider.provider_type;
          usedModel = fbModel || fbProvider.default_model;
          fallbackUsed = true;
        } catch (fbErr: any) {
          // Last resort: Lovable Gateway
          try {
            result = await executeCall(
              { provider_type: "lovable_gateway" },
              "google/gemini-3-flash-preview"
            );
            usedProvider = "lovable_gateway";
            usedModel = "google/gemini-3-flash-preview";
            fallbackUsed = true;
          } catch (lastErr: any) {
            throw new Error(`All providers failed. Last: ${lastErr.message}`);
          }
        }
      } else {
        // Direct Lovable fallback
        try {
          result = await executeCall(
            { provider_type: "lovable_gateway" },
            "google/gemini-3-flash-preview"
          );
          usedProvider = "lovable_gateway";
          usedModel = "google/gemini-3-flash-preview";
          fallbackUsed = true;
        } catch (lastErr: any) {
          throw new Error(`All providers failed. Last: ${lastErr.message}`);
        }
      }
    }

    const latencyMs = Date.now() - startMs;

    // 5. Log usage
    await supabase.from("ai_usage_logs").insert({
      workspace_id: workspaceId,
      model_name: usedModel,
      input_tokens: result?.usage?.prompt_tokens || 0,
      output_tokens: result?.usage?.completion_tokens || 0,
      estimated_cost: 0,
    });

    return new Response(JSON.stringify({
      result,
      meta: { usedProvider, usedModel, fallbackUsed, latencyMs, taskType },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
