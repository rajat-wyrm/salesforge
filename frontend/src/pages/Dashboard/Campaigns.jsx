// Marketing campaigns page.
import React, { useEffect, useState } from "react";
import { campaignService } from "@/services";
import {
  UptoPage, UptoHero, UptoButton, UptoInput, UptoBadge,
  UptoSpinner, UptoError, UptoEmptyState, UptoCard,
} from "@/components/UI/UptoHooks";
import { Megaphone, Plus } from "lucide-react";
import { toast } from "sonner";

const Campaigns = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
const [editingId, setEditingId] = useState(null);

const [draft, setDraft] = useState({
  name: "",
  subject: "",
  audience: "all",
});
  const load = async () => {
    setLoading(true);
    try {
      const res = await campaignService.list({ limit: 100 });
      setItems(res?.items || res || []);
      setError(null);
    } catch (e) { setError(e?.message || "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
  e.preventDefault();

  try {
    if (editingId) {
      await campaignService.update(editingId, draft);
      toast.success("Campaign updated");
    } else {
      await campaignService.create(draft);
      toast.success("Campaign created");
    }

    setShowCreate(false);
    setEditingId(null);

    setDraft({
      name: "",
      subject: "",
      audience: "all",
    });

    load();
  } catch (err) {
    toast.error(err?.message || "Operation failed");
  }
};

  const handleLaunch = async (id) => { try { await campaignService.launch(id); load(); } catch (_) {} };
  const handlePause = async (id) => {
  try {
    await campaignService.pause(id);
    toast.success("Campaign paused");
    load();
  } catch (err) {
    toast.error(err?.message || "Pause failed");
  }
};
  const handleDelete = async (id) => {
  const ok = window.confirm("Delete this campaign?");
  if (!ok) return;

  try {
    await campaignService.remove(id);
    toast.success("Campaign deleted");
    load();
  } catch (err) {
    toast.error(err?.message || "Delete failed");
  }
};
const handleEdit = (campaign) => {
  setEditingId(campaign.id);

  setDraft({
  name: campaign.name || "",
  subject: campaign.conditions?.subject || "",
  audience: campaign.conditions?.audience || "all",
});

  setShowCreate(true);
};
  return (
    <UptoPage>
      <UptoHero
        title="Campaigns"
        subtitle="Email and marketing automation"
        actions={<UptoButton onClick={() => setShowCreate(true)}><Plus className="mr-1 h-4 w-4 inline" /> New campaign</UptoButton>}
      />
      <UptoCard>
        {loading && <UptoSpinner />}
        {error && <UptoError message={error} onRetry={load} />}
        {!loading && !error && items.length === 0 && (
          <UptoEmptyState icon={Megaphone} title="No campaigns" body="Create a campaign to reach your audience." />
        )}
        {!loading && !error && items.length > 0 && (
          <div className="space-y-2">
            {items.map((c) => (
              <div key={c.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-slate-500">
  {c.conditions?.audience || "All"} · {c.conditions?.subject || "—"}
</div>
                </div>
              <div className="flex items-center gap-2">

  <UptoBadge>
    {c.active ? "Running" : "Draft"}
  </UptoBadge>

  {!c.active ? (
    <UptoButton
      variant="ghost"
      onClick={() => handleLaunch(c.id)}
    >
      Launch
    </UptoButton>
  ) : (
    <UptoButton
      variant="secondary"
      onClick={() => handlePause(c.id)}
    >
      Pause
    </UptoButton>
  )}

  <UptoButton
  variant="ghost"
  onClick={() => handleEdit(c)}
>
  Edit
</UptoButton>

  <UptoButton
    variant="danger"
    onClick={() => handleDelete(c.id)}
  >
    Delete
  </UptoButton>

</div>
              </div>
            ))}
          </div>
        )}
      </UptoCard>
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
  {editingId ? "Edit campaign" : "New campaign"}
</h3>
            <div className="space-y-3">
              <UptoInput label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
              <UptoInput label="Subject" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
              <UptoInput label="Audience" value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value })} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <UptoButton type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</UptoButton>
              <UptoButton type="submit">
  {editingId ? "Save Changes" : "Create"}
</UptoButton>
            </div>
          </form>
        </div>
      )}
    </UptoPage>
  );
};

export default Campaigns;
