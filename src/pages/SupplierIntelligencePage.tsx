import { useState } from "react";
import { useSupplierIntelligence, useSupplierDetail } from "@/hooks/useSupplierIntelligence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, Building2, Globe, CheckCircle, AlertCircle, Clock, ArrowLeft, Brain, Search, Zap, Network, BarChart3, ArrowRight } from "lucide-react";
import { toast } from "sonner";

function QualityScoreBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}

function SupplierDashboardCard({ supplier, qualityScore, onSelect }: { supplier: any; qualityScore?: any; onSelect: () => void }) {
  const score = qualityScore?.overall_score ?? null;
  return (
    <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={onSelect}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{supplier.supplier_name}</CardTitle>
          <Badge variant={supplier.is_active ? "default" : "secondary"}>{supplier.is_active ? "Ativo" : "Inativo"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {supplier.supplier_code && <p className="text-xs text-muted-foreground">Código: {supplier.supplier_code}</p>}
        {supplier.base_url && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" /> {supplier.base_url}
          </div>
        )}
        {score !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Qualidade</span>
              <span className="font-bold">{Math.round(score * 100)}%</span>
            </div>
            <Progress value={score * 100} className="h-2" />
          </div>
        )}
        <div className="flex gap-2 text-xs text-muted-foreground">
          {qualityScore && <span>{qualityScore.total_imports} imports</span>}
          {qualityScore && <span>{qualityScore.total_products} produtos</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function SupplierDetail({ supplier, onBack }: { supplier: any; onBack: () => void }) {
  const { learnPatterns, calculateQuality, buildKnowledgeGraph } = useSupplierIntelligence();
  const detail = useSupplierDetail(supplier.id);

  const avgConfidence = detail.benchmarks.data?.length
    ? (detail.benchmarks.data.reduce((s: number, b: any) => s + (b.average_confidence || 0), 0) / detail.benchmarks.data.length).toFixed(2)
    : "—";
  const avgCost = detail.benchmarks.data?.length
    ? (detail.benchmarks.data.reduce((s: number, b: any) => s + (b.average_cost || 0), 0) / detail.benchmarks.data.length).toFixed(4)
    : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Button>
        <h2 className="text-xl font-bold">{supplier.supplier_name}</h2>
        <Badge variant={supplier.is_active ? "default" : "secondary"}>{supplier.is_active ? "Ativo" : "Inativo"}</Badge>
        <div className="ml-auto flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => learnPatterns.mutate(supplier.id)} disabled={learnPatterns.isPending}>
            <Brain className="h-4 w-4 mr-1" />{learnPatterns.isPending ? "A aprender..." : "Aprender Padrões"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => calculateQuality.mutate(supplier.id)} disabled={calculateQuality.isPending}>
            <BarChart3 className="h-4 w-4 mr-1" />{calculateQuality.isPending ? "A calcular..." : "Calcular Qualidade"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => buildKnowledgeGraph.mutate(supplier.id)} disabled={buildKnowledgeGraph.isPending}>
            <Network className="h-4 w-4 mr-1" />{buildKnowledgeGraph.isPending ? "A construir..." : "Knowledge Graph"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{avgConfidence}</p><p className="text-xs text-muted-foreground">Confiança Média</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">€{avgCost}</p><p className="text-xs text-muted-foreground">Custo Médio</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{detail.benchmarks.data?.length || 0}</p><p className="text-xs text-muted-foreground">Execuções</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{detail.patterns.data?.length || 0}</p><p className="text-xs text-muted-foreground">Padrões</p></CardContent></Card>
      </div>

      <Tabs defaultValue="schemas">
        <TabsList className="flex-wrap">
          <TabsTrigger value="schemas">Estrutura</TabsTrigger>
          <TabsTrigger value="patterns">Padrões</TabsTrigger>
          <TabsTrigger value="mappings">Mapeamentos</TabsTrigger>
          <TabsTrigger value="graph">Knowledge Graph</TabsTrigger>
          <TabsTrigger value="sources">Fontes</TabsTrigger>
          <TabsTrigger value="trust">Trust Matrix</TabsTrigger>
          <TabsTrigger value="matching">Matching</TabsTrigger>
          <TabsTrigger value="grouping">Grouping</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="schemas">
          <Card><CardHeader><CardTitle className="text-sm">Estruturas Detetadas</CardTitle></CardHeader><CardContent>
            {detail.schemaProfiles.data?.length ? (
              <div className="space-y-4">
                {detail.schemaProfiles.data.map((sp: any) => (
                  <div key={sp.id} className="border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{sp.file_type}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(sp.created_at).toLocaleDateString("pt-PT")}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      <div><span className="text-muted-foreground">SKU:</span> <span className="font-medium">{sp.sku_column || "—"}</span></div>
                      <div><span className="text-muted-foreground">Preço:</span> <span className="font-medium">{sp.price_column || "—"}</span></div>
                      <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{sp.name_column || "—"}</span></div>
                      <div><span className="text-muted-foreground">EAN:</span> <span className="font-medium">{sp.ean_column || "—"}</span></div>
                      <div><span className="text-muted-foreground">Imagem:</span> <span className="font-medium">{sp.image_column || "—"}</span></div>
                      <div><span className="text-muted-foreground">Confiança:</span> <span className="font-medium">{Math.round(sp.detection_confidence * 100)}%</span></div>
                    </div>
                    {sp.attribute_columns?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {sp.attribute_columns.map((a: string) => <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Nenhuma estrutura detetada. Use "Detect Structure" após importar ficheiros.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="patterns">
          <Card><CardHeader><CardTitle className="text-sm">Padrões Aprendidos</CardTitle></CardHeader><CardContent>
            {detail.patterns.data?.length ? (
              <Table><TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Chave</TableHead><TableHead>Ocorrências</TableHead><TableHead>Confiança</TableHead><TableHead>Último</TableHead></TableRow></TableHeader>
                <TableBody>{detail.patterns.data.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell><Badge variant="outline">{p.pattern_type}</Badge></TableCell>
                    <TableCell className="font-medium">{p.pattern_key}</TableCell>
                    <TableCell>{p.occurrences}</TableCell>
                    <TableCell>{Math.round(p.confidence * 100)}%</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(p.last_seen_at).toLocaleDateString("pt-PT")}</TableCell>
                  </TableRow>
                ))}</TableBody></Table>
            ) : <p className="text-sm text-muted-foreground">Sem padrões. Clique "Aprender Padrões" para analisar.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="mappings">
          <Card><CardHeader><CardTitle className="text-sm">Sugestões de Mapeamento</CardTitle></CardHeader><CardContent>
            {detail.mappingSuggestions.data?.length ? (
              <Table><TableHeader><TableRow><TableHead>Coluna Origem</TableHead><TableHead><ArrowRight className="h-3 w-3 inline" /></TableHead><TableHead>Campo Destino</TableHead><TableHead>Confiança</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                <TableBody>{detail.mappingSuggestions.data.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-sm">{m.source_column}</TableCell>
                    <TableCell><ArrowRight className="h-3 w-3 text-muted-foreground" /></TableCell>
                    <TableCell><Badge variant="outline">{m.suggested_field}</Badge></TableCell>
                    <TableCell>{Math.round(m.confidence * 100)}%</TableCell>
                    <TableCell>
                      {m.accepted === true && <Badge variant="default">Aceite</Badge>}
                      {m.accepted === false && <Badge variant="destructive">Rejeitado</Badge>}
                      {m.accepted === null && <Badge variant="secondary">Pendente</Badge>}
                    </TableCell>
                  </TableRow>
                ))}</TableBody></Table>
            ) : <p className="text-sm text-muted-foreground">Sem sugestões de mapeamento.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="graph">
          <Card><CardHeader><CardTitle className="text-sm">Knowledge Graph</CardTitle></CardHeader><CardContent>
            {detail.knowledgeGraph.data?.length ? (
              <div className="space-y-2">
                {detail.knowledgeGraph.data.map((edge: any) => (
                  <div key={edge.id} className="flex items-center gap-2 p-2 border rounded text-sm">
                    <Badge variant="outline">{edge.node_type}</Badge>
                    <span className="font-medium">{edge.node_label}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="secondary">{edge.relationship_type}</Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="outline">{edge.related_node_type}</Badge>
                    <span className="font-medium">{edge.related_node_label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{Math.round(edge.weight * 100)}%</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Sem ligações. Clique "Knowledge Graph" para gerar.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="sources">
          <Card><CardHeader><CardTitle className="text-sm">Source Profiles</CardTitle></CardHeader><CardContent>
            {detail.sourceProfiles.data?.length ? (
              <Table><TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Papel</TableHead><TableHead>Fiabilidade</TableHead><TableHead>Prioridade</TableHead></TableRow></TableHeader>
                <TableBody>{detail.sourceProfiles.data.map((sp: any) => (
                  <TableRow key={sp.id}><TableCell><Badge variant="outline">{sp.source_type}</Badge></TableCell><TableCell>{sp.source_role}</TableCell><TableCell>{(sp.reliability_score * 100).toFixed(0)}%</TableCell><TableCell>{sp.priority_rank}</TableCell></TableRow>
                ))}</TableBody></Table>
            ) : <p className="text-sm text-muted-foreground">Sem source profiles.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="trust">
          <Card><CardHeader><CardTitle className="text-sm">Field Trust Rules</CardTitle></CardHeader><CardContent>
            {detail.fieldTrust.data?.length ? (
              <Table><TableHeader><TableRow><TableHead>Campo</TableHead><TableHead>Primária</TableHead><TableHead>Secundária</TableHead><TableHead>Trust</TableHead><TableHead>Conflito</TableHead></TableRow></TableHeader>
                <TableBody>{detail.fieldTrust.data.map((ft: any) => (
                  <TableRow key={ft.id}><TableCell className="font-medium">{ft.field_name}</TableCell><TableCell>{ft.primary_source_type}</TableCell><TableCell>{ft.secondary_source_type || "—"}</TableCell><TableCell>{(ft.trust_score * 100).toFixed(0)}%</TableCell><TableCell>{ft.conflict_strategy}</TableCell></TableRow>
                ))}</TableBody></Table>
            ) : <p className="text-sm text-muted-foreground">Sem regras de confiança.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="matching">
          <Card><CardHeader><CardTitle className="text-sm">Matching Rules</CardTitle></CardHeader><CardContent>
            {detail.matchingRules.data?.length ? (
              <Table><TableHeader><TableRow><TableHead>Regra</TableHead><TableHead>Tipo</TableHead><TableHead>Peso</TableHead><TableHead>Ativo</TableHead></TableRow></TableHeader>
                <TableBody>{detail.matchingRules.data.map((mr: any) => (
                  <TableRow key={mr.id}><TableCell>{mr.rule_name}</TableCell><TableCell><Badge variant="outline">{mr.match_type}</Badge></TableCell><TableCell>{mr.rule_weight}</TableCell><TableCell>{mr.is_active ? <CheckCircle className="h-4 w-4 text-primary" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}</TableCell></TableRow>
                ))}</TableBody></Table>
            ) : <p className="text-sm text-muted-foreground">Sem regras de matching.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="grouping">
          <Card><CardHeader><CardTitle className="text-sm">Grouping Rules</CardTitle></CardHeader><CardContent>
            {detail.groupingRules.data?.length ? (
              <Table><TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Discriminadores</TableHead><TableHead>Threshold</TableHead></TableRow></TableHeader>
                <TableBody>{detail.groupingRules.data.map((gr: any) => (
                  <TableRow key={gr.id}><TableCell><Badge variant="outline">{gr.grouping_type}</Badge></TableCell><TableCell>{gr.discriminator_fields?.join(", ") || "—"}</TableCell><TableCell>{(gr.confidence_threshold * 100).toFixed(0)}%</TableCell></TableRow>
                ))}</TableBody></Table>
            ) : <p className="text-sm text-muted-foreground">Sem regras de grouping.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="learning">
          <Card><CardHeader><CardTitle className="text-sm">Learning Timeline</CardTitle></CardHeader><CardContent>
            {detail.learningEvents.data?.length ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {detail.learningEvents.data.map((ev: any) => (
                  <div key={ev.id} className="flex items-start gap-3 p-2 rounded border">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{ev.event_type}</span>
                        <Badge variant={ev.outcome === "success" || ev.outcome === "confirmed" ? "default" : "destructive"} className="text-xs">{ev.outcome}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(ev.created_at).toLocaleString("pt-PT")}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Sem eventos de aprendizagem.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="benchmarks">
          <Card><CardHeader><CardTitle className="text-sm">Benchmarks</CardTitle></CardHeader><CardContent>
            {detail.benchmarks.data?.length ? (
              <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Rows</TableHead><TableHead>Matches</TableHead><TableHead>Conf.</TableHead><TableHead>Custo</TableHead><TableHead>Latência</TableHead></TableRow></TableHeader>
                <TableBody>{detail.benchmarks.data.map((b: any) => (
                  <TableRow key={b.id}><TableCell className="text-xs">{new Date(b.created_at).toLocaleDateString("pt-PT")}</TableCell><TableCell><Badge variant="outline">{b.source_type || "—"}</Badge></TableCell><TableCell>{b.rows_processed}</TableCell><TableCell>{b.successful_matches}</TableCell><TableCell>{(b.average_confidence * 100).toFixed(0)}%</TableCell><TableCell>€{b.average_cost?.toFixed(4)}</TableCell><TableCell>{b.average_latency_ms?.toFixed(0)}ms</TableCell></TableRow>
                ))}</TableBody></Table>
            ) : <p className="text-sm text-muted-foreground">Sem benchmarks.</p>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SupplierIntelligencePage() {
  const { suppliers, qualityScores, createSupplier } = useSupplierIntelligence();
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [search, setSearch] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return toast.error("Nome obrigatório");
    createSupplier.mutate(
      { supplier_name: newName, supplier_code: newCode || undefined, base_url: newUrl || undefined },
      { onSuccess: () => { setShowCreate(false); setNewName(""); setNewCode(""); setNewUrl(""); } }
    );
  };

  const getQualityScore = (supplierId: string) => qualityScores.data?.find((q: any) => q.supplier_id === supplierId);

  const filtered = suppliers.data?.filter((s: any) =>
    !search || s.supplier_name.toLowerCase().includes(search.toLowerCase()) || s.supplier_code?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Dashboard KPIs
  const totalSuppliers = suppliers.data?.length || 0;
  const avgQuality = qualityScores.data?.length
    ? qualityScores.data.reduce((s: number, q: any) => s + (q.overall_score || 0), 0) / qualityScores.data.length
    : 0;
  const totalProducts = qualityScores.data?.reduce((s: number, q: any) => s + (q.total_products || 0), 0) || 0;
  const totalImports = qualityScores.data?.reduce((s: number, q: any) => s + (q.total_imports || 0), 0) || 0;

  if (selectedSupplier) {
    return (
      <div className="p-6 space-y-4">
        <SupplierDetail supplier={selectedSupplier} onBack={() => setSelectedSupplier(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="h-6 w-6" />Supplier Intelligence</h1>
          <p className="text-sm text-muted-foreground">Aprendizagem automática de estrutura, padrões e qualidade de fornecedores</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Novo Fornecedor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Fornecedor</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome *</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do fornecedor" /></div>
              <div><Label>Código</Label><Input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="Código interno" /></div>
              <div><Label>URL Base</Label><Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://fornecedor.com" /></div>
              <Button onClick={handleCreate} disabled={createSupplier.isPending} className="w-full">{createSupplier.isPending ? "A criar..." : "Criar Fornecedor"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{totalSuppliers}</p><p className="text-xs text-muted-foreground">Fornecedores</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{totalImports}</p><p className="text-xs text-muted-foreground">Importações</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{totalProducts}</p><p className="text-xs text-muted-foreground">Produtos</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{avgQuality ? `${Math.round(avgQuality * 100)}%` : "—"}</p>
          <p className="text-xs text-muted-foreground">Qualidade Média</p>
        </CardContent></Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Pesquisar fornecedor..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s: any) => (
          <SupplierDashboardCard key={s.id} supplier={s} qualityScore={getQualityScore(s.id)} onSelect={() => setSelectedSupplier(s)} />
        ))}
        {!filtered.length && !suppliers.isLoading && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">Nenhum fornecedor encontrado.</p>
        )}
      </div>
    </div>
  );
}
