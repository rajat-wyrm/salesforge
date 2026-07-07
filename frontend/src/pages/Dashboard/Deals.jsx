import React, { useCallback, useEffect, useRef, useState } from "react";
import { dealService } from "@/services";
import {
  useUptoStyles,
  UptoPage,
  UptoHero,
  UptoSectionHeading,
  UptoButton,
  UptoInput,
  UptoSpinner,
  UptoError,
  UptoEmptyState,
  UptoCard,
  UptoProgressBar,
} from "@/components/UI/UptoHooks";
import { openEventStream } from "@/lib/api";
import { Briefcase, DollarSign, GripVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const stageColors = {
  gray: "border-slate-400",
  blue: "border-blue-400",
  amber: "border-amber-400",
  emerald: "border-emerald-400",
  red: "border-red-400",
  purple: "border-purple-400",
};

const emptyMetric = { count: 0, amount: 0 };

const Deals = () => {
  const { isMember } = useAuth();
  const s = useUptoStyles();
  const { darkMode } = s;
  const [kanban, setKanban] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createStage, setCreateStage] = useState(null);
  const [draft, setDraft] = useState({ title: "", amount: 0 });
  const [draggingId, setDraggingId] = useState(null);
  const createFormRef = useRef(null);

  const money = (value) =>
    `$${Math.round(Number(value) || 0).toLocaleString()}`;
  const pipelineMetrics = {
    total: metrics?.total || 0,
    won: metrics?.won || 0,
    open: metrics?.open || emptyMetric,
    commit: metrics?.commit || emptyMetric,
    bestCase: metrics?.bestCase || emptyMetric,
    wonRate: metrics?.wonRate || 0,
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [k, m] = await Promise.all([
        dealService.kanban(),
        dealService.metrics(),
      ]);
      setKanban(Array.isArray(k) ? k : []);
      setMetrics(m || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const stream = openEventStream("/sse/stream", {
      onEvent: (evt) => {
        if (
          ["DEAL_CREATED", "DEAL_UPDATED", "DEAL_STAGE_CHANGED"].includes(evt)
        )
          load();
      },
    });
    return () => stream.close();
  }, [load]);

  const create = async (e) => {
    e.preventDefault();
    try {
      await dealService.create({ ...draft, stageId: createStage });
      toast.success("Deal created");
      setShowCreate(false);
      setDraft({ title: "", amount: 0 });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const move = async (dealId, newStageId) => {
    try {
      await dealService.move(dealId, { stageId: newStageId });
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const onDragStart = (e, dealId) => {
    setDraggingId(dealId);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e) => e.preventDefault();
  const onDrop = async (e, stageId) => {
    e.preventDefault();
    if (!draggingId) return;
    await move(draggingId, stageId);
    setDraggingId(null);
  };

  if (loading && !kanban.length) return <UptoSpinner />;
  if (error) return <UptoError error={error} onRetry={load} />;

  return (
    <UptoPage>
      <UptoHero
        title="Deals"
        subtitle={
          metrics
            ? `${pipelineMetrics.open.count} open - ${money(pipelineMetrics.open.amount)} in pipeline`
            : "Sales pipeline"
        }
        darkMode={darkMode}
        actions={
          isMember && (
            <UptoButton
              disabled={!kanban.length}
              onClick={() => {
                setCreateStage(kanban[0]?.id || null);
                setShowCreate(true);
                createFormRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
            >
              <Plus className="h-4 w-4" /> New Deal
            </UptoButton>
          )
        }
      />

      {metrics && (
        <section>
          <UptoSectionHeading label="Pipeline Metrics" darkMode={darkMode} />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <UptoCard>
              <p className={`text-xs uppercase ${s.subtext}`}>Open</p>
              <p className={`mt-1 text-2xl font-bold ${s.heading}`}>
                {pipelineMetrics.open.count}
              </p>
              <p className={`text-xs ${s.muted}`}>
                {money(pipelineMetrics.open.amount)}
              </p>
            </UptoCard>
            <UptoCard>
              <p className={`text-xs uppercase ${s.subtext}`}>Commit</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {money(pipelineMetrics.commit.amount)}
              </p>
              <p className={`text-xs ${s.muted}`}>75%+ probability</p>
            </UptoCard>
            <UptoCard>
              <p className={`text-xs uppercase ${s.subtext}`}>Best Case</p>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                {money(pipelineMetrics.bestCase.amount)}
              </p>
              <p className={`text-xs ${s.muted}`}>50%+ probability</p>
            </UptoCard>
            <UptoCard>
              <p className={`text-xs uppercase ${s.subtext}`}>Won Rate</p>
              <p className="mt-1 text-2xl font-bold text-[#00b5ad]">
                {pipelineMetrics.wonRate}%
              </p>
              <p className={`text-xs ${s.muted}`}>
                {pipelineMetrics.won} of {pipelineMetrics.total} won
              </p>
            </UptoCard>
          </div>
        </section>
      )}

      <section>
        <UptoSectionHeading label="Deal Pipeline" darkMode={darkMode} />
        {kanban.length === 0 ? (
          <UptoCard>
            <UptoEmptyState
              icon={Briefcase}
              title="No pipeline stages"
              body="Pipeline stages will appear here once the workspace is ready."
            />
          </UptoCard>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {kanban.map((stage) => (
              <div
                key={stage.id}
                className={`flex h-full w-72 shrink-0 flex-col rounded-2xl border-t-4 ${darkMode ? "bg-slate-900/60" : "bg-slate-50/60"} ${stageColors[stage.color] || stageColors.gray}`}
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-xs font-semibold uppercase tracking-wide ${s.heading}`}
                    >
                      {stage.name}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${darkMode ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-600"}`}
                    >
                      {stage.deals?.length || 0}
                    </span>
                  </div>
                </div>
                <div
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, stage.id)}
                  className="min-h-[100px] space-y-2 p-2"
                >
                  {(stage.deals || []).map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, deal.id)}
                      className={`cursor-grab rounded-xl border p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing ${
                        darkMode
                          ? "border-slate-800 bg-slate-900"
                          : "border-slate-100 bg-white"
                      } ${draggingId === deal.id ? "opacity-50" : ""}`}
                    >
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h4
                          className={`line-clamp-2 text-sm font-semibold ${s.heading}`}
                        >
                          {deal.title || "Untitled deal"}
                        </h4>
                        <GripVertical className="h-3 w-3 shrink-0 text-slate-300" />
                      </div>
                      <div
                        className={`mb-2 flex items-center gap-1 text-xs ${s.body}`}
                      >
                        <DollarSign className="h-3 w-3" />{" "}
                        {money(deal.amount).replace("$", "")}
                      </div>
                      <UptoProgressBar
                        value={deal.probability || stage.probability || 0}
                        max={100}
                        darkMode={darkMode}
                      />
                      <div
                        className={`mt-2 flex items-center justify-between text-[10px] ${s.muted}`}
                      >
                        <span>
                          {deal.probability ?? stage.probability ?? 0}% likely
                        </span>
                        {deal.expectedCloseAt && (
                          <span>
                            closes{" "}
                            {new Date(
                              deal.expectedCloseAt,
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!stage.deals || stage.deals.length === 0) && (
                    <p className={`py-4 text-center text-xs ${s.muted}`}>
                      No deals here
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showCreate && (
        <section ref={createFormRef}>
          <UptoCard>
            <h3 className={`mb-4 text-base font-semibold ${s.heading}`}>
              New Deal
            </h3>
            <form onSubmit={create} className="space-y-3">
              <UptoInput
                label="Title *"
                value={draft.title}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, title: e.target.value }))
                }
                required
                placeholder="Acme - Enterprise Plan"
              />
              <UptoInput
                label="Amount *"
                type="number"
                value={draft.amount}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, amount: Number(e.target.value) }))
                }
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <UptoInput
                  label="Probability %"
                  type="number"
                  min={0}
                  max={100}
                  value={draft.probability || 50}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      probability: Number(e.target.value),
                    }))
                  }
                />
                <UptoInput
                  label="Expected close"
                  type="date"
                  value={draft.expectedCloseAt || ""}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, expectedCloseAt: e.target.value }))
                  }
                />
              </div>
              <div className="flex gap-2">
                <UptoButton type="submit">Create Deal</UptoButton>
                <UptoButton
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </UptoButton>
              </div>
            </form>
          </UptoCard>
        </section>
      )}
    </UptoPage>
  );
};

export default Deals;
