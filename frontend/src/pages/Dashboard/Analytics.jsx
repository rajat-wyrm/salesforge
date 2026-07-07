import React, { useEffect, useRef, useState } from "react";
import { winLossService, emailTrackingService } from "@/services";
import {
  useUptoStyles,
  UptoPage,
  UptoHero,
  UptoSectionHeading,
  UptoButton,
  UptoInput,
  UptoTextarea,
  UptoSelect,
  UptoBadge,
  UptoSpinner,
  UptoError,
  UptoEmptyState,
  UptoCard,
  UptoProgressBar,
} from "@/components/UI/UptoHooks";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trophy,
  X,
  Mail,
  MousePointerClick,
  Eye,
  BarChart3,
  Trash2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const OUTCOMES = [
  { id: "WON", label: "Won", color: "emerald", icon: Trophy },
  { id: "LOST", label: "Lost", color: "red", icon: X },
  { id: "POSTPONED", label: "Postponed", color: "amber", icon: Calendar },
  { id: "CANCELLED", label: "Cancelled", color: "gray", icon: X },
];

const LOSS_REASONS = [
  "PRICE",
  "COMPETITOR",
  "NO_BUDGET",
  "NO_DECISION",
  "TIMING",
  "NO_RESPONSE",
  "FEATURES",
  "RELATIONSHIP",
  "OTHER",
];

const Analytics = () => {
  const { isMember } = useAuth();
  const s = useUptoStyles();
  const { darkMode } = s;
  const [tab, setTab] = useState("winloss");
  const [records, setRecords] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [emailAnalytics, setEmailAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({
    dealId: "",
    outcome: "WON",
    lossReason: "",
    competitor: "",
    amount: 0,
    closedAt: "",
    cycleDays: "",
    notes: "",
    lessons: "",
  });
  const recordDealOutcomeRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [w, a, e] = await Promise.all([
        winLossService.list(),
        winLossService.analytics(),
        emailTrackingService.analytics(),
      ]);
      setRecords(w.items || []);
      setAnalytics(a);
      setEmailAnalytics(e);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await winLossService.create({
        ...draft,
        dealId: draft.dealId ? Number(draft.dealId) : undefined,
        amount: Number(draft.amount) || 0,
        cycleDays: draft.cycleDays ? Number(draft.cycleDays) : undefined,
        closedAt: draft.closedAt || new Date().toISOString(),
        lossReason:
          draft.outcome === "LOST" ? draft.lossReason || "OTHER" : undefined,
      });
      toast.success("Record created");
      setShowCreate(false);
      setDraft({
        dealId: "",
        outcome: "WON",
        lossReason: "",
        competitor: "",
        amount: 0,
        closedAt: "",
        cycleDays: "",
        notes: "",
        lessons: "",
      });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const remove = async (id) => {
    if (!confirm("Delete this record?")) return;
    try {
      await winLossService.remove(id);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <UptoPage>
      <UptoHero
        title="Win/Loss & Email Analytics"
        subtitle="Track deal outcomes and email engagement."
        darkMode={darkMode}
        actions={
          isMember &&
          tab === "winloss" && (
            <UptoButton
              onClick={() => {
                setShowCreate(true);
                recordDealOutcomeRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
            >
              <Plus className="h-4 w-4" /> Record Outcome
            </UptoButton>
          )
        }
      />

      <section>
        <div className="mb-4 flex items-center gap-2">
          {["winloss", "email"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${tab === t ? "bg-[#00b5ad] text-white" : s.body + " " + (darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100")}`}
            >
              {t === "winloss" ? "Win/Loss Analysis" : "Email Tracking"}
            </button>
          ))}
        </div>

        {loading ? (
          <UptoSpinner />
        ) : error ? (
          <UptoError error={error} onRetry={load} />
        ) : tab === "winloss" ? (
          <>
            {analytics && (
              <section className="mb-6">
                <UptoSectionHeading
                  label="Win/Loss Overview"
                  darkMode={darkMode}
                />
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <UptoCard>
                    <p className={`text-xs uppercase ${s.subtext}`}>Win Rate</p>
                    <p
                      className={`mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400`}
                    >
                      {analytics.winRate}%
                    </p>
                    <p className={`text-xs ${s.muted}`}>
                      {analytics.totalWon}/{analytics.total} deals
                    </p>
                  </UptoCard>
                  <UptoCard>
                    <p className={`text-xs uppercase ${s.subtext}`}>
                      Total Won
                    </p>
                    <p className={`mt-1 text-2xl font-bold ${s.heading}`}>
                      {analytics.totalWon}
                    </p>
                  </UptoCard>
                  <UptoCard>
                    <p className={`text-xs uppercase ${s.subtext}`}>
                      Total Lost
                    </p>
                    <p
                      className={`mt-1 text-2xl font-bold text-red-600 dark:text-red-400`}
                    >
                      {analytics.totalLost}
                    </p>
                  </UptoCard>
                  <UptoCard>
                    <p className={`text-xs uppercase ${s.subtext}`}>
                      Avg Deal Size
                    </p>
                    <p className={`mt-1 text-2xl font-bold ${s.heading}`}>
                      ${Math.round(analytics.avgDealSize || 0).toLocaleString()}
                    </p>
                  </UptoCard>
                </div>
              </section>
            )}

            {analytics && analytics.byOutcome.length > 0 && (
              <section className="mb-6">
                <UptoSectionHeading label="By Outcome" darkMode={darkMode} />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {analytics.byOutcome.map((o) => {
                    const cfg = OUTCOMES.find((c) => c.id === o.outcome);
                    return (
                      <UptoCard key={o.outcome}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {cfg && (
                              <cfg.icon
                                className={`h-4 w-4 text-${o.outcome === "WON" ? "emerald" : o.outcome === "LOST" ? "red" : "amber"}-500`}
                              />
                            )}
                            <h3 className={`font-semibold ${s.heading}`}>
                              {o.outcome}
                            </h3>
                          </div>
                          <UptoBadge tone={cfg?.color || "default"}>
                            {o.count} deals
                          </UptoBadge>
                        </div>
                        <p className={`mt-2 text-sm ${s.muted}`}>
                          ${(o.total || 0).toLocaleString()} total value
                        </p>
                      </UptoCard>
                    );
                  })}
                </div>
              </section>
            )}

            {analytics &&
              analytics.byLossReason &&
              analytics.byLossReason.length > 0 && (
                <section className="mb-6">
                  <UptoSectionHeading
                    label="Loss Reasons"
                    darkMode={darkMode}
                  />
                  <UptoCard>
                    {analytics.byLossReason.map((r) => (
                      <div key={r.lossReason} className="mb-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-medium ${s.heading}`}>
                            {r.lossReason}
                          </span>
                          <span className={s.muted}>{r.count}</span>
                        </div>
                        <UptoProgressBar
                          value={r.count}
                          max={Math.max(
                            ...analytics.byLossReason.map((r) => r.count),
                            1,
                          )}
                          darkMode={darkMode}
                        />
                      </div>
                    ))}
                  </UptoCard>
                </section>
              )}

            <section>
              <UptoSectionHeading label="All Records" darkMode={darkMode} />
              {records.length === 0 ? (
                <UptoCard>
                  <UptoEmptyState
                    icon={BarChart3}
                    title="No win/loss records yet"
                    body="Record your first deal outcome to start learning."
                  />
                </UptoCard>
              ) : (
                <UptoCard>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                      <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="py-3 px-2">Outcome</th>
                          <th className="py-3 px-2">Amount</th>
                          <th className="py-3 px-2">Reason</th>
                          <th className="py-3 px-2">Competitor</th>
                          <th className="py-3 px-2">Closed</th>
                          <th className="py-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {records.map((r) => (
                          <tr key={r.id} className={s.body}>
                            <td className="py-3 px-2">
                              <UptoBadge
                                tone={
                                  r.outcome === "WON"
                                    ? "success"
                                    : r.outcome === "LOST"
                                      ? "danger"
                                      : "warning"
                                }
                              >
                                {r.outcome}
                              </UptoBadge>
                            </td>
                            <td className="py-3 px-2 font-bold">
                              ${(r.amount || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-2">{r.lossReason || "—"}</td>
                            <td className="py-3 px-2">{r.competitor || "—"}</td>
                            <td className="py-3 px-2 text-xs">
                              {r.closedAt
                                ? new Date(r.closedAt).toLocaleDateString()
                                : "—"}
                            </td>
                            <td className="py-3 px-2 text-right">
                              {isMember && (
                                <UptoButton
                                  variant="ghost"
                                  onClick={() => remove(r.id)}
                                  className="text-red-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </UptoButton>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </UptoCard>
              )}
            </section>
          </>
        ) : (
          <>
            {emailAnalytics && (
              <section className="mb-6">
                <UptoSectionHeading
                  label="Email Engagement"
                  darkMode={darkMode}
                />
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <UptoCard>
                    <p className={`text-xs uppercase ${s.subtext}`}>Sent</p>
                    <p className={`mt-1 text-2xl font-bold ${s.heading}`}>
                      {emailAnalytics.totalSent}
                    </p>
                  </UptoCard>
                  <UptoCard>
                    <p className={`text-xs uppercase ${s.subtext}`}>Opens</p>
                    <p
                      className={`mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400`}
                    >
                      {emailAnalytics.totalOpened}
                    </p>
                    <p className={`text-xs ${s.muted}`}>
                      {emailAnalytics.openRate}% open rate
                    </p>
                  </UptoCard>
                  <UptoCard>
                    <p className={`text-xs uppercase ${s.subtext}`}>Clicks</p>
                    <p
                      className={`mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400`}
                    >
                      {emailAnalytics.totalClicked}
                    </p>
                    <UptoProgressBar
                      value={emailAnalytics.clickRate}
                      max={100}
                      darkMode={darkMode}
                    />
                  </UptoCard>
                  <UptoCard>
                    <p className={`text-xs uppercase ${s.subtext}`}>
                      Engagement
                    </p>
                    <p className={`mt-1 text-2xl font-bold text-[#00b5ad]`}>
                      {Math.round(
                        (emailAnalytics.openRate + emailAnalytics.clickRate) /
                          2,
                      )}
                      %
                    </p>
                    <p className={`text-xs ${s.muted}`}>avg combined</p>
                  </UptoCard>
                </div>
              </section>
            )}

            {emailAnalytics &&
              emailAnalytics.byType &&
              emailAnalytics.byType.length > 0 && (
                <section>
                  <UptoSectionHeading
                    label="Event Breakdown"
                    darkMode={darkMode}
                  />
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {emailAnalytics.byType.map((t) => (
                      <UptoCard key={t.type}>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${s.body}`}>{t.type}</span>
                          <UptoBadge tone="info">{t.count}</UptoBadge>
                        </div>
                      </UptoCard>
                    ))}
                  </div>
                </section>
              )}

            {emailAnalytics &&
              emailAnalytics.topRecipients &&
              emailAnalytics.topRecipients.length > 0 && (
                <section>
                  <UptoSectionHeading
                    label="Top Recipients"
                    darkMode={darkMode}
                  />
                  <UptoCard>
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                      <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="py-2">Recipient</th>
                          <th className="py-2">Events</th>
                          <th className="py-2">Opens</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {emailAnalytics.topRecipients.map((r, i) => (
                          <tr key={i} className={s.body}>
                            <td className="py-2 font-mono text-xs">
                              {r.recipient}
                            </td>
                            <td className="py-2">{r.total}</td>
                            <td className="py-2">
                              <UptoBadge tone="warning">{r.opens}</UptoBadge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </UptoCard>
                </section>
              )}
          </>
        )}
      </section>

      {showCreate && (
        <section ref={recordDealOutcomeRef}>
          <UptoCard>
            <h3 className={`text-base font-semibold mb-4 ${s.heading}`}>
              Record Deal Outcome
            </h3>
            <form onSubmit={create} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <UptoInput
                  label="Deal ID"
                  type="number"
                  value={draft.dealId}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, dealId: e.target.value }))
                  }
                />
                <UptoSelect
                  label="Outcome *"
                  value={draft.outcome}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, outcome: e.target.value }))
                  }
                >
                  {OUTCOMES.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </UptoSelect>
                {draft.outcome === "LOST" && (
                  <UptoSelect
                    label="Loss Reason"
                    value={draft.lossReason}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, lossReason: e.target.value }))
                    }
                  >
                    <option value="">Select reason</option>
                    {LOSS_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </UptoSelect>
                )}
                <UptoInput
                  label="Competitor (if lost to)"
                  value={draft.competitor}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, competitor: e.target.value }))
                  }
                />
                <UptoInput
                  label="Amount"
                  type="number"
                  value={draft.amount}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, amount: e.target.value }))
                  }
                />
                <UptoInput
                  label="Closed At"
                  type="date"
                  value={draft.closedAt}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, closedAt: e.target.value }))
                  }
                />
                <UptoInput
                  label="Cycle Days"
                  type="number"
                  value={draft.cycleDays}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, cycleDays: e.target.value }))
                  }
                />
              </div>
              <UptoTextarea
                label="Notes"
                value={draft.notes}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, notes: e.target.value }))
                }
              />
              <UptoTextarea
                label="Lessons Learned"
                value={draft.lessons}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, lessons: e.target.value }))
                }
              />
              <div className="flex gap-2">
                <UptoButton type="submit">Save</UptoButton>
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

export default Analytics;
