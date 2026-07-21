// Knowledge base page.
import React, { useEffect, useState } from "react";
import { kbService } from "@/services";
import {
  useUptoStyles,
  UptoPage,
  UptoHero,
  UptoButton,
  UptoInput,
  UptoTextarea,
  UptoBadge,
  UptoSpinner,
  UptoError,
  UptoEmptyState,
  UptoCard,
} from "@/components/UI/UptoHooks";
import { BookOpen, Plus, ThumbsUp, ThumbsDown, Search, Edit3, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const initDraft = () => ({ title: "", body: "" });

const KB = () => {
  const { isMember } = useAuth();
  const { darkMode } = useUptoStyles();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(initDraft);
  const [voting, setVoting] = useState(new Set());

  const load = async (searchTerm) => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 100 };
      if (searchTerm) params.search = searchTerm;
      const res = await kbService.list(params);
      setItems(res?.items || res || []);
    } catch (e) { setError(e?.message || "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    load(val);
  };

  const openCreate = () => {
    setEditing(null);
    setDraft(initDraft());
    setShowCreate(true);
  };

  const openEdit = (article) => {
    setEditing(article);
    setDraft({ title: article.title || article.name, body: article.body || "" });
    setShowCreate(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await kbService.update(editing.id, draft);
        toast.success("Article updated");
      } else {
        await kbService.create(draft);
        toast.success("Article created");
      }
      setShowCreate(false);
      setEditing(null);
      setDraft(initDraft());
      load(search);
    } catch (err) { toast.error(err?.message || "Save failed"); }
  };

  const remove = async (id) => {
    if (!confirm("Delete this article?")) return;
    try { await kbService.remove(id); toast.success("Article deleted"); load(search); }
    catch (e) { toast.error(e?.message || "Delete failed"); }
  };

  const vote = async (id, helpful) => {
    if (voting.has(id)) return;
    setVoting((prev) => new Set(prev).add(id));
    try { await kbService.vote(id, helpful); load(search); }
    catch (_) {}
    finally { setVoting((prev) => { const n = new Set(prev); n.delete(id); return n; }); }
  };

  return (
    <UptoPage>
      <UptoHero
        title="Knowledge base"
        subtitle="Self-service articles and documentation"
        darkMode={darkMode}
        actions={isMember && <UptoButton onClick={openCreate}><Plus className="h-4 w-4" /> New article</UptoButton>}
      />

      {items.length > 0 && (
        <div className="relative max-w-md">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search articles..."
            className={`w-full rounded-xl border pl-9 pr-3 py-2 text-sm shadow-sm transition focus:border-[#00b5ad] focus:outline-none focus:ring-2 focus:ring-[#00b5ad]/20 ${darkMode ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"}`}
          />
        </div>
      )}

      {loading ? (
        <UptoSpinner />
      ) : error ? (
        <UptoCard><UptoError error={error} onRetry={() => load(search)} /></UptoCard>
      ) : items.length === 0 ? (
        <UptoCard>
          <UptoEmptyState
            icon={BookOpen}
            title={search ? "No matching articles" : "No articles"}
            body={search ? "Try a different search term." : "Create the first article for your team."}
          />
        </UptoCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <div key={a.id} className={`group relative rounded-2xl border p-5 shadow-sm transition-colors duration-300 ${darkMode ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-slate-100 hover:border-slate-200"}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className={`font-semibold text-sm leading-snug ${darkMode ? "text-white" : "text-slate-900"}`}>
                  {a.title || a.name}
                </h3>
                {isMember && (
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(a)} className={`p-1 rounded-lg transition ${darkMode ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"}`}>
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => remove(a.id)} className="p-1 rounded-lg transition text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <p className={`text-xs leading-relaxed line-clamp-3 mb-3 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                {a.body}
              </p>
              <div className="flex items-center gap-3">
                <UptoBadge>{a.helpful || 0} helpful</UptoBadge>
                <button
                  onClick={() => vote(a.id, true)}
                  disabled={voting.has(a.id)}
                  className={`text-xs transition disabled:opacity-40 ${darkMode ? "text-slate-500 hover:text-teal-400" : "text-slate-400 hover:text-teal-600"}`}
                >
                  <ThumbsUp className="h-3.5 w-3.5 inline" />
                </button>
                <button
                  onClick={() => vote(a.id, false)}
                  disabled={voting.has(a.id)}
                  className={`text-xs transition disabled:opacity-40 ${darkMode ? "text-slate-500 hover:text-red-400" : "text-slate-400 hover:text-red-600"}`}
                >
                  <ThumbsDown className="h-3.5 w-3.5 inline" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className={`w-full max-w-lg rounded-2xl p-6 shadow-xl ${darkMode ? "bg-slate-900 border border-slate-700" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>
                {editing ? "Edit article" : "New article"}
              </h3>
              <button type="button" onClick={() => setShowCreate(false)} className={`p-1 rounded-lg transition ${darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <UptoInput
                label="Title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                required
              />
              <UptoTextarea
                label="Body"
                rows={5}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                required
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <UptoButton type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </UptoButton>
              <UptoButton type="submit">
                {editing ? "Save" : "Create"}
              </UptoButton>
            </div>
          </form>
        </div>
      )}
    </UptoPage>
  );
};

export default KB;
