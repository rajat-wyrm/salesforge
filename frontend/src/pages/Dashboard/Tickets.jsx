import React, { useEffect, useState } from "react";
import { ticketService } from "@/services";
import { useTheme } from "@/context/ThemeContext";
import {
  UptoPage, UptoButton, UptoInput, UptoSelect, UptoTextarea, UptoBadge,
  UptoSpinner, UptoError, UptoEmptyState, UptoCard,
} from "@/components/UI/UptoHooks";
import { Ticket, Plus, MessageSquare, ChevronLeft, ChevronRight, Search, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["open", "in_progress", "waiting", "resolved", "closed"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

const statusColors = {
  open: "info",
  in_progress: "warning",
  waiting: "default",
  resolved: "success",
  closed: "danger",
};

const priorityColors = {
  low: "default",
  medium: "brand",
  high: "warning",
  urgent: "danger",
};

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const statusLabels = {
  open: "Open",
  in_progress: "In Progress",
  waiting: "Waiting",
  resolved: "Resolved",
  closed: "Closed",
};

const Tickets = () => {
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comment, setComment] = useState("");
  const [draft, setDraft] = useState({ subject: "", description: "", priority: "medium" });
  const [filters, setFilters] = useState({ search: "", status: "", priority: "" });

  const heading = darkMode ? "text-white" : "text-slate-900";
  const subtext = darkMode ? "text-slate-400" : "text-slate-500";
  const body = darkMode ? "text-slate-300" : "text-slate-600";
  const card = darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100";
  const inputBg = darkMode ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400";

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== "")) };
      const res = await ticketService.list(params);
      setItems(res?.items || []);
      setTotal(res?.total || 0);
      setPages(res?.pages || 1);
      setError(null);
    } catch (e) { setError(e?.message || "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1); }, []);

  useEffect(() => {
    const timer = setTimeout(() => { load(1); }, 300);
    return () => clearTimeout(timer);
  }, [filters.search, filters.status, filters.priority]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await ticketService.create(draft);
      toast.success("Ticket created");
      setShowCreate(false);
      setDraft({ subject: "", description: "", priority: "medium" });
      load(1);
    } catch (err) { toast.error(err?.message || "Create failed"); }
  };

  const handleStatus = async (id, status) => {
    try {
      await ticketService.update(id, { status });
      toast.success(`Ticket ${statusLabels[status]}`);
      load(page);
      if (selectedTicket?.id === id) {
        setSelectedTicket((prev) => ({ ...prev, status }));
      }
    } catch { toast.error("Failed to update status"); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await ticketService.addComment(selectedTicket.id, { body: comment });
      toast.success("Comment added");
      setComment("");
      const updated = await ticketService.get(selectedTicket.id);
      setSelectedTicket(updated);
    } catch (err) { toast.error(err?.message || "Failed to add comment"); }
  };

  const openDetail = async (ticket) => {
    try {
      const detail = await ticketService.get(ticket.id);
      setSelectedTicket(detail);
    } catch {
      setSelectedTicket(ticket);
    }
  };

  const statCards = [
    { label: "Total Tickets", value: total, color: "from-[#00b5ad] to-[#2dd4bf]" },
    { label: "Open", value: items.filter((t) => t.status === "open").length, color: "from-blue-500 to-blue-400" },
    { label: "Resolved", value: items.filter((t) => t.status === "resolved").length, color: "from-emerald-500 to-emerald-400" },
    { label: "Urgent", value: items.filter((t) => t.priority === "urgent").length, color: "from-red-500 to-red-400" },
  ];

  return (
    <UptoPage>
      <div className="relative overflow-hidden -mx-6 md:-mx-10 lg:-mx-16 px-6 md:px-10 lg:px-16 py-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl ${darkMode ? "bg-teal-900/10" : "bg-teal-300/20"}`} />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className={`text-3xl md:text-4xl font-semibold mb-2 ${heading}`}>Tickets</h1>
            <p className={`text-base ${subtext}`}>Customer support and help desk</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <UptoButton onClick={() => { setDraft({ subject: "", description: "", priority: "medium" }); setShowCreate(true); }}>
              <Plus className="h-4 w-4" /> New Ticket
            </UptoButton>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => (
          <div key={stat.label} className={`rounded-2xl border p-5 ${card} relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl bg-gradient-to-br ${stat.color} opacity-20`} />
            <p className={`text-xs font-medium uppercase tracking-wide ${subtext}`}>{stat.label}</p>
            <p className={`mt-2 text-3xl font-bold ${heading}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl border p-5 ${card} mb-6`}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <input
              placeholder="Search tickets..."
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              className={`w-full rounded-xl border px-3 py-2 pl-9 text-sm ${inputBg}`}
            />
            <Search className={`relative -top-7 left-2.5 h-4 w-4 ${subtext}`} />
          </div>
          <UptoSelect label="Status" value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
          </UptoSelect>
          <UptoSelect label="Priority" value={filters.priority}
            onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))}
          >
            <option value="">All</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </UptoSelect>
          <UptoButton variant="ghost" onClick={() => { setFilters({ search: "", status: "", priority: "" }); load(1); }}>
            <RotateCcw className="h-4 w-4" /> Reset
          </UptoButton>
        </div>
      </div>

      {error && <UptoError message={error} onRetry={() => load(page)} />}

      {loading ? (
        <UptoSpinner />
      ) : items.length === 0 ? (
        <UptoEmptyState icon={Ticket} title="No tickets found" body="Create a ticket to track customer issues." action={<UptoButton onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New Ticket</UptoButton>} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((t) => (
              <div
                key={t.id}
                className={`rounded-2xl border p-5 ${card} cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5`}
                onClick={() => openDetail(t)}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 text-xs">
                    <UptoBadge tone={priorityColors[t.priority] || "default"}>{priorityLabels[t.priority] || t.priority}</UptoBadge>
                    <span className={subtext}>{t.number || `#${t.id}`}</span>
                  </div>
                  <UptoBadge tone={statusColors[t.status] || "default"}>{statusLabels[t.status]}</UptoBadge>
                </div>
                <h3 className={`font-semibold mb-1.5 line-clamp-1 ${heading}`}>{t.subject || t.title}</h3>
                {t.description && (
                  <p className={`text-sm line-clamp-2 mb-3 ${body}`}>{t.description}</p>
                )}
                <div className={`flex items-center justify-between text-xs ${subtext}`}>
                  <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  {t._count?.comments > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {t._count.comments}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <UptoButton variant="secondary" onClick={() => { const p = page - 1; setPage(p); load(p); }} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </UptoButton>
              <span className={`text-sm ${subtext}`}>Page {page} of {pages}</span>
              <UptoButton variant="secondary" onClick={() => { const p = page + 1; setPage(p); load(p); }} disabled={page >= pages}>
                Next <ChevronRight className="h-4 w-4" />
              </UptoButton>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} onClick={(e) => e.stopPropagation()} className={`w-full max-w-lg rounded-2xl p-6 ${darkMode ? "bg-slate-900 border border-slate-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-semibold ${heading}`}>New Ticket</h3>
              <button type="button" onClick={() => setShowCreate(false)} className={`rounded-lg p-1.5 ${subtext} hover:bg-slate-100 dark:hover:bg-slate-800 transition`}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <UptoInput label="Subject" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} required placeholder="Brief summary of the issue" />
              <UptoTextarea label="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} required placeholder="Detailed description..." rows={4} />
              <UptoSelect label="Priority" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </UptoSelect>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <UptoButton type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</UptoButton>
              <UptoButton type="submit">Create Ticket</UptoButton>
            </div>
          </form>
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={() => setSelectedTicket(null)}>
          <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-2xl mt-10 mb-10 rounded-2xl p-6 md:p-8 ${darkMode ? "bg-slate-900 border border-slate-800" : "bg-white"}`}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`text-xs font-mono ${subtext}`}>{selectedTicket.number || `#${selectedTicket.id}`}</span>
                  <UptoBadge tone={statusColors[selectedTicket.status] || "default"}>{statusLabels[selectedTicket.status]}</UptoBadge>
                  <UptoBadge tone={priorityColors[selectedTicket.priority] || "default"}>{priorityLabels[selectedTicket.priority] || selectedTicket.priority}</UptoBadge>
                </div>
                <h2 className={`text-xl md:text-2xl font-semibold ${heading}`}>{selectedTicket.subject || selectedTicket.title}</h2>
              </div>
              <button type="button" onClick={() => setSelectedTicket(null)} className={`shrink-0 rounded-lg p-1.5 ${subtext} hover:bg-slate-100 dark:hover:bg-slate-800 transition`}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className={`rounded-xl border p-4 mb-6 ${card}`}>
              <p className={`text-sm whitespace-pre-wrap ${body}`}>{selectedTicket.description || "No description provided."}</p>
              <div className={`mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs ${darkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                <span>Created: {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                {selectedTicket.updatedAt && <span>Updated: {new Date(selectedTicket.updatedAt).toLocaleString()}</span>}
              </div>
            </div>

            {selectedTicket.status !== "closed" && selectedTicket.status !== "resolved" && (
              <div className="flex flex-wrap gap-2 mb-6">
                {STATUSES.filter((s) => s !== selectedTicket.status).map((s) => (
                  <UptoButton key={s} variant="secondary" onClick={() => handleStatus(selectedTicket.id, s)}>
                    Mark as {statusLabels[s]}
                  </UptoButton>
                ))}
              </div>
            )}

            <div className={`mb-4 font-semibold text-sm ${heading}`}>Comments ({selectedTicket.comments?.length || 0})</div>

            <div className="space-y-3 mb-6">
              {(selectedTicket.comments?.length > 0) ? (
                selectedTicket.comments.map((c, i) => (
                  <div key={c.id || i} className={`rounded-xl border p-4 ${card}`}>
                    <div className={`flex items-center gap-2 text-xs mb-1.5 ${subtext}`}>
                      <span className="font-medium">{c.author?.name || c.author || "User"}</span>
                      <span>{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className={`text-sm ${body}`}>{c.body || c.text}</p>
                  </div>
                ))
              ) : (
                <p className={`text-sm ${subtext}`}>No comments yet.</p>
              )}
            </div>

            {selectedTicket.status !== "closed" && (
              <form onSubmit={handleComment} className="flex gap-3">
                <input
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm ${inputBg}`}
                />
                <UptoButton type="submit" disabled={!comment.trim()}>
                  <MessageSquare className="h-4 w-4" /> Send
                </UptoButton>
              </form>
            )}
          </div>
        </div>
      )}
    </UptoPage>
  );
};

export default Tickets;
