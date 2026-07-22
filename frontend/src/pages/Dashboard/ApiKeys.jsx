import React, { useEffect, useState } from "react";
import { apiKeyService, webhookService } from "@/services";
import { useUptoStyles, UptoPage, UptoHero, UptoSectionHeading, UptoButton, UptoInput, UptoSelect, UptoBadge, UptoSpinner, UptoError, UptoEmptyState, UptoCard, UptoCopyButton } from "@/components/UI/UptoHooks";
import { Key, Webhook, Plus, Trash2, Copy, Activity, RotateCw, Send, Eye, EyeOff, Edit } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const WEBHOOK_EVENTS = [
  "LEAD_CREATED", "LEAD_UPDATED", "LEAD_DELETED", "LEAD_STATUS_CHANGED",
  "DEAL_CREATED", "DEAL_UPDATED", "ORGANIZATION_CREATED",
  "USER_INVITED", "USER_JOINED", "PAYMENT_SUCCEEDED", "PAYMENT_FAILED",
  "SUBSCRIPTION_UPDATED", "SEARCH_COMPLETED", "INTEGRATION_SYNCED",
];

const ApiKeys = () => {
  const { isAdmin } = useAuth();
  const s = useUptoStyles();
  const { darkMode } = s;
  const [keys, setKeys] = useState([]);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState("read,write");
  const [created, setCreated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editScopes, setEditScopes] = useState("");

  const load = async () => {
    setLoading(true);
    try { setKeys(await apiKeyService.list() || []); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!name) return;
    try {
      const k = await apiKeyService.create({ name, scopes });
      setCreated(k);
      setName("");
      toast.success("API key created. Copy it now — you won't see it again.");
      await load();
    } catch (err) { toast.error(err.message); }
  };

  const revoke = async (id) => {
    if (!confirm("Revoke this API key? Any systems using it will lose access.")) return;
    try { await apiKeyService.revoke(id); toast.success("API key revoked"); await load(); }
    catch (e) { toast.error(e.message); }
  };
  const startEdit = (k) => {
    setEditingId(k.id);
    setEditName(k.name);
    setEditScopes(k.scopes);
  };

  const saveEdit = async (id) => {
    try { 
      await apiKeyService.update(id, { name: editName, scopes: editScopes }); 
      toast.success("API key updated"); 
      setEditingId(null); 
      await load(); 
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <UptoSpinner />;
  if (error) return <UptoError error={error} onRetry={load} />;

  return (
    <UptoPage>
      <UptoHero title="API keys" subtitle="Create keys to integrate Fintrix with your own tools." darkMode={darkMode} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UptoSectionHeading label="Active Keys" hint={`${keys.length} active`} darkMode={darkMode} />
          <UptoCard>
            {keys.length === 0 ? (
              <UptoEmptyState icon={Key} title="No API keys yet" body="Create your first key to start integrating." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                  <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <tr><th className="py-3 px-2">Name</th><th className="py-3 px-2">Key</th><th className="py-3 px-2">Scopes</th><th className="py-3 px-2">Last used</th><th className="py-3 px-2 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {keys.map((k) => (
                      editingId === k.id ? (
                        <tr key={k.id}>
                          <td className="py-3 px-2"><input className="w-full rounded border px-2 py-1 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={editName} onChange={(e) => setEditName(e.target.value)} /></td>
                          <td className="py-3 px-2 font-mono text-xs">{k.keyPrefix}…</td>
                          <td className="py-3 px-2"><input className="w-full rounded border px-2 py-1 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={editScopes} onChange={(e) => setEditScopes(e.target.value)} /></td>
                          <td className={`py-3 px-2 text-xs ${s.muted}`}>{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}</td>
                          <td className="py-3 px-2 text-right flex justify-end gap-1">
                            <UptoButton onClick={() => saveEdit(k.id)}>Save</UptoButton>
                            <UptoButton variant="secondary" onClick={() => setEditingId(null)}>Cancel</UptoButton>
                          </td>
                        </tr>
                      ) : (
                        <tr key={k.id}>
                          <td className={`py-3 px-2 font-medium ${s.heading}`}>{k.name}</td>
                          <td className="py-3 px-2 font-mono text-xs">{k.keyPrefix}…</td>
                          <td className="py-3 px-2"><UptoBadge>{k.scopes}</UptoBadge></td>
                          <td className={`py-3 px-2 text-xs ${s.muted}`}>{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}</td>
                          <td className="py-3 px-2 text-right flex justify-end gap-1">
                            <UptoButton variant="ghost" onClick={() => startEdit(k)}><Edit className="h-4 w-4" /></UptoButton>
                            <UptoButton variant="ghost" onClick={() => revoke(k.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></UptoButton>
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </UptoCard>
        </div>

        {isAdmin && (
          <UptoCard>
            <UptoSectionHeading label="Create New Key" darkMode={darkMode} />
            <form onSubmit={create} className="space-y-3">
              <UptoInput label="Name" placeholder="e.g. CI pipeline" value={name} onChange={(e) => setName(e.target.value)} required />
              <UptoInput label="Scopes" value={scopes} onChange={(e) => setScopes(e.target.value)} hint="Comma-separated, e.g. read,write" />
              <UptoButton type="submit" className="w-full"><Plus className="h-4 w-4" /> Create key</UptoButton>
            </form>
            {created && (
              <div className={`mt-4 rounded-xl border p-3 text-sm ${darkMode ? "border-emerald-900/40 bg-emerald-900/20" : "border-emerald-200 bg-emerald-50"}`}>
                <p className={`mb-1 font-semibold ${darkMode ? "text-emerald-300" : "text-emerald-800"}`}>{created.name}</p>
                <div className="flex items-center gap-2">
                  <code className={`block w-full truncate rounded px-2 py-1 font-mono text-xs ${darkMode ? "bg-slate-800" : "bg-white"}`}>{created.key}</code>
                  <UptoCopyButton value={created.key} />
                </div>
                <p className={`mt-2 text-xs ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}>Store this securely. It will not be shown again.</p>
              </div>
            )}
          </UptoCard>
        )}
      </div>

      <section>
        <UptoSectionHeading label="How to use" darkMode={darkMode} />
        <UptoCard>
          <pre className={`overflow-x-auto rounded-xl p-4 text-xs ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-900 text-slate-100"}`}>
{`curl -H "Authorization: Bearer YOUR_KEY" \\
     -H "Content-Type: application/json" \\
     ${typeof window !== "undefined" ? window.location.origin : "http://localhost:5173"}/api/leads`}
          </pre>
        </UptoCard>
      </section>
    </UptoPage>
  );
};

const Webhooks = () => {
  const { isAdmin } = useAuth();
  const s = useUptoStyles();
  const { darkMode } = s;
  const [hooks, setHooks] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", events: [] });

  const load = async () => {
    setLoading(true);
    try {
      const [h, d] = await Promise.all([webhookService.list(), webhookService.deliveries({ limit: 20 })]);
      setHooks(h || []);
      setDeliveries(d.items || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (form.events.length === 0) return toast.error("Select at least one event");
    try {
      await webhookService.create(form);
      setForm({ name: "", url: "", events: [] });
      setShowCreate(false);
      toast.success("Webhook created");
      await load();
    } catch (err) { toast.error(err.message); }
  };

  const testHook = async (id) => {
    try {
      const r = await webhookService.test(id);
      toast.success(`Test delivered (${r.durationMs}ms, status ${r.status || "n/a"})`);
      await load();
    } catch (e) { toast.error(e.message); }
  };

  const remove = async (id) => {
    if (!confirm("Delete this webhook?")) return;
    try { await webhookService.remove(id); toast.success("Deleted"); await load(); }
    catch (e) { toast.error(e.message); }
  };

  const toggleEvent = (ev) =>
    setForm((p) => ({ ...p, events: p.events.includes(ev) ? p.events.filter((e) => e !== ev) : [...p.events, ev] }));

  if (loading) return <UptoSpinner />;
  if (error) return <UptoError error={error} onRetry={load} />;

  return (
    <UptoPage>
      <UptoHero title="Webhooks" subtitle="Subscribe to events and send them to your own services." darkMode={darkMode}
        actions={isAdmin && <UptoButton onClick={() => setShowCreate((p) => !p)}><Plus className="h-4 w-4" /> New Webhook</UptoButton>}
      />

      {showCreate && (
        <section>
          <UptoCard>
            <UptoSectionHeading label="Create Webhook" darkMode={darkMode} />
            <form onSubmit={create} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <UptoInput label="Name" placeholder="My CRM" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
                <UptoInput label="URL" placeholder="https://example.com/webhook" value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} required />
              </div>
              <div>
                <p className={`mb-2 text-sm font-medium ${s.body}`}>Events</p>
                <div className="flex flex-wrap gap-2">
                  {WEBHOOK_EVENTS.map((ev) => (
                    <button type="button" key={ev} onClick={() => toggleEvent(ev)} className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      form.events.includes(ev)
                        ? "border-[#00b5ad] bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                        : darkMode ? "border-slate-700 text-slate-300 hover:border-slate-500" : "border-slate-300 text-slate-600 hover:border-slate-400"
                    }`}>{ev}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <UptoButton type="submit">Create Webhook</UptoButton>
                <UptoButton type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</UptoButton>
              </div>
            </form>
          </UptoCard>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UptoSectionHeading label="Webhooks" darkMode={darkMode} />
          {hooks.length === 0 ? (
            <UptoCard><UptoEmptyState icon={Webhook} title="No webhooks yet" body="Create your first webhook to start receiving events." /></UptoCard>
          ) : (
            <div className="space-y-3">
              {hooks.map((h) => (
                <UptoCard key={h.id}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${s.heading}`}>{h.name}</p>
                        {h.active ? <UptoBadge tone="success">Active</UptoBadge> : <UptoBadge tone="warning">Paused</UptoBadge>}
                        {h.failureCount > 0 && <UptoBadge tone="danger">{h.failureCount} failures</UptoBadge>}
                      </div>
                      <p className={`mt-0.5 truncate text-sm ${s.muted}`}>{h.url}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {h.events.split(",").map((ev) => <UptoBadge key={ev} tone="info">{ev}</UptoBadge>)}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {isAdmin && <UptoButton variant="ghost" onClick={() => testHook(h.id)} title="Send test"><Send className="h-4 w-4" /></UptoButton>}
                      {isAdmin && <UptoButton variant="ghost" onClick={() => remove(h.id)} className="text-red-500" title="Delete"><Trash2 className="h-4 w-4" /></UptoButton>}
                    </div>
                  </div>
                </UptoCard>
              ))}
            </div>
          )}
        </div>

        <div>
          <UptoSectionHeading label="Recent Deliveries" darkMode={darkMode} />
          <UptoCard>
            {deliveries.length === 0 ? (
              <UptoEmptyState icon={Activity} title="No deliveries yet" body="Once your webhook fires, deliveries will appear here." />
            ) : (
              <ul className="space-y-2 text-sm">
                {deliveries.map((d) => (
                  <li key={d.id} className="flex items-start justify-between rounded-xl border border-slate-100 p-2 dark:border-slate-800">
                    <div>
                      <p className={`font-medium ${s.heading}`}>{d.event}</p>
                      <p className={`text-xs ${s.muted}`}>{new Date(d.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      {d.responseStatus ? (
                        <UptoBadge tone={d.responseStatus < 300 ? "success" : "danger"}>{d.responseStatus}</UptoBadge>
                      ) : <UptoBadge tone="warning">err</UptoBadge>}
                      <p className="mt-1 text-xs text-slate-500">{d.durationMs}ms</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </UptoCard>
        </div>
      </div>
    </UptoPage>
  );
};

export { ApiKeys, Webhooks };
