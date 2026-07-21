import React, { useEffect, useState } from "react";
import { quoteService } from "@/services";
import { useUptoStyles, UptoPage, UptoHero, UptoSectionHeading, UptoButton, UptoInput, UptoTextarea, UptoBadge, UptoSpinner, UptoError, UptoEmptyState, UptoCard, UptoProgressBar } from "@/components/UI/UptoHooks";
import { FileText, Plus, Eye, Send, Check, X, DollarSign, Calendar, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const STATUSES = [
  { id: "DRAFT", label: "Draft", color: "gray", icon: FileText },
  { id: "SENT", label: "Sent", color: "blue", icon: Send },
  { id: "VIEWED", label: "Viewed", color: "amber", icon: Eye },
  { id: "ACCEPTED", label: "Accepted", color: "emerald", icon: Check },
  { id: "REJECTED", label: "Rejected", color: "red", icon: X },
  { id: "EXPIRED", label: "Expired", color: "red", icon: Calendar },
];

const Quotes = () => {
  const { isMember } = useAuth();
  const s = useUptoStyles();
  const { darkMode } = s;
  const [tab, setTab] = useState("board");
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({
    title: "", description: "", dealId: "",
    items: [{ name: "", quantity: 1, unitPrice: 0, discount: 0 }],
    tax: 0, discount: 0, currency: "USD", notes: "", terms: "Payment due within 30 days.",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [q, m] = await Promise.all([quoteService.list(), quoteService.metrics()]);
      setItems(q.items || []);
      setMetrics(m);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();

    if (draft.dealId && Number(draft.dealId) < 1) {
  toast.error("Deal ID must be positive");
  return;
}

if (Number(draft.tax) < 0) {
  toast.error("Tax cannot be negative");
  return;
}

if (Number(draft.discount) < 0) {
  toast.error("Discount cannot be negative");
  return;
}

for (const item of draft.items) {
  if (Number(item.quantity) < 1) {
    toast.error("Quantity must be at least 1");
    return;
  }

  if (Number(item.unitPrice) < 0) {
    toast.error("Unit Price cannot be negative");
    return;
  }
}

    if (!draft.title.trim()) {
  toast.error("Title is required");
  return;
}

    try {
      await quoteService.create({
        ...draft,
        dealId: draft.dealId ? Number(draft.dealId) : undefined,
        items: draft.items.filter((i) => i.name).map((i) => ({ ...i, total: (i.quantity * i.unitPrice) - (i.discount || 0) })),
      });
      toast.success("Quote created");
      setShowCreate(false);
      setDraft({ title: "", description: "", dealId: "", items: [{ name: "", quantity: 1, unitPrice: 0, discount: 0 }], tax: 0, discount: 0, currency: "USD", notes: "", terms: "Payment due within 30 days." });
      load();
    } catch (err) { toast.error(err.message); }
  };
  const updateStatus = async (id, status) => {
    try { await quoteService.updateStatus(id, status); toast.success(`Quote ${status.toLowerCase()}`); load(); }
    catch (e) { toast.error(e.message); }
  };
  const remove = async (id) => {
    if (!confirm("Delete this quote?")) return;
    try { await quoteService.remove(id); load(); }
    catch (e) { toast.error(e.message); }
  };

  const quotesByStatus = STATUSES.map((s) => ({ ...s, quotes: items.filter((q) => q.status === s.id) }));

  return (
    <UptoPage>
      <UptoHero title="Quotes & Proposals" subtitle="Create, send, and track quotes and proposals." darkMode={darkMode}
        actions={isMember && <UptoButton onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New Quote</UptoButton>}
      />

      {metrics && (
        <section>
          <UptoSectionHeading label="Quote Metrics" darkMode={darkMode} />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <UptoCard><p className={`text-xs uppercase ${s.subtext}`}>Total Quotes</p><p className={`mt-1 text-2xl font-bold ${s.heading}`}>{metrics.total}</p></UptoCard>
            <UptoCard><p className={`text-xs uppercase ${s.subtext}`}>Win Rate</p><p className={`mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400`}>{metrics.winRate}%</p><p className={`text-xs ${s.muted}`}>{metrics.accepted} accepted</p></UptoCard>
            <UptoCard><p className={`text-xs uppercase ${s.subtext}`}>Pipeline Value</p><p className={`mt-1 text-2xl font-bold ${s.heading}`}>${(metrics.totalValue || 0).toLocaleString()}</p></UptoCard>
            <UptoCard><p className={`text-xs uppercase ${s.subtext}`}>Won Revenue</p><p className={`mt-1 text-2xl font-bold text-[#00b5ad]`}>${(metrics.acceptedValue || 0).toLocaleString()}</p></UptoCard>
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center gap-2">
          {["board", "list"].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${tab === t ? "bg-[#00b5ad] text-white" : s.body + " " + (darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100")}`}>
              {t === "board" ? "Pipeline" : "List"}
            </button>
          ))}
        </div>

        {loading ? <UptoSpinner /> : error ? <UptoError error={error} onRetry={load} /> : tab === "board" ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {quotesByStatus.map((col) => {
              const colorMap = { gray: "border-slate-400", blue: "border-blue-400", amber: "border-amber-400", emerald: "border-emerald-400", red: "border-red-400" };
              return (
                <div key={col.id} className={`flex h-full w-72 shrink-0 flex-col rounded-2xl border-t-4 ${darkMode ? "bg-slate-900/60" : "bg-slate-50/60"} ${colorMap[col.color] || colorMap.gray}`}>
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <col.icon className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className={`text-xs font-semibold uppercase tracking-wide ${s.heading}`}>{col.label}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${darkMode ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-600"}`}>{col.quotes.length}</span>
                    </div>
                  </div>
                  <div className="space-y-2 p-2 min-h-[100px]">
                    {col.quotes.length === 0 ? <p className={`py-4 text-center text-xs ${s.muted}`}>No quotes</p> : col.quotes.map((q) => (
                      <UptoCard key={q.id} className="cursor-pointer">
                        <div className="mb-1 flex items-start justify-between">
                          <h4 className={`line-clamp-2 text-sm font-semibold ${s.heading}`}>{q.title}</h4>
                        </div>
                        <p className={`text-xs ${s.muted}`}>{q.number}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`flex items-center gap-1 text-sm font-bold ${s.heading}`}><DollarSign className="h-3 w-3" />{(q.total || 0).toLocaleString()}</span>
                          {q.validUntil && <span className={`text-[10px] ${s.muted}`}>valid until {new Date(q.validUntil).toLocaleDateString()}</span>}
                        </div>
                        {q.status === "DRAFT" && isMember && (
                          <UptoButton onClick={() => updateStatus(q.id, "SENT")} className="mt-2 w-full text-xs"><Send className="h-3 w-3" /> Send</UptoButton>
                        )}
                        {q.status === "SENT" && isMember && (
                          <div className="mt-2 flex gap-1">
                            <UptoButton onClick={() => updateStatus(q.id, "ACCEPTED")} className="flex-1 text-xs"><Check className="h-3 w-3" /></UptoButton>
                            <UptoButton onClick={() => updateStatus(q.id, "REJECTED")} variant="danger" className="flex-1 text-xs"><X className="h-3 w-3" /></UptoButton>
                          </div>
                        )}
                      </UptoCard>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <UptoCard>
            {items.length === 0 ? (
              <UptoEmptyState icon={FileText} title="No quotes yet" body="Create your first quote or proposal." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                  <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <tr><th className="py-3 px-2">Number</th><th className="py-3 px-2">Title</th><th className="py-3 px-2">Status</th><th className="py-3 px-2">Total</th><th className="py-3 px-2 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((q) => (
                      <tr key={q.id} className={s.body}>
                        <td className="py-3 px-2 font-mono text-xs">{q.number}</td>
                        <td className={`py-3 px-2 font-medium ${s.heading}`}>{q.title}</td>
                        <td className="py-3 px-2"><UptoBadge tone={q.status === "ACCEPTED" ? "success" : q.status === "REJECTED" ? "danger" : "default"}>{q.status}</UptoBadge></td>
                        <td className="py-3 px-2 font-bold">${(q.total || 0).toLocaleString()}</td>
                        <td className="py-3 px-2 text-right">
                          {isMember && <UptoButton variant="ghost" onClick={() => remove(q.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></UptoButton>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </UptoCard>
        )}
      </section>

      {showCreate && (
        <section>
          <UptoCard>
            <h3 className={`text-base font-semibold mb-4 ${s.heading}`}>New Quote</h3>
            <form onSubmit={create} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <UptoInput label="Title *" value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} required placeholder="Q4 Enterprise Plan" />
            <UptoInput
  label="Deal ID (optional)"
  type="number"
  min={1}
  step="1"
  value={draft.dealId}
  onChange={(e) => {
    const value = e.target.value;

    if (value === "") {
      setDraft((p) => ({ ...p, dealId: "" }));
      return;
    }

    const num = Number(value);

    if (num < 1) return;

    setDraft((p) => ({
      ...p,
      dealId: num,
    }));
  }}
/>
              </div>
              <UptoTextarea label="Description" value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} />

              <div>
                <p className={`mb-2 text-sm font-medium ${s.body}`}>Line Items</p>
                {draft.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-5"><UptoInput placeholder="Item name" value={item.name} onChange={(e) => { const items = [...draft.items]; items[idx].name = e.target.value; setDraft((p) => ({ ...p, items })); }} /></div>
                    <div className="col-span-2"><UptoInput type="number" placeholder="Qty" min={1}
step="1" value={item.quantity} onChange={(e) => { const items = [...draft.items]; const value = e.target.value;

if (value === "") {
  items[idx].quantity = "";
} else {
  const num = Number(value);

  if (num < 1) return;

  items[idx].quantity = num;
}

setDraft((p) => ({ ...p, items }));
 setDraft((p) => ({ ...p, items })); }} /></div>
                    <div className="col-span-3"><UptoInput type="number" placeholder="Unit price" min={0} step="0.01" value={item.unitPrice} onChange={(e) => { const items = [...draft.items]; const value = e.target.value;

if (value === "") {
  items[idx].unitPrice = "";
} else {
  const num = Number(value);

  if (num < 0) return;

  items[idx].unitPrice = num;
}

setDraft((p) => ({ ...p, items }));

 setDraft((p) => ({ ...p, items })); }} /></div>
                    <div className="col-span-2 flex items-center">
                      {draft.items.length > 1 && <UptoButton variant="ghost" onClick={() => setDraft((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))} className="text-red-500"><Trash2 className="h-4 w-4" /></UptoButton>}
                    </div>
                  </div>
                ))}
                <UptoButton variant="secondary" onClick={() => setDraft((p) => ({ ...p, items: [...p.items, { name: "", quantity: 1, unitPrice: 0, discount: 0 }] }))} className="mt-2"><Plus className="h-4 w-4" /> Add Item</UptoButton>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <UptoInput label="Tax" type="number" min={0} value={draft.tax}
        onChange={(e) => {
  const value = e.target.value;

  if (value === "") {
    setDraft((p) => ({ ...p, tax: "" }));
    return;
  }

  const num = Number(value);

  if (num < 0) return;

  setDraft((p) => ({
    ...p,
    tax: num,
  }));
}}
                />
            <UptoInput label="Discount" type="number" min={0} value={draft.discount}
        onChange={(e) => {
  const value = e.target.value;

  if (value === "") {
    setDraft((p) => ({ ...p, tax: "" }));
    return;
  }

  const num = Number(value);

  if (num < 0) return;

  setDraft((p) => ({
    ...p,
    discount: num,
  }));
}}
                />
                <UptoInput label="Currency" value={draft.currency} onChange={(e) => setDraft((p) => ({ ...p, currency: e.target.value }))} />
              </div>
              <UptoTextarea label="Terms" value={draft.terms} onChange={(e) => setDraft((p) => ({ ...p, terms: e.target.value }))} />
              <UptoTextarea label="Notes" value={draft.notes} onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))} />

              <div className="flex gap-2">
                <UptoButton type="submit">Create Quote</UptoButton>
                <UptoButton type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</UptoButton>
              </div>
            </form>
          </UptoCard>
        </section>
      )}
    </UptoPage>
  );
};

export default Quotes;
