// supabase/functions/_shared/ai/provider-registry.ts
// Resolves full ResolvedRoute from workspace + capability context.
// INVARIANT: never reads api_key from DB. All keys come from Deno.env.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { ProviderConfig, ResolvedRoute, RunPromptParams } from "./provider-types.ts";
import { CAPABILITY_DEFAULTS } from "./capability-matrix.ts";

// Static provider configs — source of truth for API metadata.
// DB (ai_provider_registry) provides enable/priority overrides but never API keys.
const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  anthropic: {
    id: "anthropic", displayName: "Anthropic", format: "anthropic",
    apiBaseUrl: "https://api.anthropic.com/v1/messages", apiKeyEnvVar: "ANTHROPIC_API_KEY",
    authScheme: "x-api-key", enabled: true, isLegacy: false, priority: 1,
  },
  openai: {
    id: "openai", displayName: "OpenAI", format: "openai_compatible",
    apiBaseUrl: "https://api.openai.com/v1/chat/completions", apiKeyEnvVar: "OPENAI_API_KEY",
    authScheme: "bearer", enabled: true, isLegacy: false, priority: 2,
  },
  gemini: {
    id: "gemini", displayName: "Gemini", format: "gemini",
    apiBaseUrl: "https://generativelanguage.googleapis.com/v1beta", apiKeyEnvVar: "GEMINI_API_KEY",
    authScheme: "query_param", enabled: true, isLegacy: false, priority: 3,
  },
  mistral: {
    id: "mistral", displayName: "Mistral", format: "openai_compatible",
    apiBaseUrl: "https://api.mistral.ai/v1/chat/completions", apiKeyEnvVar: "MISTRAL_API_KEY",
    authScheme: "bearer", enabled: false, isLegacy: false, priority: 10,
  },
  perplexity: {
    id: "perplexity", displayName: "Perplexity", format: "openai_compatible",
    apiBaseUrl: "https://api.perplexity.ai/chat/completions", apiKeyEnvVar: "PERPLEXITY_API_KEY",
    authScheme: "bearer", enabled: false, isLegacy: false, priority: 11,
  },
  deepseek: {
    id: "deepseek", displayName: "DeepSeek", format: "openai_compatible",
    apiBaseUrl: "https://api.deepseek.com/v1/chat/completions", apiKeyEnvVar: "DEEPSEEK_API_KEY",
    authScheme: "bearer", enabled: false, isLegacy: false, priority: 12,
  },
  grok: {
    id: "grok", displayName: "Grok", format: "openai_compatible",
    apiBaseUrl: "https://api.x.ai/v1/chat/completions", apiKeyEnvVar: "GROK_API_KEY",
    authScheme: "bearer", enabled: false, isLegacy: false, priority: 13,
  },
  lovable_gateway: {
    id: "lovable_gateway", displayName: "Lovable Gateway", format: "openai_compatible",
    apiBaseUrl: "https://ai.gateway.lovable.dev/v1/chat/completions", apiKeyEnvVar: "LOVABLE_API_KEY",
    authScheme: "bearer", enabled: false, isLegacy: true, priority: 99,
  },
};

function getProvider(id: string): ProviderConfig | null {
  return PROVIDER_CONFIGS[id] ?? null;
}

function isKeyAvailable(provider: ProviderConfig): boolean {
  return !!Deno.env.get(provider.apiKeyEnvVar);
}

function buildChain(
  primaryProvider: ProviderConfig,
  primaryModel: string,
  fallbackSpecs: Array<{ provider: string; model: string }>,
): Array<{ provider: ProviderConfig; model: string }> {
  const chain: Array<{ provider: ProviderConfig; model: string }> = [];

  if (isKeyAvailable(primaryProvider)) {
    chain.push({ provider: primaryProvider, model: primaryModel });
  } else {
    console.warn(`[provider-registry] Key not available for ${primaryProvider.id} — skipping`);
  }

  for (const fb of fallbackSpecs) {
    const p = getProvider(fb.provider);
    if (!p) continue;
    if (isKeyAvailable(p)) {
      chain.push({ provider: p, model: fb.model });
    } else {
      console.warn(`[provider-registry] Key not available for fallback ${p.id} — skipping`);
    }
  }

  return chain;
}

function getDefaultModelForProvider(providerId: string): string {
  const defaults: Record<string, string> = {
    anthropic: "claude-sonnet-4-6",
    openai: "gpt-4o",
    gemini: "gemini-2.5-pro",
    mistral: "mistral-large-latest",
    perplexity: "sonar-pro",
    deepseek: "deepseek-chat",
    grok: "grok-2",
  };
  return defaults[providerId] ?? "gpt-4o";
}

function getCapabilityFallbacks(
  capability: string,
): Array<{ provider: string; model: string }> {
  return CAPABILITY_DEFAULTS[capability as keyof typeof CAPABILITY_DEFAULTS]?.fallback ?? [
    { provider: "openai", model: "gpt-4o" },
    { provider: "gemini", model: "gemini-2.5-pro" },
  ];
}

export async function resolveRoute(
  supabase: SupabaseClient,
  params: RunPromptParams,
): Promise<ResolvedRoute> {
  const { workspaceId, capability, taskType, providerOverride, modelOverride } = params;

<<<<<<< ours
=======
  // Product optimization policy (production safety):
  // primary gemini, fallback openai -> anthropic.
  if (taskType === "product_optimization") {
    const gemini = getProvider("gemini");
    if (gemini) {
      const primaryModel = modelOverride && isModelCompatibleWithProvider(modelOverride, "gemini")
        ? modelOverride
        : getDefaultModelForProvider("gemini");
      if (modelOverride && !isModelCompatibleWithProvider(modelOverride, "gemini")) {
        console.warn(
          `[provider-registry] product_optimization override "${modelOverride}" is not compatible with gemini; using ${primaryModel}`,
        );
      }
      const chain = buildChain(gemini, primaryModel, [
        { provider: "openai", model: getDefaultModelForProvider("openai") },
        { provider: "anthropic", model: getDefaultModelForProvider("anthropic") },
      ]);
      if (chain.length > 0) {
        console.log(
          `[provider-registry] product_optimization deterministic chain: ${chain.map((c) => `${c.provider.id}/${c.model}`).join(" -> ")}`,
        );
        return {
          selectedProvider: chain[0].provider,
          selectedModel: chain[0].model,
          fallbackChain: chain.slice(1),
          finalParams: {},
          decisionSource: "capability_default",
        };
      }
    }
  }

>>>>>>> theirs
  // 1. ai_routing_rules (workspace + task_type) — highest precedence
  if (taskType) {
    try {
      const { data: rule } = await supabase
        .from("ai_routing_rules")
        .select("provider_id, model_override, fallback_provider_id, fallback_model")
        .eq("workspace_id", workspaceId)
        .eq("task_type", taskType)
        .eq("is_active", true)
        .single();

      if (rule?.provider_id) {
        const p = getProvider(rule.provider_id as string);
        const model = modelOverride ??
          (rule.model_override as string | null) ??
          getDefaultModelForProvider(rule.provider_id as string);
        const fbProviderId = rule.fallback_provider_id as string | null;
        const fbModel = (rule.fallback_model as string | null) ??
          (fbProviderId ? getDefaultModelForProvider(fbProviderId) : undefined);

        if (p) {
          const extraFallbacks: Array<{ provider: string; model: string }> = [];
          if (fbProviderId && fbModel) extraFallbacks.push({ provider: fbProviderId, model: fbModel });
          extraFallbacks.push(...getCapabilityFallbacks(capability));

          const chain = buildChain(p, model, extraFallbacks);
          if (chain.length > 0) {
            return {
              selectedProvider: chain[0].provider,
              selectedModel: chain[0].model,
              fallbackChain: chain.slice(1),
              finalParams: {},
              decisionSource: "routing_rule",
            };
          }
        }
      }
    } catch { /* no matching rule — continue to next level */ }
  }

  // 2. workspace_ai_preferences (specific capability)
  // 3. workspace_ai_preferences ('*' global default)
  for (const cap of [capability, "*"]) {
    try {
      const { data: pref } = await supabase
        .from("workspace_ai_preferences")
        .select(
          "provider_id, model_id, fallback_provider_id, fallback_model_id, temperature, max_tokens, json_mode",
        )
        .eq("workspace_id", workspaceId)
        .eq("capability", cap)
        .eq("enabled", true)
        .single();

      if (pref?.provider_id) {
        const p = getProvider(pref.provider_id as string);
        const model = modelOverride ??
          (pref.model_id as string | null) ??
          getDefaultModelForProvider(pref.provider_id as string);

        if (p && model) {
          const chain = buildChain(p, model, getCapabilityFallbacks(capability));
          if (chain.length > 0) {
            return {
              selectedProvider: chain[0].provider,
              selectedModel: chain[0].model,
              fallbackChain: chain.slice(1),
              finalParams: {
                temperature: (pref.temperature as number | null) ?? undefined,
                maxTokens: (pref.max_tokens as number | null) ?? undefined,
                jsonMode: (pref.json_mode as boolean | null) ?? undefined,
              },
              decisionSource: "workspace_preference",
            };
          }
        }
      }
    } catch { /* no preference — continue */ }
  }

  // 4. CAPABILITY_DEFAULTS (static capability matrix)
  const defaults = CAPABILITY_DEFAULTS[capability as keyof typeof CAPABILITY_DEFAULTS];
  if (defaults) {
    const overrideProvider = providerOverride ? getProvider(providerOverride) : null;
    const primaryProvider = overrideProvider ?? getProvider(defaults.provider)!;
    const primaryModel = modelOverride ??
      (overrideProvider ? getDefaultModelForProvider(providerOverride!) : defaults.model);

    const chain = buildChain(primaryProvider, primaryModel, defaults.fallback);
    if (chain.length > 0) {
      return {
        selectedProvider: chain[0].provider,
        selectedModel: chain[0].model,
        fallbackChain: chain.slice(1),
        finalParams: {},
        decisionSource: "capability_default",
      };
    }
  }

  // 5. System default: Anthropic → OpenAI → Gemini
  const systemChain = buildChain(
    PROVIDER_CONFIGS["anthropic"]!,
    "claude-sonnet-4-6",
    [{ provider: "openai", model: "gpt-4o" }, { provider: "gemini", model: "gemini-2.5-pro" }],
  );

  if (systemChain.length === 0) {
    throw new Error(
      "No AI providers available — add ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY to Supabase secrets",
    );
  }

  return {
    selectedProvider: systemChain[0].provider,
    selectedModel: systemChain[0].model,
    fallbackChain: systemChain.slice(1),
    finalParams: {},
    decisionSource: "system_default",
  };
}
