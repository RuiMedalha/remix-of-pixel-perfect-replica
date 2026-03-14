import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceContext } from "@/hooks/useWorkspaces";
import { toast } from "sonner";

export function usePlaybookEngine() {
  const { activeWorkspace } = useWorkspaceContext();
  const wsId = activeWorkspace?.id;
  const qc = useQueryClient();

  const detections = useQuery({
    queryKey: ["supplier-auto-detections", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("supplier_auto_detections") as any)
        .select("*").eq("workspace_id", wsId).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data as any[];
    },
  });

  const inferences = useQuery({
    queryKey: ["supplier-column-inferences", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("supplier_column_inferences") as any)
        .select("*").eq("workspace_id", wsId).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data as any[];
    },
  });

  const playbookDrafts = useQuery({
    queryKey: ["supplier-playbook-drafts", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("supplier_playbook_drafts") as any)
        .select("*").eq("workspace_id", wsId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const overrides = useQuery({
    queryKey: ["supplier-overrides", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("supplier_overrides") as any)
        .select("*").eq("workspace_id", wsId).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data as any[];
    },
  });

  const autoDetect = useMutation({
    mutationFn: async (params: { file_name?: string; source_url?: string; headers?: string[]; sample_data?: any[]; source_type?: string }) => {
      const { data, error } = await supabase.functions.invoke("auto-detect-supplier", {
        body: { workspace_id: wsId, ...params },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["supplier-auto-detections"] });
      qc.invalidateQueries({ queryKey: ["supplier-profiles"] });
      toast.success(data.matched_supplier_id ? "Fornecedor detetado e associado" : "Fornecedor detetado (não confirmado)");
    },
  });

  const inferMapping = useMutation({
    mutationFn: async (params: { supplier_id?: string; detection_id?: string; headers: string[]; sample_data?: any[]; file_name?: string }) => {
      const { data, error } = await supabase.functions.invoke("infer-column-mapping", {
        body: { workspace_id: wsId, ...params },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-column-inferences"] });
      toast.success("Mapeamento inferido com sucesso");
    },
  });

  const generateDraft = useMutation({
    mutationFn: async (params: { supplier_id?: string; detection_id?: string; inference_id?: string }) => {
      const { data, error } = await supabase.functions.invoke("generate-playbook-draft", {
        body: { workspace_id: wsId, ...params },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-playbook-drafts"] });
      toast.success("Playbook draft gerado");
    },
  });

  const applyCorrections = useMutation({
    mutationFn: async (params: { supplier_id?: string; corrections?: any[]; instruction?: string; draft_id?: string }) => {
      const { data, error } = await supabase.functions.invoke("apply-supplier-corrections", {
        body: { workspace_id: wsId, ...params },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-overrides"] });
      qc.invalidateQueries({ queryKey: ["supplier-playbook-drafts"] });
      toast.success("Correções aplicadas");
    },
  });

  const promoteDraft = useMutation({
    mutationFn: async (draftId: string) => {
      // Get draft
      const { data: draft, error: dErr } = await (supabase.from("supplier_playbook_drafts") as any)
        .select("*").eq("id", draftId).single();
      if (dErr) throw dErr;

      // Create real playbook
      const { data: playbook, error: pErr } = await supabase.functions.invoke("create-supplier-playbook", {
        body: {
          workspace_id: wsId,
          supplier_id: draft.supplier_id,
          playbook_name: draft.playbook_name,
          playbook_type: (draft.playbook_config as any)?.source_type || "excel_only",
          playbook_config: {
            ...draft.playbook_config,
            column_mapping: draft.column_mapping,
            matching_rules: draft.matching_rules,
            grouping_rules: draft.grouping_rules,
            taxonomy_suggestion: draft.taxonomy_suggestion,
            image_strategy: draft.image_strategy,
            validation_profile: draft.validation_profile,
          },
        },
      });
      if (pErr) throw pErr;

      // Mark draft as promoted
      await (supabase.from("supplier_playbook_drafts") as any)
        .update({ status: "promoted", promoted_playbook_id: playbook?.playbook?.id })
        .eq("id", draftId);

      return playbook;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-playbook-drafts"] });
      qc.invalidateQueries({ queryKey: ["supplier-playbooks"] });
      toast.success("Playbook promovido com sucesso");
    },
  });

  const deleteDraft = useMutation({
    mutationFn: async (draftId: string) => {
      const { error } = await (supabase.from("supplier_playbook_drafts") as any).delete().eq("id", draftId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-playbook-drafts"] });
      toast.success("Draft eliminado");
    },
  });

  return {
    detections, inferences, playbookDrafts, overrides,
    autoDetect, inferMapping, generateDraft, applyCorrections, promoteDraft, deleteDraft,
  };
}
