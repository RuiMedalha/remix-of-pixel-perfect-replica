import { useState, useEffect, useRef } from "react";
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
  Globe, Loader2, MousePointerClick, Trash2, Play, Download,
  Eye, Link2, Image as ImageIcon, Type, FileText, ArrowRight, ArrowLeft, X,
  Zap, Coins, List, Navigation, Crosshair, ExternalLink, RefreshCw, Wand2,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

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

interface ExtractedLink {
  url: string;
  text: string;
  selected: boolean;
}

type Mode = "browse" | "select";
type Step = "url" | "browse" | "links" | "select-fields" | "batch" | "results";

export default function VisualScraperPage() {
  const { activeWorkspace } = useWorkspaceContext();
  const [step, setStep] = useState<Step>("url");
  const [url, setUrl] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [fields, setFields] = useState<SelectedField[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [navHistory, setNavHistory] = useState<string[]>([]);

  // Links extraction
  const [extractedLinks, setExtractedLinks] = useState<ExtractedLink[]>([]);
  const [linkFilter, setLinkFilter] = useState("");

  // Batch state
  const [batchLoading, setBatchLoading] = useState(false);
  const [results, setResults] = useState<ExtractedRow[]>([]);
  const [errors, setErrors] = useState<any[]>([]);

  // Dialogs
  const [showSendDialog, setShowSendDialog] = useState(false);

  // Cost control
  const [useFirecrawl, setUseFirecrawl] = useState(false);

  // Current iframe mode
  const [iframeMode, setIframeMode] = useState<Mode>("browse");

  // Listen for messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "navigate") {
        // User clicked a link in browse mode
        loadPage(e.data.url, "browse");
      } else if (e.data?.type === "element-selected") {
        const { selector, text, src, href, tagName } = e.data;
        let type: SelectedField["type"] = "text";
        let preview = text || "";
        if (tagName === "img" || src) { type = "image"; preview = src || ""; }
        else if (tagName === "a" || href) { type = "link"; preview = href || text || ""; }

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
  }, [fields.length, useFirecrawl]);

  const loadPage = async (targetUrl: string, mode: Mode) => {
    if (!targetUrl.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("proxy-page", {
        body: { url: targetUrl.trim(), useFirecrawl, mode },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setHtmlContent(data.html);
      setCurrentUrl(data.sourceUrl);
      setPageTitle(data.metadata?.title || targetUrl);
      setIframeMode(mode);

      if (mode === "browse") {
        setNavHistory(prev => [...prev, data.sourceUrl]);
        if (step === "url") setStep("browse");
      }
    } catch (err: any) {
      toast.error("Erro ao carregar página", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadUrl = () => loadPage(url, "browse");

  const handleGoBack = () => {
    if (navHistory.length > 1) {
      const prev = navHistory[navHistory.length - 2];
      setNavHistory(h => h.slice(0, -1));
      loadPage(prev, iframeMode);
    }
  };

  // Extract all links from current page for product listing
  const handleExtractLinks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-with-selectors", {
        body: {
          urls: [currentUrl],
          fields: [
            { name: "link_url", selector: "a[href]", type: "link" },
            { name: "link_text", selector: "a[href]", type: "text" },
          ],
          workspaceId: activeWorkspace?.id,
          useFirecrawl: false,
          extractAllMatches: true,
        },
      });
      if (error) throw error;

      // The scrape function returns one row per URL, but we need all links
      // Let's parse links from the HTML directly via a dedicated approach
      // For now, use the proxy to get all links
      const { data: proxyData } = await supabase.functions.invoke("proxy-page", {
        body: { url: currentUrl, useFirecrawl, mode: "browse" },
      });

      if (proxyData?.html) {
        // Parse links from HTML using DOMParser on client
        const parser = new DOMParser();
        const doc = parser.parseFromString(proxyData.html, "text/html");
        const anchors = doc.querySelectorAll("a[href]");
        const baseUrl = new URL(currentUrl);
        const links: ExtractedLink[] = [];
        const seen = new Set<string>();

        anchors.forEach(a => {
          try {
            let href = a.getAttribute("href") || "";
            if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) return;
            const fullUrl = new URL(href, baseUrl.origin).href;
            if (seen.has(fullUrl)) return;
            seen.add(fullUrl);
            // Only include links from same domain
            if (new URL(fullUrl).hostname === baseUrl.hostname) {
              links.push({
                url: fullUrl,
                text: (a.textContent || "").trim().substring(0, 120),
                selected: false,
              });
            }
          } catch { /* ignore invalid URLs */ }
        });

        setExtractedLinks(links);
        setStep("links");
        toast.success(`${links.length} links encontrados na página`);
      }
    } catch (err: any) {
      toast.error("Erro ao extrair links", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Enter selection mode on current page
  const handleEnterSelectMode = () => {
    loadPage(currentUrl, "select");
    setStep("select-fields");
  };

  // Go to a product page from links list
  const handleGoToProduct = (productUrl: string) => {
    setUrl(productUrl);
    loadPage(productUrl, "select");
    setStep("select-fields");
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
      toast.error("Selecione pelo menos um campo.");
      return;
    }
    setStep("batch");
  };

  const handleRunBatch = async () => {
    // Get URLs from selected links or manual input
    const selectedLinkUrls = extractedLinks.filter(l => l.selected).map(l => l.url);
    let urls = selectedLinkUrls.length > 0 ? selectedLinkUrls : [currentUrl];

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
      toast.error("Erro na extração", { description: err.message });
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
      const { data: job, error: jobError } = await supabase
        .from("ingestion_jobs")
        .insert({
          workspace_id: activeWorkspace.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          source_type: "api" as any,
          source_ref: currentUrl,
          status: "pending" as any,
          config: { type: "visual_scraper", fields: fields.map(f => f.name) },
        } as any)
        .select("id")
        .single();

      if (jobError) throw jobError;

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

      toast.success(`Job de ingestão criado com ${results.length} itens!`);
      setShowSendDialog(false);
    } catch (err: any) {
      toast.error("Erro ao criar job", { description: err.message });
    } finally {
      setBatchLoading(false);
    }
  };

  const toggleAllLinks = (selected: boolean) => {
    setExtractedLinks(prev => prev.map(l => ({ ...l, selected })));
  };

  const toggleLink = (url: string) => {
    setExtractedLinks(prev => prev.map(l => l.url === url ? { ...l, selected: !l.selected } : l));
  };

  const filteredLinks = extractedLinks.filter(l =>
    !linkFilter || l.url.toLowerCase().includes(linkFilter.toLowerCase()) ||
    l.text.toLowerCase().includes(linkFilter.toLowerCase())
  );

  const selectedLinksCount = extractedLinks.filter(l => l.selected).length;

  const typeIcons: Record<string, React.ReactNode> = {
    text: <Type className="w-3 h-3" />,
    image: <ImageIcon className="w-3 h-3" />,
    link: <Link2 className="w-3 h-3" />,
    html: <FileText className="w-3 h-3" />,
  };

  const stepLabels: Record<Step, string> = {
    url: "URL",
    browse: "Navegar",
    links: "Links",
    "select-fields": "Selecionar",
    batch: "Extrair",
    results: "Resultados",
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-0">
      {/* Top toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-background flex-shrink-0">
        <Globe className="w-5 h-5 text-primary" />
        <span className="font-semibold text-sm">Visual Scraper</span>

        {/* Step indicators */}
        <div className="flex gap-1 ml-3">
          {(Object.keys(stepLabels) as Step[]).filter(s => s !== "url" || step === "url").map((s, i) => (
            <Badge key={s} variant={step === s ? "default" : "outline"} className="text-[10px] px-1.5 py-0">
              {stepLabels[s]}
            </Badge>
          ))}
        </div>

        {/* Cost indicator */}
        <div className="ml-auto flex items-center gap-2">
          {useFirecrawl ? (
            <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">
              <Zap className="w-3 h-3 mr-1" /> Premium
            </Badge>
          ) : (
            <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-[10px]">
              <Coins className="w-3 h-3 mr-1" /> Gratuito
            </Badge>
          )}
          <Switch checked={useFirecrawl} onCheckedChange={setUseFirecrawl} className="scale-75" />
        </div>
      </div>

      {/* Step: URL Entry */}
      {step === "url" && (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Abrir Página do Fornecedor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Insira o URL da página de listagem de produtos. Poderá navegar livremente como num browser e depois selecionar os dados que pretende extrair.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="https://fornecedor.com/produtos"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLoadUrl()}
                  className="font-mono text-sm"
                />
                <Button onClick={handleLoadUrl} disabled={loading || !url.trim()}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  <span className="ml-1">Abrir</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Browse (full-page iframe with address bar) */}
      {(step === "browse" || step === "select-fields") && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/30 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleGoBack} disabled={navHistory.length <= 1 || loading}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => loadPage(currentUrl, iframeMode)} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <div className="flex-1 flex items-center gap-2 bg-background border rounded-md px-3 py-1 text-xs font-mono text-muted-foreground truncate">
              {loading && <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />}
              <span className="truncate">{currentUrl}</span>
            </div>
            <a href={currentUrl} target="_blank" rel="noreferrer">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>

            {/* Action buttons */}
            <div className="flex items-center gap-1 ml-2 border-l pl-2">
              {step === "browse" && (
                <>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleExtractLinks} disabled={loading}>
                    <List className="w-3.5 h-3.5 mr-1" /> Extrair Links
                  </Button>
                  <Button size="sm" className="h-7 text-xs" onClick={handleEnterSelectMode} disabled={loading}>
                    <Crosshair className="w-3.5 h-3.5 mr-1" /> Selecionar Campos
                  </Button>
                </>
              )}
              {step === "select-fields" && (
                <>
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-300">
                    <Crosshair className="w-3 h-3 mr-1" /> Modo Seleção
                  </Badge>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { loadPage(currentUrl, "browse"); setStep("browse"); }}>
                    <Navigation className="w-3.5 h-3.5 mr-1" /> Voltar a Navegar
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 flex min-h-0">
            {/* Iframe */}
            <div className="flex-1 relative">
              <iframe
                ref={iframeRef}
                srcDoc={htmlContent}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
                title="Preview da página"
              />
              {step === "select-fields" && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2 pointer-events-none">
                  <MousePointerClick className="w-3.5 h-3.5" />
                  Clique nos elementos que deseja extrair
                </div>
              )}
            </div>

            {/* Fields panel (only in select-fields step) */}
            {step === "select-fields" && (
              <div className="w-72 border-l flex flex-col bg-background flex-shrink-0">
                <div className="p-3 border-b flex items-center justify-between">
                  <span className="text-sm font-semibold">Campos ({fields.length})</span>
                  <Button size="sm" className="h-7 text-xs" onClick={handleGoToBatch} disabled={fields.length === 0}>
                    Avançar <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-2">
                    {fields.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-8 px-2">
                        Clique nos elementos da página para os adicionar como campos de extração.
                      </p>
                    )}
                    {fields.map(field => (
                      <div key={field.id} className="border rounded-lg p-2 space-y-1">
                        <div className="flex items-center gap-1">
                          <Input
                            value={field.name}
                            onChange={e => handleUpdateFieldName(field.id, e.target.value)}
                            className="h-6 text-xs font-medium"
                          />
                          <Select value={field.type} onValueChange={v => handleUpdateFieldType(field.id, v as any)}>
                            <SelectTrigger className="h-6 w-16 text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texto</SelectItem>
                              <SelectItem value="image">Img</SelectItem>
                              <SelectItem value="link">Link</SelectItem>
                              <SelectItem value="html">HTML</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveField(field.id)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                          {typeIcons[field.type]} {field.preview || "(vazio)"}
                        </p>
                        <p className="text-[9px] font-mono text-muted-foreground/40 truncate">{field.selector}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step: Links extraction */}
      {step === "links" && (
        <div className="flex-1 flex flex-col min-h-0 p-4 gap-3">
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setStep("browse")}>
              <ArrowLeft className="w-3 h-3 mr-1" /> Voltar
            </Button>
            <h2 className="font-semibold">Links Encontrados</h2>
            <Badge>{extractedLinks.length} total</Badge>
            {selectedLinksCount > 0 && <Badge variant="secondary">{selectedLinksCount} selecionados</Badge>}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toggleAllLinks(true)}>Selecionar Todos</Button>
              <Button variant="outline" size="sm" onClick={() => toggleAllLinks(false)}>Limpar</Button>
            </div>
          </div>

          <Input
            placeholder="Filtrar links por URL ou texto..."
            value={linkFilter}
            onChange={e => setLinkFilter(e.target.value)}
            className="max-w-md"
          />

          <p className="text-xs text-muted-foreground">
            Selecione os links das páginas de produto. Depois vá a uma página de produto para definir os campos a extrair.
          </p>

          <ScrollArea className="flex-1 border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredLinks.length > 0 && filteredLinks.every(l => l.selected)}
                      onCheckedChange={(c) => {
                        const urls = new Set(filteredLinks.map(l => l.url));
                        setExtractedLinks(prev => prev.map(l => urls.has(l.url) ? { ...l, selected: !!c } : l));
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-xs">URL</TableHead>
                  <TableHead className="text-xs">Texto</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLinks.map(link => (
                  <TableRow key={link.url} className={link.selected ? "bg-primary/5" : ""}>
                    <TableCell>
                      <Checkbox checked={link.selected} onCheckedChange={() => toggleLink(link.url)} />
                    </TableCell>
                    <TableCell className="text-xs font-mono truncate max-w-md" title={link.url}>
                      {link.url}
                    </TableCell>
                    <TableCell className="text-xs truncate max-w-48">{link.text || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleGoToProduct(link.url)} title="Abrir e selecionar campos">
                        <Crosshair className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          {selectedLinksCount > 0 && fields.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={handleGoToBatch}>
                <Play className="w-4 h-4 mr-1" /> Extrair {selectedLinksCount} páginas ({fields.length} campos)
              </Button>
            </div>
          )}

          {selectedLinksCount > 0 && fields.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-lg p-3 bg-muted/30">
              <Wand2 className="w-4 h-4" />
              <span>Selecione links e depois clique no <Crosshair className="w-3 h-3 inline" /> de uma página para definir os campos a extrair.</span>
            </div>
          )}
        </div>
      )}

      {/* Step: Batch confirmation */}
      {step === "batch" && (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-xl w-full">
            <CardHeader>
              <CardTitle className="text-base">Confirmar Extração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Campos a extrair:
                </p>
                <div className="flex flex-wrap gap-1">
                  {fields.map(f => (
                    <Badge key={f.id} variant="secondary" className="text-xs">
                      {typeIcons[f.type]} {f.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {selectedLinksCount > 0
                    ? `${selectedLinksCount} páginas selecionadas`
                    : `1 página (${currentUrl})`}
                </p>
                {useFirecrawl && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                    <Zap className="w-3 h-3 mr-1" /> Modo Premium — irá gastar créditos
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(selectedLinksCount > 0 ? "links" : "select-fields")}>
                  ← Voltar
                </Button>
                <Button onClick={handleRunBatch} disabled={batchLoading}>
                  {batchLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                  Extrair Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Results */}
      {step === "results" && (
        <div className="flex-1 flex flex-col min-h-0 gap-3 p-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge>{results.length} produtos extraídos</Badge>
            {errors.length > 0 && <Badge variant="destructive">{errors.length} erros</Badge>}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep("batch")}>← Voltar</Button>
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

          <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar para Ingestion Hub</DialogTitle>
                <DialogDescription>
                  Serão criados <strong>{results.length}</strong> itens para revisão e aprovação.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSendDialog(false)}>Cancelar</Button>
                <Button onClick={handleSendToProducts} disabled={batchLoading}>
                  {batchLoading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
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
