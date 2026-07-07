import React, { useEffect, useState } from "react";
import { workflowService } from "@/services";
import { useUptoStyles, UptoPage, UptoHero, UptoSectionHeading, UptoButton, UptoInput, UptoTextarea, UptoSelect, UptoBadge, UptoSpinner, UptoError, UptoEmptyState, UptoCard } from "@/components/UI/UptoHooks";
import { Zap, Plus, Play, Trash2, Activity } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const TRIGGER_LABELS = {
  LEAD_CREATED: "Lead created", LEAD_STATUS_CHANGED: "Lead status changed", LEAD_SCORE_CHANGED: "Lead score changed",
  DEAL_CREATED: "Deal created", DEAL_STAGE_CHANGED: "Deal stage changed", DEAL_WON: "Deal won", DEAL_LOST: "Deal lost",
  ACTIVITY_COMPLETED: "Activity completed", FORM_SUBMITTED: "Form submitted", EMAIL_OPENED: "Email opened",
  EMAIL_REPLIED: "Email replied", SCHEDULED_TIME: "Scheduled time", WEBHOOK_RECEIVED: "Webhook received",
};
const ACTION_LABELS = {
  SEND_EMAIL: "Send email", CREATE_TASK: "Create task", UPDATE_FIELD: "Update field",
  ASSIGN_OWNER: "Assign owner", ADD_TAG: "Add tag", REMOVE_TAG: "Remove tag", NOTIFY_USER: "Notify user",
  CREATE_DEAL: "Create deal", WEBHOOK: "Send webhook", WAIT: "Wait", BRANCH: "Branch",
};

const Workflows = () => {
  const { isAdmin } = useAuth();
  const s = useUptoStyles();
  const { darkMode } = s;
  const [items, setItems] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "", trigger: "LEAD_CREATED", actions: [{ type: "NOTIFY_USER", message: "New lead created" }] });

  const load = async () => {
    setLoading(true);
    try {
      const [w, t] = await Promise.all([workflowService.list(), workflowService.templates()]);
      setItems(w || []);
      setTemplates(t || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try { await workflowService.create(draft); toast.success("Workflow created"); setShowCreate(false); setDraft({ name: "", description: "", trigger: "LEAD_CREATED", actions: [{ type: "NOTIFY_USER", message: "New lead created" }] }); load(); }
    catch (err) { toast.error(err.message); }
  };
  const toggle = async (w) => {
    try { await workflowService.toggle(w.id); load(); }
    catch (e) { toast.error(e.message); }
  };
  const test = async (w) => {
    try { const r = await workflowService.test(w.id); toast.success(`Test executed (${r.executed} actions)`); }
    catch (e) { toast.error(e.message); }
  };
  const remove = async (id) => {
    if (!confirm("Delete this workflow?")) return;
    try { await workflowService.remove(id); load(); }
    catch (e) { toast.error(e.message); }
  };
  const applyTemplate = (t) => {
    setDraft({ name: t.name, description: t.description || "", trigger: t.trigger, actions: t.actions });
    setShowCreate(true);
  };

  return (
    <UptoPage>
      <UptoHero title="Workflows" subtitle="No-code automation rules for your sales process." darkMode={darkMode}
        actions={isAdmin && <UptoButton onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New Workflow</UptoButton>}
      />

      {templates.length > 0 && (
        <section>
          <UptoSectionHeading label="Quick start" darkMode={darkMode} />
          <UptoCard>
            <div className="flex flex-wrap gap-2">
              {templates.map((t, i) => (
                <button key={i} onClick={() => applyTemplate(t)} className={`rounded-xl border px-3 py-1.5 text-xs transition ${darkMode ? "border-slate-700 hover:border-[#00b5ad] hover:bg-teal-900/20" : "border-slate-200 hover:border-[#00b5ad] hover:bg-teal-50"}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </UptoCard>
        </section>
      )}

      {loading ? <UptoSpinner /> : items.length === 0 ? (
        <section><UptoCard><UptoEmptyState icon={Zap} title="No workflows yet" body="Build your first automation to save hours every week." /></UptoCard></section>
      ) : (
        <section>
          <UptoSectionHeading label="Your Workflows" darkMode={darkMode} />
          <div className="space-y-4">
            {items.map((w) => (
              <UptoCard key={w.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className={`font-semibold ${s.heading}`}>{w.name}</h3>
                      <UptoBadge tone={w.active ? "success" : "warning"}>{w.active ? "Active" : "Paused"}</UptoBadge>
                      <UptoBadge tone="info">{TRIGGER_LABELS[w.trigger] || w.trigger}</UptoBadge>
                    </div>
                    {w.description && <p className={`text-xs ${s.muted}`}>{w.description}</p>}
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                      <span><Activity className="mr-1 inline h-3 w-3" />{w._count?.runs || 0} runs</span>
                      {w.lastRunAt && <span>last run {new Date(w.lastRunAt).toLocaleString()}</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(w.actions || []).map((a, i) => (
                        <span key={i} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${darkMode ? "bg-teal-900/30 text-teal-300" : "bg-teal-50 text-teal-700"}`}>
                          {ACTION_LABELS[a.type] || a.type}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={w.active} onChange={() => toggle(w)} className="sr-only peer" />
                      <span className={`relative inline-block h-6 w-11 rounded-full transition ${w.active ? "bg-[#00b5ad]" : darkMode ? "bg-slate-700" : "bg-slate-300"}`}>
                        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${w.active ? "translate-x-5" : ""}`} />
                      </span>
                    </label>
                    {isAdmin && <UptoButton variant="ghost" onClick={() => test(w)} title="Test"><Play className="h-4 w-4" /></UptoButton>}
                    {isAdmin && <UptoButton variant="ghost" onClick={() => remove(w.id)} className="text-red-500" title="Delete"><Trash2 className="h-4 w-4" /></UptoButton>}
                  </div>
                </div>
              </UptoCard>
            ))}
          </div>
        </section>
      )}

      {showCreate && (
        <section>
          <UptoCard>
            <h3 className={`text-base font-semibold mb-4 ${s.heading}`}>New Workflow</h3>
            <form onSubmit={create} className="space-y-3">
              <UptoInput label="Name" value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} required />
              <UptoInput label="Description" value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} />
              <UptoSelect label="When this happens" value={draft.trigger} onChange={(e) => setDraft((p) => ({ ...p, trigger: e.target.value }))}>
                {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </UptoSelect>
              <UptoTextarea label="Actions (JSON)" rows={6} value={JSON.stringify(draft.actions, null, 2)} onChange={(e) => {
                try { setDraft((p) => ({ ...p, actions: JSON.parse(e.target.value) })); } catch {}
              }} />
              <div className="flex gap-2">
                <UptoButton type="submit">Create</UptoButton>
                <UptoButton type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</UptoButton>
              </div>
            </form>
          </UptoCard>
        </section>
      )}
    </UptoPage>
  );
};

export default Workflows;
