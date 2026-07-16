// Help desk / customer support tickets page.
import React, { useEffect, useState } from "react";
import { ticketService } from "@/services";
import {
  UptoPage, UptoHero, UptoButton, UptoInput, UptoSelect, UptoTextarea, UptoBadge,
  UptoSpinner, UptoError, UptoEmptyState, UptoCard,
} from "@/components/UI/UptoHooks";
import { Ticket, Plus } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["open", "in_progress", "waiting", "resolved", "closed"];
const PRIORITIES = ["low", "medium", "high", "critical"];

const Tickets = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ subject: "", description: "", priority: "medium" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await ticketService.list({ limit: 100 });
      setItems(res?.items || res || []);
      setError(null);
    } catch (e) { setError(e?.message || "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await ticketService.create(draft);
      toast.success("Ticket created");
      setShowCreate(false);
      setDraft({ subject: "", description: "", priority: "medium" });
      load();
    } catch (err) { toast.error(err?.message || "Create failed"); }
  };

  const handleStatus = async (id, status) => {
    try { await ticketService.update(id, { status }); load(); } catch (_) { }
  };

  return (
    <UptoPage>
      <UptoHero
        title="Tickets"
        subtitle="Customer support and help desk"
        actions={<UptoButton onClick={() => setShowCreate(true)}><Plus className="mr-1 h-4 w-4 inline" /> New ticket</UptoButton>}
      />
      <UptoCard>
        {loading && <UptoSpinner />}
        {error && <UptoError message={error} onRetry={load} />}
        {!loading && !error && items.length === 0 && (
          <UptoEmptyState icon={Ticket} title="No tickets" body="Create a ticket to track customer issues." />
        )}
        {!loading && !error && items.length > 0 && (
          <div className="space-y-2">
            {items.map((t) => (
              <div key={t.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.subject || t.title}</div>
                  <div className="text-xs text-slate-500">{t.number} · {new Date(t.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <UptoBadge>{t.priority || "medium"}</UptoBadge>
                  <UptoBadge>{t.status}</UptoBadge>
                </div>
              </div>
            ))}
          </div>
        )}
      </UptoCard>
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">New ticket</h3>
            <div className="space-y-3">
              <UptoInput label="Subject" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} required />
              <UptoTextarea label="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} required />
              <UptoSelect label="Priority" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </UptoSelect>
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

export default Tickets;
