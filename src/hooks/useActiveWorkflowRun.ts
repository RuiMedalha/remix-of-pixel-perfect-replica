import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const LS_KEY = "active_workflow_run_id";

export function useActiveWorkflowRun() {
  const [activeRunId, setActiveRunIdState] = useState<string | null>(() =>
    localStorage.getItem(LS_KEY)
  );

  const setActiveRun = useCallback((runId: string) => {
    localStorage.setItem(LS_KEY, runId);
    setActiveRunIdState(runId);
  }, []);

  const clearActiveRun = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setActiveRunIdState(null);
  }, []);

  const createNewSession = useCallback(
    async (name: string, workspaceId: string): Promise<string> => {
      const { data: workflow, error: wfErr } = await supabase
        .from("catalog_workflows")
        .insert({
          workspace_id: workspaceId,
          workflow_name: name,
          workflow_type: "supplier_import",
        } as any)
        .select("id")
        .single();
      if (wfErr) throw wfErr;

      const { data: run, error: runErr } = await supabase
        .from("catalog_workflow_runs")
        .insert({
          workspace_id: workspaceId,
          workflow_id: workflow.id,
          trigger_source: "manual",
          status: "running",
          started_at: new Date().toISOString(),
        } as any)
        .select("id")
        .single();
      if (runErr) throw runErr;

      setActiveRun(run.id);
      return run.id as string;
    },
    [setActiveRun]
  );

  return { activeRunId, setActiveRun, clearActiveRun, createNewSession };
}
