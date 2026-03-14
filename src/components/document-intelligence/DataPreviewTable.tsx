import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CheckCircle, Package } from "lucide-react";

interface DetectedProduct {
  [key: string]: any;
  _confidence?: number;
  _warnings?: string[];
}

interface Props {
  products: DetectedProduct[];
  columns?: string[];
}

const DISPLAY_LABELS: Record<string, string> = {
  sku: "SKU", original_title: "Título", original_description: "Descrição",
  original_price: "Preço", category: "Categoria", dimensions: "Dimensões",
  weight: "Peso", material: "Material", title: "Título", description: "Descrição",
  price: "Preço", color_options: "Cores", technical_specs: "Especificações",
};

export function DataPreviewTable({ products, columns: columnsProp }: Props) {
  if (!products?.length) return null;

  // Auto-detect columns from product keys, excluding internal fields
  const columns = columnsProp || (() => {
    const keys = new Set<string>();
    products.slice(0, 10).forEach((p) => {
      Object.keys(p).forEach((k) => {
        if (!k.startsWith("_") && k !== "confidence" && k !== "images" && k !== "currency") keys.add(k);
      });
    });
    // Prioritize common fields
    const priority = ["sku", "title", "original_title", "description", "original_description", "original_price", "price", "category", "material", "dimensions", "weight"];
    const sorted = [...keys].sort((a, b) => {
      const ai = priority.indexOf(a);
      const bi = priority.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
    return sorted;
  })();
  if (!products?.length) return null;

  const lowConfidence = products.filter((p) => (p._confidence || 0) < 60);
  const highConfidence = products.filter((p) => (p._confidence || 100) >= 60);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4" /> Produtos Detetados
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="default">{products.length} produtos</Badge>
            {lowConfidence.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {lowConfidence.length} baixa confiança
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-80">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.slice(0, 6).map((col) => (
                  <TableHead key={col} className="text-xs">{col}</TableHead>
                ))}
                <TableHead className="text-xs">Confiança</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.slice(0, 30).map((product, i) => (
                <TableRow key={i} className={(product._confidence || 100) < 60 ? "bg-destructive/5" : ""}>
                  {columns.slice(0, 6).map((col) => (
                    <TableCell key={col} className="text-xs max-w-32 truncate">
                      {product[col] || <span className="text-muted-foreground italic">vazio</span>}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {(product._confidence || 100) >= 80 ? (
                        <CheckCircle className="h-3 w-3 text-primary" />
                      ) : (product._confidence || 100) >= 60 ? (
                        <AlertTriangle className="h-3 w-3 text-accent-foreground" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                      )}
                      <span className="text-xs">{product._confidence || "—"}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {products.length > 30 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">A mostrar 30 de {products.length}</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
