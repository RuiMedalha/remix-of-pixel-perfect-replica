import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, Upload, Eye, Brain, Send, Loader2, CheckCircle, AlertTriangle, XCircle, Table2, Layers, GitCompare, Shield, BarChart3, Languages, ImageIcon, Settings2 } from "lucide-react";
import { usePdfExtractions, usePdfPages, usePdfTables, useStartPdfExtraction, useVisionParsePage, useMapPdfToProducts } from "@/hooks/usePdfExtraction";
import { useUploadedFiles } from "@/hooks/useUploadedFiles";
import { useRunDocumentIntelligence } from "@/hooks/useDocumentIntelligence";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PDFUploadDropzone } from "@/components/document-intelligence/PDFUploadDropzone";
import { ExtractionPipelineViewer } from "@/components/document-intelligence/ExtractionPipelineViewer";
import { ExtractionActionsDropdown, ProviderModeSelector } from "@/components/document-intelligence/ExtractionActions";
import { DocumentIntelligenceProviderPanel } from "@/components/document-intelligence/DocumentIntelligenceProviderPanel";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  queued: { label: "Na fila", variant: "secondary" },
  extracting: { label: "A extrair", variant: "default" },
  reviewing: { label: "Em revisão", variant: "outline" },
  done: { label: "Concluído", variant: "default" },
  error: { label: "Erro", variant: "destructive" },
};

const zoneColors: Record<string, string> = {
  header: "bg-primary/10 text-primary",
  section_title: "bg-accent text-accent-foreground",
  table: "bg-muted text-foreground",
  notes: "bg-secondary text-secondary-foreground",
  note: "bg-secondary text-secondary-foreground",
  footer: "bg-muted text-muted-foreground",
  paragraph: "text-foreground",
  body_text: "text-foreground",
  image: "bg-accent/50 text-accent-foreground",
  caption: "bg-muted text-muted-foreground",
};

const semanticTypeColors: Record<string, string> = {
  sku: "bg-primary/20 text-primary",
  title: "bg-accent text-accent-foreground",
  price: "bg-secondary text-secondary-foreground",
  description: "bg-muted text-foreground",
  dimensions: "bg-primary/10 text-primary",
  capacity: "bg-accent/50 text-accent-foreground",
  material: "bg-secondary/50 text-secondary-foreground",
  unknown: "bg-muted text-muted-foreground",
};

const tableTypeLabels: Record<string, string> = {
  product_table: "Produtos",
  technical_specs: "Especificações",
  pricing_table: "Preços",
  accessories: "Acessórios",
  compatibility: "Compatibilidade",
  spare_parts: "Peças",
};

export default function PDFExtractionPage() {
  const { data: extractions, isLoading } = usePdfExtractions();
  const { data: files } = useUploadedFiles();
  const startExtraction = useStartPdfExtraction();
  const mapToProducts = useMapPdfToProducts();
  const runDocIntel = useRunDocumentIntelligence();
  const [selectedExtraction, setSelectedExtraction] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("extractions");
  const [executionMode, setExecutionMode] = useState("auto");
  const [manualProvider, setManualProvider] = useState("");

  const pdfFiles = (files || []).filter(f => f.file_type === "application/pdf" || f.file_name?.endsWith(".pdf"));
  const activeExtractions = (extractions || []).filter((e: any) => !e.archived_at);

  const handleStartExtraction = () => {
    if (!selectedFileId) { toast.error("Seleciona um ficheiro PDF"); return; }
    startExtraction.mutate(selectedFileId);
    setSelectedFileId("");
  };

  const handleFileUploaded = (fileId: string) => {
    setSelectedFileId(fileId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Intelligence</h1>
          <p className="text-muted-foreground">Motor enterprise de extração PDF com provider abstraction, fallback chain e observabilidade completa</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="extractions">Extrações</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="extractions" className="space-y-6">
          {/* Upload & New Extraction */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Upload className="h-5 w-5" /> Upload Direto de PDF</CardTitle>
                <CardDescription>Arraste um PDF ou clique para selecionar</CardDescription>
              </CardHeader>
              <CardContent>
                <PDFUploadDropzone onFileUploaded={handleFileUploaded} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5" /> Nova Extração</CardTitle>
                <CardDescription>Selecione um PDF já carregado e inicie a extração</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={selectedFileId} onValueChange={setSelectedFileId}>
                  <SelectTrigger><SelectValue placeholder="Seleciona um PDF..." /></SelectTrigger>
                  <SelectContent>
                    {pdfFiles.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.file_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <ProviderModeSelector
                    mode={executionMode}
                    onModeChange={setExecutionMode}
                    manualProvider={manualProvider}
                    onManualProviderChange={setManualProvider}
                  />
                </div>
                <Button onClick={handleStartExtraction} disabled={startExtraction.isPending || !selectedFileId} className="w-full">
                  {startExtraction.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                  Extrair com Document Intelligence
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Extractions Table with Observability */}
          <Card>
            <CardHeader>
              <CardTitle>Extrações</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : !activeExtractions?.length ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma extração ainda</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ficheiro</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Páginas</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Modo</TableHead>
                      <TableHead>Fallback</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeExtractions.map((ext: any) => {
                      const sc = statusConfig[ext.status] || statusConfig.queued;
                      return (
                        <TableRow key={ext.id}>
                          <TableCell className="font-medium text-sm">{ext.uploaded_files?.file_name || "—"}</TableCell>
                          <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                          <TableCell className="text-sm">{ext.processed_pages}/{ext.total_pages}</TableCell>
                          <TableCell className="text-xs">{ext.provider_used || "Lovable Gateway"}</TableCell>
                          <TableCell className="text-xs">{ext.provider_model || ext.model_used || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{ext.extraction_mode || "auto"}</Badge>
                          </TableCell>
                          <TableCell>
                            {ext.fallback_used ? (
                              <Badge variant="secondary" className="text-[10px]">{ext.fallback_provider}</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">{new Date(ext.created_at).toLocaleDateString("pt-PT")}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => setSelectedExtraction(ext.id)}>
                                <Eye className="h-3 w-3" />
                              </Button>
                              {ext.status === "reviewing" && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => mapToProducts.mutate({ extractionId: ext.id })}>
                                    <Table2 className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" onClick={() => mapToProducts.mutate({ extractionId: ext.id, sendToIngestion: true })}>
                                    <Send className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              <ExtractionActionsDropdown
                                extraction={ext}
                                onViewDetails={setSelectedExtraction}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers">
          <DocumentIntelligenceProviderPanel />
        </TabsContent>
      </Tabs>

      {selectedExtraction && (
        <ExtractionDetailDialog extractionId={selectedExtraction} onClose={() => setSelectedExtraction(null)} />
      )}
    </div>
  );
}

function ExtractionDetailDialog({ extractionId, onClose }: { extractionId: string; onClose: () => void }) {
  const { data: pages, isLoading } = usePdfPages(extractionId);
  const pageIds = (pages || []).map((p: any) => p.id);
  const { data: tables } = usePdfTables(pageIds);
  const visionParse = useVisionParsePage();
  const [activeTab, setActiveTab] = useState("pages");
  const [reconcilePageId, setReconcilePageId] = useState<string | null>(null);

  // Extraction details
  const { data: extraction } = useQuery({
    queryKey: ["pdf-extraction-detail", extractionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdf_extractions")
        .select("*")
        .eq("id", extractionId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: metrics } = useQuery({
    queryKey: ["pdf-extraction-metrics", extractionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdf_extraction_metrics" as any)
        .select("*")
        .eq("extraction_id", extractionId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) return null;
      return (data as any[])?.[0] || null;
    },
  });

  const { data: sections } = useQuery({
    queryKey: ["pdf-sections", pageIds],
    enabled: pageIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdf_sections" as any)
        .select("*")
        .in("page_id", pageIds);
      if (error) return [];
      return data as any[];
    },
  });

  const selectedPage = reconcilePageId ? (pages || []).find((p: any) => p.id === reconcilePageId) : null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" /> Document Intelligence — Detalhes
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-4">
          {/* Pipeline sidebar */}
          <div className="col-span-1">
            <ExtractionPipelineViewer
              providerUsed={(extraction as any)?.provider_used}
              providerModel={(extraction as any)?.provider_model || (extraction as any)?.model_used}
              extractionMode={(extraction as any)?.extraction_mode}
              fallbackUsed={(extraction as any)?.fallback_used}
              fallbackProvider={(extraction as any)?.fallback_provider}
              status={(extraction as any)?.status}
            />
          </div>

          {/* Main content */}
          <div className="col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="pages">Páginas ({pages?.length || 0})</TabsTrigger>
                <TabsTrigger value="tables">Tabelas ({tables?.length || 0})</TabsTrigger>
                <TabsTrigger value="reconcile">Reconciliação</TabsTrigger>
                <TabsTrigger value="metrics">Métricas</TabsTrigger>
              </TabsList>

              <TabsContent value="pages">
                <ScrollArea className="h-[60vh]">
                  {isLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : (
                    <div className="space-y-4">
                      {(pages || []).map((page: any) => (
                        <Card key={page.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">Página {page.page_number}</CardTitle>
                              <div className="flex items-center gap-2">
                                {page.has_tables && <Badge>Tabelas</Badge>}
                                {(page.page_context as any)?.language && (
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    <Languages className="h-3 w-3" /> {(page.page_context as any).language?.language || (page.page_context as any).language}
                                  </Badge>
                                )}
                                {(page.page_context as any)?.provider && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {(page.page_context as any).provider}
                                  </Badge>
                                )}
                                <Badge variant="outline">Confiança: {page.confidence_score}%</Badge>
                                <Button size="sm" variant="outline" onClick={() => visionParse.mutate(page.id)} disabled={visionParse.isPending}>
                                  <Brain className="h-3 w-3 mr-1" /> AI Parse
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setReconcilePageId(page.id); setActiveTab("reconcile"); }}>
                                  <GitCompare className="h-3 w-3 mr-1" /> Reconciliar
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {(page.zones || []).length > 0 && (
                              <div className="mb-3 flex flex-wrap gap-1">
                                {(page.zones || []).map((z: any, i: number) => (
                                  <Badge key={i} variant="outline" className={`text-xs ${zoneColors[z.type] || ""}`}>
                                    {z.type}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <pre className="text-xs bg-muted p-3 rounded-md max-h-32 overflow-auto whitespace-pre-wrap font-mono">
                              {(page.raw_text || "").substring(0, 400)}{(page.raw_text || "").length > 400 ? "..." : ""}
                            </pre>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="tables">
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-4">
                    {(tables || []).map((table: any) => (
                      <Card key={table.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-sm flex items-center gap-2">
                                Tabela #{table.table_index} — {table.row_count}×{table.col_count}
                                {table.table_type && (
                                  <Badge variant="secondary" className="text-xs">
                                    {tableTypeLabels[table.table_type] || table.table_type}
                                  </Badge>
                                )}
                              </CardTitle>
                              {table.template_id && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Shield className="h-3 w-3" /> Template aplicado
                                </p>
                              )}
                            </div>
                            <Badge variant="outline">Confiança: {table.confidence_score}%</Badge>
                          </div>
                          {(table.column_classifications || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(table.column_classifications || []).map((col: any, i: number) => (
                                <Tooltip key={i}>
                                  <TooltipTrigger>
                                    <Badge variant="secondary" className={`text-xs ${semanticTypeColors[col.semantic_type] || ""}`}>
                                      {col.header}: {col.semantic_type}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Fonte: {col.source} | Confiança: {col.confidence}%</p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {(table.headers || []).map((h: string, i: number) => {
                                    const col = (table.column_classifications || [])[i];
                                    return (
                                      <TableHead key={i} className="text-xs">
                                        <div>{h}</div>
                                        {col && <div className="text-[10px] font-normal text-muted-foreground">{col.semantic_type}</div>}
                                      </TableHead>
                                    );
                                  })}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(table.pdf_table_rows || []).slice(0, 15).map((row: any) => (
                                  <TableRow key={row.id}>
                                    {((row.reconciled_cells?.length ? row.reconciled_cells : row.cells) || []).map((cell: any, ci: number) => (
                                      <TableCell key={ci} className="text-xs">
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <div className="flex items-center gap-1">
                                              <span>{cell.value}</span>
                                              {cell.confidence >= 80 && <CheckCircle className="h-3 w-3 text-primary shrink-0" />}
                                              {cell.confidence >= 50 && cell.confidence < 80 && <AlertTriangle className="h-3 w-3 text-accent-foreground shrink-0" />}
                                              {cell.confidence < 50 && <XCircle className="h-3 w-3 text-destructive shrink-0" />}
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent className="max-w-xs">
                                            <p className="text-xs">Confiança: {cell.confidence}%</p>
                                            <p className="text-xs">Fonte: {cell.source}</p>
                                            {cell.semantic_type && <p className="text-xs">Tipo: {cell.semantic_type}</p>}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            {(table.pdf_table_rows || []).length > 15 && (
                              <p className="text-xs text-muted-foreground mt-2">A mostrar 15 de {table.pdf_table_rows.length} linhas</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {(!tables || tables.length === 0) && (
                      <p className="text-muted-foreground text-center py-8">Nenhuma tabela detectada</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="reconcile">
                <ScrollArea className="h-[60vh]">
                  {!selectedPage ? (
                    <div className="text-center py-8">
                      <GitCompare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Seleciona uma página na tab "Páginas" para ver a reconciliação</p>
                    </div>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Reconciliação — Página {selectedPage.page_number}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><FileText className="h-3 w-3" /> Texto</h4>
                            <div className="bg-muted rounded-md p-2 max-h-60 overflow-auto">
                              {(((selectedPage.text_result as any)?.zones || (selectedPage.layout_zones as any[]) || []) as any[]).map((z: any, i: number) => (
                                <div key={i} className={`text-xs p-1 mb-1 rounded ${zoneColors[z.type] || ""}`}>
                                  <span className="font-medium">[{z.type}]</span> {(z.content || z.content_summary || "").substring(0, 80)}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Brain className="h-3 w-3" /> Visão AI</h4>
                            <div className="bg-muted rounded-md p-2 max-h-60 overflow-auto">
                              {((selectedPage.vision_result as any)?.tables?.length > 0) ? (
                                (((selectedPage.vision_result as any).tables || []) as any[]).map((t: any, i: number) => (
                                  <div key={i} className="text-xs p-1 mb-1 border-b border-border">
                                    <span className="font-medium">Tabela {i + 1}:</span> {(t.headers || []).join(", ")}
                                    <br />
                                    <span className="text-muted-foreground">{(t.rows || []).length} linhas, confiança {t.confidence}%</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-muted-foreground">Sem resultados AI — clique "AI Parse"</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><GitCompare className="h-3 w-3" /> Reconciliado</h4>
                            <div className="bg-muted rounded-md p-2 max-h-60 overflow-auto">
                              {(((selectedPage.reconciled_result as any)?.zones || []) as any[]).map((z: any, i: number) => (
                                <div key={i} className={`text-xs p-1 mb-1 rounded ${zoneColors[z.type] || ""}`}>
                                  <span className="font-medium">[{z.type}]</span> {(z.content_summary || "").substring(0, 80)}
                                </div>
                              ))}
                              {!((selectedPage.reconciled_result as any)?.zones?.length) && (
                                <p className="text-xs text-muted-foreground">Execute AI Parse para gerar reconciliação</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="metrics">
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-4">
                    {metrics ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Métricas de Qualidade</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Confiança Média</p>
                              <p className="text-2xl font-bold text-foreground">{metrics.avg_confidence}%</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Tabelas Detetadas</p>
                              <p className="text-2xl font-bold text-foreground">{metrics.tables_detected}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Linhas Extraídas</p>
                              <p className="text-2xl font-bold text-foreground">{metrics.rows_extracted}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Taxa de Mapeamento</p>
                              <p className="text-2xl font-bold text-foreground">{metrics.mapping_success_rate}%</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Tempo de Processamento</p>
                              <p className="text-2xl font-bold text-foreground">{(metrics.processing_time / 1000).toFixed(1)}s</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">Métricas disponíveis após a extração</p>
                    )}
                    {(sections || []).length > 0 && (
                      <Card>
                        <CardHeader><CardTitle className="text-sm">Secções Detetadas</CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            {(sections || []).map((s: any) => (
                              <div key={s.id} className="flex items-center justify-between text-xs border-b border-border py-1">
                                <span className="font-medium">{s.section_title}</span>
                                <Badge variant="outline" className="text-xs">Confiança: {s.confidence}%</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
