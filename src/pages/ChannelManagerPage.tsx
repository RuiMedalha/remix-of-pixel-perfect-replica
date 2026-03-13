import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Loader2, Radio, Link2, ArrowRightLeft, BarChart3, Send, Settings2, ExternalLink } from "lucide-react";
import {
  useChannels, useCreateChannel, useDeleteChannel,
  useChannelConnections, useCreateConnection,
  useFieldMappings, useUpsertFieldMapping, useDeleteFieldMapping,
  useCategoryMappings, useUpsertCategoryMapping,
  useChannelPublishJobs, useChannelPublishJobItems,
  CHANNEL_TYPES, CANONICAL_FIELDS,
} from "@/hooks/useChannels";
import { useWorkspaceContext } from "@/hooks/useWorkspaces";

export default function ChannelManagerPage() {
  const { activeWorkspace } = useWorkspaceContext();
  const { data: channels, isLoading } = useChannels();
  const createChannel = useCreateChannel();
  const deleteChannel = useDeleteChannel();
  const { data: jobs } = useChannelPublishJobs();

  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannel, setNewChannel] = useState({ channel_name: "", channel_type: "woocommerce" });
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("channels");

  const selectedChannel = channels?.find((c: any) => c.id === selectedChannelId);

  const handleCreateChannel = () => {
    if (!activeWorkspace || !newChannel.channel_name.trim()) return;
    createChannel.mutate({ ...newChannel, workspace_id: activeWorkspace.id, channel_type: newChannel.channel_type as any });
    setShowNewChannel(false);
    setNewChannel({ channel_name: "", channel_type: "woocommerce" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Radio className="w-6 h-6" /> Canais de Publicação</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerir canais de venda, mappings e publicações</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{channels?.length ?? 0}</div><p className="text-xs text-muted-foreground">Canais</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{channels?.filter((c: any) => c.status === "active").length ?? 0}</div><p className="text-xs text-muted-foreground">Ativos</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{jobs?.length ?? 0}</div><p className="text-xs text-muted-foreground">Jobs</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{jobs?.filter((j: any) => j.job_status === "completed").length ?? 0}</div><p className="text-xs text-muted-foreground">Concluídos</p></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="channels"><Radio className="w-4 h-4 mr-1" /> Canais</TabsTrigger>
          <TabsTrigger value="mappings" disabled={!selectedChannelId}><ArrowRightLeft className="w-4 h-4 mr-1" /> Mappings</TabsTrigger>
          <TabsTrigger value="connections" disabled={!selectedChannelId}><Link2 className="w-4 h-4 mr-1" /> Conexões</TabsTrigger>
          <TabsTrigger value="jobs"><BarChart3 className="w-4 h-4 mr-1" /> Jobs</TabsTrigger>
        </TabsList>

        {/* CHANNELS */}
        <TabsContent value="channels" className="space-y-4">
          <div className="flex justify-end"><Button size="sm" onClick={() => setShowNewChannel(true)}><Plus className="w-4 h-4 mr-1" /> Novo Canal</Button></div>
          {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(channels || []).map((ch: any) => {
                const ct = CHANNEL_TYPES.find(t => t.value === ch.channel_type);
                return (
                  <Card key={ch.id} className={`cursor-pointer transition-colors ${selectedChannelId === ch.id ? "border-primary" : "hover:border-primary/50"}`}
                    onClick={() => { setSelectedChannelId(ch.id); setActiveTab("mappings"); }}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span className="flex items-center gap-2">{ct?.icon} {ch.channel_name}</span>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteChannel.mutate(ch.id); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{ch.channel_type}</Badge>
                        <Badge className={ch.status === "active" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}>{ch.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Criado: {new Date(ch.created_at).toLocaleDateString("pt-PT")}</p>
                    </CardContent>
                  </Card>
                );
              })}
              {(!channels || channels.length === 0) && <p className="text-sm text-muted-foreground col-span-3 text-center py-8">Nenhum canal configurado</p>}
            </div>
          )}
        </TabsContent>

        {/* MAPPINGS */}
        <TabsContent value="mappings">
          {selectedChannelId && <ChannelMappingEditor channelId={selectedChannelId} workspaceId={activeWorkspace?.id || ""} />}
        </TabsContent>

        {/* CONNECTIONS */}
        <TabsContent value="connections">
          {selectedChannelId && <ChannelConnectionsPanel channelId={selectedChannelId} workspaceId={activeWorkspace?.id || ""} />}
        </TabsContent>

        {/* JOBS */}
        <TabsContent value="jobs" className="space-y-4">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data</TableHead><TableHead>Canal</TableHead><TableHead>Status</TableHead>
                <TableHead>Progresso</TableHead><TableHead>Falhas</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(jobs || []).map((j: any) => (
                  <TableRow key={j.id}>
                    <TableCell className="text-sm">{new Date(j.created_at).toLocaleDateString("pt-PT")}</TableCell>
                    <TableCell><Badge variant="outline">{(j as any).channels?.channel_name || "—"}</Badge></TableCell>
                    <TableCell><Badge className={j.job_status === "completed" ? "bg-green-500/10 text-green-600" : j.job_status === "failed" ? "bg-red-500/10 text-red-600" : "bg-yellow-500/10 text-yellow-600"}>{j.job_status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={j.total_products > 0 ? (j.processed_products / j.total_products) * 100 : 0} className="h-2 w-20" />
                        <span className="text-xs">{j.processed_products}/{j.total_products}</span>
                      </div>
                    </TableCell>
                    <TableCell>{j.failed_products > 0 ? <Badge variant="destructive">{j.failed_products}</Badge> : "0"}</TableCell>
                  </TableRow>
                ))}
                {(!jobs || jobs.length === 0) && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sem jobs</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* New Channel Dialog */}
      <Dialog open={showNewChannel} onOpenChange={setShowNewChannel}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Canal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Nome</Label><Input value={newChannel.channel_name} onChange={e => setNewChannel(p => ({ ...p, channel_name: e.target.value }))} placeholder="Ex: WooCommerce PT" /></div>
            <div><Label className="text-xs">Tipo</Label>
              <Select value={newChannel.channel_type} onValueChange={v => setNewChannel(p => ({ ...p, channel_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CHANNEL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewChannel(false)}>Cancelar</Button>
            <Button onClick={handleCreateChannel} disabled={!newChannel.channel_name.trim()}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Channel Mapping Editor ---
function ChannelMappingEditor({ channelId, workspaceId }: { channelId: string; workspaceId: string }) {
  const { data: fieldMappings, isLoading } = useFieldMappings(channelId);
  const { data: catMappings } = useCategoryMappings(channelId);
  const upsertField = useUpsertFieldMapping();
  const deleteField = useDeleteFieldMapping();
  const upsertCat = useUpsertCategoryMapping();
  const [newMapping, setNewMapping] = useState({ canonical_field: "", channel_field: "", required: false });
  const [newCat, setNewCat] = useState({ internal_category: "", channel_category: "" });

  const handleAddField = () => {
    if (!newMapping.canonical_field || !newMapping.channel_field) return;
    upsertField.mutate({ ...newMapping, workspace_id: workspaceId, channel_id: channelId });
    setNewMapping({ canonical_field: "", channel_field: "", required: false });
  };

  const handleAddCat = () => {
    if (!newCat.internal_category || !newCat.channel_category) return;
    upsertCat.mutate({ ...newCat, workspace_id: workspaceId, channel_id: channelId });
    setNewCat({ internal_category: "", channel_category: "" });
  };

  return (
    <div className="space-y-6">
      {/* Field Mappings */}
      <Card>
        <CardHeader><CardTitle className="text-base">Mapeamento de Campos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1"><Label className="text-xs">Campo Interno</Label>
              <Select value={newMapping.canonical_field} onValueChange={v => setNewMapping(p => ({ ...p, canonical_field: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>{CANONICAL_FIELDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex-1"><Label className="text-xs">Campo Canal</Label><Input value={newMapping.channel_field} onChange={e => setNewMapping(p => ({ ...p, channel_field: e.target.value }))} placeholder="body_html" /></div>
            <div className="flex items-center gap-1 pb-1"><Switch checked={newMapping.required} onCheckedChange={v => setNewMapping(p => ({ ...p, required: v }))} /><span className="text-xs">Req</span></div>
            <Button size="sm" onClick={handleAddField}><Plus className="w-4 h-4" /></Button>
          </div>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Interno</TableHead><TableHead>Canal</TableHead><TableHead>Obrigatório</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {(fieldMappings || []).map((fm: any) => (
                  <TableRow key={fm.id}>
                    <TableCell><Badge variant="outline">{fm.canonical_field}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{fm.channel_field}</TableCell>
                    <TableCell>{fm.required ? <Badge className="bg-red-500/10 text-red-600">Sim</Badge> : "—"}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => deleteField.mutate(fm.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Category Mappings */}
      <Card>
        <CardHeader><CardTitle className="text-base">Mapeamento de Categorias</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1"><Label className="text-xs">Categoria Interna</Label><Input value={newCat.internal_category} onChange={e => setNewCat(p => ({ ...p, internal_category: e.target.value }))} /></div>
            <div className="flex-1"><Label className="text-xs">Categoria Canal</Label><Input value={newCat.channel_category} onChange={e => setNewCat(p => ({ ...p, channel_category: e.target.value }))} /></div>
            <Button size="sm" onClick={handleAddCat}><Plus className="w-4 h-4" /></Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Interna</TableHead><TableHead>Canal</TableHead><TableHead>Confiança</TableHead></TableRow></TableHeader>
            <TableBody>
              {(catMappings || []).map((cm: any) => (
                <TableRow key={cm.id}>
                  <TableCell>{cm.internal_category}</TableCell>
                  <TableCell className="font-mono text-sm">{cm.channel_category}</TableCell>
                  <TableCell><Badge variant="outline">{cm.confidence}%</Badge></TableCell>
                </TableRow>
              ))}
              {(!catMappings || catMappings.length === 0) && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-4">Sem mapeamentos</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Channel Connections Panel ---
function ChannelConnectionsPanel({ channelId, workspaceId }: { channelId: string; workspaceId: string }) {
  const { data: connections, isLoading } = useChannelConnections(channelId);
  const createConn = useCreateConnection();
  const [showNew, setShowNew] = useState(false);
  const [newConn, setNewConn] = useState({ connection_name: "", credentials: "{}", settings: "{}" });

  const handleCreate = () => {
    try {
      createConn.mutate({
        workspace_id: workspaceId,
        channel_id: channelId,
        connection_name: newConn.connection_name,
        credentials: JSON.parse(newConn.credentials),
        settings: JSON.parse(newConn.settings),
      });
      setShowNew(false);
    } catch { /* invalid JSON */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button size="sm" onClick={() => setShowNew(true)}><Plus className="w-4 h-4 mr-1" /> Nova Conexão</Button></div>
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
        <div className="space-y-3">
          {(connections || []).map((c: any) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{c.connection_name || "Sem nome"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={c.status === "connected" ? "bg-green-500/10 text-green-600" : "bg-muted"}>{c.status}</Badge>
                    {c.last_sync_at && <span className="text-xs text-muted-foreground">Último sync: {new Date(c.last_sync_at).toLocaleDateString("pt-PT")}</span>}
                  </div>
                </div>
                <Settings2 className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
          {(!connections || connections.length === 0) && <p className="text-sm text-muted-foreground text-center py-8">Sem conexões configuradas</p>}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Conexão</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Nome</Label><Input value={newConn.connection_name} onChange={e => setNewConn(p => ({ ...p, connection_name: e.target.value }))} /></div>
            <div><Label className="text-xs">Credenciais (JSON)</Label><Textarea value={newConn.credentials} onChange={e => setNewConn(p => ({ ...p, credentials: e.target.value }))} rows={4} className="font-mono text-xs" /></div>
            <div><Label className="text-xs">Settings (JSON)</Label><Textarea value={newConn.settings} onChange={e => setNewConn(p => ({ ...p, settings: e.target.value }))} rows={3} className="font-mono text-xs" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
