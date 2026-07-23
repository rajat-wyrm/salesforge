import {
  AlertTriangle,
  CheckCircle,
  ChevronsRight,
  Download,
  MoreVertical,
  Users,
  Activity,
  RefreshCw,
  Loader2,
} from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "./StatCard";
import { api, unwrap, tokenStore } from "../../lib/api";

const AdminMainLayout = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboard, health] = await Promise.all([
        unwrap(api.get("/admin/dashboard")),
        unwrap(api.get("/admin/server-health")).catch(() => null),
      ]);
      setDashboardData(dashboard);
      setHealthData(health);
    } catch (err) {
      console.error("Failed to fetch admin dashboard:", err);
      setError(err?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReportError(null);
    try {
      const token = tokenStore.get();
      const baseURL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000") + "/api";
      const response = await fetch(`${baseURL}/admin/monthly-report`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
      a.download = filenameMatch ? filenameMatch[1] : "salesforge-monthly-report.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Report download failed:", err);
      setReportError(err?.message || "Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  };

  const totals = dashboardData?.totals || {};
  const recentUsers = dashboardData?.recentUsers || [];

  // Extract health statuses from live data
  const dbStatus = healthData?.database?.status || "operational";
  const dbLatency = healthData?.database?.latencyMs || 0;
  const apiStatus = healthData?.api?.status || "operational";
  const emailStatus = healthData?.email?.status || "operational";
  const memPercent = healthData?.memory?.heapUsedPercent || 0;

  const getHealthLabel = (status) => {
    if (status === "operational") return { label: "Operational", color: "text-green-600" };
    if (status === "high_latency") return { label: "High Latency", color: "text-amber-500" };
    return { label: "Degraded", color: "text-red-500" };
  };

  const getBarWidth = (status, latency) => {
    if (status === "operational") return Math.max(75, 100 - (latency || 0) / 10);
    if (status === "high_latency") return 50;
    return 20;
  };

  if (loading) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 overflow-y-auto flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-teal-600" />
          <span className="text-slate-500 text-sm">Loading dashboard...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 overflow-y-auto flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle size={40} className="text-amber-500 mx-auto" />
          <p className="text-slate-600">{error}</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors text-sm inline-flex items-center gap-2"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 overflow-y-auto">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Total Users"
          value={totals.totalUsers?.toLocaleString() || "0"}
          icon={Users}
          change={`${totals.totalOrganizations || 0} orgs`}
          colorClass="bg-blue-500"
        />
        <StatCard
          title="Active Licenses"
          value={totals.paidOrgs?.toLocaleString() || "0"}
          icon={CheckCircle}
          change={`${totals.totalOrganizations || 0} total`}
          colorClass="bg-green-500"
        />
        <StatCard
          title="Pending Alerts"
          value={totals.unreadNotifications?.toLocaleString() || "0"}
          icon={AlertTriangle}
          change={`${totals.totalApiKeys || 0} API keys`}
          colorClass="bg-amber-500"
        />
        <StatCard
          title="Total Deals"
          value={totals.totalDeals?.toLocaleString() || "0"}
          icon={Activity}
          change={`${totals.totalLeads || 0} leads`}
          colorClass="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Table Area */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">
              Recent Registrations
            </h3>
            <button
              onClick={() => navigate("/admin/users")}
              className="text-sm text-teal-600 font-medium hover:underline flex items-center"
            >
              View All <ChevronsRight size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="p-3 sm:p-4">User</th>
                  <th className="p-3 sm:p-4">Role</th>
                  <th className="p-3 sm:p-4 hidden sm:table-cell">Status</th>
                  <th className="p-3 sm:p-4">Date</th>
                  <th className="p-3 sm:p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                      No recent registrations found
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3 sm:p-4">
                        <div className="font-medium text-slate-900">
                          {user.name}
                        </div>
                        <div className="text-slate-500 text-xs">{user.email}</div>
                      </td>
                      <td className="p-3 sm:p-4 text-slate-600 text-xs">{user.role}</td>
                      <td className="p-3 sm:p-4 hidden sm:table-cell">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-slate-500 text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 sm:p-4 text-right">
                        <button
                          onClick={() => navigate("/admin/users")}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Widgets */}
        <div className="space-y-6">
          {/* System Health - LIVE DATA */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">System Health</h3>
              <button
                onClick={() => navigate("/admin/server-health")}
                className="text-xs text-teal-600 hover:underline"
              >
                Details →
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Database API</span>
                  <span className={`font-medium ${getHealthLabel(dbStatus).color}`}>
                    {getHealthLabel(dbStatus).label}
                    {dbLatency > 0 && <span className="text-slate-400 text-xs ml-1">({dbLatency}ms)</span>}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${dbStatus === "operational" ? "bg-green-500" : dbStatus === "high_latency" ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${getBarWidth(dbStatus, dbLatency)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">API Server</span>
                  <span className={`font-medium ${getHealthLabel(apiStatus).color}`}>
                    {getHealthLabel(apiStatus).label}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${apiStatus === "operational" ? "bg-green-500" : "bg-amber-500"}`}
                    style={{ width: `${apiStatus === "operational" ? 95 : 50}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Memory Usage</span>
                  <span className={`font-medium ${memPercent < 80 ? "text-green-600" : "text-amber-500"}`}>
                    {memPercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${memPercent < 60 ? "bg-green-500" : memPercent < 80 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${memPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-xl shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-600/20 to-purple-600/20"></div>
            <div className="relative">
              <h3 className="font-bold text-lg mb-2">Admin Tools</h3>
              <p className="text-slate-300 text-sm mb-4">
                Quickly generate reports or manage system backups.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleGenerateReport}
                  disabled={reportLoading}
                  className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {reportLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Download size={16} /> Generate Monthly Report
                    </>
                  )}
                </button>
                {reportError && (
                  <p className="text-red-300 text-xs text-center">{reportError}</p>
                )}
                <button
                  onClick={() => navigate("/admin/audit-logs")}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  View Audit Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminMainLayout;