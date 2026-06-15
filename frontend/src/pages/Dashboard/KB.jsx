// Knowledge base page.
import React, { useEffect, useState } from "react";
import { kbService } from "@/services";
import {
  UptoPage, UptoHero, UptoButton, UptoInput, UptoTextarea, UptoBadge,
  UptoSpinner, UptoError, UptoEmptyState, UptoCard,
} from "@/components/UI/UptoHooks";
import { BookOpen, Plus, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";

const KB = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ title: "", body: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await kbService.list({ limit: 100 });
      setItems(res?.items || res || []);
      setError(null);
    } catch (e) { setError(e?.message || "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await kbService.create(draft);
      toast.success("Article created");
      setShowCreate(false);
      setDraft({ title: "", body: "" });
      load();
    } catch (err) { toast.error(err?.message || "Create failed"); }
  };

  const vote = async (id, helpful) => {
    try { await kbService.vote(id, helpful); load(); } catch (_) {}
  };

  return (
    <UptoPage>
      <UptoHero
        title="Knowledge base"
        subtitle="Self-service articles and documentation"
        actions={<UptoButton onClick={() => setShowCreate(true)}><Plus className="mr-1 h-4 w-4 inline" /> New article</UptoButton>}
      />
      <UptoCard>
        {loading && <UptoSpinner />}
        {error && <UptoError message={error} onRetry={load} />}
        {!loading && !error && items.length === 0 && (
          <UptoEmptyState icon={BookOpen} title="No articles" body="Create the first article for your team." />
        )}
        {!loading && !error && items.length > 0 && (
          <div className="space-y-2">
            {items.map((a) => (
              <div key={a.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="font-medium">{a.title || a.name}</div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{a.body}</div>
                <div className="mt-2 flex items-center gap-2">
                  <UptoBadge>{a.helpful || 0} helpful</UptoBadge>
                  <button onClick={() => vote(a.id, true)} className="text-xs text-slate-500 hover:text-teal-600"><ThumbsUp className="h-3 w-3 inline" /></button>
                  <button onClick={() => vote(a.id, false)} className="text-xs text-slate-500 hover:text-red-600"><ThumbsDown className="h-3 w-3 inline" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </UptoCard>
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">New article</h3>
            <div className="space-y-3">
              <UptoInput label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required />
              <UptoTextarea label="Body" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} required />
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

export default KB;
