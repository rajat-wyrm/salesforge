// Sales territory management page.
import React, { useEffect, useState } from "react";
import { territoryService } from "@/services";
import {
  UptoPage, UptoHero, UptoBadge, UptoSpinner, UptoError,
  UptoEmptyState, UptoCard,
} from "@/components/UI/UptoHooks";
import { Map } from "lucide-react";

const Territories = () => {
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [list, met] = await Promise.all([territoryService.list(), territoryService.metrics()]);
      setItems(list || []);
      setMetrics(met || null);
      setError(null);
    } catch (e) { setError(e?.message || "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <UptoPage>
      <UptoHero title="Territories" subtitle="Geographic and industry segmentation for your sales team" />

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <UptoCard><div className="text-xs text-slate-500">Total accounts</div><div className="text-2xl font-semibold">{metrics.total || 0}</div></UptoCard>
          <UptoCard><div className="text-xs text-slate-500">Regions</div><div className="text-2xl font-semibold">{Object.keys(metrics.byRegion || {}).length}</div></UptoCard>
          <UptoCard><div className="text-xs text-slate-500">Industries</div><div className="text-2xl font-semibold">{Object.keys(metrics.byType || {}).length}</div></UptoCard>
        </div>
      )}

      <UptoCard>
        {loading && <UptoSpinner />}
        {error && <UptoError message={error} onRetry={load} />}
        {!loading && !error && items.length === 0 && (
          <UptoEmptyState icon={Map} title="No territories" body="Add organizations to see territories form." />
        )}
        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((t) => (
              <div key={t.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-slate-500 mt-1">{t.region} · {t.type || "All"}</div>
                <div className="mt-2"><UptoBadge>{t.accountCount || 0} accounts</UptoBadge></div>
              </div>
            ))}
          </div>
        )}
      </UptoCard>
    </UptoPage>
  );
};

export default Territories;
