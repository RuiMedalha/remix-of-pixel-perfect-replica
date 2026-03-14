import { useState, useCallback, useMemo } from "react";
import { Upload, FileSpreadsheet, Play, Eye, Loader2, CheckCircle, AlertCircle, Clock, ArrowRight, X, Database, Webhook, Zap, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useIngestionJobs, useIngestionJobItems, useParseIngestion, useRunIngestionJob, type IngestionJob } from "@/hooks/useIngestion";
import { usePlaybookEngine } from "@/hooks/usePlaybookEngine";
import { useDeleteUploadedFile } from "@/hooks/useDeleteUploadedFile";
import { SupplierAutoDetectionPanel } from "@/components/playbook-engine/SupplierAutoDetectionPanel";
import { SmartColumnInferencePreview } from "@/components/playbook-engine/SmartColumnInferencePreview";
import { ImportPreviewBeforeRun } from "@/components/playbook-engine/ImportPreviewBeforeRun";
import { PlaybookCorrectionsPanel } from "@/components/playbook-engine/PlaybookCorrectionsPanel";
import { IngestionJobActionsDropdown } from "@/components/playbook-engine/IngestionJobActionsDropdown";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const PRODUCT_FIELDS = [
  { key: "sku", label: "SKU" },
  { key: "original_title", label: "Título" },
  { key: "original_description", label: "Descrição" },
  { key: "original_price", label: "Preço" },
  { key: "sale_price", label: "Preço Promocional" },
  { key: "category", label: "Categoria" },
  { key: "short_description", label: "Descrição Curta" },
  { key: "image_urls", label: "Imagens (URLs)" },
  { key: "tags", label: "Tags" },
  { key: "meta_title", label: "Meta Title" },
  { key: "meta_description", label: "Meta Description" },
  { key: "seo_slug", label: "SEO Slug" },
  { key: "supplier_ref", label: "Ref. Fornecedor" },
  { key: "technical_specs", label: "Especificações" },
  { key: "attributes", label: "Atributos" },
  { key: "product_type", label: "Tipo de Produto" },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  queued: { label: "Na fila", color: "bg-muted text-muted-foreground" },
  parsing: { label: "A analisar", color: "bg-primary/10 text-primary" },
  mapping: { label: "A mapear", color: "bg-primary/10 text-primary" },
  dry_run: { label: "Preview", color: "bg-amber-500/10 text-amber-600" },
  importing: { label: "A importar", color: "bg-blue-500/10 text-blue-600" },
  done: { label: "Concluído", color: "bg-green-500/10 text-green-600" },
  error: { label: "Erro", color: "bg-destructive/10 text-destructive" },
};

const IngestionHubPage = () => {
  const { data: jobs, isLoading } = useIngestionJobs();
  const parseIngestion = useParseIngestion();
  const runJob = useRunIngestionJob();
  const {
    autoDetect, inferMapping, generateDraft, applyCorrections, overrides,
    deleteIngestionJob, archiveIngestionJob, triggerAutoDraftFromIngestion,
  } = usePlaybookEngine();
  const deleteFile = useDeleteUploadedFile();

  const [activeTab, setActiveTab] = useState("import");
  const [dragOver, setDragOver] = useState(false);

  // Parsing state
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [mergeStrategy, setMergeStrategy] = useState("merge");
  const [dupFields, setDupFields] = useState("sku");

  // Auto-detection state
  const [currentDetection, setCurrentDetection] = useState<any>(null);
  const [currentInference, setCurrentInference] = useState<any>(null);
  const [showReview, setShowReview] = useState(false);
  const [showCorrections, setShowCorrections] = useState(false);

  // Preview state
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const { data: previewItems } = useIngestionJobItems(previewJobId);

  // Detail state
  const [detailJob, setDetailJob] = useState<IngestionJob | null>(null);
  const { data: detailItems } = useIngestionJobItems(detailJob?.id || null);

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setCurrentDetection(null);
    setCurrentInference(null);
    setShowReview(false);
    const ext = file.name.split(".").pop()?.toLowerCase();

    let headers: string[] = [];
    let rows: any[] = [];

    if (ext === "csv") {
      const text = await file.text();
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length === 0) return;
      const sep = lines[0].includes(";") ? ";" : ",";
      headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ""));
      rows = lines.slice(1).map(line => {
        const vals = line.split(sep).map(v => v.trim().replace(/^"|"$/g, ""));
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
        return obj;
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
      if (data.length === 0) return;
      headers = Object.keys(data[0]);
      rows = data;
    } else if (ext === "json") {
      const text = await file.text();
      const parsed = JSON.parse(text);
      rows = Array.isArray(parsed) ? parsed : [parsed];
      if (rows.length === 0) return;
      headers = Object.keys(rows[0]);
    } else {
      toast.error("Formato não suportado. Use CSV, XLSX ou JSON.");
      return;
    }

    setParsedHeaders(headers);
    setParsedData(rows);

    // 1. Auto-detect supplier
    try {
      const detResult = await autoDetect.mutateAsync({
        file_name: file.name,
        headers,
        sample_data: rows.slice(0, 50),
        source_type: ext || "excel",
      });
      setCurrentDetection(detResult.detection);

      // 2. Infer column mapping
      const infResult = await inferMapping.mutateAsync({
        supplier_id: detResult.matched_supplier_id || undefined,
        detection_id: detResult.detection?.id,
        headers,
        sample_data: rows.slice(0, 50),
        file_name: file.name,
      });
      setCurrentInference(infResult);

      // Apply inferred mapping
      if (infResult.mapping) {
        setFieldMappings(infResult.mapping);
      }

      // 3. Generate playbook draft
      await generateDraft.mutateAsync({
        supplier_id: detResult.matched_supplier_id || undefined,
        detection_id: detResult.detection?.id,
        inference_id: infResult.inference?.id,
      });

      setShowReview(true);
    } catch (e) {
      // Fallback to basic auto-mapping if engine fails
      const autoMap: Record<string, string> = {};
      headers.forEach(h => {
        const lower = h.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (lower.includes("sku") || lower === "ref") autoMap[h] = "sku";
        else if (lower.includes("title") || lower.includes("titulo") || lower.includes("nome") || lower === "name") autoMap[h] = "original_title";
        else if (lower.includes("desc") && !lower.includes("short") && !lower.includes("curta")) autoMap[h] = "original_description";
        else if (lower.includes("price") || lower.includes("preco") || lower.includes("preço") || lower === "pvp") autoMap[h] = "original_price";
        else if (lower.includes("categ")) autoMap[h] = "category";
        else if (lower.includes("image") || lower.includes("imagem") || lower.includes("foto")) autoMap[h] = "image_urls";
      });
      setFieldMappings(autoMap);
    }
  }, [autoDetect, inferMapping, generateDraft]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
    e.target.value = "";
  }, [handleFile]);

  const handleDryRun = async () => {
    if (!parsedData) return;
    try {
      const result = await parseIngestion.mutateAsync({
        data: parsedData,
        fileName,
        sourceType: fileName.endsWith(".csv") ? "csv" : fileName.endsWith(".json") ? "json" : "xlsx",
        fieldMappings,
        mergeStrategy,
        duplicateDetectionFields: dupFields.split(",").map(s => s.trim()).filter(Boolean),
        mode: "dry_run",
      });
      setPreviewResult(result);
      setPreviewJobId(result.jobId);

      // Trigger auto-draft creation after successful dry-run
      triggerAutoDraftAfterIngestion(result.jobId);

      toast.success("Preview gerado com sucesso");
    } catch {}
  };

  const handleLiveRun = async () => {
    if (!parsedData) return;
    try {
      const result = await parseIngestion.mutateAsync({
        data: parsedData,
        fileName,
        sourceType: fileName.endsWith(".csv") ? "csv" : fileName.endsWith(".json") ? "json" : "xlsx",
        fieldMappings,
        mergeStrategy,
        duplicateDetectionFields: dupFields.split(",").map(s => s.trim()).filter(Boolean),
        mode: "live",
      });
      await runJob.mutateAsync(result.jobId);

      // Trigger auto-draft creation after successful live import
      triggerAutoDraftAfterIngestion(result.jobId);

      resetForm();
    } catch {}
  };

  const triggerAutoDraftAfterIngestion = (jobId: string) => {
    if (!parsedData || !parsedHeaders.length) return;
    const ext = fileName.split(".").pop()?.toLowerCase() || "xlsx";
    triggerAutoDraftFromIngestion.mutate({
      ingestion_job_id: jobId,
      file_name: fileName,
      headers: parsedHeaders,
      sample_data: parsedData.slice(0, 50),
      source_type: ext,
    });
  };

  const handleRunExistingJob = async (jobId: string) => {
    try { await runJob.mutateAsync(jobId); } catch {}
  };

  const handleJobAction = (action: string, jobId: string) => {
    const job = jobs?.find(j => j.id === jobId);
    switch (action) {
      case "view":
        if (job) setDetailJob(job);
        break;
      case "run":
        handleRunExistingJob(jobId);
        break;
      case "delete":
        deleteIngestionJob.mutate(jobId);
        break;
      case "archive":
        archiveIngestionJob.mutate(jobId);
        break;
      case "delete_file":
        // Delete the uploaded file associated with this job
        toast.info("A eliminar ficheiro...");
        // We'd need the file ID; for now delete by job reference
        deleteIngestionJob.mutate(jobId);
        break;
      case "clone":
        toast.info("Clone: funcionalidade em desenvolvimento");
        break;
      case "open_draft":
        toast.info("Navegar para Supplier Playbooks > Auto-Drafts");
        break;
      default:
        toast.info(`Ação "${action}" pendente de implementação`);
    }
  };

  const resetForm = () => {
    setParsedData(null);
    setParsedHeaders([]);
    setFileName("");
    setFieldMappings({});
    setPreviewResult(null);
    setPreviewJobId(null);
    setCurrentDetection(null);
    setCurrentInference(null);
    setShowReview(false);
    setShowCorrections(false);
  };

  const mappedCount = Object.keys(fieldMappings).length;

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Centro de Importação</h1>
        <p className="text-muted-foreground mt-1">Importe, mapeie e valide dados de catálogo com deteção inteligente de fornecedores e matching automático de SKU.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="import" className="gap-2"><Upload className="w-4 h-4" /> Importar</TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2"><Clock className="w-4 h-4" /> Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6 mt-4">
          {!parsedData ? (
            <Card
              className={cn("border-2 border-dashed transition-colors cursor-pointer",
                dragOver ? "border-primary bg-accent" : "border-border hover:border-primary/50"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileSpreadsheet className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-1">Arraste um ficheiro para importar</p>
                <p className="text-sm text-muted-foreground mb-2">CSV, XLSX, XLS ou JSON</p>
                <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Deteção automática de fornecedor e mapeamento inteligente
                </p>
                <Button variant="outline" asChild>
                  <label className="cursor-pointer">
                    Selecionar Ficheiro
                    <input type="file" accept=".csv,.xlsx,.xls,.json,.xml" className="hidden" onChange={onFileSelect} />
                  </label>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{fileName}</h2>
                  <p className="text-sm text-muted-foreground">{parsedData.length} linhas detectadas · {parsedHeaders.length} colunas</p>
                </div>
                <Button variant="ghost" size="sm" onClick={resetForm}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
              </div>

              {/* Auto-detection panel */}
              <SupplierAutoDetectionPanel
                detection={currentDetection}
                isDetecting={autoDetect.isPending}
              />

              {/* Smart inference with review toggle */}
              {showReview ? (
                <ImportPreviewBeforeRun
                  detection={currentDetection}
                  inference={currentInference}
                  draft={null}
                  parsedData={parsedData}
                  fieldMappings={fieldMappings}
                  onConfirmImport={handleLiveRun}
                  onCorrectMapping={() => setShowReview(false)}
                  onSaveDraft={() => { toast.success("Draft guardado"); }}
                  onReprocess={() => handleFile(new File([], fileName))}
                  isImporting={parseIngestion.isPending || runJob.isPending}
                />
              ) : (
                <>
                  {/* Settings row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Estratégia de Merge</Label>
                      <Select value={mergeStrategy} onValueChange={setMergeStrategy}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="merge">Merge (insert + update)</SelectItem>
                          <SelectItem value="insert_only">Apenas inserir novos</SelectItem>
                          <SelectItem value="update_only">Apenas atualizar existentes</SelectItem>
                          <SelectItem value="replace">Substituir completamente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Campos de detecção de duplicados</Label>
                      <Input value={dupFields} onChange={e => setDupFields(e.target.value)} placeholder="sku, original_title" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Mapeamento</Label>
                      <p className="text-sm text-muted-foreground">{mappedCount} de {parsedHeaders.length} colunas mapeadas</p>
                    </div>
                  </div>

                  {/* Smart column inference */}
                  <SmartColumnInferencePreview
                    inference={currentInference}
                    headers={parsedHeaders}
                    sampleData={parsedData || []}
                    fieldMappings={fieldMappings}
                    onMappingChange={setFieldMappings}
                  />

                  {/* Corrections panel */}
                  {showCorrections && (
                    <PlaybookCorrectionsPanel
                      supplierId={currentDetection?.matched_supplier_id}
                      overrides={(overrides.data || []).filter((o: any) => o.supplier_id === currentDetection?.matched_supplier_id)}
                      onApplyInstruction={(instruction) => {
                        applyCorrections.mutate({
                          supplier_id: currentDetection?.matched_supplier_id,
                          instruction,
                        });
                      }}
                      onApplyCorrection={(c) => {
                        applyCorrections.mutate({
                          supplier_id: currentDetection?.matched_supplier_id,
                          corrections: [c],
                        });
                      }}
                      isApplying={applyCorrections.isPending}
                    />
                  )}

                  {/* Dry-run result */}
                  {previewResult && (
                    <Card className="border-amber-500/30 bg-amber-500/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Eye className="w-4 h-4 text-amber-600" />
                          Resultado do Preview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{previewResult.inserts}</p>
                            <p className="text-xs text-muted-foreground">Novos</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{previewResult.updates}</p>
                            <p className="text-xs text-muted-foreground">Atualizações</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-muted-foreground">{previewResult.skips}</p>
                            <p className="text-xs text-muted-foreground">Ignorados</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-amber-600">{previewResult.duplicates}</p>
                            <p className="text-xs text-muted-foreground">Duplicados</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-foreground">{previewResult.totalRows}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                        </div>

                        {previewResult.groups?.length > 0 && (
                          <div className="mt-4 border-t border-border pt-3">
                            <p className="text-xs font-medium mb-2">Grupos de variações detectados:</p>
                            <div className="flex flex-wrap gap-2">
                              {previewResult.groups.map((g: any) => (
                                <Badge key={g.key} variant="outline" className="text-xs">{g.key} ({g.count} items)</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {previewItems && previewItems.length > 0 && (
                          <div className="mt-4 border-t border-border pt-3">
                            <p className="text-xs font-medium mb-2">Detalhes por linha:</p>
                            <ScrollArea className="max-h-64">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs">#</TableHead>
                                    <TableHead className="text-xs">Ação</TableHead>
                                    <TableHead className="text-xs">SKU</TableHead>
                                    <TableHead className="text-xs">Título</TableHead>
                                    <TableHead className="text-xs">Match</TableHead>
                                    <TableHead className="text-xs">Grupo</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {previewItems.slice(0, 20).map((item) => (
                                    <TableRow key={item.id}>
                                      <TableCell className="text-xs">{item.source_row_index + 1}</TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className={cn("text-[10px]",
                                          item.action === "insert" ? "border-green-500 text-green-600" :
                                          item.action === "update" || item.action === "merge" ? "border-blue-500 text-blue-600" :
                                          "border-muted text-muted-foreground"
                                        )}>{item.action}</Badge>
                                      </TableCell>
                                      <TableCell className="text-xs font-mono">{item.mapped_data?.sku || "—"}</TableCell>
                                      <TableCell className="text-xs max-w-[200px] truncate">{item.mapped_data?.original_title || "—"}</TableCell>
                                      <TableCell className="text-xs">{item.match_confidence ? `${item.match_confidence}%` : "—"}</TableCell>
                                      <TableCell className="text-xs">
                                        {item.parent_group_key ? (
                                          <Badge variant="secondary" className="text-[10px]">
                                            {item.is_parent ? "Parent" : "Child"}: {item.parent_group_key}
                                          </Badge>
                                        ) : "—"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </ScrollArea>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 flex-wrap">
                    <Button variant="outline" onClick={() => setShowReview(true)} disabled={mappedCount === 0}>
                      <Eye className="w-4 h-4 mr-1" /> Rever Antes de Importar
                    </Button>
                    <Button variant="outline" onClick={handleDryRun} disabled={parseIngestion.isPending || mappedCount === 0}>
                      {parseIngestion.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Eye className="w-4 h-4 mr-1" />}
                      Preview (Dry Run)
                    </Button>
                    <Button onClick={handleLiveRun} disabled={parseIngestion.isPending || runJob.isPending || mappedCount === 0}>
                      {(parseIngestion.isPending || runJob.isPending) ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
                      Importar Agora
                    </Button>
                    <Button variant="ghost" onClick={() => setShowCorrections(!showCorrections)}>
                      Correções
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
                <Database className="w-10 h-10 mb-3" />
                <p className="font-medium">Sem jobs de ingestão</p>
                <p className="text-sm">Importe dados no separador "Importar"</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {jobs.map(job => {
                const st = statusLabels[job.status] || statusLabels.queued;
                return (
                  <Card key={job.id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="flex items-center gap-4 py-3">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setDetailJob(job)}>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{job.file_name || `Job ${job.id.slice(0, 8)}`}</p>
                          <Badge className={cn("text-[10px]", st.color)}>{st.label}</Badge>
                          <Badge variant="outline" className="text-[10px]">{job.mode === "dry_run" ? "Preview" : "Live"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {job.total_rows} linhas · {job.imported_rows} importados · {job.updated_rows} atualizados · {job.failed_rows} erros
                          {job.created_at && ` · ${format(new Date(job.created_at), "dd/MM HH:mm")}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {job.status === "dry_run" && (
                          <Button size="sm" variant="outline" onClick={() => handleRunExistingJob(job.id)}>
                            <Play className="w-3 h-3 mr-1" /> Executar
                          </Button>
                        )}
                        <IngestionJobActionsDropdown job={job} onAction={handleJobAction} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Job Detail Dialog */}
      <JobDetailDialog job={detailJob} items={detailItems || []} onClose={() => setDetailJob(null)} />
    </div>
  );
};

export default IngestionHubPage;
