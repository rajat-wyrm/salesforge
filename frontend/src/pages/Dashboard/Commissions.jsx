// Commissions tracking page.
import React, { useEffect, useState } from "react";
import { commissionService } from "@/services";
import {
  UptoPage, UptoHero, UptoBadge, UptoSpinner, UptoError,
  UptoEmptyState, UptoCard,
} from "@/components/UI/UptoHooks";
import { DollarSign } from "lucide-react";

const Commissions = () => {
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [list, met] = await Promise.all([commissionService.list(), commissionService.metrics()]);
      setItems(list || []);
      setMetrics(met || null);
      setError(null);
    } catch (e) { setError(e?.message || "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <UptoPage>
      <UptoHero title="Commissions" subtitle="Track sales rep earnings and payouts" />

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <UptoCard><div className="text-xs text-slate-500">Total</div><div className="text-2xl font-semibold">${(metrics.totalAmount || 0).toLocaleString()}</div></UptoCard>
          <UptoCard><div className="text-xs text-slate-500">Paid</div><div className="text-2xl font-semibold text-emerald-600">${(metrics.totalPaid || 0).toLocaleString()}</div></UptoCard>
          <UptoCard><div className="text-xs text-slate-500">Pending</div><div className="text-2xl font-semibold text-amber-600">${(metrics.totalPending || 0).toLocaleString()}</div></UptoCard>
        </div>
      )}

      <UptoCard>
        {loading && <UptoSpinner />}
        {error && <UptoError message={error} onRetry={load} />}
        {!loading && !error && items.length === 0 && (
          <UptoEmptyState icon={DollarSign} title="No commissions" body="Commissions are created when deals close." />
        )}
        {!loading && !error && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Rate</th>
                  <th className="px-3 py-2">Period</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-2 font-medium">{c.user?.name || c.userId}</td>
                    <td className="px-3 py-2">${(c.amount || 0).toLocaleString()}</td>
                    <td className="px-3 py-2">{((c.rate || 0) * 100).toFixed(1)}%</td>
                    <td className="px-3 py-2 text-slate-500">{c.period || "—"}</td>
                    <td className="px-3 py-2"><UptoBadge>{c.status || "pending"}</UptoBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </UptoCard>
    </UptoPage>
  );
};

export default Commissions;
