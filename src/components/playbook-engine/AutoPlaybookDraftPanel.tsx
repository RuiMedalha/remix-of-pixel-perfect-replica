import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Rocket, Trash2, Eye, AlertTriangle, CheckCircle } from "lucide-react";

interface Props {
  draft: any;
  onPromote: (draftId: string) => void;
  onDelete: (draftId: string) => void;
  isPromoting: boolean;
}

export function AutoPlaybookDraftPanel({ draft, onPromote, onDelete, isPromoting }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!draft) return null;

  const confidence = Math.round((draft.confidence_score || 0) * 100);
  const reviewFields = draft.needs_review_fields || [];
  const mapping = draft.column_mapping || {};
  const mappedCount = Object.keys(mapping).length;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {confidence >= 70 ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
            {draft.playbook_name}
            <Badge variant="outline" className="text-[10px]">{confidence}%</Badge>
            {draft.auto_generated && <Badge className="text-[10px] bg-primary/10 text-primary">Auto</Badge>}
            <Badge variant={draft.status === "promoted" ? "default" : "secondary"} className="text-[10px]">
              {draft.status}
            </Badge>
          </CardTitle>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setExpanded(!expanded)}>
              <Eye className="w-3 h-3 mr-1" /> {expanded ? "Ocultar" : "Detalhes"}
            </Button>
            {draft.status === "draft" && (
              <>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onPromote(draft.id)} disabled={isPromoting}>
                  {isPromoting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Rocket className="w-3 h-3 mr-1" />}
                  Promover
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => onDelete(draft.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Colunas mapeadas</p>
              <p className="font-medium">{mappedCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Regras matching</p>
              <p className="font-medium">{(draft.matching_rules || []).length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Regras agrupamento</p>
              <p className="font-medium">{(draft.grouping_rules || []).length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Campos a rever</p>
              <p className="font-medium">{reviewFields.length}</p>
            </div>
          </div>

          {/* Column mapping summary */}
          <div>
            <p className="text-xs font-medium mb-1">Mapeamento</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(mapping).map(([header, field]) => (
                <Badge key={header} variant="outline" className="text-[10px]">
                  {header} → {String(field)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Review fields */}
          {reviewFields.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1 text-amber-600">Campos com baixa confiança</p>
              <div className="flex flex-wrap gap-1">
                {reviewFields.map((f: string) => (
                  <Badge key={f} variant="secondary" className="text-[10px] border-amber-500/30">{f}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
