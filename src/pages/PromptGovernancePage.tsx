import { useState } from "react";
import { usePromptGovernance } from "@/hooks/usePromptGovernance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileCode, CheckCircle, Clock, BarChart3 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PROMPT_TYPES = ["enrichment", "description", "seo", "categorization", "validation", "translation", "general"];

export default function PromptGovernancePage() {
  const { templates, createTemplate, useVersions, createVersion, activateVersion, usageLogs } = usePromptGovernance();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState({ prompt_name: "", prompt_type: "general", base_prompt: "", description: "" });
  const [newVersionText, setNewVersionText] = useState("");

  const versions = useVersions(selectedTemplate);
  const logs = usageLogs(selectedVersion);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileCode className="w-6 h-6" /> Prompt Governance
        </h1>
        <p className="text-muted-foreground">Gestão centralizada de prompts com versionamento e análise</p>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="versions">Versões</TabsTrigger>
          <TabsTrigger value="analytics">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Novo Template</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="Nome do prompt" value={newTemplate.prompt_name} onChange={(e) => setNewTemplate({ ...newTemplate, prompt_name: e.target.value })} />
                <Select value={newTemplate.prompt_type} onValueChange={(v) => setNewTemplate({ ...newTemplate, prompt_type: v })}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>{PROMPT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Input placeholder="Descrição" value={newTemplate.description} onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })} />
              <Textarea placeholder="Prompt base..." value={newTemplate.base_prompt} onChange={(e) => setNewTemplate({ ...newTemplate, base_prompt: e.target.value })} rows={4} />
              <Button onClick={() => { createTemplate.mutate(newTemplate); setNewTemplate({ prompt_name: "", prompt_type: "general", base_prompt: "", description: "" }); }} disabled={!newTemplate.prompt_name || !newTemplate.base_prompt || createTemplate.isPending}>
                <Plus className="w-4 h-4 mr-1" /> Criar Template
              </Button>
            </CardContent>
          </Card>

          {templates.data?.map((t: any) => (
            <Card key={t.id} className={`cursor-pointer transition-colors ${selectedTemplate === t.id ? "border-primary" : ""}`} onClick={() => { setSelectedTemplate(t.id); setSelectedVersion(null); }}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{t.prompt_name}</p>
                  <p className="text-xs text-muted-foreground">{t.description || t.prompt_type}</p>
                </div>
                <Badge variant="secondary">{t.prompt_type}</Badge>
              </CardContent>
            </Card>
          ))}
          {templates.data?.length === 0 && <p className="text-muted-foreground">Nenhum template criado.</p>}
        </TabsContent>

        <TabsContent value="versions" className="space-y-4 mt-4">
          {!selectedTemplate ? (
            <p className="text-muted-foreground">Selecione um template na tab Templates.</p>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle className="text-base">Nova Versão</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Textarea placeholder="Texto do prompt..." value={newVersionText} onChange={(e) => setNewVersionText(e.target.value)} rows={4} />
                  <Button size="sm" onClick={() => { createVersion.mutate({ template_id: selectedTemplate!, prompt_text: newVersionText }); setNewVersionText(""); }} disabled={!newVersionText || createVersion.isPending}>
                    <Plus className="w-4 h-4 mr-1" /> Criar Versão
                  </Button>
                </CardContent>
              </Card>

              {versions.data?.map((v: any) => (
                <Card key={v.id} className={`cursor-pointer ${selectedVersion === v.id ? "border-primary" : ""}`} onClick={() => setSelectedVersion(v.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {v.is_active ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                        <span className="font-medium">v{v.version_number}</span>
                        {v.is_active && <Badge>Ativa</Badge>}
                      </div>
                      {!v.is_active && (
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); activateVersion.mutate({ template_id: selectedTemplate!, version_id: v.id }); }}>
                          Ativar
                        </Button>
                      )}
                    </div>
                    <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap max-h-32 overflow-auto">{v.prompt_text}</pre>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          {!selectedVersion ? (
            <p className="text-muted-foreground">Selecione uma versão para ver performance.</p>
          ) : (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Logs de Utilização</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agente</TableHead>
                      <TableHead>Input</TableHead>
                      <TableHead>Output</TableHead>
                      <TableHead>Tempo (ms)</TableHead>
                      <TableHead>Confiança</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.data?.map((l: any) => (
                      <TableRow key={l.id}>
                        <TableCell>{l.agent_name || "—"}</TableCell>
                        <TableCell>{l.input_size || 0}</TableCell>
                        <TableCell>{l.output_size || 0}</TableCell>
                        <TableCell>{l.execution_time || 0}</TableCell>
                        <TableCell>{l.confidence_score ? `${(l.confidence_score * 100).toFixed(0)}%` : "—"}</TableCell>
                        <TableCell className="text-xs">{new Date(l.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {logs.data?.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sem logs</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
