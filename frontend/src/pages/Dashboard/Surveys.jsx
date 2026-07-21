// Surveys page (NPS, CSAT, custom).
import React, { useEffect, useState } from "react";
import { surveyService } from "@/services";
import {
  UptoPage, UptoHero, UptoButton, UptoInput, UptoBadge,
  UptoSpinner, UptoError, UptoEmptyState, UptoCard,
} from "@/components/UI/UptoHooks";
import { MessageCircle, Plus } from "lucide-react";
import { toast } from "sonner";

const Surveys = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ title: "", type: "NPS", question: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await surveyService.list({ limit: 100 });
      setItems(res?.items || res || []);
      setError(null);
    } catch (e) { setError(e?.message || "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: draft.title,
        type: draft.type,
        questions: draft.question ? [draft.question] : [],
      };
      await surveyService.create(payload);
      toast.success("Survey created");
      setShowCreate(false);
      setDraft({ title: "", type: "NPS", question: "" });
      load();
    } catch (err) {
  const message =
    err?.response?.data?.message ||
    err?.message ||
    "Create failed";

  toast.error(message);
}
  };

  return (
    <UptoPage>
      <UptoHero
        title="Surveys"
        subtitle="NPS, CSAT, and custom feedback collection"
        actions={<UptoButton onClick={() => setShowCreate(true)}><Plus className="mr-1 h-4 w-4 inline" /> New survey</UptoButton>}
      />
      <UptoCard>
        {loading && <UptoSpinner />}
        {error && <UptoError message={error} onRetry={load} />}
        {!loading && !error && items.length === 0 && (
          <UptoEmptyState icon={MessageCircle} title="No surveys" body="Create your first survey to gather feedback." />
        )}
        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((s) => (
              <div key={s.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="font-medium">{s.title}</div>
                <div className="text-xs text-slate-500 mt-1">{s.question || "—"}</div>
                <div className="mt-2"><UptoBadge>{s.type || "NPS"}</UptoBadge></div>
              </div>
            ))}
          </div>
        )}
      </UptoCard>
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">New survey</h3>
            <div className="space-y-3">
              <UptoInput label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required />
              <UptoInput label="Type (NPS, CSAT, CUSTOM)" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} />
              <UptoInput label="Question" value={draft.question} onChange={(e) => setDraft({ ...draft, question: e.target.value })} />
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

export default Surveys;
