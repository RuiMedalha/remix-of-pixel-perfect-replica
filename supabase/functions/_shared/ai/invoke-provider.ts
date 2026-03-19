// supabase/functions/_shared/ai/invoke-provider.ts
import type { InvokeParams, InvokeResult } from "./provider-types.ts";
import { classifyError, classifyNetworkError } from "./error-classifier.ts";

const TIMEOUT_MS = 30_000; // 30s per spec. If Phase 3 vision tasks need longer, increase here only.

export async function invokeProvider(params: InvokeParams): Promise<InvokeResult> {
  switch (params.provider.format) {
    case "openai_compatible": return await invokeOpenAICompatible(params);
    case "anthropic":         return await invokeAnthropic(params);
    case "gemini":            return await invokeGemini(params);
    default: throw new ProviderError(
      `Unknown provider format: ${(params.provider as { format: string }).format}`,
      "invalid_request",
    );
  }
}

// ─── Adapter 1: OpenAI-compatible (OpenAI, Mistral, Perplexity, DeepSeek, Grok) ───

async function invokeOpenAICompatible(params: InvokeParams): Promise<InvokeResult> {
  const apiKey = Deno.env.get(params.provider.apiKeyEnvVar);
  if (!apiKey) {
    throw new ProviderError(`Missing env var: ${params.provider.apiKeyEnvVar}`, "auth_error");
  }

  const messages = buildMessages(params);
  const body: Record<string, unknown> = {
    model: params.model,
    messages,
    ...(params.temperature != null ? { temperature: params.temperature } : {}),
    ...(params.maxTokens != null ? { max_tokens: params.maxTokens } : {}),
    ...(params.jsonMode ? { response_format: { type: "json_object" } } : {}),
    ...(params.tools?.length ? { tools: params.tools, tool_choice: params.toolChoice ?? "auto" } : {}),
  };

  const startMs = Date.now();
  let resp: Response;
  try {
    resp = await fetchWithTimeout(params.provider.apiBaseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new ProviderError("Network error", classifyNetworkError(err));
  }

  const latencyMs = Date.now() - startMs;

  if (!resp.ok) {
    const text = await resp.text();
    throw new ProviderError(
      `${params.provider.id} ${resp.status}: ${text}`,
      classifyError(resp.status, text, params.provider.id),
    );
  }

  let raw: Record<string, unknown>;
  try {
    raw = await resp.json() as Record<string, unknown>;
  } catch {
    throw new ProviderError("Failed to parse response JSON", "parse_error");
  }

  const choice = (raw.choices as Array<Record<string, unknown>>)?.[0];
  const message = choice?.message as Record<string, unknown> | undefined;
  const content = (message?.content as string) ?? "";
  const finishReason = normalizeFinishReason(choice?.finish_reason as string);
  const usage = raw.usage as Record<string, number> | undefined;

  return {
    content,
    finishReason,
    inputTokens: usage?.prompt_tokens ?? 0,
    outputTokens: usage?.completion_tokens ?? 0,
    provider: params.provider.id,
    model: params.model,
    latencyMs,
    rawResponse: raw,
    normalizedResponse: {
      choices: [{
        message: {
          role: "assistant",
          content,
          tool_calls: message?.tool_calls as unknown[] | undefined,
        },
        finish_reason: finishReason,
      }],
      usage: {
        prompt_tokens: usage?.prompt_tokens ?? 0,
        completion_tokens: usage?.completion_tokens ?? 0,
        total_tokens: usage?.total_tokens ?? 0,
      },
      model: (raw.model as string) ?? params.model,
    },
  };
}

// ─── Adapter 2: Anthropic native ───

async function invokeAnthropic(params: InvokeParams): Promise<InvokeResult> {
  const apiKey = Deno.env.get(params.provider.apiKeyEnvVar);
  if (!apiKey) {
    throw new ProviderError(`Missing env var: ${params.provider.apiKeyEnvVar}`, "auth_error");
  }

  const userMessages = params.messages.filter((m) => m.role !== "system");
  const body: Record<string, unknown> = {
    model: params.model,
    max_tokens: params.maxTokens ?? 4096,
    ...(params.systemPrompt ? { system: params.systemPrompt } : {}),
    messages: userMessages,
    ...(params.temperature != null ? { temperature: params.temperature } : {}),
    ...(params.tools?.length ? { tools: params.tools, tool_choice: params.toolChoice } : {}),
  };

  const startMs = Date.now();
  let resp: Response;
  try {
    resp = await fetchWithTimeout(params.provider.apiBaseUrl, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new ProviderError("Network error", classifyNetworkError(err));
  }

  const latencyMs = Date.now() - startMs;

  if (!resp.ok) {
    const text = await resp.text();
    throw new ProviderError(
      `anthropic ${resp.status}: ${text}`,
      classifyError(resp.status, text, "anthropic"),
    );
  }

  let raw: Record<string, unknown>;
  try {
    raw = await resp.json() as Record<string, unknown>;
  } catch {
    throw new ProviderError("Failed to parse Anthropic response", "parse_error");
  }

  const contentBlocks = raw.content as Array<{ type: string; text?: string }> | undefined;
  const content = contentBlocks?.find((b) => b.type === "text")?.text ?? "";
  const finishReason = normalizeFinishReason(raw.stop_reason as string);
  const usage = raw.usage as { input_tokens: number; output_tokens: number } | undefined;
  const inputTokens = usage?.input_tokens ?? 0;
  const outputTokens = usage?.output_tokens ?? 0;

  return {
    content,
    finishReason,
    inputTokens,
    outputTokens,
    provider: params.provider.id,
    model: params.model,
    latencyMs,
    rawResponse: raw,
    normalizedResponse: {
      choices: [{ message: { role: "assistant", content }, finish_reason: finishReason }],
      usage: {
        prompt_tokens: inputTokens,
        completion_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
      },
      model: params.model,
    },
  };
}

// ─── Adapter 3: Gemini native ───

async function invokeGemini(params: InvokeParams): Promise<InvokeResult> {
  const apiKey = Deno.env.get(params.provider.apiKeyEnvVar);
  if (!apiKey) {
    throw new ProviderError(`Missing env var: ${params.provider.apiKeyEnvVar}`, "auth_error");
  }

  const url = `${params.provider.apiBaseUrl}/models/${params.model}:generateContent?key=${apiKey}`;

  const contents = params.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const body: Record<string, unknown> = {
    contents,
    ...(params.systemPrompt
      ? { systemInstruction: { parts: [{ text: params.systemPrompt }] } }
      : {}),
    generationConfig: {
      ...(params.temperature != null ? { temperature: params.temperature } : {}),
      ...(params.maxTokens != null ? { maxOutputTokens: params.maxTokens } : {}),
      ...(params.jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };

  const startMs = Date.now();
  let resp: Response;
  try {
    resp = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new ProviderError("Network error", classifyNetworkError(err));
  }

  const latencyMs = Date.now() - startMs;

  if (!resp.ok) {
    const text = await resp.text();
    throw new ProviderError(
      `gemini ${resp.status}: ${text}`,
      classifyError(resp.status, text, "gemini"),
    );
  }

  let raw: Record<string, unknown>;
  try {
    raw = await resp.json() as Record<string, unknown>;
  } catch {
    throw new ProviderError("Failed to parse Gemini response", "parse_error");
  }

  const candidates = raw.candidates as Array<Record<string, unknown>> | undefined;
  const firstCandidate = candidates?.[0];
  const parts = (firstCandidate?.content as Record<string, unknown>)?.parts as
    | Array<{ text?: string }>
    | undefined;
  const content = parts?.map((p) => p.text ?? "").join("") ?? "";
  const finishReason = normalizeFinishReason(firstCandidate?.finishReason as string);
  const usageMeta = raw.usageMetadata as
    | { promptTokenCount?: number; candidatesTokenCount?: number }
    | undefined;

  return {
    content,
    finishReason,
    inputTokens: usageMeta?.promptTokenCount ?? 0,
    outputTokens: usageMeta?.candidatesTokenCount ?? 0,
    provider: params.provider.id,
    model: params.model,
    latencyMs,
    rawResponse: raw,
    normalizedResponse: {
      choices: [{ message: { role: "assistant", content }, finish_reason: finishReason }],
      usage: {
        prompt_tokens: usageMeta?.promptTokenCount ?? 0,
        completion_tokens: usageMeta?.candidatesTokenCount ?? 0,
        total_tokens:
          (usageMeta?.promptTokenCount ?? 0) + (usageMeta?.candidatesTokenCount ?? 0),
      },
      model: params.model,
    },
  };
}

// ─── Helpers ───

function buildMessages(
  params: InvokeParams,
): Array<{ role: string; content: string }> {
  const out: Array<{ role: string; content: string }> = [];
  if (params.systemPrompt) out.push({ role: "system", content: params.systemPrompt });
  out.push(...params.messages.filter((m) => m.role !== "system"));
  return out;
}

function normalizeFinishReason(raw: string | undefined): InvokeResult["finishReason"] {
  if (!raw) return "unknown";
  const lower = raw.toLowerCase();
  if (lower === "stop" || lower === "end_turn") return "stop";
  if (lower === "length" || lower === "max_tokens") return "length";
  if (lower === "tool_use" || lower === "tool_calls") return "tool_calls";
  if (lower.includes("safety") || lower.includes("filter") || lower === "recitation") {
    return "content_filter";
  }
  return "unknown";
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export class ProviderError extends Error {
  category: import("./provider-types.ts").ErrorCategory;
  constructor(message: string, category: import("./provider-types.ts").ErrorCategory) {
    super(message);
    this.category = category;
    this.name = "ProviderError";
  }
}
