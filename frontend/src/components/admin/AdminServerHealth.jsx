import React, { useEffect, useState, useCallback } from "react";
import {
  Database, Server, Mail, RefreshCw, Loader2,
  AlertTriangle, CheckCircle, HardDrive, Wifi, Key, Bell,
} from "lucide-react";
import { api, unwrap } from "../../lib/api";

const StatusBadge = ({ status }) => {
  const config = {
    operational: { color: "bg-green-100 text-green-700", icon: <CheckCircle size={14} />, label: "Operational" },
    high_latency: { color: "bg-amber-100 text-amber-700", icon: <AlertTriangle size={14} />, label: "High Latency" },
    degraded: { color: "bg-red-100 text-red-700", icon: <AlertTriangle size={14} />, label: "Degraded" },
  };
  const c = config[status] || config.operational;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.color}`}>
      {c.icon} {c.label}
    </span>
  );
};

const HealthCard = ({ icon: Icon, title, children, status }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-slate-100">
          <Icon size={20} className="text-slate-600" />
        </div>
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
      {status && <StatusBadge status={status} />}
    </div>
    {children}
  </div>
);

const MetricRow = ({ label, value, suffix }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm font-medium text-slate-800">
      {value}{suffix && <span className="text-slate-400 ml-1">{suffix}</span>}
    </span>
  </div>
);

const AdminServerHealth = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await unwrap(api.get("/admin/server-health"));
      setHealth(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err?.message || "Failed to fetch server health");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  if (loading && !health) {
    return (
      <main className="flex-1 p-8 bg-slate-50 overflow-y-auto flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-teal-600" />
          <span className="text-slate-500 text-sm">Checking server health...</span>
        </div>
      </main>
    );
  }

  if (error && !health) {
    return (
      <main className="flex-1 p-8 bg-slate-50 overflow-y-auto flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle size={40} className="text-amber-500 mx-auto" />
          <p className="text-slate-600">{error}</p>
          <button onClick={fetchHealth} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors text-sm inline-flex items-center gap-2">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </main>
    );
  }

  const db = health?.database || {};
  const apiHealth = health?.api || {};
  const mem = health?.memory || {};
  const resources = health?.resources || {};
  const email = health?.email || {};

  // Overall status
  const allOperational = db.status === "operational" && apiHealth.status === "operational" && email.status === "operational";

  return (
    <main className="flex-1 p-8 bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Server Health</h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time system monitoring and diagnostics
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-slate-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div className={`p-4 rounded-xl mb-8 flex items-center gap-3 ${allOperational ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
        <div className={`w-3 h-3 rounded-full ${allOperational ? "bg-green-500 animate-pulse" : "bg-amber-500 animate-pulse"}`}></div>
        <span className={`font-medium text-sm ${allOperational ? "text-green-700" : "text-amber-700"}`}>
          {allOperational ? "All Systems Operational" : "Some Systems Experiencing Issues"}
        </span>
      </div>

      {/* Health Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Database */}
        <HealthCard icon={Database} title="Database" status={db.status}>
          <MetricRow label="Latency" value={db.latencyMs} suffix="ms" />
          <MetricRow label="Status" value={db.status === "operational" ? "Connected" : "Issues Detected"} />
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Response Time</span>
              <span className="text-slate-500">{db.latencyMs}ms</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${db.latencyMs < 100 ? "bg-green-500" : db.latencyMs < 500 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(100, Math.max(5, (1 - db.latencyMs / 1000) * 100))}%` }}
              ></div>
            </div>
          </div>
        </HealthCard>

        {/* API Server */}
        <HealthCard icon={Server} title="API Server" status={apiHealth.status}>
          <MetricRow label="Uptime" value={formatUptime(apiHealth.uptimeSeconds || 0)} />
          <MetricRow label="Hours" value={apiHealth.uptimeHours} suffix="hrs" />
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Uptime Health</span>
              <span className="text-slate-500">99.9%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full w-[99%] transition-all duration-500"></div>
            </div>
          </div>
        </HealthCard>

        {/* Memory */}
        <HealthCard icon={HardDrive} title="Memory Usage" status={mem.heapUsedPercent < 80 ? "operational" : "high_latency"}>
          <MetricRow label="RSS" value={mem.rss} />
          <MetricRow label="Heap Used" value={mem.heapUsed} />
          <MetricRow label="Heap Total" value={mem.heapTotal} />
          <MetricRow label="External" value={mem.external} />
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Heap Usage</span>
              <span className="text-slate-500">{mem.heapUsedPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${mem.heapUsedPercent < 60 ? "bg-green-500" : mem.heapUsedPercent < 80 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${mem.heapUsedPercent || 0}%` }}
              ></div>
            </div>
          </div>
        </HealthCard>

        {/* Email */}
        <HealthCard icon={Mail} title="Email Relay" status={email.status}>
          <MetricRow label="Status" value={email.status === "operational" ? "Connected" : "Issues"} />
          <MetricRow label="Provider" value="SMTP" />
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Key size={14} className="text-slate-400" />
              <span className="text-slate-500">Active API Keys:</span>
              <span className="font-medium text-slate-800">{resources.activeApiKeys || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Wifi size={14} className="text-slate-400" />
              <span className="text-slate-500">Active Webhooks:</span>
              <span className="font-medium text-slate-800">{resources.activeWebhooks || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Bell size={14} className="text-slate-400" />
              <span className="text-slate-500">Total Notifications:</span>
              <span className="font-medium text-slate-800">{resources.totalNotifications || 0}</span>
            </div>
          </div>
        </HealthCard>
      </div>
    </main>
  );
};

export default AdminServerHealth;
