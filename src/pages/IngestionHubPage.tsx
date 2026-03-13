import { useState, useCallback, useMemo } from "react";
import { Upload, FileSpreadsheet, Play, Eye, Loader2, CheckCircle, AlertCircle, Clock, ArrowRight, X, Database, Webhook } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useIngestionJobs, useIngestionJobItems, useParseIngestion, useRunIngestionJob, type IngestionJob } from "@/hooks/useIngestion";
import { ColumnMapper } from "@/components/ColumnMapper";
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

  const [activeTab, setActiveTab] = useState("import");
  const [dragOver, setDragOver] = useState(false);

  // Parsing state
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [mergeStrategy, setMergeStrategy] = useState("merge");
  const [dupFields, setDupFields] = useState("sku");

  // Preview state
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const { data: previewItems } = useIngestionJobItems(previewJobId);

  // Detail state
  const [detailJob, setDetailJob] = useState<IngestionJob | null>(null);
  const { data: detailItems } = useIngestionJobItems(detailJob?.id || null);

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      const text = await file.text();
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length === 0) return;
      const sep = lines[0].includes(";") ? ";" : ",";
      const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ""));
      const rows = lines.slice(1).map(line => {
        const vals = line.split(sep).map(v => v.trim().replace(/^"|"$/g, ""));
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
        return obj;
      });
      setParsedHeaders(headers);
      setParsedData(rows);
      // Auto-map
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
    } else if (ext === "xlsx" || ext === "xls") {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
      if (data.length === 0) return;
      const headers = Object.keys(data[0]);
      setParsedHeaders(headers);
      setParsedData(data);
      // Auto-map same as CSV
      const autoMap: Record<string, string> = {};
      headers.forEach(h => {
        const lower = h.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (lower.includes("sku") || lower === "ref") autoMap[h] = "sku";
        else if (lower.includes("title") || lower.includes("titulo") || lower.includes("nome") || lower === "name") autoMap[h] = "original_title";
        else if (lower.includes("desc") && !lower.includes("short")) autoMap[h] = "original_description";
        else if (lower.includes("price") || lower.includes("preco") || lower === "pvp") autoMap[h] = "original_price";
        else if (lower.includes("categ")) autoMap[h] = "category";
        else if (lower.includes("image") || lower.includes("foto")) autoMap[h] = "image_urls";
      });
      setFieldMappings(autoMap);
    } else if (ext === "json") {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      if (rows.length === 0) return;
      const headers = Object.keys(rows[0]);
      setParsedHeaders(headers);
      setParsedData(rows);
      setFieldMappings({});
    } else {
      toast.error("Formato não suportado. Use CSV, XLSX ou JSON.");
    }
  }, []);

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
      // Run the job
      await runJob.mutateAsync(result.jobId);
      resetForm();
    } catch {}
  };

  const handleRunExistingJob = async (jobId: string) => {
    try {
      await runJob.mutateAsync(jobId);
    } catch {}
  };

  const resetForm = () => {
    setParsedData(null);
    setParsedHeaders([]);
    setFileName("");
    setFieldMappings({});
    setPreviewResult(null);
    setPreviewJobId(null);
  };

  const mappedCount = Object.keys(fieldMappings).length;

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ingestion Hub</h1>
        <p className="text-muted-foreground mt-1">Importe, mapeie e valide dados de catálogo de múltiplas fontes.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="import" className="gap-2"><Upload className="w-4 h-4" /> Importar</TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2"><Clock className="w-4 h-4" /> Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6 mt-4">
          {!parsedData ? (
            /* Drop zone */
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
                <p className="text-sm text-muted-foreground mb-4">CSV, XLSX, XLS ou JSON</p>
                <Button variant="outline" asChild>
                  <label className="cursor-pointer">
                    Selecionar Ficheiro
                    <input type="file" accept=".csv,.xlsx,.xls,.json,.xml" className="hidden" onChange={onFileSelect} />
                  </label>
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Mapping & Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{fileName}</h2>
                  <p className="text-sm text-muted-foreground">{parsedData.length} linhas detectadas · {parsedHeaders.length} colunas</p>
                </div>
                <Button variant="ghost" size="sm" onClick={resetForm}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
              </div>

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

              {/* Field mapping */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Mapeamento de Campos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {parsedHeaders.map(header => (
                      <div key={header} className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded truncate min-w-0 flex-shrink" title={header}>
                          {header}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <Select
                          value={fieldMappings[header] || "__skip__"}
                          onValueChange={v => {
                            const next = { ...fieldMappings };
                            if (v === "__skip__") delete next[header];
                            else next[header] = v;
                            setFieldMappings(next);
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Ignorar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__skip__">— Ignorar —</SelectItem>
                            {PRODUCT_FIELDS.map(f => (
                              <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Data preview */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pré-visualização (primeiras 5 linhas)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs w-10">#</TableHead>
                          {parsedHeaders.slice(0, 8).map(h => (
                            <TableHead key={h} className="text-xs">{h}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.slice(0, 5).map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                            {parsedHeaders.slice(0, 8).map(h => (
                              <TableCell key={h} className="text-xs max-w-[200px] truncate">{String(row[h] ?? "")}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

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
                            <Badge key={g.key} variant="outline" className="text-xs">
                              {g.key} ({g.count} items)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preview items table */}
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
                                    )}>
                                      {item.action}
                                    </Badge>
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
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleDryRun} disabled={parseIngestion.isPending || mappedCount === 0}>
                  {parseIngestion.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Eye className="w-4 h-4 mr-1" />}
                  Preview (Dry Run)
                </Button>
                <Button onClick={handleLiveRun} disabled={parseIngestion.isPending || runJob.isPending || mappedCount === 0}>
                  {(parseIngestion.isPending || runJob.isPending) ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
                  Importar Agora
                </Button>
              </div>
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
                  <Card key={job.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setDetailJob(job)}>
                    <CardContent className="flex items-center gap-4 py-3">
                      <div className="flex-1 min-w-0">
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
                      {job.status === "dry_run" && (
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleRunExistingJob(job.id); }}>
                          <Play className="w-3 h-3 mr-1" /> Executar
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Job Detail Dialog */}
      <Dialog open={!!detailJob} onOpenChange={(open) => !open && setDetailJob(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailJob?.file_name || `Job ${detailJob?.id.slice(0, 8)}`}
              {detailJob && (
                <Badge className={cn("text-[10px]", (statusLabels[detailJob.status] || statusLabels.queued).color)}>
                  {(statusLabels[detailJob.status] || statusLabels.queued).label}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {detailJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[
                  { l: "Total", v: detailJob.total_rows },
                  { l: "Importados", v: detailJob.imported_rows },
                  { l: "Atualizados", v: detailJob.updated_rows },
                  { l: "Ignorados", v: detailJob.skipped_rows },
                  { l: "Duplicados", v: detailJob.duplicate_rows },
                  { l: "Erros", v: detailJob.failed_rows },
                ].map(s => (
                  <div key={s.l} className="text-center">
                    <p className="text-xl font-bold">{s.v}</p>
                    <p className="text-[10px] text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>

              {detailItems && detailItems.length > 0 && (
                <ScrollArea className="max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">#</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Ação</TableHead>
                        <TableHead className="text-xs">SKU</TableHead>
                        <TableHead className="text-xs">Título</TableHead>
                        <TableHead className="text-xs">Erro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs">{item.source_row_index + 1}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("text-[10px]",
                              item.status === "processed" ? "border-green-500 text-green-600" :
                              item.status === "error" ? "border-destructive text-destructive" :
                              item.status === "skipped" ? "border-muted text-muted-foreground" :
                              ""
                            )}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{item.action || "—"}</TableCell>
                          <TableCell className="text-xs font-mono">{item.mapped_data?.sku || item.source_data?.sku || "—"}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{item.mapped_data?.original_title || "—"}</TableCell>
                          <TableCell className="text-xs text-destructive max-w-[200px] truncate">{item.error_message || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IngestionHubPage;
