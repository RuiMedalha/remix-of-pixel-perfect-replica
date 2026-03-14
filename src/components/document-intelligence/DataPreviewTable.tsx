import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Package, PencilLine } from "lucide-react";

interface DetectedProduct {
  [key: string]: any;
  _confidence?: number;
  _warnings?: string[];
}

interface Props {
  products: DetectedProduct[];
  columns?: string[];
  editable?: boolean;
  onProductsChange?: (products: DetectedProduct[]) => void;
}

const DISPLAY_LABELS: Record<string, string> = {
  sku: "SKU",
  original_title: "Título",
  original_description: "Descrição",
  original_price: "Preço",
  category: "Categoria",
  dimensions: "Dimensões",
  weight: "Peso",
  material: "Material",
  title: "Título",
  description: "Descrição",
  price: "Preço",
  color_options: "Cores",
  technical_specs: "Especificações",
};

const PAGE_SIZE = 25;

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value) || typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function getConfidence(product: DetectedProduct): number | null {
  const confidence = Number(product._confidence ?? product.confidence);
  return Number.isFinite(confidence) ? confidence : null;
}

export function DataPreviewTable({ products: rawProducts, columns: columnsProp, editable = false, onProductsChange }: Props) {
  const flattenedProducts = useMemo(() => {
    if (!Array.isArray(rawProducts)) return [];
    const flat: DetectedProduct[] = [];

    const walk = (item: any, parentSection?: string) => {
      if (item == null) return;

      if (Array.isArray(item)) {
        item.forEach((entry) => walk(entry, parentSection));
        return;
      }

      if (typeof item !== "object") return;

      if (Array.isArray(item.products)) {
        const section = typeof item.section_title === "string" ? item.section_title : parentSection;
        item.products.forEach((entry: any) => walk(entry, section));
        return;
      }

      flat.push({ ...item, category: item.category || parentSection });
    };

    walk(rawProducts);
    return flat;
  }, [rawProducts]);

  const [tableProducts, setTableProducts] = useState<DetectedProduct[]>(flattenedProducts);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setTableProducts(flattenedProducts);
  }, [flattenedProducts]);

  useEffect(() => {
    setPage(1);
  }, [tableProducts.length]);

  if (!tableProducts.length) return null;

  const columns = columnsProp || (() => {
    const keys = new Set<string>();
    tableProducts.slice(0, 30).forEach((product) => {
      Object.keys(product).forEach((key) => {
        if (!key.startsWith("_") && key !== "confidence" && key !== "images" && key !== "currency") {
          keys.add(key);
        }
      });
    });

    const priority = [
      "sku",
      "title",
      "original_title",
      "description",
      "original_description",
      "original_price",
      "price",
      "category",
      "material",
      "dimensions",
      "weight",
    ];

    return [...keys].sort((a, b) => {
      const ai = priority.indexOf(a);
      const bi = priority.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  })();

  const lowConfidenceCount = tableProducts.filter((product) => {
    const confidence = getConfidence(product);
    return confidence !== null && confidence < 60;
  }).length;

  const totalPages = Math.max(1, Math.ceil(tableProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const visibleProducts = tableProducts.slice(startIndex, startIndex + PAGE_SIZE);

  const handleCellChange = (absoluteIndex: number, column: string, value: string) => {
    setTableProducts((prev) => {
      const next = [...prev];
      next[absoluteIndex] = {
        ...next[absoluteIndex],
        [column]: value,
      };
      onProductsChange?.(next);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4" /> Produtos Detetados
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {editable && (
              <Badge variant="outline" className="flex items-center gap-1">
                <PencilLine className="h-3 w-3" /> Edição ativa
              </Badge>
            )}
            <Badge variant="default">{tableProducts.length} produtos</Badge>
            {lowConfidenceCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {lowConfidenceCount} baixa confiança
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <ScrollArea className="max-h-[420px]">
          <div className="overflow-auto">
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column} className="text-xs whitespace-nowrap">
                      {DISPLAY_LABELS[column] || column}
                    </TableHead>
                  ))}
                  <TableHead className="text-xs whitespace-nowrap">Confiança</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {visibleProducts.map((product, rowIndex) => {
                  const absoluteIndex = startIndex + rowIndex;
                  const confidence = getConfidence(product);

                  return (
                    <TableRow key={`${absoluteIndex}-${product.sku || "row"}`} className={confidence !== null && confidence < 60 ? "bg-destructive/5" : ""}>
                      {columns.map((column) => {
                        const cellText = formatCellValue(product[column]);
                        return (
                          <TableCell key={`${absoluteIndex}-${column}`} className="text-xs align-top min-w-[160px]">
                            {editable ? (
                              <Input
                                value={cellText}
                                onChange={(event) => handleCellChange(absoluteIndex, column, event.target.value)}
                                className="h-7 text-xs"
                              />
                            ) : (
                              <span className="block truncate" title={cellText || "—"}>
                                {cellText || <span className="text-muted-foreground italic">—</span>}
                              </span>
                            )}
                          </TableCell>
                        );
                      })}

                      <TableCell>
                        <div className="flex items-center gap-1">
                          {confidence !== null && confidence >= 80 ? (
                            <CheckCircle className="h-3 w-3 text-primary" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-accent-foreground" />
                          )}
                          <span className="text-xs">{confidence !== null ? `${confidence}%` : "—"}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            A mostrar {visibleProducts.length} de {tableProducts.length} produtos
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={safePage === 1}>
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="text-xs text-muted-foreground">Página {safePage} de {totalPages}</span>
            <Button size="sm" variant="outline" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={safePage === totalPages}>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
