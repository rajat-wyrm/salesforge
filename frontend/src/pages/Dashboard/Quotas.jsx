// Sales quotas tracking page.
import React, { useEffect, useState } from "react";
import { quotaService } from "@/services";
import {
  UptoPage, UptoHero, UptoButton, UptoInput, UptoBadge,
  UptoSpinner, UptoError, UptoEmptyState, UptoCard, UptoProgressBar,
} from "@/components/UI/UptoHooks";
import { Target, Plus } from "lucide-react";
import { toast } from "sonner";

const Quotas = () => {
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ userId: "", target: "", type: "revenue" });

  const load = async () => {
    setLoading(true);
    try {
      const [list, met] = await Promise.all([quotaService.list(), quotaService.metrics()]);
      setItems(list || []);
      setMetrics(met || null);
      setError(null);
    } catch (e) { setError(e?.message || "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await quotaService.create({ ...draft, target: Number(draft.target) });
      toast.success("Quota created");
      setShowCreate(false);
      setDraft({ userId: "", target: "", type: "revenue" });
      load();
    } catch (err) { toast.error(err?.message || "Create failed"); }
  };

  return (
    <UptoPage>
      <UptoHero
        title="Sales quotas"
        subtitle="Track targets and attainment for your sales team"
        actions={<UptoButton onClick={() => setShowCreate(true)}><Plus className="mr-1 h-4 w-4 inline" /> New quota</UptoButton>}
      />

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <UptoCard><div className="text-xs text-slate-500">Total target</div><div className="text-2xl font-semibold">${(metrics.totalTarget || 0).toLocaleString()}</div></UptoCard>
          <UptoCard><div className="text-xs text-slate-500">Total actual</div><div className="text-2xl font-semibold">${(metrics.totalActual || 0).toLocaleString()}</div></UptoCard>
          <UptoCard><div className="text-xs text-slate-500">Attainment</div><div className="text-2xl font-semibold text-teal-600">{metrics.progress || 0}%</div></UptoCard>
        </div>
      )}

      <UptoCard>
        {loading && <UptoSpinner />}
        {error && <UptoError message={error} onRetry={load} />}
        {!loading && !error && items.length === 0 && (
          <UptoEmptyState icon={Target} title="No quotas yet" body="Set targets for your team to track performance." />
        )}
        {!loading && !error && items.length > 0 && (
          <div className="space-y-3">
            {items.map((q) => (
              <div key={`${q.userId}-${q.period}`} className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium">{q.user?.name || "—"} <UptoBadge>{q.type}</UptoBadge></div>
                  <div className="text-sm text-slate-500">{q.period} · {q.progress}%</div>
                </div>
                <UptoProgressBar value={q.progress} />
                <div className="text-xs text-slate-500 mt-1">${q.actual?.toLocaleString() || 0} of ${q.target?.toLocaleString() || 0}</div>
              </div>
            ))}
          </div>
        )}
      </UptoCard>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">New quota</h3>
            <div className="space-y-3">
              <UptoInput label="User ID" value={draft.userId} onChange={(e) => setDraft({ ...draft, userId: e.target.value })} required />
              <UptoInput label="Target" type="number" value={draft.target} onChange={(e) => setDraft({ ...draft, target: e.target.value })} required />
              <UptoInput label="Type" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <UptoButton type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</UptoButton>
              <UptoButton type="submit">Create</UptoButton>
            </div>
          </form>
        </div>
      )}
    </UptoPage>
  );
};

export default Quotas;
