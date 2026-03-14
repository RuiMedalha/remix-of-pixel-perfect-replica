import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Eye, Package, PencilLine } from "lucide-react";

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
  short_description: "Descrição Curta",
  brand: "Marca",
  model: "Modelo",
  quantity: "Quantidade",
  unit: "Unidade",
  reference: "Referência",
};

const PAGE_SIZES = [25, 50, 100, 200];

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value) || typeof value === "object") {
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return String(value);
}

function getConfidence(product: DetectedProduct): number | null {
  const confidence = Number(product._confidence ?? product.confidence);
  return Number.isFinite(confidence) ? confidence : null;
}

function getAllColumns(products: DetectedProduct[]): string[] {
  const keys = new Set<string>();
  products.forEach((product) => {
    Object.keys(product).forEach((key) => {
      if (!key.startsWith("_") && key !== "confidence" && key !== "images" && key !== "currency") {
        keys.add(key);
      }
    });
  });

  const priority = [
    "sku", "reference", "title", "original_title", "description", "original_description",
    "short_description", "original_price", "price", "category", "brand", "model",
    "material", "dimensions", "weight", "color_options", "technical_specs",
  ];

  return [...keys].sort((a, b) => {
    const ai = priority.indexOf(a);
    const bi = priority.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

// Summary columns shown in the table
const SUMMARY_COLUMNS = ["sku", "reference", "title", "original_title", "price", "original_price", "category"];

export function DataPreviewTable({ products: rawProducts, columns: columnsProp, editable = false, onProductsChange }: Props) {
  const flattenedProducts = useMemo(() => {
    if (!Array.isArray(rawProducts)) return [];
    const flat: DetectedProduct[] = [];

    const walk = (item: any, parentSection?: string) => {
      if (item == null) return;
      if (Array.isArray(item)) { item.forEach((entry) => walk(entry, parentSection)); return; }
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
  const [pageSize, setPageSize] = useState(50);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);

  useEffect(() => { setTableProducts(flattenedProducts); }, [flattenedProducts]);
  useEffect(() => { setPage(1); }, [tableProducts.length, pageSize]);

  const allColumns = useMemo(() => columnsProp || getAllColumns(tableProducts), [columnsProp, tableProducts]);
  
  // Only show key columns in the table; all columns visible in detail dialog
  const tableColumns = useMemo(() => {
    const available = allColumns.filter((c) => SUMMARY_COLUMNS.includes(c));
    // If none of the summary columns match, fall back to first 5
    return available.length > 0 ? available : allColumns.slice(0, 5);
  }, [allColumns]);

  if (!tableProducts.length) return null;

  const lowConfidenceCount = tableProducts.filter((p) => {
    const c = getConfidence(p);
    return c !== null && c < 60;
  }).length;

  const totalPages = Math.max(1, Math.ceil(tableProducts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const visibleProducts = tableProducts.slice(startIndex, startIndex + pageSize);

  const handleCellChange = (absoluteIndex: number, column: string, value: string) => {
    setTableProducts((prev) => {
      const next = [...prev];
      next[absoluteIndex] = { ...next[absoluteIndex], [column]: value };
      onProductsChange?.(next);
      return next;
    });
  };

  const selectedProduct = selectedProductIndex !== null ? tableProducts[selectedProductIndex] : null;

  return (
    <>
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
          <ScrollArea className="max-h-[520px]">
            <div className="overflow-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-10">#</TableHead>
                    {tableColumns.map((column) => (
                      <TableHead key={column} className="text-xs whitespace-nowrap">
                        {DISPLAY_LABELS[column] || column}
                      </TableHead>
                    ))}
                    <TableHead className="text-xs whitespace-nowrap">Confiança</TableHead>
                    <TableHead className="text-xs w-10"></TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {visibleProducts.map((product, rowIndex) => {
                    const absoluteIndex = startIndex + rowIndex;
                    const confidence = getConfidence(product);

                    return (
                      <TableRow
                        key={`${absoluteIndex}-${product.sku || "row"}`}
                        className={`cursor-pointer hover:bg-muted/50 ${confidence !== null && confidence < 60 ? "bg-destructive/5" : ""}`}
                        onClick={() => setSelectedProductIndex(absoluteIndex)}
                      >
                        <TableCell className="text-xs text-muted-foreground">{absoluteIndex + 1}</TableCell>
                        {tableColumns.map((column) => {
                          const cellText = formatCellValue(product[column]);
                          return (
                            <TableCell key={`${absoluteIndex}-${column}`} className="text-xs align-top max-w-[250px]">
                              <span className="block truncate" title={cellText || "—"}>
                                {cellText || <span className="text-muted-foreground italic">—</span>}
                              </span>
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
                        <TableCell>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setSelectedProductIndex(absoluteIndex); }}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {startIndex + 1}–{Math.min(startIndex + pageSize, tableProducts.length)} de {tableProducts.length}
              </p>
              <select
                className="text-xs border rounded px-1 py-0.5 bg-background text-foreground"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s} por página</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => setPage(1)} disabled={safePage === 1} className="text-xs h-7 px-2">
                1
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="h-7">
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <span className="text-xs text-muted-foreground px-1">Pág. {safePage}/{totalPages}</span>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="h-7">
                <ChevronRight className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage(totalPages)} disabled={safePage === totalPages} className="text-xs h-7 px-2">
                {totalPages}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Detail Dialog */}
      <Dialog open={selectedProductIndex !== null} onOpenChange={(open) => { if (!open) setSelectedProductIndex(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4" />
              Produto #{selectedProductIndex !== null ? selectedProductIndex + 1 : ""} — {selectedProduct ? formatCellValue(selectedProduct.title || selectedProduct.original_title || selectedProduct.sku || "Sem título") : ""}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-2">
            {selectedProduct && (
              <div className="space-y-3 pb-4">
                {allColumns.map((column) => {
                  const value = formatCellValue(selectedProduct[column]);
                  const isLong = value.length > 80;
                  return (
                    <div key={column} className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground">
                        {DISPLAY_LABELS[column] || column}
                      </Label>
                      {editable ? (
                        isLong ? (
                          <Textarea
                            value={value}
                            onChange={(e) => handleCellChange(selectedProductIndex!, column, e.target.value)}
                            className="text-sm min-h-[80px]"
                          />
                        ) : (
                          <Input
                            value={value}
                            onChange={(e) => handleCellChange(selectedProductIndex!, column, e.target.value)}
                            className="text-sm"
                          />
                        )
                      ) : (
                        <p className="text-sm bg-muted/50 rounded px-3 py-2 whitespace-pre-wrap break-words">
                          {value || <span className="text-muted-foreground italic">—</span>}
                        </p>
                      )}
                    </div>
                  );
                })}
                {/* Confidence */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Confiança</Label>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const c = getConfidence(selectedProduct);
                      return (
                        <>
                          {c !== null && c >= 80 ? <CheckCircle className="h-4 w-4 text-primary" /> : <AlertTriangle className="h-4 w-4 text-accent-foreground" />}
                          <span className="text-sm">{c !== null ? `${c}%` : "—"}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
          {selectedProductIndex !== null && (
            <div className="flex items-center justify-between pt-2 border-t">
              <Button size="sm" variant="outline" disabled={selectedProductIndex === 0} onClick={() => setSelectedProductIndex((i) => (i !== null ? i - 1 : null))}>
                <ChevronLeft className="h-3 w-3 mr-1" /> Anterior
              </Button>
              <span className="text-xs text-muted-foreground">{selectedProductIndex + 1} / {tableProducts.length}</span>
              <Button size="sm" variant="outline" disabled={selectedProductIndex === tableProducts.length - 1} onClick={() => setSelectedProductIndex((i) => (i !== null ? i + 1 : null))}>
                Seguinte <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
