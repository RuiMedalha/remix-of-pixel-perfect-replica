import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Globe, Loader2, Search, Play, Eye, Zap, Coins, Brain, CheckCircle2,
  AlertTriangle, XCircle, ArrowRight, RefreshCw, Layers, Settings2,
  ChevronRight, Target, Wand2, Plus, FileText, Download, BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useWebsiteExtractionAgent } from "@/hooks/useWebsiteExtractionAgent";

type AgentPhase = "setup" | "discovery" | "test" | "preview" | "scale";

const FIELD_LABELS: Record<string, string> = {
  product_name: "Nome do Produto",
  sku: "SKU / Referência",
  supplier_reference: "Ref. Fornecedor",
  brand: "Marca",
  price: "Preço",
  description: "Descrição",
  short_description: "Descrição Curta",
  image_urls: "Imagens",
  technical_specs: "Especificações",
  attributes: "Atributos",
  downloads: "Downloads",
  accessories: "Acessórios",
  category_breadcrumbs: "Categorias",
};

const PAGE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  likely_product_page: { label: "Produto", color: "bg-emerald-500/10 text-emerald-600" },
  likely_category_page: { label: "Categoria", color: "bg-blue-500/10 text-blue-600" },
  likely_search_page: { label: "Pesquisa", color: "bg-amber-500/10 text-amber-600" },
  likely_document_page: { label: "Documento", color: "bg-purple-500/10 text-purple-600" },
  info_page: { label: "Info", color: "bg-muted text-muted-foreground" },
  unknown: { label: "Desconhecido", color: "bg-muted text-muted-foreground" },
  error: { label: "Erro", color: "bg-destructive/10 text-destructive" },
};

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-destructive";
  return <span className={`text-xs font-mono font-semibold ${color}`}>{pct}%</span>;
}

export default function WebsiteExtractionAgentPage() {
  const agent = useWebsiteExtractionAgent();
  const [phase, setPhase] = useState<AgentPhase>("setup");
  const [targetUrl, setTargetUrl] = useState("");
  const [useFirecrawl, setUseFirecrawl] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);

  // Discovery results
  const [discoveryResult, setDiscoveryResult] = useState<any>(null);
  const [discoveredLinks, setDiscoveredLinks] = useState<any[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Record<string, boolean>>({});

  // Test extraction results
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testSampleSize, setTestSampleSize] = useState(5);

  // Config dialog
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [newConfigDomain, setNewConfigDomain] = useState("");
  const [newConfigName, setNewConfigName] = useState("");

  // Learnings dialog
  const [showLearningsDialog, setShowLearningsDialog] = useState(false);

  const configsList = agent.configs.data || [];

  // ── Phase A: Discovery ──

  const handleDiscover = async () => {
    if (!targetUrl) { toast.error("Introduza um URL"); return; }
    try {
      const result = await agent.discover.mutateAsync({
        target_url: targetUrl,
        config_id: selectedConfigId || undefined,
        use_firecrawl: useFirecrawl,
      });
      setDiscoveryResult(result);
      setDiscoveredLinks(result.links || []);
      // Auto-select product pages
      const autoSelected: Record<string, boolean> = {};
      (result.links || []).forEach((l: any) => {
        if (l.type === "likely_product_page") autoSelected[l.url] = true;
      });
      setSelectedUrls(autoSelected);
      setPhase("discovery");
    } catch { /* handled by mutation */ }
  };

  // ── Phase B: Test Extraction ──

  const handleTestExtraction = async () => {
    const urls = Object.entries(selectedUrls)
      .filter(([, selected]) => selected)
      .map(([url]) => url)
      .slice(0, testSampleSize);

    if (urls.length === 0) { toast.error("Selecione páginas para testar"); return; }

    try {
      const result = await agent.extractTest.mutateAsync({
        urls,
        config_id: selectedConfigId || undefined,
        run_id: discoveryResult?.run_id,
        use_firecrawl: useFirecrawl,
      });
      setTestResults(result.extractions || []);
      setPhase("preview");
    } catch { /* handled by mutation */ }
  };

  // ── Phase C: Scale ──

  const handleScaleExtraction = async () => {
    const productUrls = discoveredLinks
      .filter(l => l.type === "likely_product_page")
      .map(l => l.url);

    if (productUrls.length === 0) { toast.error("Nenhuma página de produto encontrada"); return; }

    try {
      const result = await agent.extractTest.mutateAsync({
        urls: productUrls,
        config_id: selectedConfigId || undefined,
        run_id: discoveryResult?.run_id,
        use_firecrawl: useFirecrawl,
      });
      setTestResults(result.extractions || []);
      setPhase("scale");
      toast.success(`Extração em escala concluída: ${result.total} páginas`);
    } catch { /* handled by mutation */ }
  };

  // ── Create Config ──

  const handleCreateConfig = async () => {
    if (!newConfigDomain) return;
    try {
      const result = await agent.createConfig.mutateAsync({
        domain: newConfigDomain,
        display_name: newConfigName || newConfigDomain,
      });
      setSelectedConfigId(result.id);
      setShowConfigDialog(false);
      setNewConfigDomain("");
      setNewConfigName("");
    } catch { /* handled */ }
  };

  // ── Save Learnings ──

  const handleSaveLearnings = async () => {
    if (!testResults.length || !selectedConfigId) return;

    const domain = new URL(targetUrl).hostname;
    const learnings: any[] = [];

    // Extract successful selectors as learnings
    for (const result of testResults) {
      if (result.extracted_data) {
        for (const [field, value] of Object.entries(result.extracted_data)) {
          if (value && (result.field_confidence?.[field] || 0) >= 0.7) {
            learnings.push({
              type: "field_mapping",
              key: field,
              value: { field, sample_value: (value as string).substring(0, 200) },
              confidence: result.field_confidence[field],
            });
          }
        }
      }
    }

    // Save URL patterns
    const productUrls = testResults.filter(r => r.page_classification?.type === "likely_product_page").map(r => r.url);
    if (productUrls.length > 0) {
      // Try to extract common URL pattern
      try {
        const paths = productUrls.map(u => new URL(u).pathname);
        const segments = paths[0].split("/").filter(Boolean);
        if (segments.length >= 2) {
          learnings.push({
            type: "url_pattern",
            key: `/${segments[0]}/`,
            value: { page_type: "likely_product_page", sample_urls: productUrls.slice(0, 3) },
            confidence: 0.7,
          });
        }
      } catch { /* ignore */ }
    }

    if (learnings.length > 0) {
      await agent.saveLearning.mutateAsync({
        config_id: selectedConfigId,
        domain,
        learnings,
      });
    } else {
      toast.info("Sem padrões suficientes para guardar");
    }
  };

  const selectedProductCount = Object.values(selectedUrls).filter(Boolean).length;
  const productPageCount = discoveredLinks.filter(l => l.type === "likely_product_page").length;
  const categoryPageCount = discoveredLinks.filter(l => l.type === "likely_category_page").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6" />
            Website Extraction Agent
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Extração inteligente e controlada de dados de fornecedores
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowConfigDialog(true)}>
            <Plus className="w-3 h-3 mr-1" /> Nova Configuração
          </Button>
          {configsList.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowLearningsDialog(true)}>
              <Brain className="w-3 h-3 mr-1" /> Memória
            </Button>
          )}
        </div>
      </div>

      {/* Phase indicators */}
      <div className="flex items-center gap-2">
        {(["setup", "discovery", "preview", "scale"] as AgentPhase[]).map((p, i) => (
          <div key={p} className="flex items-center gap-1">
            <button
              onClick={() => { if (p === "setup" || (p === "discovery" && discoveryResult) || (p === "preview" && testResults.length > 0)) setPhase(p); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                phase === p
                  ? "bg-primary text-primary-foreground"
                  : p === "setup" || (p === "discovery" && discoveryResult) || (p === "preview" && testResults.length > 0)
                    ? "bg-muted hover:bg-muted/80 cursor-pointer"
                    : "bg-muted/50 text-muted-foreground cursor-default"
              }`}
            >
              {p === "setup" && <Search className="w-3 h-3" />}
              {p === "discovery" && <Globe className="w-3 h-3" />}
              {p === "preview" && <Eye className="w-3 h-3" />}
              {p === "scale" && <Zap className="w-3 h-3" />}
              {p === "setup" ? "Setup" : p === "discovery" ? "Discovery" : p === "preview" ? "Preview" : "Scale"}
            </button>
            {i < 3 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* ── Setup Phase ── */}
      {phase === "setup" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuração</CardTitle>
              <CardDescription>Configure o domínio e inicie o discovery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {configsList.length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground">Configuração existente (opcional)</label>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {configsList.map((c: any) => (
                      <Badge
                        key={c.id}
                        variant={selectedConfigId === c.id ? "default" : "outline"}
                        className="cursor-pointer text-[10px]"
                        onClick={() => setSelectedConfigId(selectedConfigId === c.id ? null : c.id)}
                      >
                        {c.display_name || c.domain}
                        {c.total_products_extracted > 0 && (
                          <span className="ml-1 opacity-60">({c.total_products_extracted})</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground">URL do site do fornecedor</label>
                <Input
                  value={targetUrl}
                  onChange={e => setTargetUrl(e.target.value)}
                  placeholder="https://www.fornecedor.com"
                  className="mt-1"
                  onKeyDown={e => e.key === "Enter" && handleDiscover()}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={useFirecrawl} onCheckedChange={setUseFirecrawl} id="fc-mode" />
                <label htmlFor="fc-mode" className="text-xs flex items-center gap-1">
                  <Coins className="w-3 h-3" /> Modo Premium (Firecrawl)
                </label>
              </div>

              <Button onClick={handleDiscover} disabled={agent.discover.isPending} className="w-full">
                {agent.discover.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                Iniciar Discovery
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Como funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <Badge variant="outline" className="shrink-0 text-[10px]">Fase A</Badge>
                <p>Discovery leve — identifica páginas, classifica automaticamente e distingue categorias de produtos.</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="shrink-0 text-[10px]">Fase B</Badge>
                <p>Teste em poucas páginas — extrai campos, mostra preview com confidence score por campo.</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="shrink-0 text-[10px]">Fase C</Badge>
                <p>Escala — só após validação, aplica as regras aprendidas ao resto do site.</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="shrink-0 text-[10px]">💡</Badge>
                <p>O agente prioriza HTML fetch + DOM heurísticas. IA apenas quando necessário.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Discovery Phase ── */}
      {phase === "discovery" && discoveryResult && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total", value: discoveryResult.stats?.total || 0, icon: Globe },
              { label: "Produtos", value: productPageCount, icon: Target },
              { label: "Categorias", value: categoryPageCount, icon: Layers },
              { label: "Documentos", value: discoveryResult.stats?.document_pages || 0, icon: FileText },
              { label: "Desconhecidos", value: discoveryResult.stats?.unknown || 0, icon: AlertTriangle },
            ].map(s => (
              <Card key={s.label} className="p-3">
                <div className="flex items-center gap-2">
                  <s.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-xl font-bold mt-1">{s.value}</p>
              </Card>
            ))}
          </div>

          {/* Target page classification */}
          {discoveryResult.target_classification && (
            <Card className="p-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Página alvo:</span>
                <Badge className={PAGE_TYPE_LABELS[discoveryResult.target_classification.type]?.color || ""}>
                  {PAGE_TYPE_LABELS[discoveryResult.target_classification.type]?.label || discoveryResult.target_classification.type}
                </Badge>
                <ConfidenceBadge value={discoveryResult.target_classification.confidence} />
              </div>
            </Card>
          )}

          {/* Links list */}
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Páginas descobertas ({discoveredLinks.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => {
                      const allProduct: Record<string, boolean> = {};
                      discoveredLinks.forEach(l => { if (l.type === "likely_product_page") allProduct[l.url] = true; });
                      setSelectedUrls(allProduct);
                    }}
                  >
                    Selecionar Produtos ({productPageCount})
                  </Button>
                  <Badge variant="outline" className="text-[10px]">
                    {selectedProductCount} selecionados
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-80">
                <div className="divide-y">
                  {discoveredLinks.map((link, i) => (
                    <label key={i} className="flex items-start gap-2 px-4 py-2 hover:bg-muted/30 cursor-pointer">
                      <Checkbox
                        checked={!!selectedUrls[link.url]}
                        onCheckedChange={checked => setSelectedUrls(prev => ({ ...prev, [link.url]: !!checked }))}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs truncate">{link.text || "Sem texto"}</p>
                        <p className="text-[10px] font-mono text-muted-foreground truncate">{link.url}</p>
                      </div>
                      <Badge className={`shrink-0 text-[10px] ${PAGE_TYPE_LABELS[link.type]?.color || ""}`}>
                        {PAGE_TYPE_LABELS[link.type]?.label || link.type}
                      </Badge>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Test extraction controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Amostra:</label>
              {[1, 5, 10].map(n => (
                <Button
                  key={n}
                  variant={testSampleSize === n ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTestSampleSize(n)}
                >
                  {n} {n === 1 ? "página" : "páginas"}
                </Button>
              ))}
            </div>
            <div className="ml-auto">
              <Button onClick={handleTestExtraction} disabled={agent.extractTest.isPending || selectedProductCount === 0}>
                {agent.extractTest.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                Testar Extração ({Math.min(selectedProductCount, testSampleSize)} páginas)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Phase ── */}
      {(phase === "preview" || phase === "scale") && testResults.length > 0 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Páginas processadas</p>
              <p className="text-xl font-bold">{testResults.length}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Confiança média</p>
              <p className="text-xl font-bold">
                {Math.round((testResults.reduce((a, r) => a + (r.avg_confidence || 0), 0) / testResults.length) * 100)}%
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Com warnings</p>
              <p className="text-xl font-bold text-amber-600">
                {testResults.filter(r => r.warnings?.length > 0).length}
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Com erros</p>
              <p className="text-xl font-bold text-destructive">
                {testResults.filter(r => r.error).length}
              </p>
            </Card>
          </div>

          {/* Preview table */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">
                {phase === "preview" ? "Preview de Extração" : "Resultados em Escala"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] w-[200px]">Página</TableHead>
                      <TableHead className="text-[10px]">Nome</TableHead>
                      <TableHead className="text-[10px]">SKU</TableHead>
                      <TableHead className="text-[10px]">Preço</TableHead>
                      <TableHead className="text-[10px]">Specs</TableHead>
                      <TableHead className="text-[10px]">Imagens</TableHead>
                      <TableHead className="text-[10px]">Confiança</TableHead>
                      <TableHead className="text-[10px]">Avisos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testResults.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-[10px] font-mono max-w-[200px] truncate" title={r.url}>
                          {r.url ? new URL(r.url).pathname : "-"}
                        </TableCell>
                        <TableCell className="text-[10px] max-w-[200px] truncate">
                          {r.extracted_data?.product_name || <span className="text-muted-foreground">—</span>}
                          {r.field_confidence?.product_name && (
                            <ConfidenceBadge value={r.field_confidence.product_name} />
                          )}
                        </TableCell>
                        <TableCell className="text-[10px]">
                          {r.extracted_data?.sku || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-[10px]">
                          {r.extracted_data?.price || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-[10px]">
                          {r.extracted_data?.technical_specs ? (
                            <Badge variant="outline" className="text-[9px]">
                              {r.extracted_data.technical_specs.split("\n").length} linhas
                            </Badge>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-[10px]">
                          {r.extracted_data?.image_urls ? (
                            <Badge variant="outline" className="text-[9px]">
                              {r.extracted_data.image_urls.split(" | ").length} imgs
                            </Badge>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <ConfidenceBadge value={r.avg_confidence || 0} />
                        </TableCell>
                        <TableCell>
                          {r.warnings?.length > 0 ? (
                            <Badge variant="outline" className="text-[9px] text-amber-600">
                              {r.warnings.length}
                            </Badge>
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Detail cards */}
          <Tabs defaultValue="fields">
            <TabsList>
              <TabsTrigger value="fields" className="text-xs">Campos por Página</TabsTrigger>
              <TabsTrigger value="warnings" className="text-xs">Avisos</TabsTrigger>
            </TabsList>
            <TabsContent value="fields" className="mt-3">
              <div className="grid gap-3 md:grid-cols-2">
                {testResults.slice(0, 10).map((r, i) => (
                  <Card key={i} className="p-3">
                    <p className="text-[10px] font-mono text-muted-foreground truncate mb-2" title={r.url}>
                      {r.url ? new URL(r.url).pathname : "-"}
                    </p>
                    <div className="space-y-1">
                      {Object.entries(r.extracted_data || {}).map(([field, value]) => (
                        <div key={field} className="flex items-start gap-2">
                          <span className="text-[10px] text-muted-foreground w-24 shrink-0">
                            {FIELD_LABELS[field] || field}
                          </span>
                          <span className="text-[10px] truncate flex-1">{String(value).substring(0, 80)}</span>
                          <ConfidenceBadge value={r.field_confidence?.[field] || 0} />
                        </div>
                      ))}
                      {Object.keys(r.extracted_data || {}).length === 0 && (
                        <p className="text-[10px] text-muted-foreground">Nenhum campo extraído</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="warnings" className="mt-3">
              <Card className="p-3">
                <div className="space-y-2">
                  {testResults.filter(r => r.warnings?.length > 0).map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-mono text-muted-foreground truncate">{r.url ? new URL(r.url).pathname : "-"}</p>
                        <ul className="list-disc list-inside">
                          {r.warnings.map((w: string, j: number) => (
                            <li key={j} className="text-[10px] text-muted-foreground">{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                  {testResults.filter(r => r.warnings?.length > 0).length === 0 && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Sem avisos
                    </p>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setPhase("discovery")}>
              <RefreshCw className="w-3 h-3 mr-1" /> Voltar ao Discovery
            </Button>
            {selectedConfigId && (
              <Button variant="outline" onClick={handleSaveLearnings} disabled={agent.saveLearning.isPending}>
                {agent.saveLearning.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Brain className="w-3 h-3 mr-1" />}
                Guardar Padrões
              </Button>
            )}
            {phase === "preview" && (
              <Button onClick={handleScaleExtraction} disabled={agent.extractTest.isPending || productPageCount === 0}>
                {agent.extractTest.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                Escalar ({productPageCount} produtos)
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Config Dialog ── */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Configuração de Fornecedor</DialogTitle>
            <DialogDescription>Crie uma configuração para guardar padrões aprendidos por domínio.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Domínio</label>
              <Input value={newConfigDomain} onChange={e => setNewConfigDomain(e.target.value)} placeholder="www.fornecedor.com" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Nome (opcional)</label>
              <Input value={newConfigName} onChange={e => setNewConfigName(e.target.value)} placeholder="Nome do fornecedor" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateConfig} disabled={!newConfigDomain || agent.createConfig.isPending}>
              {agent.createConfig.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Learnings Dialog ── */}
      <Dialog open={showLearningsDialog} onOpenChange={setShowLearningsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" /> Memória do Agente
            </DialogTitle>
            <DialogDescription>Padrões aprendidos por domínio/fornecedor</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-80">
            <div className="space-y-2 p-1">
              {configsList.map((c: any) => (
                <Card key={c.id} className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{c.display_name || c.domain}</span>
                    <Badge variant="outline" className="text-[10px]">{c.domain}</Badge>
                  </div>
                  <div className="flex gap-3 text-[10px] text-muted-foreground">
                    <span>{c.total_pages_discovered || 0} páginas descobertas</span>
                    <span>{c.total_products_extracted || 0} produtos extraídos</span>
                    <span>{Object.keys(c.learned_selectors || {}).length} seletores aprendidos</span>
                  </div>
                </Card>
              ))}
              {configsList.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma configuração criada ainda.</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Import needed for the header icon
function Bot(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
    </svg>
  );
}
