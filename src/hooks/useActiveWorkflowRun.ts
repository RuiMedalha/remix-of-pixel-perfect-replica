import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useActiveWorkflowRun(workspaceId?: string) {
  const lsKey = workspaceId ? `active_workflow_run_id_${workspaceId}` : null;

  const [activeRunId, setActiveRunIdState] = useState<string | null>(() =>
    lsKey ? localStorage.getItem(lsKey) : null
  );

  // Reset on real workspace change — never on first render
  const prevWorkspaceId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (
      prevWorkspaceId.current !== undefined &&
      prevWorkspaceId.current !== workspaceId
    ) {
      setActiveRunIdState(null);
    }
    prevWorkspaceId.current = workspaceId;
  }, [workspaceId]);

  const setActiveRun = useCallback(
    (runId: string) => {
      if (!lsKey) return;
      localStorage.setItem(lsKey, runId);
      setActiveRunIdState(runId);
    },
    [lsKey]
  );

  const clearActiveRun = useCallback(() => {
    if (!lsKey) return;
    localStorage.removeItem(lsKey);
    setActiveRunIdState(null);
  }, [lsKey]);

  const createNewSession = useCallback(
    async (name: string, wsId: string): Promise<string> => {
      const { data: workflow, error: wfErr } = await supabase
        .from("catalog_workflows")
        .insert({
          workspace_id: wsId,
          workflow_name: name,
          workflow_type: "supplier_import",
        } as any)
        .select("id")
        .single();
      if (wfErr) throw wfErr;

      const { data: run, error: runErr } = await supabase
        .from("catalog_workflow_runs")
        .insert({
          workspace_id: wsId,
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
