// supabase/functions/resolve-ai-route/index.ts
// Thin HTTP wrapper (~80 lines). All AI logic lives in _shared/ai/.
// HTTP contract is identical to the previous implementation (backward compatible).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runPrompt } from "../_shared/ai/prompt-runner.ts";
import { mapTaskTypeToCapability } from "../_shared/ai/capability-matrix.ts";
import { toLegacyResponse } from "./legacy-compat.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { taskType, workspaceId, messages, systemPrompt, options, modelOverride } =
      await req.json();
    if (!taskType || !workspaceId) throw new Error("taskType and workspaceId required");

    // Resolve system prompt from prompt_templates/prompt_versions if a routing rule
    // specifies one. This is existing logic extracted from the old resolve-ai-route.
    const resolvedPrompt = await resolvePromptTemplate(
      supabase,
      workspaceId,
      taskType,
      systemPrompt,
    );

    const { result, meta } = await runPrompt(supabase, {
      workspaceId,
      capability: mapTaskTypeToCapability(taskType),
      taskType,
      systemPrompt: resolvedPrompt,
      messages,
      temperature: options?.temperature,
      maxTokens: options?.max_tokens,
      jsonMode: !!options?.response_format,
      modelOverride,
      tools: options?.tools,
      toolChoice: options?.tool_choice,
    });

    return new Response(
      JSON.stringify({
        result: toLegacyResponse(result),
        meta: {
          usedProvider: meta.provider,
          usedModel: meta.model,
          fallbackUsed: meta.fallbackUsed,
          latencyMs: meta.latencyMs,
          taskType,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Resolves the system prompt via prompt_templates / prompt_versions.
// Precedence: active prompt_version > base_prompt from template > caller's systemPrompt.
// Extracted verbatim from the old resolve-ai-route — no new logic.
async function resolvePromptTemplate(
  supabase: ReturnType<typeof createClient>,
  workspaceId: string,
  taskType: string,
  fallbackPrompt: string,
): Promise<string> {
  try {
    const { data: rule } = await supabase
      .from("ai_routing_rules")
      .select("prompt_template_id, prompt:prompt_template_id(base_prompt)")
      .eq("workspace_id", workspaceId)
      .eq("task_type", taskType)
      .eq("is_active", true)
      .single();

    if (rule?.prompt_template_id) {
      const { data: version } = await supabase
        .from("prompt_versions")
        .select("prompt_text")
        .eq("template_id", rule.prompt_template_id)
        .eq("is_active", true)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (version?.prompt_text) return version.prompt_text;

      const basePrompt = (rule.prompt as { base_prompt?: string } | null)?.base_prompt;
      if (basePrompt) return basePrompt;
    }
  } catch { /* no rule or template — use caller's prompt */ }

  return fallbackPrompt || "";
}
