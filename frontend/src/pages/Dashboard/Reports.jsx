import React, { useEffect, useState } from "react";
import { reportService, forecastService } from "@/services";
import { useUptoStyles, UptoPage, UptoHero, UptoSectionHeading, UptoButton, UptoBadge, UptoSpinner, UptoError, UptoEmptyState, UptoCard, UptoProgressBar } from "@/components/UI/UptoHooks";
import { BarChart3, TrendingUp, Play, Trash2, FileText, Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const Reports = () => {
  const { isMember } = useAuth();
  const s = useUptoStyles();
  const { darkMode } = s;
  const [items, setItems] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(null);
  const [results, setResults] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [r, t, f] = await Promise.all([reportService.list(), reportService.templates(), forecastService.current()]);
      setItems(r || []);
      setTemplates(t || []);
      setForecast(f);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async (t) => {
    try { await reportService.create({ name: t.name, type: t.type, description: t.description, config: {} }); toast.success("Report saved"); load(); }
    catch (e) { toast.error(e.message); }
  };
  const run = async (r) => {
    setRunning(r.id);
    try { const data = await reportService.run(r.id); setResults((p) => ({ ...p, [r.id]: data })); toast.success("Report generated"); }
    catch (e) { toast.error(e.message); }
    finally { setRunning(null); }
  };
  const remove = async (id) => {
    if (!confirm("Delete this report?")) return;
    try { await reportService.remove(id); load(); }
    catch (e) { toast.error(e.message); }
  };

  if (loading) return <UptoSpinner />;
  if (error) return <UptoError error={error} onRetry={load} />;

  return (
    <UptoPage>
      <UptoHero title="Reports & Forecasts" subtitle="Custom reports, templates, and revenue forecasting." darkMode={darkMode} />

      {forecast && (
        <section>
          <UptoSectionHeading label="Current Quarter Forecast" hint={forecast.period} darkMode={darkMode} />
          <UptoCard>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className={`text-xs uppercase ${s.subtext}`}>Open</p>
                <p className={`text-2xl font-bold ${s.heading}`}>{forecast.open?.count || 0}</p>
                <p className={`text-xs ${s.muted}`}>${(forecast.open?.amount || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className={`text-xs uppercase ${s.subtext}`}>Commit</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${(forecast.commit?.amount || 0).toLocaleString()}</p>
                <p className={`text-xs ${s.muted}`}>≥75% probability</p>
              </div>
              <div>
                <p className={`text-xs uppercase ${s.subtext}`}>Best case</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">${(forecast.bestCase?.amount || 0).toLocaleString()}</p>
                <p className={`text-xs ${s.muted}`}>≥50% probability</p>
              </div>
              <div>
                <p className={`text-xs uppercase ${s.subtext}`}>Pipeline</p>
                <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">${(forecast.pipeline?.amount || 0).toLocaleString()}</p>
                <p className={`text-xs ${s.muted}`}>all open deals</p>
              </div>
            </div>
          </UptoCard>
        </section>
      )}

      <section>
        <UptoSectionHeading label="Report Templates" darkMode={darkMode} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {templates.map((t) => (
            <UptoCard key={t.id}>
              <h3 className={`mb-1 text-sm font-semibold ${s.heading}`}>{t.name}</h3>
              <p className={`mb-3 text-xs ${s.muted}`}>{t.description}</p>
              {isMember && <UptoButton variant="secondary" onClick={() => create(t)} className="w-full"><Plus className="h-4 w-4" /> Save & run</UptoButton>}
            </UptoCard>
          ))}
        </div>
      </section>

      <section>
        <UptoSectionHeading label="Your Reports" darkMode={darkMode} />
        {items.length === 0 ? (
          <UptoCard><UptoEmptyState icon={FileText} title="No reports yet" body="Save a template above to get started." /></UptoCard>
        ) : (
          <div className="space-y-4">
            {items.map((r) => (
              <UptoCard key={r.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`font-semibold ${s.heading}`}>{r.name}</h3>
                    {r.description && <p className={`text-xs ${s.muted}`}>{r.description}</p>}
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <UptoBadge>{r.type}</UptoBadge>
                      {r.lastRunAt && <span>last run {new Date(r.lastRunAt).toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <UptoButton variant="secondary" onClick={() => run(r)} disabled={running === r.id}><Play className="h-4 w-4" /> {running === r.id ? "Running..." : "Run"}</UptoButton>
                    <UptoButton variant="ghost" onClick={() => remove(r.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></UptoButton>
                  </div>
                </div>
                {results[r.id] && (
                  <div className={`mt-3 rounded-xl border p-3 ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
                    <pre className="overflow-x-auto text-xs">{JSON.stringify(results[r.id].data, null, 2)}</pre>
                  </div>
                )}
              </UptoCard>
            ))}
          </div>
        )}
      </section>
    </UptoPage>
  );
};

export default Reports;
