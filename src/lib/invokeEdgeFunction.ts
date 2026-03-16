import { supabase } from "@/integrations/supabase/client";

/**
 * Wrapper normalizado para chamadas a Supabase Edge Functions.
 *
 * Normaliza os dois tipos de erro possíveis:
 * - `error`      — falha HTTP / de rede (lançado pelo cliente Supabase)
 * - `data.error` — erro de aplicação devolvido no corpo da resposta JSON
 *
 * Em caso de sucesso, devolve `data` tipado como `T`.
 * Em caso de falha, lança sempre um `Error` com mensagem legível.
 */
export async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  options?: { body?: unknown }
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, options);

  if (error) throw error;

  if (data?.error) {
    throw new Error(
      typeof data.error === "string" ? data.error : JSON.stringify(data.error)
    );
  }

  return data as T;
}
