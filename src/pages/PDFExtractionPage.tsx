import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Eye, Brain, Send, Loader2, CheckCircle, AlertTriangle, XCircle, Table2 } from "lucide-react";
import { usePdfExtractions, usePdfPages, usePdfTables, useStartPdfExtraction, useVisionParsePage, useMapPdfToProducts } from "@/hooks/usePdfExtraction";
import { useUploadedFiles } from "@/hooks/useUploadedFiles";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  queued: { label: "Na fila", variant: "secondary" },
  extracting: { label: "A extrair", variant: "default" },
  reviewing: { label: "Em revisão", variant: "outline" },
  done: { label: "Concluído", variant: "default" },
  error: { label: "Erro", variant: "destructive" },
};

export default function PDFExtractionPage() {
  const { data: extractions, isLoading } = usePdfExtractions();
  const { data: files } = useUploadedFiles();
  const startExtraction = useStartPdfExtraction();
  const mapToProducts = useMapPdfToProducts();
  const [selectedExtraction, setSelectedExtraction] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string>("");

  const pdfFiles = (files || []).filter(f => f.file_type === "application/pdf" || f.file_name?.endsWith(".pdf"));

  const handleStartExtraction = () => {
    if (!selectedFileId) { toast.error("Seleciona um ficheiro PDF"); return; }
    startExtraction.mutate(selectedFileId);
    setSelectedFileId("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Extração PDF</h1>
          <p className="text-muted-foreground">Extrai dados estruturados de catálogos PDF de fabricantes</p>
        </div>
      </div>

      {/* Upload / Start Extraction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Nova Extração</CardTitle>
          <CardDescription>Seleciona um PDF já carregado para iniciar a extração automática</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 items-end">
          <div className="flex-1">
            <Select value={selectedFileId} onValueChange={setSelectedFileId}>
              <SelectTrigger><SelectValue placeholder="Seleciona um PDF..." /></SelectTrigger>
              <SelectContent>
                {pdfFiles.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.file_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleStartExtraction} disabled={startExtraction.isPending || !selectedFileId}>
            {startExtraction.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
            Extrair
          </Button>
        </CardContent>
      </Card>

      {/* Extractions List */}
      <Card>
        <CardHeader>
          <CardTitle>Extrações</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !extractions?.length ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma extração ainda</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ficheiro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Páginas</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extractions.map((ext: any) => {
                  const sc = statusConfig[ext.status] || statusConfig.queued;
                  return (
                    <TableRow key={ext.id}>
                      <TableCell className="font-medium">{ext.uploaded_files?.file_name || "—"}</TableCell>
                      <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                      <TableCell>{ext.processed_pages}/{ext.total_pages}</TableCell>
                      <TableCell className="capitalize">{ext.extraction_method || "—"}</TableCell>
                      <TableCell>{new Date(ext.created_at).toLocaleDateString("pt-PT")}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedExtraction(ext.id)}>
                          <Eye className="h-3 w-3 mr-1" /> Ver
                        </Button>
                        {ext.status === "reviewing" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => mapToProducts.mutate({ extractionId: ext.id })}>
                              <Table2 className="h-3 w-3 mr-1" /> Mapear
                            </Button>
                            <Button size="sm" onClick={() => mapToProducts.mutate({ extractionId: ext.id, sendToIngestion: true })}>
                              <Send className="h-3 w-3 mr-1" /> Enviar
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedExtraction && (
        <ExtractionDetailDialog
          extractionId={selectedExtraction}
          onClose={() => setSelectedExtraction(null)}
        />
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Detalhe da Extração
          </DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pages">Páginas ({pages?.length || 0})</TabsTrigger>
            <TabsTrigger value="tables">Tabelas ({tables?.length || 0})</TabsTrigger>
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
                            <Badge variant={page.has_tables ? "default" : "secondary"}>
                              {page.has_tables ? "Tabelas" : "Sem tabelas"}
                            </Badge>
                            <Badge variant="outline">Confiança: {page.confidence_score}%</Badge>
                            <Button size="sm" variant="outline" onClick={() => visionParse.mutate(page.id)}
                              disabled={visionParse.isPending}>
                              <Brain className="h-3 w-3 mr-1" /> AI Parse
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs bg-muted p-3 rounded-md max-h-40 overflow-auto whitespace-pre-wrap font-mono">
                          {(page.raw_text || "").substring(0, 500)}{(page.raw_text || "").length > 500 ? "..." : ""}
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
                        <CardTitle className="text-sm">
                          Tabela #{table.table_index} — {table.row_count} linhas × {table.col_count} colunas
                        </CardTitle>
                        <Badge variant="outline">Confiança: {table.confidence_score}%</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {(table.headers || []).map((h: string, i: number) => (
                                <TableHead key={i} className="text-xs">{h}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(table.pdf_table_rows || []).slice(0, 20).map((row: any) => (
                              <TableRow key={row.id}>
                                {(row.cells || []).map((cell: any, ci: number) => (
                                  <TableCell key={ci} className="text-xs">
                                    <div className="flex items-center gap-1">
                                      {cell.value}
                                      {cell.confidence >= 80 && <CheckCircle className="h-3 w-3 text-primary shrink-0" />}
                                      {cell.confidence >= 50 && cell.confidence < 80 && <AlertTriangle className="h-3 w-3 text-accent-foreground shrink-0" />}
                                      {cell.confidence < 50 && <XCircle className="h-3 w-3 text-destructive shrink-0" />}
                                    </div>
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {(table.pdf_table_rows || []).length > 20 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            A mostrar 20 de {table.pdf_table_rows.length} linhas
                          </p>
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
