import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceContext } from "@/hooks/useWorkspaces";
import { toast } from "sonner";

export function usePromptGovernance() {
  const { activeWorkspace } = useWorkspaceContext();
  const qc = useQueryClient();
  const wsId = activeWorkspace?.id;

  const templates = useQuery({
    queryKey: ["prompt-templates", wsId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_templates")
        .select("*")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!wsId,
  });

  const createTemplate = useMutation({
    mutationFn: async (p: { prompt_name: string; prompt_type: string; base_prompt: string; description?: string }) => {
      const { data, error } = await supabase
        .from("prompt_templates")
        .insert({ workspace_id: wsId!, ...p })
        .select()
        .single();
      if (error) throw error;
      // Create v1
      await supabase.from("prompt_versions").insert({
        template_id: data.id,
        version_number: 1,
        prompt_text: p.base_prompt,
        is_active: true,
      });
      return data;
    },
    onSuccess: () => { toast.success("Template criado"); qc.invalidateQueries({ queryKey: ["prompt-templates"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const useVersions = (templateId: string | null) =>
    useQuery({
      queryKey: ["prompt-versions", templateId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("prompt_versions")
          .select("*")
          .eq("template_id", templateId!)
          .order("version_number", { ascending: false });
        if (error) throw error;
        return data;
      },
      enabled: !!templateId,
    });

  const createVersion = useMutation({
    mutationFn: async (p: { template_id: string; prompt_text: string }) => {
      // Get max version
      const { data: existing } = await supabase
        .from("prompt_versions")
        .select("version_number")
        .eq("template_id", p.template_id)
        .order("version_number", { ascending: false })
        .limit(1);
      const nextVersion = (existing?.[0]?.version_number || 0) + 1;
      // Deactivate all
      await supabase.from("prompt_versions").update({ is_active: false }).eq("template_id", p.template_id);
      const { data, error } = await supabase
        .from("prompt_versions")
        .insert({ template_id: p.template_id, version_number: nextVersion, prompt_text: p.prompt_text, is_active: true })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { toast.success("Nova versão criada"); qc.invalidateQueries({ queryKey: ["prompt-versions"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const activateVersion = useMutation({
    mutationFn: async (p: { template_id: string; version_id: string }) => {
      await supabase.from("prompt_versions").update({ is_active: false }).eq("template_id", p.template_id);
      const { error } = await supabase.from("prompt_versions").update({ is_active: true }).eq("id", p.version_id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Versão ativada"); qc.invalidateQueries({ queryKey: ["prompt-versions"] }); },
  });

  const overrides = useQuery({
    queryKey: ["prompt-overrides", wsId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_overrides")
        .select("*")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!wsId,
  });

  const usageLogs = (versionId: string | null) =>
    useQuery({
      queryKey: ["prompt-usage-logs", versionId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("prompt_usage_logs")
          .select("*")
          .eq("prompt_version_id", versionId!)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        return data;
      },
      enabled: !!versionId,
    });

  return { templates, createTemplate, useVersions, createVersion, activateVersion, overrides, usageLogs };
}
