import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveWorkflowRun } from "@/hooks/useActiveWorkflowRun";
import { Badge } from "@/components/ui/badge";
import { FolderOpen } from "lucide-react";

export function SessionBadge() {
  const { activeRunId } = useActiveWorkflowRun();

  const { data: activeRun } = useQuery({
    queryKey: ["workflow-run-detail", activeRunId],
    enabled: !!activeRunId,
    queryFn: async () => {
      const { data } = await supabase
        .from("catalog_workflow_runs")
        .select("id, status, created_at, catalog_workflows(workflow_name)")
        .eq("id", activeRunId!)
        .single();
      return data;
    },
  });

  const runName = (activeRun?.catalog_workflows as any)?.workflow_name;

  if (!activeRunId || !runName) return null;

  return (
    <Badge variant="secondary" className="gap-1 text-xs font-medium">
      <FolderOpen className="w-3 h-3" />
      Sessão: {runName}
    </Badge>
  );
}
