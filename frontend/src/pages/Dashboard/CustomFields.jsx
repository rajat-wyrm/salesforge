import React, { useEffect, useState } from "react";
import { customFieldService } from "@/services";
import { useUptoStyles, UptoPage, UptoHero, UptoSectionHeading, UptoButton, UptoInput, UptoSelect, UptoBadge, UptoSpinner, UptoError, UptoEmptyState, UptoCard } from "@/components/UI/UptoHooks";
import { Sparkles, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const CustomFields = () => {
  const { isAdmin } = useAuth();
  const s = useUptoStyles();
  const { darkMode } = s;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entity, setEntity] = useState("lead");
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ name: "", label: "", type: "text", options: "", required: false });

  const load = async () => {
    setLoading(true);
    try { setItems(await customFieldService.list({ entity }) || []); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [entity]);

  const create = async (e) => {
    e.preventDefault();
    try {
      const options = draft.options ? draft.options.split(",").map((s) => s.trim()).filter(Boolean) : null;
      await customFieldService.create({ ...draft, entity, options });
      toast.success("Field created");
      setShowCreate(false);
      setDraft({ name: "", label: "", type: "text", options: "", required: false });
      load();
    } catch (err) { toast.error(err.message); }
  };
  const remove = async (id) => {
    if (!confirm("Delete this field?")) return;
    try { await customFieldService.remove(id); load(); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <UptoPage>
      <UptoHero title="Custom fields" subtitle="Add your own fields to leads, deals, contacts, and companies." darkMode={darkMode}
        actions={isAdmin && <UptoButton onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New Field</UptoButton>}
      />

      <section>
        <div className="mb-4 flex items-center gap-2">
          <select value={entity} onChange={(e) => setEntity(e.target.value)} className={`rounded-xl border px-3 py-2 text-sm ${s.input}`}>
            {["lead", "deal", "contact", "company"].map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>
        {loading ? <UptoSpinner /> : items.length === 0 ? (
          <UptoCard><UptoEmptyState icon={Sparkles} title="No custom fields" body="Add fields like 'Industry', 'Budget', or 'Source rating' to capture the data that matters to your team." /></UptoCard>
        ) : (
          <div className="space-y-3">
            {items.map((f) => (
              <UptoCard key={f.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${s.heading}`}>{f.label}</h3>
                      <UptoBadge>{f.type}</UptoBadge>
                      {f.required && <UptoBadge tone="danger">required</UptoBadge>}
                    </div>
                    <p className={`text-xs ${s.muted}`}>{f.name} · {f.entity}</p>
                  </div>
                  {isAdmin && <UptoButton variant="ghost" onClick={() => remove(f.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></UptoButton>}
                </div>
              </UptoCard>
            ))}
          </div>
        )}
      </section>

      {showCreate && (
        <section>
          <UptoCard>
            <h3 className={`text-base font-semibold mb-4 ${s.heading}`}>New Custom Field</h3>
            <form onSubmit={create} className="space-y-3">
              <UptoInput label="Name (key)" value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} required placeholder="industry" />
              <UptoInput label="Label" value={draft.label} onChange={(e) => setDraft((p) => ({ ...p, label: e.target.value }))} required placeholder="Industry" />
              <UptoSelect label="Type" value={draft.type} onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value }))}>
                {["text", "number", "select", "multiselect", "date", "checkbox", "url", "email", "phone", "textarea"].map((t) => <option key={t}>{t}</option>)}
              </UptoSelect>
              {(draft.type === "select" || draft.type === "multiselect") && (
                <UptoInput label="Options (comma-separated)" value={draft.options} onChange={(e) => setDraft((p) => ({ ...p, options: e.target.value }))} placeholder="SaaS, Fintech, Healthtech" />
              )}
              <label className={`flex items-center gap-2 text-sm ${s.body}`}>
                <input type="checkbox" checked={draft.required} onChange={(e) => setDraft((p) => ({ ...p, required: e.target.checked }))} className="rounded" /> Required
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

export default CustomFields;
