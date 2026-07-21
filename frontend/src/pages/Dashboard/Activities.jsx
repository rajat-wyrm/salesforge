import React, { useEffect, useState } from "react";
import { activityService } from "@/services";
import { useUptoStyles, UptoPage, UptoHero, UptoSectionHeading, UptoButton, UptoInput, UptoSelect, UptoTextarea, UptoBadge, UptoSpinner, UptoError, UptoEmptyState, UptoCard } from "@/components/UI/UptoHooks";
import { Activity as ActivityIcon, Phone, Video, CheckSquare, Mail, MessageSquare, Plus, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const KIND_ICON = { CALL: Phone, MEETING: Video, TASK: CheckSquare, EMAIL_SENT: Mail, EMAIL_RECEIVED: Mail, NOTE: MessageSquare };
const KIND_TONE = { CALL: "info", MEETING: "brand", TASK: "warning" };
const KIND_LABELS = { CALL: "Call", MEETING: "Meeting", TASK: "Task", EMAIL_SENT: "Email sent", NOTE: "Note" };

const Activities = () => {
  const { isMember } = useAuth();
  const s = useUptoStyles();
  const { darkMode } = s;
  const [items, setItems] = useState([]);
  const [today, setToday] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState({ kind: "", status: "" });
  const [draft, setDraft] = useState({ kind: "CALL", entityType: "LEAD", entityId: 1, title: "", dueAt: "", description: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [a, t, o] = await Promise.all([activityService.list(filter), activityService.today(), activityService.overdue()]);
      setItems(a.items || []);
      setToday(t || []);
      setOverdue(o || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter.kind, filter.status]);

  const complete = async (id) => {
    try { await activityService.complete(id); toast.success("Done"); load(); }
    catch (e) { toast.error(e.message); }
  };
  const remove = async (id) => {
    if (!confirm("Delete this activity?")) return;
    try { await activityService.remove(id); load(); }
    catch (e) { toast.error(e.message); }
  };
  const create = async (e) => {
    e.preventDefault();
    if (!draft.title.trim()) {
  toast.error("Title is required");
  return;

}
    try { await activityService.create(draft); toast.success("Activity created"); setShowCreate(false); setDraft({ kind: "CALL", entityType: "LEAD", entityId: 1, title: "", dueAt: "", description: "" }); load(); }
    catch (err) { toast.error(err.message); }
  };

  return (
    <UptoPage>
      <UptoHero title="Activities" subtitle="Calls, meetings, tasks, and notes across your team." darkMode={darkMode}
        actions={isMember && <UptoButton onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Log Activity</UptoButton>}
      />

      <section>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <UptoCard>
            <UptoSectionHeading label="Today" darkMode={darkMode} />
            {today.length === 0 ? <p className={`text-sm ${s.subtext}`}>Nothing scheduled for today. 🎉</p> : (
              <ul className="space-y-2">
                {today.slice(0, 5).map((a) => {
                  const Icon = KIND_ICON[a.kind] || ActivityIcon;
                  return (
                    <li key={a.id} className={`flex items-center gap-2 rounded-xl border p-2 text-sm ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
                      <Icon className="h-4 w-4 text-[#00b5ad]" />
                      <div className="flex-1 min-w-0">
                        <p className={`truncate font-medium ${s.heading}`}>{a.title}</p>
                        <p className={`text-xs ${s.muted}`}>{KIND_LABELS[a.kind]} · {a.dueAt ? new Date(a.dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</p>
                      </div>
                      {a.status !== "COMPLETED" && <button onClick={() => complete(a.id)} className="rounded-lg p-1 text-emerald-500 hover:bg-emerald-50"><Check className="h-4 w-4" /></button>}
                    </li>
                  );
                })}
              </ul>
            )}
          </UptoCard>
          <UptoCard>
            <UptoSectionHeading label="Overdue" darkMode={darkMode} />
            {overdue.length === 0 ? <p className={`text-sm ${s.subtext}`}>All caught up.</p> : (
              <ul className="space-y-2">
                {overdue.slice(0, 5).map((a) => {
                  const Icon = KIND_ICON[a.kind] || ActivityIcon;
                  return (
                    <li key={a.id} className={`flex items-center gap-2 rounded-xl border p-2 text-sm ${darkMode ? "border-red-900/40 bg-red-900/20" : "border-red-200 bg-red-50"}`}>
                      <Icon className="h-4 w-4 text-red-500" />
                      <div className="flex-1 min-w-0">
                        <p className={`truncate font-medium ${s.heading}`}>{a.title}</p>
                        <p className={`text-xs ${darkMode ? "text-red-300" : "text-red-600"}`}>due {new Date(a.dueAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => complete(a.id)} className="rounded-lg p-1 text-emerald-500 hover:bg-emerald-50"><Check className="h-4 w-4" /></button>
                    </li>
                  );
                })}
              </ul>
            )}
          </UptoCard>
          <UptoCard>
            <UptoSectionHeading label="Quick Log" darkMode={darkMode} />
            <div className="space-y-2">
              {["CALL", "MEETING", "TASK", "NOTE"].map((k) => {
                const Icon = KIND_ICON[k];
                return (
                  <button key={k} onClick={() => { setDraft((p) => ({ ...p, kind: k })); setShowCreate(true); }} className={`flex w-full items-center gap-2 rounded-xl border p-2 text-left text-sm transition ${darkMode ? "border-slate-800 hover:bg-slate-800" : "border-slate-100 hover:bg-slate-50"}`}>
                    <Icon className="h-4 w-4 text-[#00b5ad]" /> Log a {KIND_LABELS[k].toLowerCase()}
                  </button>
                );
              })}
            </div>
          </UptoCard>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <select value={filter.kind} onChange={(e) => setFilter((p) => ({ ...p, kind: e.target.value }))} className={`rounded-xl border px-3 py-2 text-sm ${s.input}`}>
            <option value="">All kinds</option>
            {Object.entries(KIND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filter.status} onChange={(e) => setFilter((p) => ({ ...p, status: e.target.value }))} className={`rounded-xl border px-3 py-2 text-sm ${s.input}`}>
            <option value="">All statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
        {error && <UptoError error={error} onRetry={load} />}
        <UptoCard>
          {loading ? <UptoSpinner /> : items.length === 0 ? (
            <UptoEmptyState icon={ActivityIcon} title="No activities" body="Log your first call, meeting, or task to get started." />
          ) : (
            <ul className={`divide-y ${s.divider}`}>
              {items.map((a) => {
                const Icon = KIND_ICON[a.kind] || ActivityIcon;
                return (
                  <li key={a.id} className="flex items-center gap-3 py-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${darkMode ? "bg-teal-900/30 text-teal-400" : "bg-teal-50 text-teal-600"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${a.status === "COMPLETED" ? "line-through text-slate-400" : s.heading}`}>{a.title}</p>
                      <p className={`text-xs ${s.muted}`}>{a.user?.name} · {KIND_LABELS[a.kind]} · {a.dueAt ? new Date(a.dueAt).toLocaleString() : "no due date"}</p>
                    </div>
                    <UptoBadge tone={KIND_TONE[a.kind]}>{a.status}</UptoBadge>
                    {a.status !== "COMPLETED" && isMember && <button onClick={() => complete(a.id)} className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-50"><Check className="h-4 w-4" /></button>}
                    {isMember && <button onClick={() => remove(a.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><X className="h-4 w-4" /></button>}
                  </li>
                );
              })}
            </ul>
          )}
        </UptoCard>
      </section>

      {showCreate && (
        <section>
          <UptoCard>
            <h3 className={`text-base font-semibold mb-4 ${s.heading}`}>Log Activity</h3>
            <form onSubmit={create} className="space-y-3">
              <UptoSelect label="Kind" value={draft.kind} onChange={(e) => setDraft((p) => ({ ...p, kind: e.target.value }))}>
                {Object.entries(KIND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </UptoSelect>
              <UptoInput label="Title *" value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} required />
              <UptoTextarea label="Description" rows={2} value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} />
              <UptoInput label="Due at" type="datetime-local" max="3000-12-31T23:59" value={draft.dueAt} onChange={(e) => {   const value = e.target.value; if (value) { const date = new Date(value); if (!isNaN(date.getTime()) && date.getFullYear() > 3000) { toast.error("Year cannot be greater than 3000"); return; } } setDraft((p) => ({ ...p, dueAt: value, })); }}/>
              <UptoSelect label="Entity type" value={draft.entityType} onChange={(e) => setDraft((p) => ({ ...p, entityType: e.target.value }))}>
                <option value="LEAD">Lead</option>
                <option value="DEAL">Deal</option>
                <option value="CONTACT">Contact</option>
                <option value="COMPANY">Company</option>
              </UptoSelect>
              <UptoInput label="Entity ID" type="number" min={1} step="1" value={draft.entityId} onChange={(e) => { const value = e.target.value; if (value === "") { setDraft((p) => ({ ...p, entityId: "", })); return; } const num = Number(value); if (num < 1) return; setDraft((p) => ({ ...p, entityId: num, })); }}/>
              <div className="flex gap-2">
                <UptoButton type="submit">Create</UptoButton>
                <UptoButton type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</UptoButton>
              </div>
            </form>
          </UptoCard>
        </section>
      )}
    </UptoPage>
  );
};

export default Activities;

