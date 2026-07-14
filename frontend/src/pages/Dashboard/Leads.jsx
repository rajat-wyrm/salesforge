import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { leadService, tagService, savedSearchService } from "@/services";
import { useTheme } from "@/context/ThemeContext";
import { UptoPage, SectionHeading } from "@/components/UI/UptoStyles";
import {
  UptoButton as Button, UptoInput as Input, UptoSelect as Select, UptoBadge as Badge,
  UptoSpinner as FullPageSpinner, UptoError as ErrorBanner, UptoEmptyState as EmptyState, UptoCopyButton as CopyButton,
} from "@/components/UI/UptoHooks";
import { Plus, Download, Upload, Save, X, Target, Filter, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const Leads = () => {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { isMember } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: "", status: "", source: "", tagId: "", sortBy: "createdAt", order: "desc" });
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [tags, setTags] = useState([]);
  const [selected, setSelected] = useState([]);
  const [draft, setDraft] = useState({ name: "", email: "", companyName: "", status: "new", source: "website" });
  const [csv, setCsv] = useState("");
  const [savedSearches, setSavedSearches] = useState([]);

  const limit = 20;
  const heading = darkMode ? "text-white" : "text-slate-900";
  const subtext = darkMode ? "text-slate-400" : "text-slate-500";
  const body = darkMode ? "text-slate-300" : "text-slate-600";
  const card = darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100";
  const divider = darkMode ? "border-slate-800" : "border-slate-200";
  const inputBg = darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900";
  const pill = darkMode ? "bg-teal-900/50 text-teal-400" : "bg-teal-50 text-teal-700";

  const load = async (p = page, f = filters) => {
    setLoading(true);
    try {
      const params = { page: p, limit, ...Object.fromEntries(Object.entries(f).filter(([_, v]) => v !== "" && v !== null)) };
      const r = await leadService.list(params);
      setItems(r.items || []);
      setTotal(r.total || 0);
      setPages(r.pages || 1);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1, filters); }, []);
  useEffect(() => { tagService.list().then(setTags).catch(() => {}); savedSearchService.list({ resource: "leads" }).then((r) => setSavedSearches(r || [])).catch(() => {}); }, []);

  // Auto-apply filters when they change
  useEffect(() => {
    const timer = setTimeout(() => {
      load(1, filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.status, filters.source, filters.tagId, filters.search]);

  const create = async (e) => {
    e.preventDefault();
    try { await leadService.create(draft); toast.success("Lead created"); setShowCreate(false); setDraft({ name: "", email: "", companyName: "", status: "new", source: "website" }); load(1); }
    catch (err) { toast.error(err.message); }
  };
  const importLeads = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const r = await leadService.import(text);
        toast.success(`Imported ${r.created} new, updated ${r.updated}, ${r.failed} failed`);
        setShowImport(false);
        load(1, filters);
      } catch (err) {
        toast.error(err.message || "Failed to import CSV");
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be selected again
    e.target.value = null;
  };
  const saveSearch = async () => {
    const name = prompt("Name this search");
    if (!name) return;
    try { await savedSearchService.create({ name, resource: "leads", filters }); toast.success("Search saved"); const s = await savedSearchService.list({ resource: "leads" }); setSavedSearches(s || []); }
    catch (e) { toast.error(e.message); }
  };
  const applySaved = (s) => { const f = { ...filters, ...s.filters }; setFilters(f); setTimeout(() => load(1, f), 0); };
  
  // ADDED NEW DELETION LOGIC 
  const deleteSavedSearch = async (e, id) => {
    e.stopPropagation(); // Prevents clicking the outer trigger buttons
    if (!confirm("Delete this saved search filter?")) return;
    try {
      await savedSearchService.remove(id); 
      toast.success("Saved search deleted");
      setSavedSearches((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      toast.error(e.message || "Failed to delete saved search");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this lead?")) return;
    try { await leadService.remove(id); toast.success("Deleted"); load(page); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <UptoPage>
      {/* Hero matching Maindashboard style */}
      <div className="relative overflow-hidden -mx-6 md:-mx-10 lg:-mx-16 px-6 md:px-10 lg:px-16 py-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl ${darkMode ? "bg-teal-900/10" : "bg-teal-300/20"}`} />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className={`text-3xl md:text-4xl font-semibold mb-2 ${heading}`}>Leads</h1>
            <p className={`text-base ${subtext}`}>{total.toLocaleString()} total leads in your pipeline</p>
          </div>
          {isMember && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => setShowImport((p) => !p)} className={!darkMode ? "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50" : "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"}>
                <Upload className="h-4 w-4" /> Import CSV
              </Button>
              <a href={leadService.exportUrl(filters)} target="_blank" rel="noreferrer">
                <Button variant="secondary" className={!darkMode ? "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50" : "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"}>
                  <Download className="h-4 w-4" /> Export
                </Button>
              </a>
              <Button onClick={() => setShowCreate((p) => !p)} className="bg-[#00b5ad] text-white hover:bg-[#2dd4bf]">
                <Plus className="h-4 w-4" /> New Lead
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <section>
        <SectionHeading label="Filters" darkMode={darkMode} />
        <div className={`rounded-2xl p-5 border ${card}`}>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <input placeholder="Search by name, email, company…" value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} className={`w-full rounded-xl border px-3 py-2 text-sm ${inputBg}`} />
            </div>
            <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} className={`rounded-xl border px-3 py-2 text-sm ${inputBg}`}>
              <option value="">All Statuses</option>
              {["new", "contacted", "qualified", "in_progress", "converted", "closed", "lost"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={filters.source} onChange={(e) => setFilters((p) => ({ ...p, source: e.target.value }))} className={`rounded-xl border px-3 py-2 text-sm ${inputBg}`}>
              <option value="">All Sources</option>
              {["website", "referral", "social_media", "email_campaign", "cold_call", "trade_show", "partner", "import", "api", "other"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={filters.tagId} onChange={(e) => setFilters((p) => ({ ...p, tagId: e.target.value }))} className={`rounded-xl border px-3 py-2 text-sm ${inputBg}`}>
              <option value="">All Tags</option>
              {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <Button onClick={saveSearch} variant="secondary" className={!darkMode ? "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50" : "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"}>
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
          {savedSearches.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`text-xs ${subtext}`}>Saved:</span>
              {/* UPDATED UI MAPPING BLOCK  */}
              {savedSearches.map((s) => (
                <div key={s.id} className={`inline-flex items-center gap-2 rounded-full border pl-3 pr-2 py-0.5 text-xs ${darkMode ? "border-slate-700 bg-slate-800 text-slate-300" : "border-slate-300 bg-slate-50 text-slate-700"}`}>
                  <button onClick={() => applySaved(s)} className="hover:text-[#00b5ad] font-medium transition-colors">{s.name}</button>
                  <button onClick={(e) => deleteSavedSearch(e, s.id)} className="rounded-full p-0.5 hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors" title="Delete search shortcut">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {showCreate && (
        <section>
          <div className={`rounded-2xl p-6 border ${card}`}>
            <h3 className={`text-base font-semibold mb-4 ${heading}`}>New Lead</h3>
            <form onSubmit={create} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input placeholder="Full name *" value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} required className={`rounded-xl border px-3 py-2 text-sm ${inputBg}`} />
              <input placeholder="Email *" type="email" value={draft.email} onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))} required className={`rounded-xl border px-3 py-2 text-sm ${inputBg}`} />
              <input placeholder="Company" value={draft.companyName} onChange={(e) => setDraft((p) => ({ ...p, companyName: e.target.value }))} className={`rounded-xl border px-3 py-2 text-sm ${inputBg}`} />
              <input placeholder="Job title" value={draft.jobTitle || ""} onChange={(e) => setDraft((p) => ({ ...p, jobTitle: e.target.value }))} className={`rounded-xl border px-3 py-2 text-sm ${inputBg}`} />
              <select value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))} className={`rounded-xl border px-3 py-2 text-sm ${inputBg}`}>
                {["new", "contacted", "qualified", "in_progress", "converted", "closed", "lost"].map((s) => <option key={s}>{s}</option>)}
              </select>
              <select value={draft.source} onChange={(e) => setDraft((p) => ({ ...p, source: e.target.value }))} className={`rounded-xl border px-3 py-2 text-sm ${inputBg}`}>
                {["website", "referral", "social_media", "email_campaign", "cold_call", "trade_show", "partner", "import", "api", "other"].map((s) => <option key={s}>{s}</option>)}
              </select>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" className="bg-[#00b5ad] text-white hover:bg-[#2dd4bf]">Create Lead</Button>
                <Button type="button" onClick={() => setShowCreate(false)} variant="secondary" className={!darkMode ? "bg-white text-slate-700 border border-slate-300" : "bg-slate-800 text-slate-200 border border-slate-700"}>Cancel</Button>
              </div>
            </form>
          </div>
        </section>
      )}

      {showImport && (
        <section>
          <div className={`rounded-2xl p-6 border ${card}`}>
            <h3 className={`text-base font-semibold mb-4 ${heading}`}>Import CSV</h3>
            <p className={`text-sm mb-4 ${subtext}`}>
              Upload a .csv file containing your leads. Required columns are: <code>name</code>, <code>email</code>.
            </p>
            <div className="flex flex-col gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={importLeads}
                className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00b5ad] file:text-white hover:file:bg-[#2dd4bf] cursor-pointer ${subtext}`}
              />
              <div className="flex gap-2">
                <Button onClick={() => setShowImport(false)} variant="secondary" className={!darkMode ? "bg-white text-slate-700 border border-slate-300" : "bg-slate-800 text-slate-200 border border-slate-700"}>Cancel</Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Leads table */}
      <section>
        <SectionHeading label="Your Leads" darkMode={darkMode} />
        {error && <ErrorBanner error={error} onRetry={() => load(page)} />}
        <div className={`rounded-2xl border ${card} overflow-hidden`}>
          {loading ? <FullPageSpinner /> : items.length === 0 ? (
            <EmptyState icon={Target} title="No leads match your filters" body="Try clearing filters or importing a CSV." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((l) => (
                    <tr key={l.id} className={`cursor-pointer ${darkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50/60"}`} onClick={() => navigate(`/leads/${l.id}`)}>
                      <td className={`py-3 px-4 font-medium ${heading}`}>{l.name}</td>
                      <td className={`py-3 px-4 ${body}`}>
                        <div className="flex items-center gap-2">{l.email}<CopyButton value={l.email} /></div>
                      </td>
                      <td className={`py-3 px-4 ${body}`}>{l.companyName || "—"}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          l.status === "lost" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                          l.status === "converted" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                          "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}>{l.status}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${heading}`}>{l.score}</span>
                          <div className={`h-1.5 w-16 overflow-hidden rounded-full ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                            <div className="h-full bg-gradient-to-r from-[#00b5ad] to-[#2dd4bf]" style={{ width: `${l.score}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {isMember && <button onClick={() => remove(l.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button onClick={() => { const p = page - 1; setPage(p); load(p); }} disabled={page === 1} variant="secondary" className={!darkMode ? "bg-white text-slate-700 border border-slate-300" : "bg-slate-800 text-slate-200 border border-slate-700"}>Previous</Button>
          <span className={`text-xs ${subtext}`}>Page {page} of {pages}</span>
          <Button onClick={() => { const p = page + 1; setPage(p); load(p); }} disabled={page >= pages} variant="secondary" className={!darkMode ? "bg-white text-slate-700 border border-slate-300" : "bg-slate-800 text-slate-200 border border-slate-700"}>Next</Button>
        </div>
      )}
    </UptoPage>
  );
};

export default Leads;