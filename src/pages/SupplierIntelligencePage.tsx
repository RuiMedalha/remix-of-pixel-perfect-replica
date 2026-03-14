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
import { Plus, Building2, Globe, TrendingUp, DollarSign, CheckCircle, AlertCircle, Clock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

function SupplierProfileCard({ supplier, onSelect }: { supplier: any; onSelect: () => void }) {
  return (
    <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={onSelect}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{supplier.supplier_name}</CardTitle>
          <Badge variant={supplier.is_active ? "default" : "secondary"}>{supplier.is_active ? "Ativo" : "Inativo"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {supplier.supplier_code && <p className="text-xs text-muted-foreground">Código: {supplier.supplier_code}</p>}
        {supplier.base_url && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" /> {supplier.base_url}
          </div>
        )}
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>{supplier.default_currency}</span>
          <span>{supplier.country_code}</span>
          <span>{supplier.website_language}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function SupplierDetail({ supplier, onBack }: { supplier: any; onBack: () => void }) {
  const { sourceProfiles, fieldTrust, matchingRules, groupingRules, taxonomyMappings, learningEvents, benchmarks, promptProfiles } = useSupplierDetail(supplier.id);

  const avgConfidence = benchmarks.data?.length
    ? (benchmarks.data.reduce((s: number, b: any) => s + (b.average_confidence || 0), 0) / benchmarks.data.length).toFixed(2)
    : "—";
  const avgCost = benchmarks.data?.length
    ? (benchmarks.data.reduce((s: number, b: any) => s + (b.average_cost || 0), 0) / benchmarks.data.length).toFixed(4)
    : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Button>
        <h2 className="text-xl font-bold">{supplier.supplier_name}</h2>
        <Badge variant={supplier.is_active ? "default" : "secondary"}>{supplier.is_active ? "Ativo" : "Inativo"}</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{avgConfidence}</p><p className="text-xs text-muted-foreground">Confiança Média</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">€{avgCost}</p><p className="text-xs text-muted-foreground">Custo Médio</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{benchmarks.data?.length || 0}</p><p className="text-xs text-muted-foreground">Execuções</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{learningEvents.data?.length || 0}</p><p className="text-xs text-muted-foreground">Eventos Learning</p></CardContent></Card>
      </div>

      <Tabs defaultValue="sources">
        <TabsList className="flex-wrap">
          <TabsTrigger value="sources">Fontes</TabsTrigger>
          <TabsTrigger value="trust">Trust Matrix</TabsTrigger>
          <TabsTrigger value="matching">Matching</TabsTrigger>
          <TabsTrigger value="grouping">Grouping</TabsTrigger>
          <TabsTrigger value="taxonomy">Taxonomia</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="sources">
          <Card><CardHeader><CardTitle className="text-sm">Source Profiles</CardTitle></CardHeader><CardContent>
            {sourceProfiles.data?.length ? (
              <Table><TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Papel</TableHead><TableHead>Fiabilidade</TableHead><TableHead>Prioridade</TableHead></TableRow></TableHeader>
                <TableBody>{sourceProfiles.data.map((sp: any) => (
                  <TableRow key={sp.id}><TableCell><Badge variant="outline">{sp.source_type}</Badge></TableCell><TableCell>{sp.source_role}</TableCell><TableCell>{(sp.reliability_score * 100).toFixed(0)}%</TableCell><TableCell>{sp.priority_rank}</TableCell></TableRow>
                ))}</TableBody></Table>
            ) : <p className="text-sm text-muted-foreground">Sem source profiles.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="trust">
          <Card><CardHeader><CardTitle className="text-sm">Field Trust Rules</CardTitle></CardHeader><CardContent>
            {fieldTrust.data?.length ? (
              <Table><TableHeader><TableRow><TableHead>Campo</TableHead><TableHead>Primária</TableHead><TableHead>Secundária</TableHead><TableHead>Fallback</TableHead><TableHead>Trust</TableHead><TableHead>Conflito</TableHead></TableRow></TableHeader>
                <TableBody>{fieldTrust.data.map((ft: any) => (
                  <TableRow key={ft.id}><TableCell className="font-medium">{ft.field_name}</TableCell><TableCell>{ft.primary_source_type}</TableCell><TableCell>{ft.secondary_source_type || "—"}</TableCell><TableCell>{ft.fallback_source_type || "—"}</TableCell><TableCell>{(ft.trust_score * 100).toFixed(0)}%</TableCell><TableCell>{ft.conflict_strategy}</TableCell></TableRow>
                ))}</TableBody></Table>
            ) : <p className="text-sm text-muted-foreground">Sem regras de confiança.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="matching">
          <Card><CardHeader><CardTitle className="text-sm">Matching Rules</CardTitle></CardHeader><CardContent>
            {matchingRules.data?.length ? (
              <Table><TableHeader><TableRow><TableHead>Regra</TableHead><TableHead>Tipo</TableHead><TableHead>Peso</TableHead><TableHead>Ativo</TableHead></TableRow></TableHeader>
                <TableBody>{matchingRules.data.map((mr: any) => (
                  <TableRow key={mr.id}><TableCell>{mr.rule_name}</TableCell><TableCell><Badge variant="outline">{mr.match_type}</Badge></TableCell><TableCell>{mr.rule_weight}</TableCell><TableCell>{mr.is_active ? <CheckCircle className="h-4 w-4 text-primary" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}</TableCell></TableRow>
                ))}</TableBody></Table>
            ) : <p className="text-sm text-muted-foreground">Sem regras de matching.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="grouping">
          <Card><CardHeader><CardTitle className="text-sm">Grouping Rules</CardTitle></CardHeader><CardContent>
            {groupingRules.data?.length ? (
              <Table><TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Discriminadores</TableHead><TableHead>Threshold</TableHead><TableHead>Review</TableHead></TableRow></TableHeader>
                <TableBody>{groupingRules.data.map((gr: any) => (
                  <TableRow key={gr.id}><TableCell><Badge variant="outline">{gr.grouping_type}</Badge></TableCell><TableCell>{gr.discriminator_fields?.join(", ") || "—"}</TableCell><TableCell>{(gr.confidence_threshold * 100).toFixed(0)}%</TableCell><TableCell>{(gr.review_threshold * 100).toFixed(0)}%</TableCell></TableRow>
                ))}</TableBody></Table>
            ) : <p className="text-sm text-muted-foreground">Sem regras de grouping.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="taxonomy">
          <Card><CardHeader><CardTitle className="text-sm">Taxonomy Mappings</CardTitle></CardHeader><CardContent>
            {taxonomyMappings.data?.length ? (
              <Table><TableHeader><TableRow><TableHead>Família</TableHead><TableHead>Categoria Ext.</TableHead><TableHead>Subcategoria</TableHead><TableHead>Confiança</TableHead><TableHead>Fonte</TableHead></TableRow></TableHeader>
                <TableBody>{taxonomyMappings.data.map((tm: any) => (
                  <TableRow key={tm.id}><TableCell>{tm.external_family || "—"}</TableCell><TableCell>{tm.external_category || "—"}</TableCell><TableCell>{tm.external_subcategory || "—"}</TableCell><TableCell>{(tm.mapping_confidence * 100).toFixed(0)}%</TableCell><TableCell><Badge variant="secondary">{tm.mapping_source}</Badge></TableCell></TableRow>
                ))}</TableBody></Table>
            ) : <p className="text-sm text-muted-foreground">Sem mappings de taxonomia.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="prompts">
          <Card><CardHeader><CardTitle className="text-sm">Prompt Overrides</CardTitle></CardHeader><CardContent>
            {promptProfiles.data?.length ? (
              <Table><TableHeader><TableRow><TableHead>Agente</TableHead><TableHead>Scope</TableHead><TableHead>Ativo</TableHead></TableRow></TableHeader>
                <TableBody>{promptProfiles.data.map((pp: any) => (
                  <TableRow key={pp.id}><TableCell>{pp.agent_name}</TableCell><TableCell>{pp.usage_scope}</TableCell><TableCell>{pp.is_active ? <CheckCircle className="h-4 w-4 text-primary" /> : "—"}</TableCell></TableRow>
                ))}</TableBody></Table>
            ) : <p className="text-sm text-muted-foreground">Sem prompt overrides.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="learning">
          <Card><CardHeader><CardTitle className="text-sm">Learning Timeline</CardTitle></CardHeader><CardContent>
            {learningEvents.data?.length ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {learningEvents.data.map((ev: any) => (
                  <div key={ev.id} className="flex items-start gap-3 p-2 rounded border">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{ev.event_type}</span>
                        <Badge variant={ev.outcome === "success" || ev.outcome === "confirmed" ? "default" : "destructive"} className="text-xs">{ev.outcome}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(ev.created_at).toLocaleString("pt-PT")}</p>
                      {ev.confidence_before != null && <p className="text-xs">Confiança: {(ev.confidence_before * 100).toFixed(0)}% → {((ev.confidence_after || 0) * 100).toFixed(0)}%</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Sem eventos de aprendizagem.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="benchmarks">
          <Card><CardHeader><CardTitle className="text-sm">Benchmark Dashboard</CardTitle></CardHeader><CardContent>
            {benchmarks.data?.length ? (
              <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Rows</TableHead><TableHead>Matches</TableHead><TableHead>Reviews</TableHead><TableHead>Conf.</TableHead><TableHead>Custo</TableHead><TableHead>Latência</TableHead></TableRow></TableHeader>
                <TableBody>{benchmarks.data.map((b: any) => (
                  <TableRow key={b.id}><TableCell className="text-xs">{new Date(b.created_at).toLocaleDateString("pt-PT")}</TableCell><TableCell><Badge variant="outline">{b.source_type || "—"}</Badge></TableCell><TableCell>{b.rows_processed}</TableCell><TableCell>{b.successful_matches}</TableCell><TableCell>{b.manual_reviews}</TableCell><TableCell>{(b.average_confidence * 100).toFixed(0)}%</TableCell><TableCell>€{b.average_cost?.toFixed(4)}</TableCell><TableCell>{b.average_latency_ms?.toFixed(0)}ms</TableCell></TableRow>
                ))}</TableBody></Table>
            ) : <p className="text-sm text-muted-foreground">Sem benchmarks.</p>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SupplierIntelligencePage() {
  const { suppliers, createSupplier } = useSupplierIntelligence();
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return toast.error("Nome obrigatório");
    createSupplier.mutate(
      { supplier_name: newName, supplier_code: newCode || undefined, base_url: newUrl || undefined },
      { onSuccess: () => { setShowCreate(false); setNewName(""); setNewCode(""); setNewUrl(""); } }
    );
  };

  if (selectedSupplier) {
    return (
      <div className="p-6 space-y-4">
        <SupplierDetail supplier={selectedSupplier} onBack={() => setSelectedSupplier(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="h-6 w-6" />Supplier Intelligence</h1>
          <p className="text-sm text-muted-foreground">Gestão inteligente de fornecedores com aprendizagem contínua</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.data?.map((s: any) => (
          <SupplierProfileCard key={s.id} supplier={s} onSelect={() => setSelectedSupplier(s)} />
        ))}
        {!suppliers.data?.length && !suppliers.isLoading && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">Nenhum fornecedor registado. Crie o primeiro.</p>
        )}
      </div>
    </div>
  );
}
