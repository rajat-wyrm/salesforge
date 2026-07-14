import React, { useEffect, useState } from "react";
import { contractService, teamService } from "@/services";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Search, Plus, FileSignature, Filter, Download, Upload, ArrowUpDown,
  RefreshCw, X, MoreHorizontal, Building2, Calendar, FileText,
  ChevronLeft, ChevronRight, Activity, Eye, Edit, Trash2,
} from "lucide-react";

const statusMeta = {
  draft:     { label: "Draft",     cls: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/80 dark:text-gray-400 dark:border-gray-700" },
  active:    { label: "Active",    cls: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" },
  pending:   { label: "Pending",   cls: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" },
  expired:   { label: "Expired",   cls: "bg-red-100 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" },
  renewed:   { label: "Renewed",   cls: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" },
  cancelled: { label: "Cancelled", cls: "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600" },
};

const StatusBadge = ({ status }) => {
  const s = status?.toLowerCase() || "draft";
  const meta = statusMeta[s] || statusMeta.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide ${meta.cls}`}>
      {meta.label}
    </span>
  );
};

const KPICard = ({ label, value, sub, icon: Icon, accent }) => (
  <div className="group bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
    <div className="flex items-start justify-between mb-3">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <div className={`p-2 rounded-xl ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className="text-3xl font-bold text-slate-900 dark:text-white leading-none">{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

export default function Contracts() {
  const { user } = useAuth();

  const [items, setItems]                 = useState([]);
  const [metrics, setMetrics]             = useState(null);
  const [teamMembers, setTeamMembers]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [showCreate, setShowCreate]       = useState(false);
  const [selectedContract, setSelected]   = useState(null);
  const [actionMenu, setActionMenu]       = useState(null);
  const [draft, setDraft]                 = useState({ title: "", counterparty: "", value: "", startDate: "", endDate: "" });
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [ownerFilter, setOwnerFilter]     = useState("all");
  const [page, setPage]                   = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [totalItems, setTotalItems]       = useState(0);
  const limit = 10;

  const loadData = async (opts = {}) => {
    setLoading(true);
    try {
      const currentPage = opts.page ?? page;
      const [res, met, team] = await Promise.all([
        contractService.list({
          page: currentPage, limit,
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          ownerId: ownerFilter !== "all" ? ownerFilter : undefined,
        }),
        contractService.metrics(),
        teamService.members().catch(() => []),
      ]);
      setItems(res?.items || res || []);
      setTotalPages(res?.pages || 1);
      setTotalItems(res?.total ?? (res?.items || res || []).length);
      setMetrics(met || null);
      setTeamMembers(team || []);
      setError(null);
    } catch (e) {
      setError(e?.message || "Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [page, statusFilter, ownerFilter]);

  useEffect(() => {
    const delay = setTimeout(() => { setPage(1); loadData({ page: 1 }); }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await contractService.create({
        name: draft.title,
        counterparty: draft.counterparty,
        value: Number(draft.value),
        startDate: draft.startDate,
        endDate: draft.endDate,
      });
      toast.success("Contract created successfully");
      setShowCreate(false);
      setDraft({ title: "", counterparty: "", value: "", startDate: "", endDate: "" });
      loadData({ page: 1 });
    } catch (err) {
      toast.error(err?.message || "Create failed");
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete "${c.name}"?`)) return;
    try {
      await contractService.remove(c.id);
      toast.success("Contract deleted");
      loadData();
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  };

  const ownerName = (ownerId) => {
    if (!ownerId) return "—";
    return teamMembers.find(m => m.id === ownerId)?.name ?? "—";
  };

  const fmt = (date) => date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const fmtVal = (v) => v ? `$${Number(v).toLocaleString()}` : "—";
  const contractNo = (c) => `CT-${String(c.id).padStart(4, "0")}`;

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-[#090f1c] text-slate-900 dark:text-slate-100 pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── GLASSMORPHISM HEADER ── */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-[#090f1c]/80 border-b border-slate-200/70 dark:border-slate-800/60 shadow-[0_1px_12px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md shadow-teal-500/30">
              <FileSignature className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">Contracts</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-tight">Track contract lifecycle, renewals and revenue.</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
              <Upload className="w-3.5 h-3.5" /> Import
            </button>
            <button className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl shadow-md shadow-teal-500/25 transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" /> New Contract
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-6 py-8">

        {/* ── KPI CARDS ── */}
        {metrics && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <KPICard label="Total Contracts"      value={(metrics.total || 0).toLocaleString()}         sub="All time"                    icon={FileText}    accent="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400" />
            <KPICard label="Active Contracts"     value={(metrics.active || 0).toLocaleString()}        sub="Currently live"              icon={Activity}    accent="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" />
            <KPICard label="Expiring in 30 Days"  value={(metrics.renewalsDue || 0).toLocaleString()}   sub="Need action"                 icon={Calendar}    accent="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400" />
            <KPICard label="Total Contract Value" value={`$${(metrics.totalValue || 0).toLocaleString()}`} sub="Cumulative value"         icon={FileText}    accent="bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400" />
            <KPICard label="Renewal Rate"         value={`${metrics.renewalRate || 0}%`}                sub="Active vs expired"           icon={RefreshCw}   accent="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" />
          </div>
        )}

        {/* ── TOOLBAR ── */}
        <div className="bg-white dark:bg-slate-800/80 rounded-t-2xl border border-b-0 border-slate-200/60 dark:border-slate-700/50 px-4 py-3.5 flex flex-wrap gap-3 items-center shadow-sm">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contracts..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 min-w-[140px]"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="renewed">Renewed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={ownerFilter}
            onChange={(e) => { setOwnerFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 min-w-[140px]"
          >
            <option value="all">All Owners</option>
            {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" title="Sort">
              <ArrowUpDown className="w-4 h-4" />
            </button>
            <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" title="Filter">
              <Filter className="w-4 h-4" />
            </button>
            <button onClick={() => loadData()} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── DATA TABLE ── */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 shadow-sm rounded-b-2xl overflow-hidden relative">

          {loading && (
            <div className="absolute inset-0 z-10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && !loading && (
            <div className="py-20 text-center text-red-500">
              <p className="mb-4">{error}</p>
              <button onClick={() => loadData()} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Retry</button>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-500/10 dark:to-cyan-500/10 border-2 border-dashed border-teal-300 dark:border-teal-500/30 flex items-center justify-center mb-6">
                <FileSignature className="w-9 h-9 text-teal-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No contracts yet</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">Create your first contract to begin managing agreements, tracking revenue, and handling renewals.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-cyan-700 hover:-translate-y-0.5 transition-all"
              >
                <Plus className="w-5 h-5" /> Create your first contract
              </button>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/80 text-xs uppercase tracking-wider">
                    {["Contract #", "Title", "Customer", "Owner", "Start Date", "End Date", "Value", "Status", ""].map((h, i) => (
                      <th key={i} className={`px-6 py-3.5 font-semibold text-slate-500 dark:text-slate-400 ${i >= 6 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {items.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className="group hover:bg-teal-50/40 dark:hover:bg-teal-500/5 hover:shadow-[inset_3px_0_0_#14b8a6] cursor-pointer transition-all duration-150"
                    >
                      <td className="px-6 py-4 font-mono text-teal-600 dark:text-teal-400 font-medium text-xs whitespace-nowrap">{contractNo(c)}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 max-w-[200px] truncate">{c.name || "Untitled"}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{c.type || "Service Agreement"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          </span>
                          <span className="truncate max-w-[120px]">{c.company || "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{ownerName(c.ownerId)}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">{fmt(c.startDate)}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">{fmt(c.endDate)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">{fmtVal(c.value)}</td>
                      <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelected(c); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(c); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── PAGINATION ── */}
          {!loading && !error && items.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800/80">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{(page - 1) * limit + 1}</span>
                {" – "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(page * limit, totalItems)}</span>
                {" of "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{totalItems}</span>
                {" contracts"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? "bg-teal-600 text-white shadow-md shadow-teal-500/20" : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={page >= totalPages || totalPages <= 1}
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CREATE MODAL ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">New Contract</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Contract Title <span className="text-red-400">*</span></label>
                  <input
                    required
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="e.g., Enterprise SLA 2026"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Counterparty (Customer)</label>
                  <input
                    value={draft.counterparty}
                    onChange={(e) => setDraft({ ...draft, counterparty: e.target.value })}
                    placeholder="e.g., Acme Corporation"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Contract Value ($)</label>
                  <input
                    type="number"
                    value={draft.value}
                    onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                    placeholder="500000"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={draft.startDate}
                      onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">End Date</label>
                    <input
                      type="date"
                      value={draft.endDate}
                      onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 rounded-xl shadow-md shadow-teal-500/20 transition-all"
                >
                  Save Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DETAILS DRAWER ── */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"
            onClick={() => setSelected(null)}
          />
          <aside className="relative w-full max-w-[440px] h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
            style={{ animation: "slideInRight 0.25s ease-out" }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center">
                  <FileSignature className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Contract Details</h2>
                  <p className="text-xs text-slate-400 font-mono">{contractNo(selectedContract)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title & Status */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug mb-2">{selectedContract.name || "Untitled Contract"}</h3>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedContract.status} />
                  <span className="text-xs text-slate-400">{selectedContract.type || "Service Agreement"}</span>
                </div>
              </div>

              {/* Value Highlight */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-500/10 dark:to-cyan-500/10 rounded-xl p-4 border border-teal-100 dark:border-teal-500/20">
                <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">Contract Value</p>
                <p className="text-3xl font-bold text-teal-700 dark:text-teal-300">{fmtVal(selectedContract.value)}</p>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                {[
                  { label: "Customer",   val: selectedContract.company || "—" },
                  { label: "Owner",      val: ownerName(selectedContract.ownerId) },
                  { label: "Start Date", val: fmt(selectedContract.startDate) },
                  { label: "End Date",   val: fmt(selectedContract.endDate) },
                  { label: "Related Deal",  val: selectedContract.dealId ? `#${selectedContract.dealId}` : "—" },
                  { label: "Renewal Date",  val: "—" },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{val}</p>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" /> Activity Timeline
                </h4>
                <div className="relative pl-5 border-l-2 border-dashed border-slate-200 dark:border-slate-700 space-y-5">
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-teal-500 ring-4 ring-white dark:ring-slate-900 block" />
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Contract Created</p>
                    <p className="text-xs text-slate-400 mt-0.5">{fmt(selectedContract.startDate)} · {ownerName(selectedContract.ownerId)}</p>
                  </div>
                  {selectedContract.status === "active" && (
                    <div className="relative">
                      <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900 block" />
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Status changed to Active</p>
                      <p className="text-xs text-slate-400 mt-0.5">Contract marked active by owner</p>
                    </div>
                  )}
                  {selectedContract.status === "expired" && (
                    <div className="relative">
                      <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-red-400 ring-4 ring-white dark:ring-slate-900 block" />
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Contract Expired</p>
                      <p className="text-xs text-slate-400 mt-0.5">Auto-expired on end date</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 grid grid-cols-3 gap-2">
              <button className="py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5">
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
              <button className="py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
              <button className="py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> View
              </button>
            </div>
          </aside>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

    </div>
  );
}



