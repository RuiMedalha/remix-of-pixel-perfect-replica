import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  FileText, Upload, Eye, Brain, Send, Loader2, CheckCircle, AlertTriangle, XCircle,
  Table2, Layers, GitCompare, Shield, BarChart3, Languages, Settings2, ArrowRight,
  Scan, MapPin, Database, Package, Trash2,
} from "lucide-react";
import { usePdfExtractions, useStartPdfExtraction, useVisionParsePage, useMapPdfToProducts, useDeletePdfExtraction } from "@/hooks/usePdfExtraction";
import { useUploadedFiles } from "@/hooks/useUploadedFiles";
import {
  useSendExtractionToIngestion,
} from "@/hooks/useDocumentIntelligence";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PDFUploadDropzone } from "@/components/document-intelligence/PDFUploadDropzone";
import { ExtractionPipelineViewer } from "@/components/document-intelligence/ExtractionPipelineViewer";
import { ExtractionActionsDropdown, ProviderModeSelector } from "@/components/document-intelligence/ExtractionActions";
import { DocumentIntelligenceProviderPanel } from "@/components/document-intelligence/DocumentIntelligenceProviderPanel";
import { DocumentPreviewPanel } from "@/components/document-intelligence/DocumentPreviewPanel";
import { EngineRecommendationCard } from "@/components/document-intelligence/EngineRecommendationCard";
import { MappingEditor } from "@/components/document-intelligence/MappingEditor";
import { DataPreviewTable } from "@/components/document-intelligence/DataPreviewTable";
import { SendToIngestionPanel } from "@/components/document-intelligence/SendToIngestionPanel";

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

// Wizard steps — simplified flow
type WizardStep = "upload" | "extracting" | "review" | "ingestion";

const WIZARD_STEPS: { key: WizardStep; label: string; icon: React.ElementType }[] = [
  { key: "upload", label: "Upload", icon: Upload },
  { key: "extracting", label: "Extração AI", icon: Brain },
  { key: "review", label: "Revisão", icon: Package },
  { key: "ingestion", label: "Ingestão", icon: Database },
];

export default function PDFExtractionPage() {
  const { data: extractions, isLoading } = usePdfExtractions();
  const { data: files } = useUploadedFiles();
  const startExtraction = useStartPdfExtraction();
  const mapToProducts = useMapPdfToProducts();
  const deleteExtraction = useDeletePdfExtraction();
  const sendToIngestion = useSendExtractionToIngestion();

  const [selectedExtraction, setSelectedExtraction] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("wizard");
  const [executionMode, setExecutionMode] = useState("auto");
  const [manualProvider, setManualProvider] = useState("");

  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>("upload");
  const [wizardExtractionId, setWizardExtractionId] = useState<string | null>(null);

  const pdfFiles = (files || []).filter(f => f.file_type === "application/pdf" || f.file_name?.endsWith(".pdf"));
  const activeExtractions = (extractions || []).filter((e: any) => !e.archived_at);

  // Get current wizard extraction details
  const { data: wizardExtraction } = useQuery({
    queryKey: ["wizard-extraction", wizardExtractionId],
    enabled: !!wizardExtractionId,
    refetchInterval: (query) => {
      const ext = query.state.data as any;
      if (ext && ["queued", "extracting", "processing"].includes(ext.status)) return 3000;
      return false;
    },
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdf_extractions")
        .select("*, uploaded_files:file_id(file_name)")
        .eq("id", wizardExtractionId!)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  // Real progress: count pages actually extracted from pdf_pages table
  const { data: wizardPages } = useQuery({
    queryKey: ["wizard-pages-progress", wizardExtractionId],
    enabled: !!wizardExtractionId,
    refetchInterval: (query) => {
      const ext = wizardExtraction;
      if (ext && ["queued", "extracting", "processing"].includes(ext.status)) return 3000;
      return false;
    },
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdf_pages")
        .select("id, page_number, status, vision_result")
        .eq("extraction_id", wizardExtractionId!)
        .order("page_number");
      if (error) throw error;
      return data;
    },
  });

  const realProgress = useMemo(() => {
    const pages = wizardPages || [];
    const totalPages = wizardExtraction?.total_pages || 0;
    const extractedPages = pages.filter((p: any) => p.status === "extracted").length;
    const errorPages = pages.filter((p: any) => p.status === "error").length;
    const pct = totalPages > 0 ? Math.round((extractedPages / totalPages) * 100) : 0;
    // Count products from vision_result
    let productCount = 0;
    pages.forEach((p: any) => {
      const products = (p.vision_result as any)?.products || [];
      productCount += products.filter((prod: any) => prod.title || prod.sku).length;
    });
    return { extractedPages, errorPages, totalPages, pct, productCount };
  }, [wizardPages, wizardExtraction?.total_pages]);

  // Compute product count: prefer detected_products, fallback to counting from pages
  const wizardProductCount = (() => {
    const dp = wizardExtraction?.detected_products as any[];
    if (dp?.length) return dp.length;
    return realProgress.productCount;
  })();

  // Detect stalled extraction (no progress for 60s while status is still extracting)
  const [extractionStartedAt] = useState(() => Date.now());
  const isStalled = useMemo(() => {
    if (!wizardExtraction) return false;
    const status = wizardExtraction.status;
    if (!["extracting", "processing"].includes(status)) return false;
    // If created_at is > 2 min ago and processed_pages hasn't changed from what pdf_pages shows
    const createdAt = new Date(wizardExtraction.created_at).getTime();
    const elapsed = Date.now() - createdAt;
    const totalPages = wizardExtraction.total_pages || 0;
    const extracted = realProgress.extractedPages;
    // Consider stalled if: has been running > 3 min AND not all pages done AND < totalPages
    return elapsed > 180000 && extracted > 0 && extracted < totalPages;
  }, [wizardExtraction, realProgress.extractedPages]);

  // Step 1: Start extraction — goes straight to extracting
  const handleStartWizard = async () => {
    if (!selectedFileId) { toast.error("Seleciona um ficheiro PDF"); return; }
    try {
      const result = await startExtraction.mutateAsync(selectedFileId);
      setWizardExtractionId(result.extractionId);
      setWizardStep("extracting");
    } catch {}
  };

  const handleFileUploaded = (fileId: string) => {
    setSelectedFileId(fileId);
  };

  // Auto-advance: when extraction finishes (status=reviewing) and detected_products is populated, go to review
  const extractionStatus = wizardExtraction?.status;
  const hasDetectedProducts = ((wizardExtraction?.detected_products as any[])?.length || 0) > 0;
  
  // Auto-advance to review when extraction is done
  if (wizardStep === "extracting" && extractionStatus === "reviewing" && (hasDetectedProducts || realProgress.productCount > 0)) {
    setWizardStep("review");
  }

  // Resume a stalled extraction
  const handleResumeExtraction = async () => {
    if (!wizardExtractionId) return;
    toast.info("A retomar extração...");
    supabase.functions.invoke("extract-pdf-pages", {
      body: { extractionId: wizardExtractionId },
    }).then(() => {
      toast.success("Extração retomada com sucesso");
    }).catch((err) => {
      console.error("Resume error:", err);
      toast.error("Erro ao retomar extração");
    });
  };

  const handleSendToIngestion = async (config: { mergeStrategy: string; dupFields: string }) => {
    if (!wizardExtractionId) return;
    await sendToIngestion.mutateAsync({
      extractionId: wizardExtractionId,
      mergeStrategy: config.mergeStrategy,
      dupFields: config.dupFields,
    });
  };

  const resetWizard = () => {
    setWizardStep("upload");
    setWizardExtractionId(null);
    setSelectedFileId("");
    
  };

  // Quick extraction from history table
  const handleQuickExtraction = () => {
    if (!selectedFileId) { toast.error("Seleciona um ficheiro PDF"); return; }
    startExtraction.mutate(selectedFileId);
    setSelectedFileId("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Intelligence</h1>
          <p className="text-muted-foreground">Extração enterprise de dados de catálogos PDF com preview, validação e integração com Ingestion Hub</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="wizard" className="gap-2"><Layers className="h-4 w-4" /> Fluxo Assistido</TabsTrigger>
          <TabsTrigger value="extractions" className="gap-2"><FileText className="h-4 w-4" /> Histórico</TabsTrigger>
          <TabsTrigger value="providers" className="gap-2"><Settings2 className="h-4 w-4" /> Providers</TabsTrigger>
        </TabsList>

        {/* ═══════════════ WIZARD TAB ═══════════════ */}
        <TabsContent value="wizard" className="space-y-6">
          {/* Step indicator */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {WIZARD_STEPS.map((step, i) => {
              const StepIcon = step.icon;
              const isActive = step.key === wizardStep;
              const stepIdx = WIZARD_STEPS.findIndex((s) => s.key === wizardStep);
              const isDone = i < stepIdx;
              return (
                <div key={step.key} className="flex items-center gap-1">
                  {i > 0 && <div className={`w-6 h-px ${isDone ? "bg-primary" : "bg-border"}`} />}
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      isActive ? "bg-primary text-primary-foreground" :
                      isDone ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}
                    onClick={() => { if (isDone) setWizardStep(step.key); }}
                  >
                    {isDone ? <CheckCircle className="h-3 w-3" /> : <StepIcon className="h-3 w-3" />}
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step: Upload */}
          {wizardStep === "upload" && (
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
                  <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5" /> Selecionar PDF Existente</CardTitle>
                  <CardDescription>Escolha um PDF já carregado na biblioteca</CardDescription>
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
                  <Button onClick={handleStartWizard} disabled={startExtraction.isPending || !selectedFileId} className="w-full">
                    {startExtraction.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                    Iniciar Análise do Documento
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step: Extracting (auto, shows progress) */}
          {wizardStep === "extracting" && (
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center gap-5 max-w-md mx-auto">
                  {extractionStatus === "error" ? (
                    <>
                      <XCircle className="h-10 w-10 text-destructive" />
                      <p className="text-sm font-medium">Erro na extração</p>
                      {realProgress.extractedPages > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {realProgress.extractedPages} páginas foram extraídas antes do erro ({realProgress.productCount} produtos encontrados)
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button variant="default" onClick={handleResumeExtraction}>
                          <ArrowRight className="h-4 w-4 mr-2" /> Retomar extração
                        </Button>
                        <Button variant="outline" onClick={resetWizard}>
                          <Upload className="h-4 w-4 mr-2" /> Recomeçar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <div className="w-full space-y-3">
                        <div className="text-center">
                          <p className="text-sm font-medium">A extrair produtos do PDF com AI Vision...</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {(wizardExtraction as any)?.uploaded_files?.file_name || "PDF"}
                          </p>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1.5">
                          <Progress value={realProgress.pct} className="h-2.5" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{realProgress.extractedPages} de {realProgress.totalPages || "?"} páginas</span>
                            <span>{realProgress.pct}%</span>
                          </div>
                        </div>

                        {/* Stats cards */}
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="bg-muted rounded-lg p-2.5 text-center">
                            <p className="text-lg font-bold text-foreground">{realProgress.productCount}</p>
                            <p className="text-[10px] text-muted-foreground">Produtos</p>
                          </div>
                          <div className="bg-muted rounded-lg p-2.5 text-center">
                            <p className="text-lg font-bold text-foreground">{realProgress.extractedPages}</p>
                            <p className="text-[10px] text-muted-foreground">Páginas OK</p>
                          </div>
                          <div className="bg-muted rounded-lg p-2.5 text-center">
                            <p className="text-lg font-bold text-foreground">{realProgress.errorPages}</p>
                            <p className="text-[10px] text-muted-foreground">Erros</p>
                          </div>
                        </div>

                        {/* Stalled warning */}
                        {isStalled && (
                          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-center space-y-2">
                            <div className="flex items-center justify-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                              <p className="text-xs font-medium text-destructive">Extração parece ter parado</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Processadas {realProgress.extractedPages} de {realProgress.totalPages} páginas. A função pode ter expirado.
                            </p>
                            <Button size="sm" onClick={handleResumeExtraction}>
                              <ArrowRight className="h-3 w-3 mr-1" /> Retomar de onde parou
                            </Button>
                          </div>
                        )}

                        <p className="text-[10px] text-muted-foreground text-center mt-2">
                          Podes sair desta página — a extração continua em segundo plano.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Review — compiled product table */}
          {wizardStep === "review" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-5 w-5" /> Produtos Extraídos
                    </CardTitle>
                    <Badge variant="default">{wizardProductCount} produtos encontrados</Badge>
                  </div>
                  <CardDescription>
                    Revise os produtos extraídos do PDF. Quando estiver satisfeito, envie para o Ingestion Hub.
                  </CardDescription>
                </CardHeader>
              </Card>

              <DataPreviewTable
                products={(wizardExtraction?.detected_products as any[]) || []}
                columns={undefined}
              />

              <div className="flex gap-3">
                <Button onClick={() => setWizardStep("ingestion")}>
                  <ArrowRight className="h-4 w-4 mr-2" /> Aceitar e Enviar para Ingestão
                </Button>
                <Button variant="outline" onClick={resetWizard}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Step: Ingestion */}
          {wizardStep === "ingestion" && (
            <div className="space-y-4">
              <SendToIngestionPanel
                productCount={wizardProductCount}
                onSendToIngestion={handleSendToIngestion}
                isSending={sendToIngestion.isPending}
                alreadySent={wizardExtraction?.sent_to_ingestion}
              />
              {wizardExtraction?.sent_to_ingestion && (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={resetWizard}>
                    <Upload className="h-4 w-4 mr-2" /> Novo Documento
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ═══════════════ HISTORY TAB ═══════════════ */}
        <TabsContent value="extractions" className="space-y-6">
          {/* Quick extraction */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Extração Rápida</CardTitle>
              <CardDescription>Sem fluxo assistido — extrai diretamente</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Select value={selectedFileId} onValueChange={setSelectedFileId}>
                <SelectTrigger className="w-64"><SelectValue placeholder="Seleciona PDF..." /></SelectTrigger>
                <SelectContent>
                  {pdfFiles.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.file_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ProviderModeSelector
                mode={executionMode}
                onModeChange={setExecutionMode}
                manualProvider={manualProvider}
                onManualProviderChange={setManualProvider}
              />
              <Button onClick={handleQuickExtraction} disabled={startExtraction.isPending || !selectedFileId}>
                {startExtraction.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                Extrair
              </Button>
            </CardContent>
          </Card>

          {/* Extractions Table */}
          <Card>
            <CardHeader><CardTitle>Histórico de Extrações</CardTitle></CardHeader>
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
                      <TableHead>Ingestão</TableHead>
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
                          <TableCell className="text-xs">{ext.provider_used || "—"}</TableCell>
                          <TableCell className="text-xs">{ext.provider_model || ext.model_used || "—"}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{ext.extraction_mode || "auto"}</Badge></TableCell>
                          <TableCell>
                            {ext.fallback_used ? (
                              <Badge variant="secondary" className="text-[10px]">{ext.fallback_provider}</Badge>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            {ext.sent_to_ingestion ? (
                              <Badge variant="default" className="text-[10px]">Enviado</Badge>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
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
                              <ExtractionActionsDropdown extraction={ext} onViewDetails={setSelectedExtraction} />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (confirm("Eliminar esta extração e todos os dados associados?")) {
                                    deleteExtraction.mutate(ext.id);
                                  }
                                }}
                                disabled={deleteExtraction.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
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

        {/* ═══════════════ PROVIDERS TAB ═══════════════ */}
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

  const { data: extraction } = useQuery({
    queryKey: ["pdf-extraction-detail", extractionId],
    queryFn: async () => {
      const { data, error } = await supabase.from("pdf_extractions").select("*").eq("id", extractionId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: metrics } = useQuery({
    queryKey: ["pdf-extraction-metrics", extractionId],
    queryFn: async () => {
      const { data, error } = await supabase.from("pdf_extraction_metrics" as any).select("*").eq("extraction_id", extractionId).order("created_at", { ascending: false }).limit(1);
      if (error) return null;
      return (data as any[])?.[0] || null;
    },
  });

  const { data: sections } = useQuery({
    queryKey: ["pdf-sections", pageIds],
    enabled: pageIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("pdf_sections" as any).select("*").in("page_id", pageIds);
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
                      {(pages || []).filter((p: any) => {
                        const productCount = (p.page_context as any)?.product_count || 0;
                        const hasContent = (p.raw_text || "").length > 10;
                        return productCount > 0 || hasContent;
                      }).map((page: any) => {
                        const products = (page.vision_result as any)?.products || [];
                        const pageCtx = page.page_context as any;
                        const productCount = pageCtx?.product_count || products.length || 0;
                        return (
                        <Card key={page.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm flex items-center gap-2">
                                Página {page.page_number}
                                {productCount > 0 && (
                                  <Badge variant="default" className="text-xs">{productCount} produto{productCount !== 1 ? "s" : ""}</Badge>
                                )}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                {pageCtx?.page_type && (
                                  <Badge variant="outline" className="text-xs">{pageCtx.page_type}</Badge>
                                )}
                                {pageCtx?.section_title && (
                                  <Badge variant="secondary" className="text-xs">{pageCtx.section_title}</Badge>
                                )}
                                {pageCtx?.language && (
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    <Languages className="h-3 w-3" /> {typeof pageCtx.language === "string" ? pageCtx.language : pageCtx.language?.language}
                                  </Badge>
                                )}
                                <Badge variant="outline">Confiança: {page.confidence_score}%</Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {(page.zones || []).length > 0 && (
                              <div className="mb-3 flex flex-wrap gap-1">
                                {(page.zones || []).map((z: any, i: number) => (
                                  <Badge key={i} variant="outline" className={`text-xs ${zoneColors[z.type] || ""}`}>
                                    {z.type || z.content_summary}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {/* Show extracted products in a clean table format */}
                            {products.length > 0 ? (
                              <div className="overflow-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="text-xs">SKU</TableHead>
                                      <TableHead className="text-xs">Produto</TableHead>
                                      <TableHead className="text-xs">Preço</TableHead>
                                      <TableHead className="text-xs">Categoria</TableHead>
                                      <TableHead className="text-xs">Confiança</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {products.slice(0, 10).map((prod: any, pi: number) => (
                                      <TableRow key={pi}>
                                        <TableCell className="text-xs font-mono">{prod.sku || "—"}</TableCell>
                                        <TableCell className="text-xs">
                                          <div className="font-medium">{prod.title || "—"}</div>
                                          {prod.description && (
                                            <div className="text-muted-foreground text-[10px] mt-0.5 truncate max-w-xs">{prod.description}</div>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-xs">{prod.price ? `${prod.currency || "€"}${prod.price}` : "—"}</TableCell>
                                        <TableCell className="text-xs">{prod.category || pageCtx?.section_title || "—"}</TableCell>
                                        <TableCell>
                                          <div className="flex items-center gap-1">
                                            {(prod.confidence || 0) >= 80 && <CheckCircle className="h-3 w-3 text-primary" />}
                                            {(prod.confidence || 0) >= 50 && (prod.confidence || 0) < 80 && <AlertTriangle className="h-3 w-3 text-accent-foreground" />}
                                            {(prod.confidence || 0) < 50 && <XCircle className="h-3 w-3 text-destructive" />}
                                            <span className="text-xs">{prod.confidence || 0}%</span>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                                {products.length > 10 && (
                                  <p className="text-xs text-muted-foreground mt-1">A mostrar 10 de {products.length} produtos</p>
                                )}
                              </div>
                            ) : (
                              <pre className="text-xs bg-muted p-3 rounded-md max-h-24 overflow-auto whitespace-pre-wrap font-mono">
                                {(page.raw_text || "Sem conteúdo extraído").substring(0, 300)}
                              </pre>
                            )}
                          </CardContent>
                        </Card>
                      )})}
                      {(pages || []).filter((p: any) => ((p.page_context as any)?.product_count || 0) === 0 && (p.raw_text || "").length <= 10).length > 0 && (
                        <p className="text-xs text-muted-foreground text-center">
                          {(pages || []).filter((p: any) => ((p.page_context as any)?.product_count || 0) === 0).length} páginas sem produtos (capas, índices, etc.)
                        </p>
                      )}
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
                                  <Badge variant="secondary" className="text-xs">{tableTypeLabels[table.table_type] || table.table_type}</Badge>
                                )}
                              </CardTitle>
                              {table.template_id && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Shield className="h-3 w-3" /> Template aplicado</p>
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
                                  <TooltipContent><p>Fonte: {col.source} | Confiança: {col.confidence}%</p></TooltipContent>
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
                      <CardHeader><CardTitle className="text-sm">Reconciliação — Página {selectedPage.page_number}</CardTitle></CardHeader>
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
                        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Métricas de Qualidade</CardTitle></CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-1"><p className="text-xs text-muted-foreground">Confiança Média</p><p className="text-2xl font-bold text-foreground">{metrics.avg_confidence}%</p></div>
                            <div className="space-y-1"><p className="text-xs text-muted-foreground">Tabelas Detetadas</p><p className="text-2xl font-bold text-foreground">{metrics.tables_detected}</p></div>
                            <div className="space-y-1"><p className="text-xs text-muted-foreground">Linhas Extraídas</p><p className="text-2xl font-bold text-foreground">{metrics.rows_extracted}</p></div>
                            <div className="space-y-1"><p className="text-xs text-muted-foreground">Taxa de Mapeamento</p><p className="text-2xl font-bold text-foreground">{metrics.mapping_success_rate}%</p></div>
                            <div className="space-y-1"><p className="text-xs text-muted-foreground">Tempo de Processamento</p><p className="text-2xl font-bold text-foreground">{(metrics.processing_time / 1000).toFixed(1)}s</p></div>
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
