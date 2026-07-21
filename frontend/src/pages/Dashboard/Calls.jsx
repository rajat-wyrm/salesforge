// Call log page.
import React, { useEffect, useState } from "react";
import { callService } from "@/services";
import {
  UptoPage, UptoHero, UptoButton, UptoInput, UptoBadge,
  UptoSpinner, UptoError, UptoEmptyState, UptoCard,
} from "@/components/UI/UptoHooks";
import { Phone, Plus } from "lucide-react";
import { toast } from "sonner";

const Calls = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", phoneNumber: "", duration: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const res = await callService.list({ limit: 100 });
      setItems(res?.items || res || []);
      setError(null);
    } catch (e) { setError(e?.message || "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    
    try {
      await callService.create({ ...draft, duration: Number(draft.duration) });
      toast.success("Call logged");
      setShowCreate(false);
      setDraft({ title: "", description: "", phoneNumber: "", duration: 0 });
      load();
    } catch (err) { toast.error(err?.message || "Create failed"); }
  };

  return (
    <UptoPage>
      <UptoHero
        title="Calls"
        subtitle="Phone call log and tracking"
        actions={<UptoButton onClick={() => setShowCreate(true)}><Plus className="mr-1 h-4 w-4 inline" /> Log call</UptoButton>}
      />
      <UptoCard>
        {loading && <UptoSpinner />}
        {error && <UptoError message={error} onRetry={load} />}
        {!loading && !error && items.length === 0 && (
          <UptoEmptyState icon={Phone} title="No calls" body="Log your first call to get started." />
        )}
        {!loading && !error && items.length > 0 && (
          <div className="space-y-2">
            {items.map((c) => (
              <div key={c.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.title || c.phoneNumber || "Call"}</div>
                  <div className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleString()} · {c.duration || 0} min</div>
                </div>
                <UptoBadge>{c.outcome || c.status || "logged"}</UptoBadge>
              </div>
            ))}
          </div>
        )}
      </UptoCard>
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Log call</h3>
            <div className="space-y-3">
              <UptoInput label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required />
              <UptoInput label="Phone number" value={draft.phoneNumber} onChange={(e) => setDraft({ ...draft, phoneNumber: e.target.value })} />
          <UptoInput
  label="Duration (min)"
  type="number"
  min={0}
  step="1"
  value={draft.duration}
  onChange={(e) => {
    const value = e.target.value;

    if (value === "") {
      setDraft((p) => ({
        ...p,
        duration: "",
      }));
      return;
    }

    const num = Number(value);

    if (num < 0) return;

    setDraft((p) => ({
      ...p,
      duration: num,
    }));
  }}
/>

              <UptoInput label="Notes" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <UptoButton type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</UptoButton>
              <UptoButton type="submit">Save</UptoButton>
            </div>
          </form>
        </div>
      )}
    </UptoPage>
  );
};

export default Calls;