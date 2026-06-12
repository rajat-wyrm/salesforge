import React, { useEffect, useState } from "react";
import { changelogService, onboardingService, notificationPrefService, gdprService } from "@/services";
import { useUptoStyles, UptoPage, UptoHero, UptoSectionHeading, UptoButton, UptoBadge, UptoSpinner, UptoError, UptoEmptyState, UptoCard } from "@/components/UI/UptoHooks";
import { Sparkles, Mail, Bell, Smartphone, Download, Trash2, Check, Star, Zap, Shield, Wrench } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const Changelog = () => {
  const s = useUptoStyles();
  const { darkMode } = s;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { changelogService.list().then(setItems).finally(() => setLoading(false)); }, []);
  if (loading) return <UptoSpinner />;

  const TYPE_ICON = { feature: Star, improvement: Zap, fix: Wrench, breaking: Shield };
  const TYPE_TONE = { feature: "brand", improvement: "info", fix: "warning", breaking: "danger" };

  return (
    <UptoPage>
      <UptoHero title="What's new" subtitle="The latest updates, features, and improvements." darkMode={darkMode} />
      <div className="space-y-4">
        {items.map((c) => {
          const Icon = TYPE_ICON[c.type] || Star;
          return (
            <UptoCard key={c.id}>
              <div className="flex items-start gap-3">
                <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                  c.type === "feature" ? darkMode ? "bg-teal-900/30 text-teal-400" : "bg-teal-50 text-teal-600" :
                  c.type === "improvement" ? darkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600" :
                  c.type === "fix" ? darkMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-50 text-amber-600" :
                  darkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className={`font-semibold ${s.heading}`}>{c.title}</h3>
                    <UptoBadge tone={TYPE_TONE[c.type]}>{c.type}</UptoBadge>
                    <span className={`text-xs ${s.muted}`}>v{c.version}</span>
                  </div>
                  <p className={`text-sm ${s.body}`}>{c.body}</p>
                  <p className={`mt-2 text-xs ${s.muted}`}>{new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </UptoCard>
          );
        })}
      </div>
    </UptoPage>
  );
};

const Onboarding = ({ onComplete }) => {
  const s = useUptoStyles();
  const { darkMode } = s;
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { onboardingService.progress().then(setProgress).finally(() => setLoading(false)); }, []);

  const complete = async (step) => {
    try { await onboardingService.complete(step); const p = await onboardingService.progress(); setProgress(p); if (onComplete) onComplete(p); toast.success("Step completed!"); }
    catch (e) { toast.error(e.message); }
  };
  if (loading || !progress) return <UptoSpinner />;

  const currentIndex = progress.steps.findIndex((s) => !s.completed);
  const current = currentIndex === -1 ? progress.steps.length - 1 : currentIndex;

  return (
    <UptoPage>
      <UptoHero title="Welcome to UptoSkills" subtitle={`${progress.completed} of ${progress.total} steps complete`} darkMode={darkMode} />
      <UptoCard>
        <ol className="flex items-center gap-2">
          {progress.steps.map((s, i) => (
            <li key={s.step} className="flex flex-1 items-center gap-2">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                i < current ? "bg-[#00b5ad] text-white" :
                i === current ? "bg-teal-100 text-teal-700 ring-2 ring-[#00b5ad] dark:bg-teal-900/30 dark:text-teal-300" :
                darkMode ? "bg-slate-800 text-slate-500" : "bg-slate-200 text-slate-500"
              }`}>
                {i < current ? "✓" : i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-xs font-medium ${i <= current ? s.heading : s.muted}`}>{s.title}</p>
                {s.description && <p className={`truncate text-[10px] ${s.muted}`}>{s.description}</p>}
              </div>
              {i < progress.steps.length - 1 && <div className={`h-0.5 flex-1 ${i < current ? "bg-[#00b5ad]" : darkMode ? "bg-slate-800" : "bg-slate-200"}`} />}
            </li>
          ))}
        </ol>
      </UptoCard>
      <div className="mt-4 space-y-3">
        {progress.steps.map((s, i) => (
          <UptoCard key={s.step}>
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${s.completed ? "bg-emerald-500 text-white" : i === current ? "bg-[#00b5ad] text-white" : darkMode ? "bg-slate-800 text-slate-500" : "bg-slate-200 text-slate-500"}`}>
                {s.completed ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${s.heading}`}>{s.title}</p>
                <p className={`text-xs ${s.muted}`}>{s.description}</p>
              </div>
              {!s.completed && <UptoButton onClick={() => complete(s.step)}>Mark complete</UptoButton>}
              {s.completed && <UptoBadge tone="success">Done</UptoBadge>}
            </div>
          </UptoCard>
        ))}
      </div>
    </UptoPage>
  );
};

const NotificationPreferences = () => {
  const s = useUptoStyles();
  const { darkMode } = s;
  const [prefs, setPrefs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { notificationPrefService.list().then(setPrefs).finally(() => setLoading(false)); }, []);

  const toggle = async (pref) => {
    const next = prefs.map((p) => p.channel === pref.channel && p.category === pref.category ? { ...p, enabled: !p.enabled } : p);
    setPrefs(next);
    try { await notificationPrefService.update(next); }
    catch (e) { toast.error(e.message); setPrefs(prefs); }
  };

  if (loading) return <UptoSpinner />;
  const categories = [...new Set(prefs.map((p) => p.category))];
  const channels = [...new Set(prefs.map((p) => p.channel))];

  return (
    <UptoPage>
      <UptoHero title="Notification preferences" subtitle="Choose what notifications you receive and where." darkMode={darkMode} />
      <UptoCard>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                <th className="py-2">Category</th>
                {channels.map((c) => (
                  <th key={c} className="py-2 text-center">
                    <div className="inline-flex items-center gap-1">
                      {c === "in_app" && <Bell className="h-3 w-3" />}
                      {c === "email" && <Mail className="h-3 w-3" />}
                      {c === "push" && <Smartphone className="h-3 w-3" />}
                      <span className="capitalize">{c.replace("_", " ")}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${s.divider}`}>
              {categories.map((cat) => (
                <tr key={cat}>
                  <td className={`py-3 font-medium capitalize ${s.body}`}>{cat}</td>
                  {channels.map((ch) => {
                    const p = prefs.find((x) => x.channel === ch && x.category === cat);
                    return (
                      <td key={ch} className="py-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={p?.enabled ?? true} onChange={() => toggle(p)} className="sr-only peer" />
                          <span className={`relative inline-block h-6 w-11 rounded-full transition ${p?.enabled ? "bg-[#00b5ad]" : darkMode ? "bg-slate-700" : "bg-slate-300"}`}>
                            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${p?.enabled ? "translate-x-5" : ""}`} />
                          </span>
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </UptoCard>
    </UptoPage>
  );
};

const DataExport = () => {
  const { user, logout } = useAuth();
  const s = useUptoStyles();
  const { darkMode } = s;
  const navigate = useNavigate();
  const exportData = () => {
    window.open(gdprService.exportUrl(), "_blank");
    toast.success("Export started. The file will download in a new tab.");
  };
  const deleteAccount = async () => {
    const password = prompt("Enter your password to confirm deletion:");
    if (!password) return;
    if (!confirm("This will permanently delete your account and all data. Continue?")) return;
    try { await gdprService.deleteAccount(password); toast.success("Account deleted"); await logout(); navigate("/"); }
    catch (e) { toast.error(e.message); }
  };
  return (
    <UptoPage>
      <UptoHero title="Data & privacy" subtitle="Export your data or delete your account." darkMode={darkMode} />
      <div className="space-y-4">
        <UptoCard>
          <h3 className={`mb-1 text-base font-semibold ${s.heading}`}>Export your data</h3>
          <p className={`mb-3 text-sm ${s.muted}`}>Download a JSON file containing all of your workspace data, including leads, deals, activities, and settings.</p>
          <UptoButton onClick={exportData}><Download className="h-4 w-4" /> Export data</UptoButton>
        </UptoCard>
        <UptoCard>
          <h3 className="mb-1 text-base font-semibold text-red-600">Delete your account</h3>
          <p className={`mb-3 text-sm ${s.muted}`}>Permanently delete your account. This action cannot be undone.</p>
          <UptoButton variant="danger" onClick={deleteAccount}><Trash2 className="h-4 w-4" /> Delete account</UptoButton>
        </UptoCard>
      </div>
    </UptoPage>
  );
};

export { Changelog, Onboarding, NotificationPreferences, DataExport };
