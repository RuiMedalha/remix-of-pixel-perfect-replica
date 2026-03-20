// src/components/ai-comparison/AiComparisonResults.tsx
import { useState } from "react";
import { Check, Zap, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  COMPARISON_SECTIONS,
  useComparisonResults,
  useSelectComparisonResult,
  useApplyComparisonResult,
  type ComparisonResult,
} from "@/hooks/useAiComparison";
import type { Product } from "@/hooks/useProducts";

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  runId: string;
  products: Product[];
  modelIds: string[];
  sections: string[];
}

// ── Decision-support helpers ───────────────────────────────────────────────────

function findCheapestId(results: ComparisonResult[]): string | null {
  if (results.length === 0) return null;
  return results.reduce((a, b) => a.estimated_cost <= b.estimated_cost ? a : b).id;
}

function findFastestId(results: ComparisonResult[]): string | null {
  if (results.length === 0) return null;
  return results.reduce((a, b) => a.latency_ms <= b.latency_ms ? a : b).id;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function AiComparisonResults({ runId, products, modelIds, sections }: Props) {
  const { data: allResults = [], isLoading } = useComparisonResults(runId);
  const selectResult = useSelectComparisonResult();
  const applyResult  = useApplyComparisonResult();
  const [applying, setApplying] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (allResults.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Sem resultados. Verifica se a comparação correu com sucesso.
      </p>
    );
  }

  // Group: productId → sectionId → modelId → ComparisonResult
  const grouped = new Map<string, Map<string, Map<string, ComparisonResult>>>();
  for (const r of allResults) {
    if (!grouped.has(r.product_id)) grouped.set(r.product_id, new Map());
    const bySec = grouped.get(r.product_id)!;
    if (!bySec.has(r.section)) bySec.set(r.section, new Map());
    bySec.get(r.section)!.set(r.model_id, r);
  }

  const handleSelectAndApply = async (result: ComparisonResult) => {
    setApplying(result.id);
    try {
      await selectResult.mutateAsync({
        runId,
        resultId:  result.id,
        productId: result.product_id,
        section:   result.section,
      });
      await applyResult.mutateAsync({
        productId:  result.product_id,
        section:    result.section,
        outputText: result.output_text,
      });
      toast.success("Resultado aplicado ao produto.");
    } catch (err) {
      toast.error("Erro ao aplicar resultado.");
      console.error("[AiComparisonResults] apply failed:", err);
    } finally {
      setApplying(null);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-8 pr-2">
        {products.map((product) => {
          const productResults = grouped.get(product.id);
          if (!productResults) return null;

          const productTitle =
            (product as any).optimized_title ||
            (product as any).original_title ||
            "Sem título";
          const productSku = (product as any).sku;

          return (
            <div key={product.id}>
              {/* Product header */}
              <div className="flex items-baseline gap-2 mb-3 pb-2 border-b">
                <h3 className="font-semibold text-sm">{productTitle}</h3>
                {productSku && (
                  <span className="text-xs text-muted-foreground">SKU: {productSku}</span>
                )}
              </div>

              {/* Sections */}
              <div className="space-y-4">
                {COMPARISON_SECTIONS.filter((s) => sections.includes(s.id)).map((sectionDef) => {
                  const sectionResults = productResults.get(sectionDef.id);
                  if (!sectionResults) return null;

                  const resultsArr   = Array.from(sectionResults.values());
                  const cheapestId   = findCheapestId(resultsArr);
                  const fastestId    = findFastestId(resultsArr);

                  return (
                    <div key={sectionDef.id} className="border rounded-lg overflow-hidden">
                      {/* Section label */}
                      <div className="bg-muted/40 px-3 py-1.5 border-b">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {sectionDef.label}
                        </span>
                      </div>

                      {/* Model columns — horizontal scroll for many models */}
                      <div
                        className="grid overflow-x-auto"
                        style={{
                          gridTemplateColumns: `repeat(${modelIds.length}, minmax(260px, 1fr))`,
                        }}
                      >
                        {modelIds.map((modelId) => {
                          const result = sectionResults.get(modelId);

                          if (!result) {
                            return (
                              <div
                                key={modelId}
                                className="p-3 border-r last:border-r-0 text-xs text-muted-foreground"
                              >
                                Sem resultado
                              </div>
                            );
                          }

                          const isCheapest = result.id === cheapestId;
                          const isFastest  = result.id === fastestId;
                          const isSelected = result.selected;
                          const isApplying = applying === result.id;

                          return (
                            <div
                              key={modelId}
                              className={`p-3 border-r last:border-r-0 flex flex-col gap-2 ${
                                isSelected
                                  ? "bg-success/5 border-l-2 border-l-success"
                                  : ""
                              }`}
                            >
                              {/* Model name + decision badges */}
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-xs font-semibold">{modelId}</span>
                                {isCheapest && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1 py-0 text-success border-success/40 gap-0.5"
                                  >
                                    <DollarSign className="w-2.5 h-2.5" /> Mais barato
                                  </Badge>
                                )}
                                {isFastest && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1 py-0 text-primary border-primary/40 gap-0.5"
                                  >
                                    <Zap className="w-2.5 h-2.5" /> Mais rápido
                                  </Badge>
                                )}
                                {isSelected && (
                                  <Badge className="text-[10px] px-1 py-0 bg-success text-success-foreground gap-0.5">
                                    <Check className="w-2.5 h-2.5" /> Aplicado
                                  </Badge>
                                )}
                              </div>

                              {/* Output text */}
                              <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap line-clamp-6 flex-1">
                                {result.output_text || "—"}
                              </p>

                              {/* Stats row */}
                              <div className="flex gap-3 text-[10px] text-muted-foreground">
                                <span>${Number(result.estimated_cost).toFixed(5)}</span>
                                <span>{result.latency_ms}ms</span>
                                <span>
                                  {result.input_tokens + result.output_tokens} tokens
                                </span>
                              </div>

                              {/* Action */}
                              <Button
                                size="sm"
                                variant={isSelected ? "default" : "outline"}
                                className="h-7 text-xs w-full"
                                disabled={isApplying}
                                onClick={() => handleSelectAndApply(result)}
                              >
                                {isApplying ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : isSelected ? (
                                  <>
                                    <Check className="w-3 h-3 mr-1" /> Aplicado
                                  </>
                                ) : (
                                  "Selecionar e aplicar"
                                )}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
