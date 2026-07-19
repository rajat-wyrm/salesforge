import React, { useEffect, useState } from "react";
import { usageService, auditService, sessionService, twoFactorService } from "@/services";
import { useAuth } from "@/context/AuthContext";
import { useUptoStyles, UptoPage, UptoHero, UptoSectionHeading, UptoButton, UptoInput, UptoBadge, UptoSpinner, UptoError, UptoEmptyState, UptoCard, UptoProgressBar } from "@/components/UI/UptoHooks";
import { Activity, Shield, Monitor, KeyRound, LogOut, Eye, EyeOff, Check } from "lucide-react";
import { toast } from "sonner";

const Usage = () => {
  const s = useUptoStyles();
  const { darkMode } = s;
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    usageService.summary().then(setSummary).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);
  if (loading) return <UptoSpinner />;
  if (error) return <UptoError error={error} onRetry={() => location.reload()} />;
  if (!summary) return null;

  return (
    <UptoPage>
      <UptoHero title="Usage" subtitle={`Plan: ${summary.plan} · ${summary.period}`} darkMode={darkMode} />
      <section>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <UptoCard><p className={`text-xs uppercase ${s.subtext}`}>Leads</p><p className={`mt-1 text-2xl font-bold ${s.heading}`}>{summary.counts.leads}</p></UptoCard>
          <UptoCard><p className={`text-xs uppercase ${s.subtext}`}>Members</p><p className={`mt-1 text-2xl font-bold ${s.heading}`}>{summary.counts.members}</p></UptoCard>
          <UptoCard><p className={`text-xs uppercase ${s.subtext}`}>Tags</p><p className={`mt-1 text-2xl font-bold ${s.heading}`}>{summary.counts.tags}</p></UptoCard>
          <UptoCard><p className={`text-xs uppercase ${s.subtext}`}>API keys</p><p className={`mt-1 text-2xl font-bold ${s.heading}`}>{summary.counts.apiKeys}</p></UptoCard>
          <UptoCard><p className={`text-xs uppercase ${s.subtext}`}>Webhooks</p><p className={`mt-1 text-2xl font-bold ${s.heading}`}>{summary.counts.webhooks}</p></UptoCard>
          <UptoCard><p className={`text-xs uppercase ${s.subtext}`}>Saved searches</p><p className={`mt-1 text-2xl font-bold ${s.heading}`}>{summary.counts.savedSearches}</p></UptoCard>
        </div>
      </section>
      <section>
        <UptoSectionHeading label="This Month's Usage" darkMode={darkMode} />
        <UptoCard>
          <div className="space-y-3">
            {Object.entries(summary.usage).map(([k, v]) => {
              const used = v.used || 0;
              const limit = v.limit === null || v.limit === undefined ? "∞" : v.limit;
              const pct = limit && limit !== "∞" ? Math.min(100, (used / limit) * 100) : 0;
              return (
                <div key={k}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`font-medium capitalize ${s.heading}`}>{k.replace(/([A-Z])/g, " $1")}</span>
                    <span className={s.subtext}>{used} / {limit}</span>
                  </div>
                  <UptoProgressBar value={pct} max={100} darkMode={darkMode} />
                </div>
              );
            })}
          </div>
        </UptoCard>
      </section>
    </UptoPage>
  );
};

const Audit = () => {
  const s = useUptoStyles();
  const { darkMode } = s;
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const limit = 30;

const load = async (p = page, keyword = search) => {
  try {
    if (items.length === 0) {
      setLoading(true);
    }

    const r = await auditService.list({
      page: p,
      limit,
      search: keyword,
    });

    console.log("Audit response:", r);

    setItems(r.items || []);
    setTotal(r.total || 0);
    setError(null);
  } catch (error) {
    console.error("Failed to load audit logs:", error);
    setError(error.message || "Failed to load audit logs.");
  } finally {
    setLoading(false);
  }

};

useEffect(() => {
    const timer = setTimeout(() => {
        load(1, search.trim());
    }, 500);

    return () => clearTimeout(timer);
}, [search]);
  if (loading && items.length === 0) return <UptoSpinner />;
  if (error) return <UptoError error={error} onRetry={() => load(1)} />;

  return (
    <UptoPage>
      <UptoHero title="Audit log" subtitle={`${total} events recorded`} darkMode={darkMode} />
      <div className="mb-4">
  <div className="flex gap-2">
    <UptoInput
      placeholder="Search by username or email..."
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setPage(1);
      }}
    />

    {search && (
      <UptoButton
        variant="secondary"
        onClick={() => {
          setSearch("");
          setPage(1);
        }}
      >
        Clear
      </UptoButton>
    )}
  </div>
</div>
      <UptoCard>
        {items.length === 0 ? (
         <UptoEmptyState
    icon={Shield}
    title={
        search
            ? "No matching audit records"
            : "No audit events yet"
    }
    body={
        search
            ? "Try another user name or email."
            : "Activity will appear here as you and your team use UptoSkills."
    }
/>
        ) : (
          <ul className={`divide-y ${s.divider}`}>
            {items.map((row) => (
              <li key={row.id} className="flex items-center justify-between py-2 text-sm">
  <div>
    <p className={`font-medium ${s.heading}`}>
      {row.user?.name || "System"} performed {row.action}
    </p>

    <p className={`text-xs ${s.muted}`}>
      <strong>{row.user?.name || "System"}</strong>

      {row.user?.email && <> ({row.user.email})</>}

      {" • "}

      {row.entityType}

      {row.entityId && ` #${row.entityId}`}
    </p>
  </div>

  <div className="text-right text-xs text-slate-500">
    <p>{new Date(row.createdAt).toLocaleString()}</p>
    {row.ipAddress && <p>{row.ipAddress}</p>}
  </div>
</li>
            ))}
          </ul>
        )}
      </UptoCard>
      {total > limit && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <UptoButton variant="secondary" disabled={page === 1} onClick={() => { const p = page - 1; setPage(p); load(p, search);; }}>Previous</UptoButton>
          <span className={`text-xs ${s.subtext}`}>Page {page} of {Math.ceil(total / limit)}</span>
          <UptoButton variant="secondary" disabled={page * limit >= total} onClick={() => { const p = page + 1; setPage(p); load(p, search); }}>Next</UptoButton>
        </div>
      )}
    </UptoPage>
  );
};

const Sessions = () => {
  const s = useUptoStyles();
  const { darkMode } = s;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setItems(await sessionService.list() || []); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const revoke = async (id) => {
    if (!confirm("Revoke this session?")) return;
    try { await sessionService.revoke(id); toast.success("Session revoked"); await load(); }
    catch (e) { toast.error(e.message); }
  };
  const revokeAll = async () => {
    if (!confirm("Revoke all other sessions? You'll stay signed in here.")) return;
    try { await sessionService.revokeAll(); toast.success("All sessions revoked"); await load(); }
    catch (e) { toast.error(e.message); }
  };

  if (loading) return <UptoSpinner />;
  if (error) return <UptoError error={error} onRetry={load} />;

  return (
    <UptoPage>
      <UptoHero title="Active sessions" subtitle="Manage devices that are currently signed in to your account." darkMode={darkMode}
        actions={<UptoButton variant="danger" onClick={revokeAll}><LogOut className="h-4 w-4" /> Revoke all</UptoButton>}
      />
      <UptoCard>
        {items.length === 0 ? (
          <UptoEmptyState icon={Monitor} title="No active sessions" />
        ) : (
          <ul className={`divide-y ${s.divider}`}>
            {items.map((sess) => (
              <li key={sess.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className={`font-medium ${s.heading}`}>{sess.device || sess.userAgent || "Unknown device"}</p>
                  <p className={`text-xs ${s.muted}`}>{sess.ipAddress || "—"} · last active {new Date(sess.lastActiveAt).toLocaleString()}</p>
                </div>
                <UptoButton variant="ghost" onClick={() => revoke(sess.id)} className="text-red-500">Revoke</UptoButton>
              </li>
            ))}
          </ul>
        )}
      </UptoCard>
    </UptoPage>
  );
};

const TwoFactor = () => {
  const { user, refresh } = useAuth();
  const s = useUptoStyles();
  const { darkMode } = s;
  const [status, setStatus] = useState(null);
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setStatus(await twoFactorService.status()); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const setup = async () => {
    try {
      const data = await twoFactorService.setup();
      setSetupData(data);
    } catch (e) { toast.error(e.message); }
  };
  const verify = async (e) => {
    e.preventDefault();
    try { await twoFactorService.verify(code); toast.success("2FA enabled"); setSetupData(null); setCode(""); await load(); await refresh(); }
    catch (e) { toast.error(e.message); }
  };
  const disable = async (e) => {
    e.preventDefault();
    try { await twoFactorService.disable(code); toast.success("2FA disabled"); setCode(""); await load(); await refresh(); }
    catch (e) { toast.error(e.message); }
  };
  if (loading) return <UptoSpinner />;
  if (!status) return null;

  return (
    <UptoPage>
      <UptoHero title="Two-factor authentication" subtitle="Add an extra layer of security to your account." darkMode={darkMode} />
      <UptoCard>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className={`text-sm ${s.subtext}`}>Status</p>
            <p className={`text-lg font-semibold ${s.heading}`}>{status.enabled ? "Enabled" : "Disabled"}</p>
            {status.enabled && <p className={`text-xs ${s.muted}`}>Backup codes remaining: {status.backupCodesRemaining}</p>}
          </div>
          {status.enabled ? <UptoBadge tone="success">Active</UptoBadge> : <UptoBadge tone="warning">Inactive</UptoBadge>}
        </div>

        {!status.enabled && !setupData && (
          <UptoButton onClick={setup}><KeyRound className="h-4 w-4" /> Set up 2FA</UptoButton>
        )}

        {setupData && (
          <div className="space-y-3">
            <p className={`text-sm ${s.body}`}>Scan this secret with your authenticator app, then enter the 6-digit code to confirm.</p>
            <div className={`flex items-center gap-2 rounded-xl border p-3 ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
              <code className="font-mono text-sm">{setupData.secret}</code>
            </div>
            {setupData.backupCodes && (
              <div className={`rounded-xl border p-3 text-sm ${darkMode ? "border-amber-900/40 bg-amber-900/20" : "border-amber-200 bg-amber-50"}`}>
                <p className={`mb-1 font-semibold ${darkMode ? "text-amber-300" : "text-amber-800"}`}>Save your backup codes</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {setupData.backupCodes.map((c) => <code key={c} className="font-mono">{c}</code>)}
                </div>
              </div>
            )}
            <form onSubmit={verify} className="flex items-end gap-2">
              <UptoInput label="Verification code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" required />
              <UptoButton type="submit">Confirm</UptoButton>
            </form>
          </div>
        )}

        {status.enabled && (
          <div className="space-y-3">
            <form onSubmit={disable} className="flex items-end gap-2">
              <UptoInput label="Current 2FA code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" required />
              <UptoButton type="submit" variant="danger">Disable</UptoButton>
            </form>
          </div>
        )}
      </UptoCard>
    </UptoPage>
  );
};

export { Usage, Audit, Sessions, TwoFactor };
