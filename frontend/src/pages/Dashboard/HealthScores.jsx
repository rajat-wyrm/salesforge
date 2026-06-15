// Customer health scores page.
import React, { useEffect, useState } from "react";
import { healthScoreService } from "@/services";
import {
  UptoPage, UptoHero, UptoBadge, UptoSpinner, UptoError,
  UptoEmptyState, UptoCard, UptoProgressBar,
} from "@/components/UI/UptoHooks";
import { Heart } from "lucide-react";

const HealthScores = () => {
  const [items, setItems] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [list, an] = await Promise.all([healthScoreService.list(), healthScoreService.analytics()]);
      setItems(list?.items || list || []);
      setAnalytics(an || null);
      setError(null);
    } catch (e) { setError(e?.message || "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <UptoPage>
      <UptoHero title="Health scores" subtitle="Customer health and churn risk analytics" />
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <UptoCard><div className="text-xs text-slate-500">Avg score</div><div className="text-2xl font-semibold">{analytics.avgScore || 0}</div></UptoCard>
          <UptoCard><div className="text-xs text-slate-500">Healthy</div><div className="text-2xl font-semibold text-emerald-600">{analytics.healthy || 0}</div></UptoCard>
          <UptoCard><div className="text-xs text-slate-500">At risk</div><div className="text-2xl font-semibold text-amber-600">{analytics.atRisk || 0}</div></UptoCard>
          <UptoCard><div className="text-xs text-slate-500">Critical</div><div className="text-2xl font-semibold text-red-600">{analytics.critical || 0}</div></UptoCard>
        </div>
      )}
      <UptoCard>
        {loading && <UptoSpinner />}
        {error && <UptoError message={error} onRetry={load} />}
        {!loading && !error && items.length === 0 && (
          <UptoEmptyState icon={Heart} title="No health scores" body="Health scores appear once computed." />
        )}
        {!loading && !error && items.length > 0 && (
          <div className="space-y-2">
            {items.map((h) => (
              <div key={h.id || h.leadId} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium">{h.leadName || h.name || `Lead #${h.leadId}`}</div>
                  <UptoBadge>{h.tier || h.status || "stable"}</UptoBadge>
                </div>
                <UptoProgressBar value={h.score || 0} />
                <div className="text-xs text-slate-500 mt-1">Score: {h.score || 0}/100</div>
              </div>
            ))}
          </div>
        )}
      </UptoCard>
    </UptoPage>
  );
};

export default HealthScores;
