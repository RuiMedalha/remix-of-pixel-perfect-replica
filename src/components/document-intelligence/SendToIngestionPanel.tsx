import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowRight, Database, Loader2 } from "lucide-react";
import { useState } from "react";

interface Props {
  productCount: number;
  onSendToIngestion: (config: { mergeStrategy: string; dupFields: string }) => void;
  isSending?: boolean;
  alreadySent?: boolean;
}

export function SendToIngestionPanel({ productCount, onSendToIngestion, isSending, alreadySent }: Props) {
  const [mergeStrategy, setMergeStrategy] = useState("merge");

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database className="h-4 w-4" /> Enviar para Ingestion Hub
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Os dados extraídos serão enviados como CSV virtual para o Ingestion Hub, onde poderá
          fazer preview, validar e importar para o catálogo.
        </p>

        <div className="flex items-center gap-3">
          <div className="space-y-1 flex-1">
            <Label className="text-xs">Estratégia de Merge</Label>
            <Select value={mergeStrategy} onValueChange={setMergeStrategy}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="merge">Merge (insert + update)</SelectItem>
                <SelectItem value="insert_only">Apenas novos</SelectItem>
                <SelectItem value="update_only">Apenas atualizar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge variant="secondary" className="mt-5">{productCount} produtos</Badge>
        </div>

        {alreadySent ? (
          <div className="flex items-center gap-2 text-xs text-primary">
            <ArrowRight className="h-3 w-3" /> Já enviado para Ingestion Hub
          </div>
        ) : (
          <Button
            onClick={() => onSendToIngestion({ mergeStrategy, dupFields: "sku" })}
            disabled={isSending || productCount === 0}
            className="w-full"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            Enviar {productCount} produtos para Ingestion Hub
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
