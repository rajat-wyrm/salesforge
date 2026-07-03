import React, { useEffect, useState } from "react";
import { analyticsService, usageService } from "@/services";
import { useTheme } from "@/context/ThemeContext";
import { UptoPage, SectionHeading, UptoCard, UptoToolCard } from "@/components/UI/UptoStyles";
import { UptoError as ErrorBanner, UptoSpinner as FullPageSpinner, UptoBadge as Badge } from "@/components/UI/UptoHooks";
import { Activity, BarChart3, TrendingUp, Users, Target, Search, MailCheck, Globe2, Link2, Sparkles, AlertCircle, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AnimatedBackground from "@/components/AnimatedBackground";

const Dashboard = () => {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [usage, setUsage] = useState(null);
  const [insights, setInsights] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [global, ins, us] = await Promise.all([
        analyticsService.global(),
        analyticsService.insights(),
        usageService.summary(),
      ]);
      setData(global);
      setInsights(ins.insights || []);
      setUsage(us);
    } catch (e) {
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <FullPageSpinner />;
  if (error) return <ErrorBanner error={error} onRetry={load} />;
  if (!data) return null;

  const pipeline = data.pipeline || {};
  const conversionRate = data.totals.leads > 0 ? Math.round((pipeline.converted / data.totals.leads) * 100) : 0;
  const heading = darkMode ? "text-white" : "text-slate-900";
  const subtext = darkMode ? "text-slate-400" : "text-slate-500";
  const body = darkMode ? "text-slate-300" : "text-slate-600";
  const card = darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100";
  const divider = darkMode ? "border-slate-800" : "border-slate-200";
  const pill = darkMode ? "bg-teal-900/50 text-teal-400" : "bg-teal-50 text-teal-700";

  const tools = [
    { title: "Email Search", description: "Find verified emails for your leads instantly.", path: "/tools/email", buttonText: "Start Searching", icon: Search, color: "primary" },
    { title: "Domain Search", description: "Find employee contacts from a company domain.", path: "/tools/domain", buttonText: "Search Domain", icon: BarChart3, color: "warning" },
    { title: "Database Search", description: "Search by name, role, location, and skills.", path: "/tools/database", buttonText: "Search Database", icon: Zap, color: "success" },
    { title: "Social URL Search", description: "Find profiles from LinkedIn and other platforms.", path: "/tools/url", buttonText: "Find Profiles", icon: BarChart3, color: "info" },
  ];

  return (
    <UptoPage>
      <AnimatedBackground />
      {/* Hero section matching Maindashboard */}
      <div className="relative overflow-hidden -mx-6 md:-mx-10 lg:-mx-16 px-6 md:px-10 lg:px-16 py-12 md:py-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl ${darkMode ? "bg-blue-900/20" : "bg-blue-300/20"}`} />
          <div className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl ${darkMode ? "bg-purple-900/20" : "bg-purple-300/20"}`} />
        </div>
        <div className="relative max-w-3xl">
          <h1 className={`text-3xl md:text-4xl font-semibold mb-4 leading-tight ${heading}`}>
            Welcome back to <span className="bg-gradient-to-r from-[#00b5ad] to-[#e76937] bg-clip-text text-transparent">UptoSkills</span>
          </h1>
          <p className={`text-base leading-relaxed ${body}`}>
            Access your powerful lead generation and CRM tools to find verified contacts, build targeted lists, and accelerate your sales process.
          </p>
        </div>
      </div>

      {/* Analytics cards matching Maindashboard style */}
      <section>
        <SectionHeading label="Performance Overview" darkMode={darkMode} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <UptoCard title="Total Leads" value={data.totals.leads.toLocaleString()} icon={Target} trend="Live count" color="primary" darkMode={darkMode} />
          <UptoCard title="Qualified" value={pipeline.qualified || 0} icon={Activity} trend="Pipeline" color="success" darkMode={darkMode} />
          <UptoCard title="Converted" value={pipeline.converted || 0} icon={TrendingUp} trend={`${conversionRate}% rate`} color="warning" darkMode={darkMode} />
          <UptoCard title="New This Week" value={data.trends.newLeads7d} icon={Sparkles} trend="Last 7 days" color="info" darkMode={darkMode} />
        </div>
      </section>

      {/* AI Insights */}
      <section>
        <SectionHeading label="AI-Powered Insights" darkMode={darkMode} />
        <div className={`rounded-2xl p-6 md:p-8 border ${card}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-base font-semibold ${heading}`}>What your data is telling you</h3>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${pill}`}>AI Insights</span>
          </div>
          <div className="space-y-3">
            {insights.length === 0 ? (
              <p className={`text-sm ${subtext}`}>No insights yet.</p>
            ) : insights.map((ins, i) => {
              const Icon = ins.type === "positive" ? TrendingUp : ins.type === "warning" ? AlertCircle : Sparkles;
              const accent = ins.type === "positive"
                ? darkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                : ins.type === "warning"
                ? darkMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-50 text-amber-600"
                : darkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600";
              return (
                <div key={i} className={`flex items-start gap-3 rounded-xl p-3 ${darkMode ? "bg-slate-800/40" : "bg-slate-50/60"}`}>
                  <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl ${accent}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${heading}`}>{ins.title}</p>
                    <p className={`text-sm ${body}`}>{ins.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Search tools grid matching Maindashboard */}
      <section>
        <SectionHeading label="Search Tools" darkMode={darkMode} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tools.map((tool) => (
            <UptoToolCard
              key={tool.title}
              title={tool.title}
              description={tool.description}
              path={tool.path}
              buttonText={tool.buttonText}
              icon={tool.icon}
              color={tool.color}
              darkMode={darkMode}
              onClick={() => navigate(tool.path)}
            />
          ))}
        </div>
      </section>

      {/* Plan usage matching UptoSkills pill style */}
      {usage && (
        <section>
          <SectionHeading label="Plan Usage" darkMode={darkMode} />
          <div className={`rounded-2xl p-6 md:p-8 border ${card}`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={`text-base font-semibold ${heading}`}>This month's usage</h3>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${pill}`}>Plan: {usage.plan}</span>
            </div>
            <div className="space-y-3">
              {Object.entries(usage.usage || {}).map(([key, info]) => {
                const used = info.used || 0;
                const limit = info.limit === null || info.limit === undefined ? "∞" : info.limit;
                const pct = info.limit ? Math.min(100, (used / info.limit) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-medium capitalize ${heading}`}>{key.replace(/([A-Z])/g, " $1")}</span>
                      <span className={subtext}>{used} / {limit}</span>
                    </div>
                    <div className={`h-2 w-full overflow-hidden rounded-full ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                      <div className="h-full bg-gradient-to-r from-[#00b5ad] to-[#2dd4bf] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </UptoPage>
  );
};

export default Dashboard;
