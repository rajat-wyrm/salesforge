import React, { useEffect, useState, useCallback } from "react";
import {
  Loader2, AlertTriangle, RefreshCw,
  Send, CheckCircle, Building, CreditCard, Shield,
} from "lucide-react";
import { api, unwrap } from "../../lib/api";

const AdminSettings = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventType, setEventType] = useState("MAINTENANCE_NOTICE");
  const [eventMessage, setEventMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [eventResult, setEventResult] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await unwrap(api.get("/admin/platform-stats"));
      setStats(data);
    } catch (err) {
      setError(err?.message || "Failed to load platform stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleTriggerEvent = async (e) => {
    e.preventDefault();
    setSending(true);
    setEventResult(null);
    try {
      const data = await unwrap(
        api.post("/admin/system-event", {
          eventType,
          message: eventMessage || undefined,
        })
      );
      setEventResult({ type: "success", message: data?.message || "Event triggered successfully." });
      setEventMessage("");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.normalized?.message || err?.message || "Failed to trigger event.";
      setEventResult({ type: "error", message: msg });
    } finally {
      setSending(false);
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case "FREE": return "bg-slate-100 text-slate-700";
      case "STARTER": return "bg-blue-100 text-blue-700";
      case "PRO": return "bg-purple-100 text-purple-700";
      case "ENTERPRISE": return "bg-amber-100 text-amber-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-700";
      case "TRIALING": return "bg-blue-100 text-blue-700";
      case "PAST_DUE": return "bg-red-100 text-red-700";
      case "CANCELED": return "bg-slate-100 text-slate-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  if (loading) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 overflow-y-auto flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-teal-600" />
          <span className="text-slate-500 text-sm">Loading settings...</span>
        </div>
      </main>
    );
  }

  if (error && !stats) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 overflow-y-auto flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle size={40} className="text-amber-500 mx-auto" />
          <p className="text-slate-600">{error}</p>
          <button onClick={fetchStats} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors text-sm inline-flex items-center gap-2">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 overflow-y-auto">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800">Global Settings</h2>
        <p className="text-sm text-slate-500 mt-1">Platform configuration and management tools</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Platform Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-teal-50">
                <Building size={20} className="text-teal-600" />
              </div>
              <h3 className="font-semibold text-slate-800">Organization Overview</h3>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-4">
              {stats?.total || 0}
              <span className="text-sm font-normal text-slate-500 ml-2">total organizations</span>
            </div>

            <h4 className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
              <CreditCard size={14} className="text-slate-500" /> By Plan
            </h4>
            <div className="space-y-2.5 mb-6">
              {(stats?.byPlan || []).length === 0 ? (
                <p className="text-sm text-slate-400">No plan data available</p>
              ) : (
                stats.byPlan.map((item) => (
                  <div key={item.plan} className="flex items-center justify-between py-1">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPlanColor(item.plan)}`}>
                      {item.plan}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{item.count}</span>
                  </div>
                ))
              )}
            </div>

            <h4 className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
              <Shield size={14} className="text-slate-500" /> By Status
            </h4>
            <div className="space-y-2.5">
              {(stats?.byStatus || []).length === 0 ? (
                <p className="text-sm text-slate-400">No status data available</p>
              ) : (
                stats.byStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between py-1">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{item.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* System Events */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-amber-50">
                <Send size={20} className="text-amber-600" />
              </div>
              <h3 className="font-semibold text-slate-800">Trigger System Event</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Broadcast system-wide notifications to all users in your organization.
            </p>

            <form onSubmit={handleTriggerEvent} className="space-y-4">
              <div>
                <label htmlFor="admin-event-type" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Event Type
                </label>
                <select
                  id="admin-event-type"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none cursor-pointer"
                  style={{ colorScheme: "light" }}
                >
                  <option value="MAINTENANCE_NOTICE">Maintenance Notice</option>
                  <option value="BACKUP_COMPLETED">Backup Completed</option>
                </select>
              </div>

              <div>
                <label htmlFor="admin-event-msg" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Custom Message <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="admin-event-msg"
                  value={eventMessage}
                  onChange={(e) => setEventMessage(e.target.value)}
                  placeholder="Enter a custom notification message..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
                />
              </div>

              {eventResult && (
                <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${eventResult.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                  {eventResult.type === "success" ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
                  <span>{eventResult.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Trigger Event
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Platform Info Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 sm:p-6 rounded-xl shadow-lg">
            <h3 className="font-bold text-lg mb-3">Platform Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Application</span>
                <span className="font-medium text-white">SalesForge CRM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Version</span>
                <span className="font-medium text-white">2.0.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Environment</span>
                <span className="font-medium px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full text-xs">
                  Development
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Users</span>
                <span className="font-medium text-white">{stats?.total || 0} orgs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminSettings;
