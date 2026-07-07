import React, { useEffect, useState } from "react";
import { templateService } from "@/services";
import { useUptoStyles, UptoPage, UptoHero, UptoSectionHeading, UptoButton, UptoInput, UptoTextarea, UptoSelect, UptoBadge, UptoSpinner, UptoError, UptoEmptyState, UptoCard, UptoCopyButton } from "@/components/UI/UptoHooks";
import { Mail, Plus, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const Templates = () => {
  const { isMember } = useAuth();
  const s = useUptoStyles();
  const { darkMode } = s;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ name: "", subject: "", body: "", category: "sales", isShared: false });
  const [test, setTest] = useState({ id: null, vars: { name: "Jane", company: "Acme" } });

  const load = async () => {
    setLoading(true);
    try { setItems(await templateService.list() || []); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try { await templateService.create(draft); toast.success("Template created"); setShowCreate(false); setDraft({ name: "", subject: "", body: "", category: "sales", isShared: false }); load(); }
    catch (err) { toast.error(err.message); }
  };
  const remove = async (id) => {
    if (!confirm("Delete this template?")) return;
    try { await templateService.remove(id); load(); }
    catch (e) { toast.error(e.message); }
  };
  const renderTemplate = async (t) => {
    try {
      const r = await templateService.use(t.id, test.vars);
      setTest({ id: t.id, vars: test.vars, output: r });
      toast.success("Rendered with sample variables");
    } catch (e) { toast.error(e.message); }
  };

  return (
    <UptoPage>
      <UptoHero title="Email templates" subtitle="Reusable emails with variables and categories." darkMode={darkMode}
        actions={isMember && <UptoButton onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New Template</UptoButton>}
      />

      {loading ? <UptoSpinner /> : items.length === 0 ? (
        <section><UptoCard><UptoEmptyState icon={Mail} title="No templates yet" body="Build your first email template to send faster." /></UptoCard></section>
      ) : (
        <section>
          <UptoSectionHeading label="Your Templates" darkMode={darkMode} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {items.map((t) => (
              <UptoCard key={t.id}>
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className={`font-semibold ${s.heading}`}>{t.name}</h3>
                    <p className={`text-xs ${s.muted}`}>{t.category || "general"} · used {t.useCount || 0} times</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {isMember && <UptoButton variant="ghost" onClick={() => renderTemplate(t)}><Play className="h-4 w-4" /></UptoButton>}
                    {isMember && <UptoButton variant="ghost" onClick={() => remove(t.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></UptoButton>}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className={`rounded-xl border p-2 ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
                    <p className={`text-xs font-semibold ${s.subtext}`}>Subject</p>
                    <p className={s.heading}>{t.subject}</p>
                  </div>
                  <div className={`rounded-xl border p-2 ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
                    <p className={`text-xs font-semibold ${s.subtext}`}>Body preview</p>
                    <p className={`line-clamp-3 ${s.body}`}>{t.body}</p>
                  </div>
                </div>
                {test.id === t.id && test.output && (
                  <div className={`mt-3 rounded-xl border p-3 text-sm ${darkMode ? "border-emerald-900/40 bg-emerald-900/20" : "border-emerald-200 bg-emerald-50"}`}>
                    <p className={`text-xs font-semibold ${darkMode ? "text-emerald-300" : "text-emerald-800"}`}>Rendered with sample variables</p>
                    <p className={`mt-1 ${darkMode ? "text-emerald-200" : "text-emerald-900"}`}><b>{test.output.subject}</b></p>
                    <p className={`mt-1 whitespace-pre-wrap text-xs ${darkMode ? "text-emerald-300" : "text-emerald-800"}`}>{test.output.body}</p>
                  </div>
                )}
              </UptoCard>
            ))}
          </div>
        </section>
      )}

      {showCreate && (
        <section>
          <UptoCard>
            <h3 className={`text-base font-semibold mb-4 ${s.heading}`}>New Template</h3>
            <form onSubmit={create} className="space-y-3">
              <UptoInput label="Name" value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} required />
              <UptoInput label="Subject" value={draft.subject} onChange={(e) => setDraft((p) => ({ ...p, subject: e.target.value }))} required hint="Use {{name}} for variables" />
              <UptoTextarea label="Body" rows={6} value={draft.body} onChange={(e) => setDraft((p) => ({ ...p, body: e.target.value }))} required />
              <UptoSelect label="Category" value={draft.category} onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))}>
                {["sales", "marketing", "followup", "onboarding", "support"].map((c) => <option key={c}>{c}</option>)}
              </UptoSelect>
              <label className={`flex items-center gap-2 text-sm ${s.body}`}>
                <input type="checkbox" checked={draft.isShared} onChange={(e) => setDraft((p) => ({ ...p, isShared: e.target.checked }))} className="rounded" /> Share with the team
              </label>
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

export default Templates;
