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
import { DEFAULT_PRODUCT_FIELDS } from "@/hooks/useUploadCatalog";
import {
  Globe, Loader2, MousePointerClick, Trash2, Play, Download,
  Eye, Link2, Image as ImageIcon, Type, FileText, ArrowRight, ArrowLeft, X,
  Zap, Coins, List, Navigation, Crosshair, ExternalLink, RefreshCw, Wand2,
  Upload, ChevronRight, Layers, FileSpreadsheet, Plus,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SelectedField {
  id: string;
  name: string;
  selector: string;
  type: "text" | "image" | "link" | "html";
  preview: string;
  isVariation?: boolean;
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
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [paginationUrls, setPaginationUrls] = useState<string[]>([]);
  const [crawledPages, setCrawledPages] = useState<string[]>([]);

  // Manual URL import
  const [manualUrls, setManualUrls] = useState("");
  const [urlImportTab, setUrlImportTab] = useState<"extract" | "import">("extract");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch state
  const [batchLoading, setBatchLoading] = useState(false);
  const [results, setResults] = useState<ExtractedRow[]>([]);
  const [errors, setErrors] = useState<any[]>([]);

  // Dialogs
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [scraperMapping, setScraperMapping] = useState<Record<string, string>>({});

  // Cost control
  const [useFirecrawl, setUseFirecrawl] = useState(false);

  // Current iframe mode
  const [iframeMode, setIframeMode] = useState<Mode>("browse");

  // Listen for messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "navigate") {
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
          isVariation: false,
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

  // Extract links + detect pagination from a page
  const extractLinksFromPage = async (pageUrl: string): Promise<{ links: ExtractedLink[]; nextPages: string[] }> => {
    const { data: proxyData } = await supabase.functions.invoke("proxy-page", {
      body: { url: pageUrl, useFirecrawl, mode: "browse" },
    });

    if (!proxyData?.html) return { links: [], nextPages: [] };

    const parser = new DOMParser();
    const doc = parser.parseFromString(proxyData.html, "text/html");
    const anchors = doc.querySelectorAll("a[href]");
    const baseUrl = new URL(pageUrl);
    const links: ExtractedLink[] = [];
    const seen = new Set<string>();

    anchors.forEach(a => {
      try {
        let href = a.getAttribute("href") || "";
        if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) return;
        const fullUrl = new URL(href, baseUrl.origin).href;
        if (seen.has(fullUrl)) return;
        seen.add(fullUrl);
        if (new URL(fullUrl).hostname === baseUrl.hostname) {
          links.push({
            url: fullUrl,
            text: (a.textContent || "").trim().substring(0, 120),
            selected: false,
          });
        }
      } catch { /* ignore */ }
    });

    // Detect pagination links (next page, page 2, 3, etc.)
    const paginationSelectors = [
      'a.next', 'a.next-page', '.pagination a', 'nav.pagination a',
      'a[rel="next"]', '.woocommerce-pagination a', '.page-numbers a',
      'a[aria-label*="next" i]', 'a[aria-label*="próx" i]', 'a[aria-label*="seguinte" i]',
      '.pager a', '.paging a', 'ul.pages a', '.paginator a',
    ];

    const nextPages: string[] = [];
    const seenPages = new Set<string>();
    paginationSelectors.forEach(sel => {
      try {
        doc.querySelectorAll(sel).forEach(el => {
          const href = el.getAttribute("href");
          if (href) {
            try {
              const fullUrl = new URL(href, baseUrl.origin).href;
              if (!seenPages.has(fullUrl) && fullUrl !== pageUrl) {
                seenPages.add(fullUrl);
                nextPages.push(fullUrl);
              }
            } catch { /* ignore */ }
          }
        });
      } catch { /* ignore */ }
    });

    return { links, nextPages };
  };

  // Initial link extraction
  const handleExtractLinks = async () => {
    setLoading(true);
    try {
      const { links, nextPages } = await extractLinksFromPage(currentUrl);
      setExtractedLinks(links);
      setPaginationUrls(nextPages);
      setCrawledPages([currentUrl]);
      setStep("links");
      toast.success(`${links.length} links encontrados. ${nextPages.length} páginas de paginação detetadas.`);
    } catch (err: any) {
      toast.error("Erro ao extrair links", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Follow pagination to get more product links
  const handleFollowPagination = async (pageUrl?: string) => {
    setPaginationLoading(true);
    try {
      const targetUrl = pageUrl || paginationUrls[0];
      if (!targetUrl) return;

      const { links: newLinks, nextPages } = await extractLinksFromPage(targetUrl);

      // Merge new links (dedup by URL)
      const existingUrls = new Set(extractedLinks.map(l => l.url));
      const uniqueNewLinks = newLinks.filter(l => !existingUrls.has(l.url));

      setExtractedLinks(prev => [...prev, ...uniqueNewLinks]);
      setCrawledPages(prev => [...prev, targetUrl]);

      // Update pagination: remove crawled, add newly discovered
      const crawled = new Set([...crawledPages, targetUrl]);
      const allNextPages = [...paginationUrls, ...nextPages].filter(
        u => !crawled.has(u) && !crawledPages.includes(u)
      );
      const uniqueNextPages = [...new Set(allNextPages)];
      setPaginationUrls(uniqueNextPages);

      toast.success(`+${uniqueNewLinks.length} novos links. ${uniqueNextPages.length} páginas restantes.`);
    } catch (err: any) {
      toast.error("Erro ao seguir paginação", { description: err.message });
    } finally {
      setPaginationLoading(false);
    }
  };

  // Follow ALL pagination automatically
  const handleFollowAllPagination = async () => {
    setPaginationLoading(true);
    try {
      let remaining = [...paginationUrls];
      let allCrawled = new Set(crawledPages);
      let allLinks = [...extractedLinks];
      const existingUrls = new Set(allLinks.map(l => l.url));
      let totalNew = 0;

      while (remaining.length > 0 && allCrawled.size < 50) { // Safety limit 50 pages
        const targetUrl = remaining.shift()!;
        if (allCrawled.has(targetUrl)) continue;

        const { links: newLinks, nextPages } = await extractLinksFromPage(targetUrl);
        allCrawled.add(targetUrl);

        const uniqueNew = newLinks.filter(l => !existingUrls.has(l.url));
        uniqueNew.forEach(l => existingUrls.add(l.url));
        allLinks = [...allLinks, ...uniqueNew];
        totalNew += uniqueNew.length;

        // Add new pagination pages
        nextPages.forEach(p => {
          if (!allCrawled.has(p) && !remaining.includes(p)) {
            remaining.push(p);
          }
        });
      }

      setExtractedLinks(allLinks);
      setCrawledPages([...allCrawled]);
      setPaginationUrls(remaining);

      toast.success(`Paginação completa: +${totalNew} links de ${allCrawled.size} páginas.`);
    } catch (err: any) {
      toast.error("Erro na paginação automática", { description: err.message });
    } finally {
      setPaginationLoading(false);
    }
  };

  // Import URLs from Excel/CSV file
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split(/[\r\n]+/).filter(Boolean);

      // Try to detect if first line is a header
      const firstLine = lines[0]?.toLowerCase() || "";
      const hasHeader = firstLine.includes("url") || firstLine.includes("link") || firstLine.includes("sku");
      const dataLines = hasHeader ? lines.slice(1) : lines;

      const urls: string[] = [];
      dataLines.forEach(line => {
        // Split by common delimiters
        const parts = line.split(/[,;\t]/);
        parts.forEach(part => {
          const trimmed = part.trim().replace(/^["']|["']$/g, "");
          if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            urls.push(trimmed);
          }
        });
      });

      if (urls.length === 0) {
        toast.error("Nenhum URL encontrado no ficheiro. Certifique-se que as URLs começam com http:// ou https://");
        return;
      }

      const existingUrls = new Set(extractedLinks.map(l => l.url));
      const newLinks: ExtractedLink[] = urls
        .filter(u => !existingUrls.has(u))
        .map(u => ({ url: u, text: "", selected: true }));

      setExtractedLinks(prev => [...prev, ...newLinks]);
      setStep("links");
      toast.success(`${newLinks.length} URLs importadas do ficheiro.`);
    } catch (err: any) {
      toast.error("Erro ao ler ficheiro", { description: err.message });
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Import URLs from textarea
  const handleManualUrlImport = () => {
    const urls = manualUrls
      .split(/[\r\n,;]+/)
      .map(u => u.trim())
      .filter(u => u.startsWith("http://") || u.startsWith("https://"));

    if (urls.length === 0) {
      toast.error("Nenhum URL válido encontrado.");
      return;
    }

    const existingUrls = new Set(extractedLinks.map(l => l.url));
    const newLinks: ExtractedLink[] = urls
      .filter(u => !existingUrls.has(u))
      .map(u => ({ url: u, text: "", selected: true }));

    setExtractedLinks(prev => [...prev, ...newLinks]);
    setManualUrls("");
    setStep("links");
    toast.success(`${newLinks.length} URLs adicionadas.`);
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

  const handleToggleVariation = (id: string) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, isVariation: !f.isVariation } : f));
  };

  const handleGoToBatch = () => {
    if (fields.length === 0) {
      toast.error("Selecione pelo menos um campo.");
      return;
    }
    setStep("batch");
  };

  const handleRunBatch = async () => {
    const selectedLinkUrls = extractedLinks.filter(l => l.selected).map(l => l.url);
    let urls = selectedLinkUrls.length > 0 ? selectedLinkUrls : [currentUrl];

    setBatchLoading(true);
    try {
      // Split into chunks of 20 to avoid timeouts
      const allResults: ExtractedRow[] = [];
      const allErrors: any[] = [];
      let firecrawlTotal = 0;

      for (let i = 0; i < urls.length; i += 20) {
        const chunk = urls.slice(i, i + 20);
        const { data, error } = await supabase.functions.invoke("scrape-with-selectors", {
          body: {
            urls: chunk,
            fields: fields.map(f => ({
              name: f.name,
              selector: f.selector,
              type: f.type,
              isVariation: f.isVariation,
            })),
            workspaceId: activeWorkspace?.id,
            useFirecrawl,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        allResults.push(...(data.results || []));
        allErrors.push(...(data.errors || []));
        firecrawlTotal += data.firecrawlCreditsUsed || 0;

        // Progress toast
        if (urls.length > 20) {
          toast.info(`Progresso: ${Math.min(i + 20, urls.length)}/${urls.length} páginas...`);
        }
      }

      setResults(allResults);
      setErrors(allErrors);
      setStep("results");
      const costMsg = firecrawlTotal > 0
        ? `(${firecrawlTotal} créditos Firecrawl)`
        : "(gratuito)";
      toast.success(`${allResults.length} produtos extraídos ${costMsg}`);
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
          {(Object.keys(stepLabels) as Step[]).filter(s => s !== "url" || step === "url").map((s) => (
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
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Abrir Página do Fornecedor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Insira o URL da página de categorias/listagem de produtos. Poderá navegar, extrair links de produtos (com paginação) e depois definir os campos a extrair.
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
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Ou importe uma lista de URLs
                </p>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls,.txt"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-1" /> Importar CSV/Excel
                    </Button>
                    <span className="text-xs text-muted-foreground self-center">
                      Ficheiro com uma coluna de URLs (CSV, TXT)
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Textarea
                      placeholder={"Cole aqui os URLs dos produtos (um por linha):\nhttps://loja.com/produto-1\nhttps://loja.com/produto-2\nhttps://loja.com/produto-3"}
                      value={manualUrls}
                      onChange={e => setManualUrls(e.target.value)}
                      rows={4}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleManualUrlImport}
                      disabled={!manualUrls.trim()}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Adicionar URLs
                    </Button>
                  </div>
                </div>
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
              <div className="w-80 border-l flex flex-col bg-background flex-shrink-0">
                <div className="p-3 border-b flex items-center justify-between">
                  <span className="text-sm font-semibold">Campos ({fields.length})</span>
                  <div className="flex gap-1">
                    {extractedLinks.filter(l => l.selected).length > 0 && (
                      <Badge variant="outline" className="text-[10px]">{extractedLinks.filter(l => l.selected).length} URLs</Badge>
                    )}
                    <Button size="sm" className="h-7 text-xs" onClick={handleGoToBatch} disabled={fields.length === 0}>
                      Avançar <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
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
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-mono text-muted-foreground/40 truncate flex-1">{field.selector}</p>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <Checkbox
                              checked={field.isVariation}
                              onCheckedChange={() => handleToggleVariation(field.id)}
                              className="h-3 w-3"
                            />
                            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                              <Layers className="w-2.5 h-2.5" /> Variação
                            </span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {fields.some(f => f.isVariation) && (
                  <div className="p-2 border-t bg-amber-50 dark:bg-amber-950/20">
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      Campos marcados como "Variação" serão extraídos como lista de opções (ex: cores, tamanhos).
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step: Links extraction */}
      {step === "links" && (
        <div className="flex-1 flex flex-col min-h-0 p-4 gap-3">
          <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setStep("browse")}>
              <ArrowLeft className="w-3 h-3 mr-1" /> Voltar
            </Button>
            <h2 className="font-semibold">Links Encontrados</h2>
            <Badge>{extractedLinks.length} total</Badge>
            {selectedLinksCount > 0 && <Badge variant="secondary">{selectedLinksCount} selecionados</Badge>}
            <Badge variant="outline" className="text-[10px]">{crawledPages.length} pág. percorridas</Badge>
            <div className="ml-auto flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => toggleAllLinks(true)}>Selecionar Todos</Button>
              <Button variant="outline" size="sm" onClick={() => toggleAllLinks(false)}>Limpar</Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-3 h-3 mr-1" /> Importar URLs
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
          </div>

          {/* Pagination controls */}
          {paginationUrls.length > 0 && (
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30 flex-shrink-0">
              <ChevronRight className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                {paginationUrls.length} página(s) de paginação detetadas
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFollowPagination()}
                disabled={paginationLoading}
                className="ml-auto"
              >
                {paginationLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                Próxima Página
              </Button>
              <Button
                size="sm"
                onClick={handleFollowAllPagination}
                disabled={paginationLoading}
              >
                {paginationLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                Percorrer Todas ({paginationUrls.length})
              </Button>
            </div>
          )}

          <Input
            placeholder="Filtrar links por URL ou texto..."
            value={linkFilter}
            onChange={e => setLinkFilter(e.target.value)}
            className="max-w-md"
          />

          <p className="text-xs text-muted-foreground">
            Selecione os links das páginas de produto. Depois clique no <Crosshair className="w-3 h-3 inline" /> para ir a uma página e definir os campos a extrair.
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
                      {f.isVariation && <Layers className="w-2.5 h-2.5 ml-1 text-amber-500" />}
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

              {fields.some(f => f.isVariation) && (
                <div className="p-3 border rounded-lg bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-700 dark:text-amber-400">
                  <p className="flex items-center gap-1 font-medium"><Layers className="w-3 h-3" /> Variações detetadas</p>
                  <p className="mt-1">Os campos de variação serão extraídos como lista. Cada combinação gerará uma linha separada nos resultados.</p>
                </div>
              )}

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
