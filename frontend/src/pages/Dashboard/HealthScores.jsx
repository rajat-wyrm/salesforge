import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { healthScoreService } from "@/services";
import {
  UptoPage,
  UptoHero,
  UptoButton,
  UptoBadge,
  UptoSpinner,
  UptoError,
  UptoEmptyState,
  UptoCard,
  useUptoStyles,
} from "@/components/UI/UptoHooks";
import {
  Activity,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  Heart,
  ListTodo,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

const getCategory = (score) => {
  if (score >= 70) {
    return {
      label: "Healthy",
      tone: "success",
      bar: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
    };
  }

  if (score >= 40) {
    return {
      label: "At risk",
      tone: "warning",
      bar: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
    };
  }

  return {
    label: "Critical",
    tone: "danger",
    bar: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
  };
};

const HealthScores = () => {
  const styles = useUptoStyles();

  const [items, setItems] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expandedLead, setExpandedLead] = useState(null);
  const [refreshingLead, setRefreshingLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadScores = async () => {
    setLoading(true);

    try {
      const [scoreResult, analyticsResult] = await Promise.allSettled([
        healthScoreService.list(),
        healthScoreService.analytics(),
      ]);

      if (scoreResult.status === "rejected") throw scoreResult.reason;

      setItems(scoreResult.value?.items || []);
      setAnalytics(analyticsResult.status === "fulfilled" ? analyticsResult.value : null);
      setError("");
      if (analyticsResult.status === "rejected") {
        toast.warning("Score summaries are temporarily unavailable, but lead scores are still shown.");
      }
    } catch (err) {
      setError(
        err?.normalized?.message ||
          err?.message ||
          "Failed to load health scores.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScores();
  }, []);

  const refreshLeadScore = async (leadId) => {
    setRefreshingLead(leadId);

    try {
      await healthScoreService.recompute(leadId);
      toast.success("Health score recalculated");
      await loadScores();
    } catch (err) {
      toast.error(
        err?.normalized?.message ||
          err?.message ||
          "Unable to recalculate score.",
      );
    } finally {
      setRefreshingLead(null);
    }
  };

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items
      .filter((item) => {
        const score = Number(item.score) || 0;
        const category = getCategory(score).label
          .toLowerCase()
          .replace(" ", "-");

        const matchesSearch =
          !query ||
          item.leadName?.toLowerCase().includes(query) ||
          item.companyName?.toLowerCase().includes(query) ||
          item.status?.toLowerCase().includes(query);

        const matchesFilter =
          filter === "all" || filter === category;

        return matchesSearch && matchesFilter;
      })
      .sort((first, second) => {
        return (first.score || 0) - (second.score || 0);
      });
  }, [items, search, filter]);

  return (
    <UptoPage>
      <UptoHero
        title="Health scores"
        subtitle="Monitor lead engagement and identify leads that need attention"
        actions={
          <UptoButton
            variant="secondary"
            onClick={loadScores}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh scores
          </UptoButton>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          title="Total leads"
          value={analytics?.total || items.length || 0}
          color={styles.heading}
        />

        <SummaryCard
          title="Average score"
          value={`${analytics?.avgScore || 0}/100`}
          color="text-[#00b5ad]"
        />

        <SummaryCard
          title="Healthy"
          value={analytics?.healthy || 0}
          color="text-emerald-600 dark:text-emerald-400"
        />

        <SummaryCard
          title="At risk"
          value={analytics?.atRisk || 0}
          color="text-amber-600 dark:text-amber-400"
        />

        <SummaryCard
          title="Critical"
          value={analytics?.critical || 0}
          color="text-red-600 dark:text-red-400"
        />
      </div>

      <UptoCard className="mt-6">
        <div className="mb-5">
          <h2 className={`text-lg font-semibold ${styles.heading}`}>
            How health score is calculated
          </h2>

          <p className={`mt-1 text-sm ${styles.subtext}`}>
            The score uses real lead information already available in
            SalesForge.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <ScoreFactor
            icon={CheckCircle2}
            title="Lead status"
            description="Qualified and converted leads receive a higher score."
          />

          <ScoreFactor
            icon={Activity}
            title="Engagement"
            description="Lead activities increase engagement health."
          />

          <ScoreFactor
            icon={FileText}
            title="Notes"
            description="Added notes show active lead management."
          />

          <ScoreFactor
            icon={ListTodo}
            title="Open tasks"
            description="Unfinished follow-up tasks reduce the score."
          />

          <ScoreFactor
            icon={Clock3}
            title="Recent activity"
            description="Recent activity improves the lead's health."
          />
        </div>
      </UptoCard>

      <UptoCard className="mt-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className={`text-lg font-semibold ${styles.heading}`}>
              Lead health overview
            </h2>

            <p className={`mt-1 text-sm ${styles.subtext}`}>
              Critical and at-risk leads should be followed up first.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search lead or company"
                className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none focus:border-[#00b5ad] focus:ring-2 focus:ring-[#00b5ad]/20 sm:w-64 ${styles.input}`}
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className={`rounded-xl border px-3 py-2 text-sm outline-none focus:border-[#00b5ad] ${styles.input}`}
            >
              <option value="all">All health levels</option>
              <option value="healthy">Healthy</option>
              <option value="at-risk">At risk</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {loading && (
          <UptoSpinner label="Calculating health scores..." />
        )}

        {!loading && error && (
          <UptoError error={error} onRetry={loadScores} />
        )}

        {!loading && !error && items.length === 0 && (
          <UptoEmptyState
            icon={Heart}
            title="No leads available for health scoring"
            body="Create a lead and add activities, notes or follow-up tasks. SalesForge will then calculate its health score."
            action={
              <UptoButton as={Link} to="/leads">
                Add your first lead
              </UptoButton>
            }
          />
        )}

        {!loading &&
          !error &&
          items.length > 0 &&
          visibleItems.length === 0 && (
            <UptoEmptyState
              icon={Search}
              title="No matching leads"
              body="Change your search or health-level filter."
              action={
                <UptoButton
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                >
                  Clear filters
                </UptoButton>
              }
            />
          )}

        {!loading && !error && visibleItems.length > 0 && (
          <div className="space-y-3">
            {visibleItems.map((item) => {
              const score = Number(item.score) || 0;
              const category = getCategory(score);
              const churnRisk = Math.round(
                (Number(item.churnRisk) || 0) * 100,
              );
              const isExpanded = expandedLead === item.leadId;

              return (
                <div
                  key={item.leadId}
                  className={`overflow-hidden rounded-2xl border ${
                    styles.darkMode
                      ? "border-slate-800 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="p-5">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/leads/${item.leadId}`}
                            className={`font-semibold hover:text-[#00b5ad] ${styles.heading}`}
                          >
                            {item.leadName ||
                              `Lead #${item.leadId}`}
                          </Link>

                          <UptoBadge tone={category.tone}>
                            {category.label}
                          </UptoBadge>

                          <UptoBadge>
                            {String(item.status || "new").replaceAll(
                              "_",
                              " ",
                            )}
                          </UptoBadge>
                        </div>

                        <div
                          className={`mt-2 flex flex-wrap gap-4 text-sm ${styles.subtext}`}
                        >
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {item.companyName || "No company"}
                          </span>

                          <span className="flex items-center gap-1">
                            {item.trend === "improving" ? (
                              <TrendingUp className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-amber-500" />
                            )}

                            {item.trend || "stable"}
                          </span>

                          <span>Churn risk: {churnRisk}%</span>
                        </div>
                      </div>

                      <div className="w-full xl:w-72">
                        <div className="mb-2 flex justify-between">
                          <span className={`text-sm ${styles.subtext}`}>
                            Health score
                          </span>

                          <span
                            className={`font-bold ${category.text}`}
                          >
                            {score}/100
                          </span>
                        </div>

                        <div
                          className={`h-2.5 overflow-hidden rounded-full ${
                            styles.darkMode
                              ? "bg-slate-800"
                              : "bg-slate-100"
                          }`}
                        >
                          <div
                            className={`h-full rounded-full ${category.bar}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <UptoButton
                          variant="secondary"
                          onClick={() =>
                            setExpandedLead(
                              isExpanded ? null : item.leadId,
                            )
                          }
                        >
                          {isExpanded ? "Hide details" : "Score details"}
                        </UptoButton>

                        <UptoButton
                          onClick={() =>
                            refreshLeadScore(item.leadId)
                          }
                          disabled={refreshingLead === item.leadId}
                        >
                          <RefreshCw
                            className={`h-4 w-4 ${
                              refreshingLead === item.leadId
                                ? "animate-spin"
                                : ""
                            }`}
                          />
                          Recalculate
                        </UptoButton>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div
                      className={`border-t p-5 ${
                        styles.darkMode
                          ? "border-slate-800 bg-slate-950/50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <h3
                        className={`mb-3 text-sm font-semibold ${styles.heading}`}
                      >
                        Score breakdown
                      </h3>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                        {Object.entries(item.factors || {}).map(
                          ([name, value]) => (
                            <div
                              key={name}
                              className={`rounded-xl border p-3 ${
                                styles.darkMode
                                  ? "border-slate-800 bg-slate-900"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <p
                                className={`text-xs capitalize ${styles.subtext}`}
                              >
                                {name}
                              </p>

                              <p
                                className={`mt-1 font-semibold ${
                                  Number(value) >= 0
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                }`}
                              >
                                {Number(value) > 0 ? "+" : ""}
                                {value}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </UptoCard>
    </UptoPage>
  );
};

const SummaryCard = ({ title, value, color }) => (
  <UptoCard className="p-5">
    <p className="text-sm text-slate-500 dark:text-slate-400">
      {title}
    </p>

    <p className={`mt-2 text-2xl font-semibold ${color}`}>
      {value}
    </p>
  </UptoCard>
);

const ScoreFactor = ({ icon: Icon, title, description }) => {
  const styles = useUptoStyles();

  return (
    <div
      className={`rounded-xl border p-4 ${
        styles.darkMode
          ? "border-slate-800 bg-slate-900"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <Icon className="mb-3 h-5 w-5 text-[#00b5ad]" />

      <p className={`text-sm font-semibold ${styles.heading}`}>
        {title}
      </p>

      <p className={`mt-1 text-xs leading-5 ${styles.subtext}`}>
        {description}
      </p>
    </div>
  );
};

export default HealthScores;
