import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { quoteService } from "@/services";
import { useUptoStyles, UptoPage, UptoHero, UptoSectionHeading, UptoButton, UptoInput, UptoSelect, UptoTextarea, UptoBadge, UptoSpinner, UptoError, UptoEmptyState, UptoCard, UptoProgressBar } from "@/components/UI/UptoHooks";
import { FileText, Plus, Eye, Send, Check, X, DollarSign, Calendar, Trash2, Download, Search, Filter } from "lucide-react";
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
  const navigate = useNavigate();
  const s = useUptoStyles();
  const { darkMode } = s;
  const [tab, setTab] = useState("board");
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    minAmount: "",
    maxAmount: ""
  });

  const [draft, setDraft] = useState({
    title: "", description: "", dealId: "",
    items: [{ name: "", quantity: 1, unitPrice: 0, discount: 0 }],
    tax: 0, discount: 0, currency: "USD", notes: "", terms: "Payment due within 30 days.",
  });

  const load = async () => {
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ""));
      const [q, m] = await Promise.all([quoteService.list(activeFilters), quoteService.metrics()]);
      setItems(q.items || []);
      setMetrics(m);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  
  useEffect(() => { load(); }, [filters.status]); // Reload on status change

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const create = async (e) => {
    e.preventDefault();
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

  const updateStatus = async (e, id, status) => {
    e.stopPropagation();
    try { await quoteService.updateStatus(id, status); toast.success(`Quote ${status.toLowerCase()}`); load(); }
    catch (e) { toast.error(e.message); }
  };

  const remove = async (e, id) => {
    e.stopPropagation();
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5 mb-4">
            <UptoCard className="py-4"><p className={`text-xs uppercase ${s.subtext}`}>Draft</p><p className={`mt-1 text-2xl font-bold ${s.heading}`}>{metrics.draft}</p></UptoCard>
            <UptoCard className="py-4"><p className={`text-xs uppercase ${s.subtext}`}>Sent</p><p className={`mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400`}>{metrics.sent}</p></UptoCard>
            <UptoCard className="py-4"><p className={`text-xs uppercase ${s.subtext}`}>Viewed</p><p className={`mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400`}>{metrics.viewed}</p></UptoCard>
            <UptoCard className="py-4"><p className={`text-xs uppercase ${s.subtext}`}>Accepted</p><p className={`mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400`}>{metrics.accepted}</p></UptoCard>
            <UptoCard className="py-4"><p className={`text-xs uppercase ${s.subtext}`}>Rejected</p><p className={`mt-1 text-2xl font-bold text-red-600 dark:text-red-400`}>{metrics.rejected}</p></UptoCard>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <UptoCard className="py-4">
              <p className={`text-xs uppercase ${s.subtext}`}>Acceptance Rate</p>
              <p className={`mt-1 text-2xl font-bold ${s.heading}`}>{metrics.winRate}%</p>
              <UptoProgressBar value={metrics.winRate} darkMode={darkMode} className="mt-2" />
            </UptoCard>
            <UptoCard className="py-4"><p className={`text-xs uppercase ${s.subtext}`}>Revenue from Accepted</p><p className={`mt-1 text-2xl font-bold text-[#00b5ad]`}>${(metrics.acceptedValue || 0).toLocaleString()}</p></UptoCard>
            <UptoCard className="py-4"><p className={`text-xs uppercase ${s.subtext}`}>Average Quote Value</p><p className={`mt-1 text-2xl font-bold ${s.heading}`}>${(metrics.avgQuoteValue || 0).toLocaleString()}</p></UptoCard>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="mb-6 mt-8">
        <UptoSectionHeading label="Filters" darkMode={darkMode} />
        <div className={`rounded-2xl p-5 border ${s.card}`}>
          <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <UptoInput placeholder="Search by title or quote #..." value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} />
            </div>
            <div className="w-32">
              <UptoInput placeholder="Min $" type="number" value={filters.minAmount} onChange={(e) => setFilters((p) => ({ ...p, minAmount: e.target.value }))} />
            </div>
            <div className="w-32">
              <UptoInput placeholder="Max $" type="number" value={filters.maxAmount} onChange={(e) => setFilters((p) => ({ ...p, maxAmount: e.target.value }))} />
            </div>
            <div className="w-40">
              <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm transition focus:border-[#00b5ad] focus:outline-none focus:ring-2 focus:ring-[#00b5ad]/20 ${s.input}`}>
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <UptoButton type="submit"><Search className="h-4 w-4" /> Filter</UptoButton>
          </form>
        </div>
      </section>

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
                    {col.quotes.length === 0 ? <p className={`py-4 text-center text-xs ${s.muted}`}>No quotes</p> : col.quotes.map((q) => {
                      const isExpired = q.validUntil && new Date(q.validUntil) < new Date();
                      const daysUntilExpiry = q.validUntil ? Math.ceil((new Date(q.validUntil) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                      
                      return (
                        <UptoCard key={q.id} className="cursor-pointer hover:border-[#00b5ad] hover:shadow-md transition-all" onClick={() => navigate(`/quotes/${q.id}`)}>
                          <div className="mb-2">
                            <h4 className={`line-clamp-2 text-sm font-semibold ${s.heading}`}>{q.title}</h4>
                            <p className={`text-xs mt-1 font-mono text-slate-500`}>{q.number}</p>
                          </div>
                          
                          <div className={`text-xs mb-3 ${s.subtext} flex flex-col gap-1`}>
                            {q.dealId && <span>Deal #{q.dealId}</span>}
                            <span>Owner: {q.createdBy?.name || "Team"}</span>
                          </div>
                          
                          <div className="mt-2 flex items-center justify-between">
                            <span className={`flex items-center gap-1 text-sm font-bold ${s.heading}`}>
                              <DollarSign className="h-3 w-3" />{(q.total || 0).toLocaleString()}
                            </span>
                          </div>

                          {q.validUntil && (
                            <div className={`mt-2 text-[10px] font-medium flex items-center gap-1 ${isExpired ? 'text-red-500' : daysUntilExpiry <= 3 ? 'text-amber-500' : 'text-emerald-500'}`}>
                              <div className={`h-1.5 w-1.5 rounded-full ${isExpired ? 'bg-red-500' : daysUntilExpiry <= 3 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                              {isExpired ? 'Expired' : `Expires in ${daysUntilExpiry} days`}
                            </div>
                          )}

                          <div className="mt-4 flex gap-1">
                            <UptoButton onClick={(e) => { e.stopPropagation(); navigate(`/quotes/${q.id}`); }} variant="secondary" className="flex-1 text-xs px-2">
                              View
                            </UptoButton>
                            {q.status === "DRAFT" && isMember && (
                              <UptoButton onClick={(e) => updateStatus(e, q.id, "SENT")} className="flex-1 text-xs px-2"><Send className="h-3 w-3" /></UptoButton>
                            )}
                            {q.status === "SENT" && isMember && (
                              <>
                                <UptoButton onClick={(e) => updateStatus(e, q.id, "ACCEPTED")} className="flex-1 text-xs px-2 bg-emerald-600 hover:bg-emerald-700 text-white"><Check className="h-3 w-3" /></UptoButton>
                                <UptoButton onClick={(e) => updateStatus(e, q.id, "REJECTED")} variant="danger" className="flex-1 text-xs px-2"><X className="h-3 w-3" /></UptoButton>
                              </>
                            )}
                          </div>
                        </UptoCard>
                      );
                    })}
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
                    <tr>
                      <th className="py-3 px-2">Number</th>
                      <th className="py-3 px-2">Title</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2">Owner</th>
                      <th className="py-3 px-2">Total</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((q) => (
                      <tr key={q.id} className={`${s.body} hover:${darkMode ? 'bg-slate-800' : 'bg-slate-50'} cursor-pointer transition-colors`} onClick={() => navigate(`/quotes/${q.id}`)}>
                        <td className="py-3 px-2 font-mono text-xs text-slate-500">{q.number}</td>
                        <td className={`py-3 px-2 font-medium ${s.heading}`}>{q.title}</td>
                        <td className="py-3 px-2"><UptoBadge tone={q.status === "ACCEPTED" ? "success" : q.status === "REJECTED" ? "danger" : "default"}>{q.status}</UptoBadge></td>
                        <td className="py-3 px-2">{q.createdBy?.name || "Team"}</td>
                        <td className="py-3 px-2 font-bold">${(q.total || 0).toLocaleString()}</td>
                        <td className="py-3 px-2 text-right">
                          {isMember && <UptoButton variant="ghost" onClick={(e) => remove(e, q.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></UptoButton>}
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
                <UptoInput label="Deal ID (optional)" type="number" value={draft.dealId} onChange={(e) => setDraft((p) => ({ ...p, dealId: e.target.value }))} />
              </div>
              <UptoTextarea label="Description" value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} />

              <div>
                <p className={`mb-2 text-sm font-medium ${s.body}`}>Line Items</p>
                {draft.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-5"><UptoInput placeholder="Item name" value={item.name} onChange={(e) => { const items = [...draft.items]; items[idx].name = e.target.value; setDraft((p) => ({ ...p, items })); }} /></div>
                    <div className="col-span-2"><UptoInput type="number" placeholder="Qty" value={item.quantity} onChange={(e) => { const items = [...draft.items]; items[idx].quantity = Number(e.target.value); setDraft((p) => ({ ...p, items })); }} /></div>
                    <div className="col-span-3"><UptoInput type="number" placeholder="Unit price" value={item.unitPrice} onChange={(e) => { const items = [...draft.items]; items[idx].unitPrice = Number(e.target.value); setDraft((p) => ({ ...p, items })); }} /></div>
                    <div className="col-span-2 flex items-center">
                      {draft.items.length > 1 && <UptoButton variant="ghost" onClick={() => setDraft((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))} className="text-red-500"><Trash2 className="h-4 w-4" /></UptoButton>}
                    </div>
                  </div>
                ))}
                <UptoButton variant="secondary" type="button" onClick={() => setDraft((p) => ({ ...p, items: [...p.items, { name: "", quantity: 1, unitPrice: 0, discount: 0 }] }))} className="mt-2"><Plus className="h-4 w-4" /> Add Item</UptoButton>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <UptoInput label="Tax" type="number" value={draft.tax} onChange={(e) => setDraft((p) => ({ ...p, tax: Number(e.target.value) }))} />
                <UptoInput label="Discount" type="number" value={draft.discount} onChange={(e) => setDraft((p) => ({ ...p, discount: Number(e.target.value) }))} />
                <UptoInput label="Currency" value={draft.currency} onChange={(e) => setDraft((p) => ({ ...p, currency: e.target.value }))} />
                <UptoInput label="Valid Until" type="date" value={draft.validUntil || ""} onChange={(e) => setDraft((p) => ({ ...p, validUntil: e.target.value }))} />
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
