import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceContext } from "@/hooks/useWorkspaces";
import {
  Globe, Loader2, MousePointerClick, Trash2, Play, Download, Plus,
  Eye, Tag, Link2, Image as ImageIcon, Type, FileText, ArrowRight, X, Zap, Coins
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface SelectedField {
  id: string;
  name: string;
  selector: string;
  type: "text" | "image" | "link" | "html";
  preview: string;
}

interface ExtractedRow {
  [key: string]: string;
}

type Step = "url" | "select" | "batch" | "results";

export default function VisualScraperPage() {
  const { activeWorkspace } = useWorkspaceContext();
  const [step, setStep] = useState<Step>("url");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [fields, setFields] = useState<SelectedField[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Batch state
  const [batchUrls, setBatchUrls] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);
  const [results, setResults] = useState<ExtractedRow[]>([]);
  const [errors, setErrors] = useState<any[]>([]);

  // Send to products dialog
  const [showSendDialog, setShowSendDialog] = useState(false);

  // Cost control
  const [useFirecrawl, setUseFirecrawl] = useState(false);
  const [fetchMethod, setFetchMethod] = useState<string>("native");

  // Listen for messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "element-selected") {
        const { selector, text, src, href, tagName } = e.data;
        // Auto-detect field type
        let type: SelectedField["type"] = "text";
        let preview = text || "";
        if (tagName === "img" || src) {
          type = "image";
          preview = src || "";
        } else if (tagName === "a" || href) {
          type = "link";
          preview = href || text || "";
        }

        const newField: SelectedField = {
          id: crypto.randomUUID(),
          name: `Campo ${fields.length + 1}`,
          selector,
          type,
          preview: preview.substring(0, 200),
        };
        setFields(prev => [...prev, newField]);
        toast.success("Elemento selecionado!", { description: preview.substring(0, 80) });
      } else if (e.data?.type === "element-deselected") {
        setFields(prev => prev.filter(f => f.selector !== e.data.selector));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [fields.length]);

  const handleLoadPage = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("proxy-page", {
        body: { url: url.trim(), useFirecrawl },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setHtmlContent(data.html);
      setSourceUrl(data.sourceUrl);
      setFetchMethod(data.fetchMethod || "native");
      setFields([]);
      setStep("select");
      const methodLabel = data.fetchMethod === "firecrawl" ? "via Firecrawl" : "gratuito";
      toast.success(`Página carregada (${methodLabel})!`, { description: data.metadata?.title || url });
    } catch (err: any) {
      toast.error("Erro ao carregar página", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const handleUpdateFieldName = (id: string, name: string) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, name } : f));
  };

  const handleUpdateFieldType = (id: string, type: SelectedField["type"]) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, type } : f));
  };

  const handleGoToBatch = () => {
    if (fields.length === 0) {
      toast.error("Selecione pelo menos um campo antes de avançar.");
      return;
    }
    setStep("batch");
  };

  const handleRunBatch = async () => {
    const urls = batchUrls
      .split("\n")
      .map(u => u.trim())
      .filter(u => u.length > 0);

    if (urls.length === 0) {
      // If no batch URLs, just use current URL
      urls.push(sourceUrl);
    }

    setBatchLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-with-selectors", {
        body: {
          urls,
          fields: fields.map(f => ({ name: f.name, selector: f.selector, type: f.type })),
          workspaceId: activeWorkspace?.id,
          useFirecrawl,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResults(data.results || []);
      setErrors(data.errors || []);
      setStep("results");
      const costMsg = data.firecrawlCreditsUsed > 0 
        ? `(${data.firecrawlCreditsUsed} créditos Firecrawl)` 
        : "(gratuito)";
      toast.success(`${data.extracted} URLs extraídas ${costMsg}`);
    } catch (err: any) {
      toast.error("Erro na extração em lote", { description: err.message });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;
    const headers = Object.keys(results[0]);
    const csv = [
      headers.join(","),
      ...results.map(row =>
        headers.map(h => `"${(row[h] || "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "scrape-results.csv";
    a.click();
  };

  const handleSendToProducts = async () => {
    if (!activeWorkspace?.id || results.length === 0) return;
    setBatchLoading(true);
    try {
      // Create ingestion job with the scraped data
      const { data: job, error: jobError } = await supabase
        .from("ingestion_jobs")
        .insert({
          workspace_id: activeWorkspace.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          source_type: "api" as any,
          source_ref: sourceUrl,
          status: "pending" as any,
          config: { type: "visual_scraper", fields: fields.map(f => f.name) },
        } as any)
        .select("id")
        .single();

      if (jobError) throw jobError;

      // Insert items
      const items = results.map((row, idx) => ({
        job_id: job.id,
        item_index: idx,
        source_data: row,
        mapped_data: row,
        status: "pending" as any,
      }));

      for (let i = 0; i < items.length; i += 50) {
        await supabase.from("ingestion_job_items").insert(items.slice(i, i + 50) as any);
      }

      toast.success(`Job de ingestão criado com ${results.length} itens!`, {
        description: "Aceda ao Ingestion Hub para rever e aprovar.",
      });
      setShowSendDialog(false);
    } catch (err: any) {
      toast.error("Erro ao criar job", { description: err.message });
    } finally {
      setBatchLoading(false);
    }
  };

  const typeIcons = {
    text: <Type className="w-3 h-3" />,
    image: <ImageIcon className="w-3 h-3" />,
    link: <Link2 className="w-3 h-3" />,
    html: <FileText className="w-3 h-3" />,
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-4 p-4">
      {/* Top bar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Globe className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold">Visual Scraper</h1>
        <div className="flex gap-1 ml-4">
          {(["url", "select", "batch", "results"] as Step[]).map((s, i) => (
            <Badge
              key={s}
              variant={step === s ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                if (s === "url" || (s === "select" && htmlContent) || (s === "batch" && fields.length) || (s === "results" && results.length)) {
                  setStep(s);
                }
              }}
            >
              {i + 1}. {s === "url" ? "URL" : s === "select" ? "Selecionar" : s === "batch" ? "Lote" : "Resultados"}
            </Badge>
          ))}
        </div>
      </div>

      {/* Step 1: Enter URL */}
      {step === "url" && (
        <Card className="max-w-2xl mx-auto mt-12 w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointerClick className="w-5 h-5" />
              Selecionar dados visualmente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Insira o URL de um fornecedor. A página será carregada e poderá clicar nos elementos que deseja extrair (nome, preço, SKU, imagens...).
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="https://fornecedor.com/produtos"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLoadPage()}
              />
              <Button onClick={handleLoadPage} disabled={loading || !url.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                <span className="ml-1">Carregar</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Visual Selection */}
      {step === "select" && (
        <div className="flex-1 flex gap-3 min-h-0">
          {/* iframe */}
          <div className="flex-1 border rounded-lg overflow-hidden bg-background relative">
            <div className="absolute top-2 left-2 z-10 bg-background/90 backdrop-blur px-3 py-1 rounded-full text-xs text-muted-foreground border flex items-center gap-2">
              <MousePointerClick className="w-3 h-3" />
              Clique nos elementos para selecionar
            </div>
            <iframe
              ref={iframeRef}
              srcDoc={htmlContent}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              title="Preview da página"
            />
          </div>

          {/* Fields panel */}
          <Card className="w-80 flex-shrink-0 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Campos Selecionados ({fields.length})</span>
                <Button size="sm" onClick={handleGoToBatch} disabled={fields.length === 0}>
                  Avançar <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
              <CardContent className="space-y-2">
                {fields.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Clique nos elementos da página à esquerda para os adicionar como campos de extração.
                  </p>
                )}
                {fields.map(field => (
                  <div key={field.id} className="border rounded-lg p-2 space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Input
                        value={field.name}
                        onChange={e => handleUpdateFieldName(field.id, e.target.value)}
                        className="h-7 text-xs font-medium"
                        placeholder="Nome do campo"
                      />
                      <Select
                        value={field.type}
                        onValueChange={v => handleUpdateFieldType(field.id, v as any)}
                      >
                        <SelectTrigger className="h-7 w-20 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texto</SelectItem>
                          <SelectItem value="image">Imagem</SelectItem>
                          <SelectItem value="link">Link</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleRemoveField(field.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate" title={field.preview}>
                      {typeIcons[field.type]} {field.preview || "(vazio)"}
                    </p>
                    <p className="text-[9px] font-mono text-muted-foreground/50 truncate" title={field.selector}>
                      {field.selector}
                    </p>
                  </div>
                ))}
              </CardContent>
            </ScrollArea>
          </Card>
        </div>
      )}

      {/* Step 3: Batch URLs */}
      {step === "batch" && (
        <Card className="max-w-2xl mx-auto mt-8 w-full">
          <CardHeader>
            <CardTitle className="text-base">Extração em Lote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cole os URLs das páginas de produto do mesmo fornecedor (um por linha).
              Os seletores definidos serão aplicados a cada página.
            </p>
            <div className="flex flex-wrap gap-1 mb-2">
              {fields.map(f => (
                <Badge key={f.id} variant="secondary" className="text-xs">
                  {typeIcons[f.type]} {f.name}
                </Badge>
              ))}
            </div>
            <Textarea
              placeholder={`${sourceUrl}\nhttps://fornecedor.com/produto-2\nhttps://fornecedor.com/produto-3`}
              value={batchUrls}
              onChange={e => setBatchUrls(e.target.value)}
              rows={8}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              {batchUrls.split("\n").filter(u => u.trim()).length || 0} URLs
              {!batchUrls.trim() && ` • Deixe vazio para extrair apenas da página original`}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("select")}>
                ← Voltar
              </Button>
              <Button onClick={handleRunBatch} disabled={batchLoading}>
                {batchLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                Extrair Dados
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results */}
      {step === "results" && (
        <div className="flex-1 flex flex-col min-h-0 gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge>{results.length} produtos extraídos</Badge>
            {errors.length > 0 && <Badge variant="destructive">{errors.length} erros</Badge>}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep("batch")}>
                ← Voltar
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="w-3 h-3 mr-1" /> CSV
              </Button>
              <Button size="sm" onClick={() => setShowSendDialog(true)}>
                <ArrowRight className="w-3 h-3 mr-1" /> Enviar p/ Ingestão
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  {results[0] && Object.keys(results[0]).map(key => (
                    <TableHead key={key} className="text-xs">{key}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    {Object.values(row).map((val, ci) => (
                      <TableCell key={ci} className="text-xs max-w-48 truncate" title={val}>
                        {val?.startsWith("http") ? (
                          <a href={val} target="_blank" rel="noreferrer" className="text-primary underline">
                            {val.substring(0, 40)}...
                          </a>
                        ) : (
                          val?.substring(0, 100) || "—"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Send to ingestion dialog */}
          <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar para Ingestion Hub</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Serão criados <strong>{results.length}</strong> itens no Ingestion Hub para revisão e aprovação antes de entrarem no catálogo.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSendDialog(false)}>Cancelar</Button>
                <Button onClick={handleSendToProducts} disabled={batchLoading}>
                  {batchLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Criar Job de Ingestão
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
