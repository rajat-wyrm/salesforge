// AI lead scoring insights page.
import React, { useEffect, useState } from "react";
import { aiScoringService } from "@/services";
import {
  UptoPage, UptoHero, UptoButton, UptoBadge, UptoSpinner, UptoError,
  UptoEmptyState, UptoCard, UptoProgressBar,
} from "@/components/UI/UptoHooks";
import { Brain, Sparkles } from "lucide-react";
import { toast } from "sonner";

const AIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await aiScoringService.insights();
      setInsights(res || null);
      setError(null);
    } catch (e) { setError(e?.message || "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleScoreAll = async () => {
    try {
      await aiScoringService.scoreAll();
      toast.success("All leads scored");
      load();
    } catch (err) { toast.error(err?.message || "Failed"); }
  };

  return (
    <UptoPage>
      <UptoHero
        title="AI lead scoring"
        subtitle="Machine-learning insights for your pipeline"
        actions={<UptoButton onClick={handleScoreAll}><Sparkles className="mr-1 h-4 w-4 inline" /> Score all</UptoButton>}
      />
      <UptoCard>
        {loading && <UptoSpinner />}
        {error && <UptoError message={error} onRetry={load} />}
        {!loading && !error && !insights && (
          <UptoEmptyState icon={Brain} title="No insights yet" body="Run scoring to get started." />
        )}
        {!loading && !error && insights && (
          <div className="space-y-4">
            {insights.summary && (
              <div>
                <div className="text-sm text-slate-500 mb-2">Summary</div>
                <div className="text-lg">{insights.summary}</div>
              </div>
            )}
            {insights.factors && Array.isArray(insights.factors) && (
              <div>
                <div className="text-sm text-slate-500 mb-2">Top scoring factors</div>
                <div className="space-y-2">
                  {insights.factors.map((f, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm">
                        <span>{f.name || f.factor}</span>
                        <span className="text-slate-500">{Math.round((f.weight || 0) * 100)}%</span>
                      </div>
                      <UptoProgressBar value={(f.weight || 0) * 100} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {insights.topLeads && Array.isArray(insights.topLeads) && (
              <div>
                <div className="text-sm text-slate-500 mb-2">Top leads</div>
                <div className="space-y-2">
                  {insights.topLeads.slice(0, 5).map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="font-medium">{l.name}</div>
                      <UptoBadge>{l.score || 0}/100</UptoBadge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </UptoCard>
    </UptoPage>
  );
};

export default AIInsights;
