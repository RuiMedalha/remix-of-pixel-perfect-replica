import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceContext } from "@/hooks/useWorkspaces";
import { toast } from "sonner";

export function usePdfExtractions() {
  const { activeWorkspace } = useWorkspaceContext();
  const workspaceId = activeWorkspace?.id;

  return useQuery({
    queryKey: ["pdf-extractions", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdf_extractions")
        .select("*, uploaded_files:file_id(file_name, file_type)")
        .eq("workspace_id", workspaceId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function usePdfPages(extractionId: string | null) {
  return useQuery({
    queryKey: ["pdf-pages", extractionId],
    enabled: !!extractionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdf_pages")
        .select("*")
        .eq("extraction_id", extractionId!)
        .order("page_number");
      if (error) throw error;
      return data;
    },
  });
}

export function usePdfTables(pageIds: string[]) {
  return useQuery({
    queryKey: ["pdf-tables", pageIds],
    enabled: pageIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdf_tables")
        .select("*, pdf_table_rows(*)")
        .in("page_id", pageIds)
        .order("table_index");
      if (error) throw error;
      return data;
    },
  });
}

export function useStartPdfExtraction() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspaceContext();

  return useMutation({
    mutationFn: async (fileId: string) => {
      // Create extraction record
      const { data: extraction, error: createErr } = await supabase
        .from("pdf_extractions")
        .insert({
          workspace_id: activeWorkspace!.id,
          file_id: fileId,
          status: "queued",
        })
        .select("id")
        .single();
      if (createErr) throw createErr;

      // Trigger extraction
      const { data, error } = await supabase.functions.invoke("extract-pdf-pages", {
        body: { extractionId: extraction.id },
      });
      if (error) throw error;
      return { ...data, extractionId: extraction.id };
    },
    onSuccess: () => {
      toast.success("Extração PDF iniciada");
      queryClient.invalidateQueries({ queryKey: ["pdf-extractions"] });
    },
    onError: (e: Error) => toast.error("Erro na extração: " + e.message),
  });
}

export function useVisionParsePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pageId: string) => {
      const { data, error } = await supabase.functions.invoke("vision-parse-pdf", {
        body: { pageId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Análise visual concluída");
      queryClient.invalidateQueries({ queryKey: ["pdf-pages"] });
      queryClient.invalidateQueries({ queryKey: ["pdf-tables"] });
    },
    onError: (e: Error) => toast.error("Erro na análise: " + e.message),
  });
}

export function useMapPdfToProducts() {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();

  return useMutation({
    mutationFn: async ({ extractionId, sendToIngestion }: { extractionId: string; sendToIngestion?: boolean }) => {
      const { data, error } = await supabase.functions.invoke("map-pdf-to-products", {
        body: { extractionId, sendToIngestion, workspaceId: currentWorkspace?.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.rowsMapped} linhas mapeadas${data.sentToIngestion ? " e enviadas para ingestão" : ""}`);
      queryClient.invalidateQueries({ queryKey: ["pdf-extractions"] });
      queryClient.invalidateQueries({ queryKey: ["ingestion-jobs"] });
    },
    onError: (e: Error) => toast.error("Erro no mapeamento: " + e.message),
  });
}
