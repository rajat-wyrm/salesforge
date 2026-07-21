import React, { useEffect, useState, useMemo } from "react";
import { calendarService } from "@/services";
import { useUptoStyles, UptoPage, UptoHero, UptoSectionHeading, UptoButton, UptoInput, UptoSelect, UptoTextarea, UptoBadge, UptoSpinner, UptoError, UptoEmptyState, UptoCard } from "@/components/UI/UptoHooks";
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Plus, Clock, MapPin, Video } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const Calendar = () => {
  const { isMember } = useAuth();
  const s = useUptoStyles();
  const { darkMode } = s;
  const [view, setView] = useState("month");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(new Date());
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", startAt: "", endAt: "", location: "", meetingUrl: "", color: "teal" });

  const { from, to } = useMemo(() => {
    const d = new Date(cursor);
    if (view === "month") {
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    if (view === "week") {
      const day = d.getDay();
      const start = new Date(d); start.setDate(d.getDate() - day); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end = new Date(d); end.setHours(23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString() };
  }, [cursor, view]);

  const load = async () => {
    setLoading(true);
    try { setEvents(await calendarService.list({ from, to }) || []); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [from, to]);

  const create = async (e) => {
    e.preventDefault();
    if (!draft.title.trim()) {
    toast.error("Title is required");
    return;
    }

    try { await calendarService.create(draft); toast.success("Event created"); setShowCreate(false); setDraft({ title: "", description: "", startAt: "", endAt: "", location: "", meetingUrl: "", color: "teal" }); load(); }
    catch (err) { toast.error(err.message); }
    };

  const monthDays = useMemo(() => {
    if (view !== "month") return [];
    const d = new Date(cursor);
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const startDay = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(d.getFullYear(), d.getMonth(), i));
    return days;
  }, [cursor, view]);

  const eventsByDay = useMemo(() => {
    const map = {};
    for (const e of events) {
      const k = new Date(e.startAt).toDateString();
      (map[k] = map[k] || []).push(e);
    }
    return map;
  }, [events]);

  const colorClass = (c) => ({
    teal: "bg-teal-500", blue: "bg-blue-500", purple: "bg-purple-500",
    pink: "bg-pink-500", amber: "bg-amber-500", red: "bg-red-500", emerald: "bg-emerald-500",
  }[c] || "bg-teal-500");

  return (
    <UptoPage>
      <UptoHero
        title="Calendar"
        subtitle="Meetings, events, and reminders"
        darkMode={darkMode}
        actions={isMember && <UptoButton onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New Event</UptoButton>}
      />

      <section>
        <UptoSectionHeading label="Schedule" darkMode={darkMode} action={
          <div className={`inline-flex rounded-xl border p-1 text-xs ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-white"}`}>
            {["day", "week", "month"].map((v) => (
              <button key={v} onClick={() => setView(v)} className={`rounded-lg px-2.5 py-1 font-medium capitalize ${view === v ? "bg-[#00b5ad] text-white" : `${s.body}`}`}>{v}</button>
            ))}
          </div>
        } />
        <UptoCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UptoButton onClick={() => {
                const d = new Date(cursor);
                if (view === "month") d.setMonth(d.getMonth() - 1);
                else if (view === "week") d.setDate(d.getDate() - 7);
                else d.setDate(d.getDate() - 1);
                setCursor(d);
              }} variant="secondary"><ChevronLeft className="h-4 w-4" /></UptoButton>
              <UptoButton onClick={() => setCursor(new Date())} variant="secondary">Today</UptoButton>
              <UptoButton onClick={() => {
                const d = new Date(cursor);
                if (view === "month") d.setMonth(d.getMonth() + 1);
                else if (view === "week") d.setDate(d.getDate() + 7);
                else d.setDate(d.getDate() + 1);
                setCursor(d);
              }} variant="secondary"><ChevronRight className="h-4 w-4" /></UptoButton>
              <h2 className={`ml-3 text-lg font-semibold ${s.heading}`}>
                {view === "month" ? cursor.toLocaleString(undefined, { month: "long", year: "numeric" }) :
                 view === "week" ? `Week of ${new Date(cursor).toLocaleDateString()}` :
                 cursor.toLocaleDateString()}
              </h2>
            </div>
          </div>

          {view === "month" ? (
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className={`border-b py-2 text-center text-xs font-semibold uppercase ${s.muted} ${s.divider}`}>{d}</div>
              ))}
              {monthDays.map((day, i) => {
                if (!day) return <div key={i} className={`h-28 border ${darkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-100 bg-slate-50/40"}`} />;
                const isToday = day.toDateString() === new Date().toDateString();
                const dayEvents = eventsByDay[day.toDateString()] || [];
                return (
                  <div key={i} className={`h-28 overflow-y-auto border p-1 text-xs ${darkMode ? "border-slate-800" : "border-slate-100"} ${isToday ? (darkMode ? "bg-teal-900/20" : "bg-teal-50/40") : ""}`}>
                    <div className={`mb-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${isToday ? "bg-[#00b5ad] text-white" : s.body}`}>
                      {day.getDate()}
                    </div>
                    {dayEvents.slice(0, 3).map((e) => (
                      <div key={e.id} className={`mb-0.5 truncate rounded px-1 py-0.5 text-[10px] text-white ${colorClass(e.color)}`}>
                        {new Date(e.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && <p className={`text-[10px] ${s.muted}`}>+{dayEvents.length - 3} more</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            loading ? <UptoSpinner /> : events.length === 0 ? (
              <UptoEmptyState icon={CalIcon} title="No events" body="Schedule a meeting or event to see it here." />
            ) : (
              <ul className={`divide-y ${s.divider}`}>
                {events.sort((a, b) => new Date(a.startAt) - new Date(b.startAt)).map((e) => (
                  <li key={e.id} className="flex items-start gap-3 py-3">
                    <div className={`mt-0.5 h-2 w-2 rounded-full ${colorClass(e.color)}`} />
                    <div className="flex-1">
                      <p className={`font-semibold ${s.heading}`}>{e.title}</p>
                      <p className={`flex items-center gap-3 text-xs ${s.subtext}`}>
                        <span><Clock className="mr-1 inline h-3 w-3" />{new Date(e.startAt).toLocaleString()} – {new Date(e.endAt).toLocaleTimeString()}</span>
                        {e.location && <span><MapPin className="mr-1 inline h-3 w-3" />{e.location}</span>}
                        {e.meetingUrl && <span><Video className="mr-1 inline h-3 w-3" />meeting</span>}
                      </p>
                      {e.description && <p className={`mt-1 text-sm ${s.body}`}>{e.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}
        </UptoCard>
      </section>

      {showCreate && (
        <section>
          <UptoCard>
            <h3 className={`text-base font-semibold mb-4 ${s.heading}`}>New Event</h3>
            <form onSubmit={create} className="space-y-3">
              <UptoInput label="Title *" value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} required />
              <UptoTextarea label="Description" value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <UptoInput label="Start *"  type="datetime-local" max="3000-12-31T23:59" value={draft.startAt}onChange={(e) => {
                const value = e.target.value; if (value) {
                    const date = new Date(value);

                    if (!isNaN(date.getTime()) && date.getFullYear() > 3000) {
                        toast.error("Year cannot be greater than 3000");
                        return;
                    }
                }
                     setDraft((p) => ({  ...p, startAt: value, })); }} required />
          <UptoInput label="End *"  type="datetime-local" max="3000-12-31T23:59" value={draft.endAt}
                  onChange={(e) => {
                      const value = e.target.value;

                      if (value) {
                          const date = new Date(value);

                          if (!isNaN(date.getTime()) && date.getFullYear() > 3000) {
                              toast.error("Year cannot be greater than 3000");
                              return;
                          }
                      }
                 setDraft((p) => ({ ...p, endAt: value,}));}} required />
              </div>
              <UptoInput label="Location" value={draft.location} onChange={(e) => setDraft((p) => ({ ...p, location: e.target.value }))} />
              <UptoInput label="Meeting URL" type="url" value={draft.meetingUrl} onChange={(e) => setDraft((p) => ({ ...p, meetingUrl: e.target.value }))} />
              <UptoSelect label="Color" value={draft.color} onChange={(e) => setDraft((p) => ({ ...p, color: e.target.value }))}>
                {["teal", "blue", "purple", "pink", "amber", "red", "emerald"].map((c) => <option key={c}>{c}</option>)}
              </UptoSelect>
              <div className="flex gap-2">
                <UptoButton type="submit">Create Event</UptoButton>
                <UptoButton type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</UptoButton>
              </div>
            </form>
          </UptoCard>
        </section>
      )}
    </UptoPage>
  );
};

export default Calendar;
