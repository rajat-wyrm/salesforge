// Contracts page.
import React, { useEffect, useState } from "react";
import { contractService } from "@/services";
import {
  UptoPage, UptoHero, UptoButton, UptoInput, UptoBadge,
  UptoSpinner, UptoError, UptoEmptyState, UptoCard,
} from "@/components/UI/UptoHooks";
import { FileSignature, Plus } from "lucide-react";
import { toast } from "sonner";

const Contracts = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ title: "", counterparty: "", value: "", startDate: "", endDate: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await contractService.list({ limit: 100 });
      setItems(res?.items || res || []);
      setError(null);
    } catch (e) { setError(e?.message || "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await contractService.create({ ...draft, value: Number(draft.value) });
      toast.success("Contract created");
      setShowCreate(false);
      setDraft({ title: "", counterparty: "", value: "", startDate: "", endDate: "" });
      load();
    } catch (err) { toast.error(err?.message || "Create failed"); }
  };

  return (
    <UptoPage>
      <UptoHero
        title="Contracts"
        subtitle="Track contract lifecycle and renewals"
        actions={<UptoButton onClick={() => setShowCreate(true)}><Plus className="mr-1 h-4 w-4 inline" /> New contract</UptoButton>}
      />
      <UptoCard>
        {loading && <UptoSpinner />}
        {error && <UptoError message={error} onRetry={load} />}
        {!loading && !error && items.length === 0 && (
          <UptoEmptyState icon={FileSignature} title="No contracts" body="Track deals and renewals from this view." />
        )}
        {!loading && !error && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Counterparty</th>
                  <th className="px-3 py-2">Value</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-2 font-medium">{c.title}</td>
                    <td className="px-3 py-2">{c.counterparty || "—"}</td>
                    <td className="px-3 py-2">${(c.value || 0).toLocaleString()}</td>
                    <td className="px-3 py-2"><UptoBadge>{c.status || "draft"}</UptoBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </UptoCard>
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">New contract</h3>
            <div className="space-y-3">
              <UptoInput label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required />
              <UptoInput label="Counterparty" value={draft.counterparty} onChange={(e) => setDraft({ ...draft, counterparty: e.target.value })} />
              <UptoInput label="Value" type="number" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} />
              <UptoInput label="Start date" type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
              <UptoInput label="End date" type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} />
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

export default Contracts;
