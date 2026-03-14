import { useState } from "react";
import { useSupplierPlaybooks } from "@/hooks/useSupplierPlaybooks";
import { usePlaybookEngine } from "@/hooks/usePlaybookEngine";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BookOpen, Play, CheckCircle, Loader2, Plug, FlaskConical, Rocket, Zap, FileText, Trash2 } from "lucide-react";
import { AutoPlaybookDraftPanel } from "@/components/playbook-engine/AutoPlaybookDraftPanel";
import { PlaybookCorrectionsPanel } from "@/components/playbook-engine/PlaybookCorrectionsPanel";

const PLAYBOOK_TYPES = [
  { value: "manufacturer_catalog", label: "Catálogo Fabricante" },
  { value: "distributor_feed", label: "Feed Distribuidor" },
  { value: "excel_only", label: "Excel Only" },
  { value: "pdf_plus_excel", label: "PDF + Excel" },
  { value: "website_plus_excel", label: "Website + Excel" },
  { value: "xml_feed", label: "XML Feed" },
  { value: "api_catalog", label: "API Catalog" },
  { value: "hybrid_supplier", label: "Híbrido" },
];

export default function SupplierPlaybooksPage() {
  const { playbooks, connectorSetups, createPlaybook, testConnector, activatePlaybook } = useSupplierPlaybooks();
  const { playbookDrafts, overrides, applyCorrections, promoteDraft, deleteDraft } = usePlaybookEngine();
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("excel_only");

  const handleCreate = () => {
    if (!newName.trim()) return toast.error("Nome obrigatório");
    createPlaybook.mutate(
      { playbook_name: newName, playbook_type: newType, is_template: true },
      {
        onSuccess: () => { toast.success("Playbook criado"); setNewName(""); },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const handleTest = (supplierId: string, testType: string) => {
    testConnector.mutate(
      { supplier_id: supplierId, test_type: testType },
      {
        onSuccess: (d) => toast.success(`Teste: ${d?.test_run?.result_status}`),
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const handleActivate = (playbookId: string, supplierId?: string) => {
    activatePlaybook.mutate(
      { playbook_id: playbookId, supplier_id: supplierId || undefined },
      {
        onSuccess: () => toast.success("Playbook ativado"),
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const handleApplyInstruction = (instruction: string) => {
    applyCorrections.mutate({ instruction }, {
      onError: (e) => toast.error(e.message),
    });
  };

  const drafts = playbookDrafts.data || [];
  const supplierOverrides = overrides.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Supplier Playbooks</h1>
        <p className="text-muted-foreground">Onboarding guiado, playbooks automáticos e reutilizáveis para fornecedores</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Novo Playbook</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input placeholder="Nome do playbook" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLAYBOOK_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} disabled={createPlaybook.isPending}>
              <BookOpen className="w-4 h-4 mr-1" /> Criar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="drafts">
        <TabsList>
          <TabsTrigger value="drafts" className="gap-1"><Zap className="w-3 h-3" /> Auto-Drafts ({drafts.length})</TabsTrigger>
          <TabsTrigger value="playbooks">Playbooks ({playbooks.data?.length || 0})</TabsTrigger>
          <TabsTrigger value="corrections" className="gap-1"><FileText className="w-3 h-3" /> Correções ({supplierOverrides.length})</TabsTrigger>
          <TabsTrigger value="connectors">Conectores ({connectorSetups.data?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="drafts" className="space-y-3 mt-4">
          {playbookDrafts.isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : drafts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum playbook auto-gerado</p>
                <p className="text-xs mt-1">Carregue um ficheiro no Ingestion Hub para gerar automaticamente</p>
              </CardContent>
            </Card>
          ) : (
            drafts.map((d: any) => (
              <AutoPlaybookDraftPanel
                key={d.id}
                draft={d}
                onPromote={(id) => promoteDraft.mutate(id)}
                onDelete={(id) => deleteDraft.mutate(id)}
                isPromoting={promoteDraft.isPending}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="playbooks">
          <Card>
            <CardHeader><CardTitle>Playbooks</CardTitle><CardDescription>Templates e configurações de fornecedor</CardDescription></CardHeader>
            <CardContent>
              {playbooks.isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : !playbooks.data?.length ? (
                <p className="text-center text-muted-foreground py-8">Nenhum playbook criado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Versão</TableHead>
                      <TableHead>Ativo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {playbooks.data.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.playbook_name}</TableCell>
                        <TableCell><Badge variant="outline">{p.playbook_type}</Badge></TableCell>
                        <TableCell>{p.is_template ? <Badge>Template</Badge> : "-"}</TableCell>
                        <TableCell>v{p.version_number}</TableCell>
                        <TableCell>{p.is_active ? <CheckCircle className="w-4 h-4 text-primary" /> : "-"}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => handleActivate(p.id, p.supplier_id)}>
                            <Rocket className="w-3 h-3 mr-1" /> Ativar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="corrections" className="mt-4">
          <PlaybookCorrectionsPanel
            overrides={supplierOverrides}
            onApplyInstruction={handleApplyInstruction}
            onApplyCorrection={(c) => applyCorrections.mutate({ corrections: [c] })}
            isApplying={applyCorrections.isPending}
          />
        </TabsContent>

        <TabsContent value="connectors">
          <Card>
            <CardHeader><CardTitle>Connector Setups</CardTitle><CardDescription>Estado dos conectores de fornecedor</CardDescription></CardHeader>
            <CardContent>
              {connectorSetups.isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : !connectorSetups.data?.length ? (
                <p className="text-center text-muted-foreground py-8">Nenhum conector configurado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Testado</TableHead>
                      <TableHead>Último Teste</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connectorSetups.data.map((cs: any) => (
                      <TableRow key={cs.id}>
                        <TableCell className="font-mono text-xs">{cs.supplier_id?.slice(0, 8)}</TableCell>
                        <TableCell>
                          <Badge variant={cs.setup_status === "active" ? "default" : "secondary"}>
                            {cs.setup_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{cs.tested_successfully ? <CheckCircle className="w-4 h-4 text-primary" /> : "-"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {cs.last_tested_at ? new Date(cs.last_tested_at).toLocaleString() : "-"}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => handleTest(cs.supplier_id, "lookup_test")}>
                            <FlaskConical className="w-3 h-3 mr-1" /> Testar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
