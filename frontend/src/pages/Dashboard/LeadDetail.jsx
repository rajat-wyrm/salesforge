import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { leadService, tagService } from "@/services";
import { useUptoStyles, UptoPage, UptoHero, UptoSectionHeading, UptoButton, UptoInput, UptoSelect, UptoTextarea, UptoBadge, UptoSpinner, UptoError, UptoEmptyState, UptoCard, UptoCopyButton } from "@/components/UI/UptoHooks";
import { ArrowLeft, Mail, Phone, Globe, Building2, MapPin, Briefcase, Tag, MessageSquare, ListTodo, Activity, Trash2, Plus, X, Pencil, Save, Download } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isMember } = useAuth();
  const s = useUptoStyles();
  const { darkMode } = s;
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [note, setNote] = useState("");
  const [task, setTask] = useState({ title: "", priority: "MEDIUM" });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [l, t] = await Promise.all([leadService.get(id), tagService.list()]);
      setLead(l);
      setAllTags(t || []);
      setDraft(l);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const addNote = async () => {
    if (!note.trim()) return;
    try {
      const n = await leadService.addNote(id, note);
      setLead((p) => ({ ...p, notes: [n, ...(p.notes || [])] }));
      setNote("");
      toast.success("Note added");
    } catch (e) { toast.error(e.message); }
  };

  const deleteNote = async (noteId) => {
    try {
      await leadService.removeNote(id, noteId);
      setLead((p) => ({ ...p, notes: p.notes.filter((n) => n.id !== noteId) }));
    } catch (e) { toast.error(e.message); }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!task.title) return;
    try {
      const t = await leadService.createTask(id, task);
      setLead((p) => ({ ...p, tasks: [t, ...(p.tasks || [])] }));
      setTask({ title: "", priority: "MEDIUM" });
      toast.success("Task created");
    } catch (err) { toast.error(err.message); }
  };

  const toggleTask = async (t) => {
    try {
      const next = t.status === "DONE" ? "TODO" : "DONE";
      await leadService.updateTask(id, t.id, { status: next });
      setLead((p) => ({ ...p, tasks: p.tasks.map((x) => (x.id === t.id ? { ...x, status: next } : x)) }));
    } catch (e) { toast.error(e.message); }
  };

  const deleteTask = async (tid) => {
    try {
      await leadService.removeTask(id, tid);
      setLead((p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== tid) }));
    } catch (e) { toast.error(e.message); }
  };

  const attachTag = async (tagId) => {
    try { await tagService.attach(id, tagId); await load(); }
    catch (e) { toast.error(e.message); }
  };
  const detachTag = async (tagId) => {
    try { await tagService.detach(id, tagId); await load(); }
    catch (e) { toast.error(e.message); }
  };

  const saveEdit = async () => {
    try {
      const data = {
        name: draft.name, email: draft.email, phone: draft.phone,
        companyName: draft.companyName, jobTitle: draft.jobTitle,
        status: draft.status, source: draft.source, score: draft.score,
      };
      await leadService.update(id, data);
      toast.success("Lead updated");
      setEditing(false);
      await load();
    } catch (e) { toast.error(e.message); }
  };

  const exportSingle = () => {
    const csv = [
      ["name", "email", "phone", "company", "jobTitle", "status", "source", "score"],
      [lead.name, lead.email, lead.phone || "", lead.companyName || "", lead.jobTitle || "", lead.status, lead.source, lead.score],
    ].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `lead-${lead.id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <UptoSpinner />;
  if (error) return <UptoError error={error} onRetry={load} />;
  if (!lead) return null;

  const tags = lead.tags?.map((x) => x.tag) || [];

  return (
    <UptoPage>
      <button onClick={() => navigate("/leads")} className={`mb-3 inline-flex items-center gap-1 text-sm ${s.subtext} hover:text-[#00b5ad]`}>
        <ArrowLeft className="h-4 w-4" /> Back to leads
      </button>

      <UptoHero
        title={editing ? "Edit lead" : lead.name}
        subtitle={lead.companyName || lead.jobTitle || "—"}
        darkMode={darkMode}
        actions={!editing ? (
          <div className="flex flex-wrap items-center gap-2">
            {isMember && <UptoButton variant="secondary" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Edit</UptoButton>}
            <UptoButton variant="secondary" onClick={exportSingle}><Download className="h-4 w-4" /> Export</UptoButton>
          </div>
        ) : (
          <div className="flex gap-2">
            <UptoButton onClick={saveEdit}><Save className="h-4 w-4" /> Save</UptoButton>
            <UptoButton variant="secondary" onClick={() => { setEditing(false); setDraft(lead); }}>Cancel</UptoButton>
          </div>
        )}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UptoSectionHeading label="Contact & Details" darkMode={darkMode} />
          <UptoCard>
            {editing ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <UptoInput label="Name" value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
                <UptoInput label="Email" value={draft.email} onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))} />
                <UptoInput label="Phone" value={draft.phone || ""} onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))} />
                <UptoInput label="Company" value={draft.companyName || ""} onChange={(e) => setDraft((p) => ({ ...p, companyName: e.target.value }))} />
                <UptoInput label="Job title" value={draft.jobTitle || ""} onChange={(e) => setDraft((p) => ({ ...p, jobTitle: e.target.value }))} />
                <UptoSelect label="Status" value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}>
                  {["new", "contacted", "qualified", "in_progress", "converted", "closed", "lost"].map((s) => <option key={s} value={s}>{s}</option>)}
                </UptoSelect>
                <UptoSelect label="Source" value={draft.source} onChange={(e) => setDraft((p) => ({ ...p, source: e.target.value }))}>
                  {["website", "referral", "social_media", "email_campaign", "cold_call", "trade_show", "partner", "import", "api", "other"].map((s) => <option key={s} value={s}>{s}</option>)}
                </UptoSelect>
                <UptoInput label="Score" type="number" min={0} max={100} value={draft.score || 0} onChange={(e) => setDraft((p) => ({ ...p, score: Number(e.target.value) }))} />
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <Row icon={Mail} label="Email" value={lead.email} copyable darkMode={darkMode} />
                <Row icon={Phone} label="Phone" value={lead.phone || "—"} darkMode={darkMode} />
                <Row icon={Building2} label="Company" value={lead.companyName || "—"} darkMode={darkMode} />
                <Row icon={Briefcase} label="Job title" value={lead.jobTitle || "—"} darkMode={darkMode} />
                <Row icon={MapPin} label="Location" value={lead.companyLocation || lead.location || "—"} darkMode={darkMode} />
                <Row icon={Globe} label="Domain" value={lead.domain || "—"} darkMode={darkMode} />
                <div className="flex items-center gap-2 pt-2">
                  <UptoBadge tone={lead.status === "lost" ? "danger" : lead.status === "converted" ? "success" : "default"}>{lead.status}</UptoBadge>
                  <UptoBadge tone="info">{lead.source}</UptoBadge>
                  <UptoBadge tone="brand">Score {lead.score}</UptoBadge>
                </div>
              </div>
            )}
          </UptoCard>
        </div>

        <div>
          <UptoSectionHeading label="Tags" darkMode={darkMode} />
          <UptoCard>
            <div className="mb-3 flex flex-wrap gap-1">
              {tags.length === 0 && <p className={`text-sm ${s.muted}`}>No tags yet.</p>}
              {tags.map((t) => (
                <span key={t.id} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${t.color}22`, color: t.color }}>
                  {t.name}
                  {isMember && <button onClick={() => detachTag(t.id)}><X className="h-3 w-3" /></button>}
                </span>
              ))}
            </div>
            {isMember && (
              <select
                onChange={(e) => { if (e.target.value) { attachTag(Number(e.target.value)); e.target.value = ""; } }}
                className={`w-full rounded-xl border px-2 py-2 text-sm ${s.input}`}
                defaultValue=""
              >
                <option value="" disabled>+ Add tag</option>
                {allTags.filter((t) => !tags.find((x) => x.id === t.id)).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
          </UptoCard>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UptoCard>
          <UptoSectionHeading label="Notes" hint={`${lead.notes?.length || 0} notes`} darkMode={darkMode} />
          {isMember && (
            <div className="mb-3">
              <UptoTextarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" />
              <div className="mt-2 flex justify-end">
                <UptoButton onClick={addNote}><MessageSquare className="h-4 w-4" /> Add note</UptoButton>
              </div>
            </div>
          )}
          {lead.notes?.length ? (
            <ul className="space-y-3">
              {lead.notes.map((n) => (
                <li key={n.id} className={`rounded-xl border p-3 text-sm ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
                  <div className={`flex items-center justify-between text-xs ${s.muted}`}>
                    <span><b className={s.heading}>{n.user?.name || "—"}</b> · {new Date(n.createdAt).toLocaleString()}</span>
                    {isMember && n.userId === user?.id && (
                      <button onClick={() => deleteNote(n.id)} className="text-red-500"><Trash2 className="h-3 w-3" /></button>
                    )}
                  </div>
                  <p className={`mt-1 whitespace-pre-wrap ${s.body}`}>{n.body}</p>
                </li>
              ))}
            </ul>
          ) : <p className={`text-sm ${s.muted}`}>No notes yet.</p>}
        </UptoCard>

        <UptoCard>
          <UptoSectionHeading label="Tasks" hint={`${lead.tasks?.length || 0} tasks`} darkMode={darkMode} />
          {isMember && (
            <form onSubmit={addTask} className="mb-3 flex items-end gap-2">
              <div className="flex-1">
                <UptoInput label="New task" value={task.title} onChange={(e) => setTask((p) => ({ ...p, title: e.target.value }))} placeholder="Follow up next week" />
              </div>
              <UptoSelect label="Priority" value={task.priority} onChange={(e) => setTask((p) => ({ ...p, priority: e.target.value }))}>
                {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => <option key={p}>{p}</option>)}
              </UptoSelect>
              <UptoButton type="submit"><Plus className="h-4 w-4" /></UptoButton>
            </form>
          )}
          {lead.tasks?.length ? (
            <ul className="space-y-2">
              {lead.tasks.map((t) => (
                <li key={t.id} className={`flex items-center gap-2 rounded-xl border p-2 text-sm ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
                  <input type="checkbox" checked={t.status === "DONE"} onChange={() => toggleTask(t)} className="h-4 w-4 rounded text-[#00b5ad]" />
                  <div className="flex-1">
                    <p className={t.status === "DONE" ? `line-through ${s.muted}` : `font-medium ${s.heading}`}>{t.title}</p>
                    <p className={`text-xs ${s.muted}`}>{t.priority} · {t.user?.name || "Unassigned"}</p>
                  </div>
                  {isMember && <button onClick={() => deleteTask(t.id)} className="text-red-500"><Trash2 className="h-3 w-3" /></button>}
                </li>
              ))}
            </ul>
          ) : <p className={`text-sm ${s.muted}`}>No tasks yet.</p>}
        </UptoCard>
      </div>

      <div className="mt-4">
        <UptoSectionHeading label="Activity Timeline" darkMode={darkMode} />
        <UptoCard>
          {lead.activities?.length ? (
            <ul className="space-y-3">
              {lead.activities.map((a) => (
                <li key={a.id} className="flex items-start gap-3 text-sm">
                  <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full ${darkMode ? "bg-teal-900/30 text-teal-400" : "bg-teal-50 text-teal-600"}`}>
                    <Activity className="h-3 w-3" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${s.heading}`}>{a.title}</p>
                    {a.body && <p className={s.muted}>{a.body}</p>}
                    <p className={`text-xs ${s.muted}`}>{a.user?.name || "—"} · {new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className={`text-sm ${s.muted}`}>No activity recorded yet.</p>}
        </UptoCard>
      </div>
    </UptoPage>
  );
};

const Row = ({ icon: Icon, label, value, copyable = false, darkMode }) => {
  const s = useUptoStyles();
  return (
    <div className={`flex items-center justify-between gap-2 border-b pb-2 ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-center gap-2 text-right">
        <span className={`font-medium ${s.heading}`}>{value}</span>
        {copyable && <UptoCopyButton value={value} />}
      </div>
    </div>
  );
};

export default LeadDetail;
