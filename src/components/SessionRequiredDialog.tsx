import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActiveWorkflowRun } from "@/hooks/useActiveWorkflowRun";
import { useWorkspaceContext } from "@/hooks/useWorkspaces";
import { toast } from "sonner";
import { FolderOpen, Plus } from "lucide-react";

interface SessionRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionRequiredDialog({ open, onOpenChange }: SessionRequiredDialogProps) {
  const { createNewSession } = useActiveWorkflowRun();
  const { activeWorkspace } = useWorkspaceContext();
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || !activeWorkspace) return;
    setIsCreating(true);
    try {
      await createNewSession(name, activeWorkspace.id);
      toast.success(`Sessão "${name}" criada.`);
      setNewName("");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar sessão");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            Sessão de Trabalho Necessária
          </DialogTitle>
          <DialogDescription>
            Tens de selecionar ou criar uma Sessão de Trabalho antes de continuar. Isto garante que os dados importados e processados ficam organizados.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Criar Nova Sessão</p>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: TEFCOLD 2026"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="h-9"
            />
            <Button
              size="sm"
              className="h-9 px-4 shrink-0"
              disabled={!newName.trim() || isCreating || !activeWorkspace}
              onClick={handleCreate}
            >
              <Plus className="w-4 h-4 mr-1" />
              Criar
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
