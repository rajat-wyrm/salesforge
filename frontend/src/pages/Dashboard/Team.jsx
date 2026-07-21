import React, { useCallback, useEffect, useState } from "react";
import { teamService, usageService } from "@/services";
import { openEventStream } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  useUptoStyles,
  UptoPage,
  UptoHero,
  UptoSectionHeading,
  UptoButton,
  UptoInput,
  UptoSelect,
  UptoBadge,
  UptoSpinner,
  UptoError,
  UptoEmptyState,
  UptoCard,
} from "@/components/UI/UptoHooks";
import { Users, UserPlus, X, Crown, Mail, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const ROLE_TONES = {
  OWNER: "brand",
  ADMIN: "info",
  MEMBER: "default",
  VIEWER: "warning",
};

const Team = () => {
  const {
    user,
    isAdmin,
    isOwner,
    organization,
    updateOrganization,
  } = useAuth();

  const s = useUptoStyles();
  const { darkMode } = s;

  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("OWNER");
  const [orgName, setOrgName] = useState(organization?.name || "");
  const [website, setWebsite] = useState(organization?.website || "");
  const [saving, setSaving] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [m, i, u] = await Promise.all([
        teamService.members(),
        teamService.invites(),
        usageService.summary(),
      ]);

      setMembers(m || []);
      setInvites(i || []);
      setUsage(u);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh members list when someone accepts an invite via SSE
  useEffect(() => {
    const stream = openEventStream("/sse/stream", {
      onEvent: (evt, payload) => {
        if (evt === "USER_JOINED") {
          load();
          if (payload) {
            const displayName = payload.name || payload.email;
            const displayRole = payload.role ? ` as ${payload.role}` : "";
            toast.success(`🎉 ${displayName} successfully added to the team${displayRole}!`);
          }
        }
      },
    });
    return () => stream.close();
  }, [load]);

  const sendInvite = async (e) => {
    e.preventDefault();

    if (!email) return;
    setSendingInvite(true);
    setInviteResult(null);

    try {
      const res = await teamService.sendInvite({ email, role });
      setInviteResult({ email, ...res });

      if (res.emailSkipped) {
        toast.warning(`Email not configured — use the invite link below.`);
      } else {
        toast.success(`Invite email sent to ${email}! ✉️`);
      }

      setEmail("");
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingInvite(false);
    }
  };

  const copyInviteLink = async () => {
    if (!inviteResult?.inviteUrl) return;
    await navigator.clipboard.writeText(inviteResult.inviteUrl);
    setCopied(true);
    toast.success("Invite link copied to clipboard!");
    setTimeout(() => setCopied(false), 3000);
  };

  const revokeInvite = async (id) => {
    if (!confirm("Revoke this invite?")) return;

    try {
      await teamService.revokeInvite(id);
      toast.success("Invite revoked");
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const changeRole = async (id, newRole) => {
    try {
      await teamService.updateMember(id, { role: newRole });
      toast.success("Role updated");
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const removeMember = async (id) => {
    if (!confirm("Remove this member from the workspace?")) return;

    try {
      await teamService.removeMember(id);
      toast.success("Member removed");
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const saveOrg = async (e) => {
    e.preventDefault();

    const trimmedOrgName = orgName.trim();
    const trimmedWebsite = website.trim();

    if (!trimmedOrgName) {
      toast.error("Workspace name is required.");
      return;
    }

    setSaving(true);

    try {
      const updated = await teamService.updateOrg({
        name: trimmedOrgName,
        website: trimmedWebsite,
      });

      setOrgName(trimmedOrgName);
      setWebsite(trimmedWebsite);
      updateOrganization(updated);

      toast.success("Workspace updated");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <UptoSpinner />;
  }

  if (error) {
    return <UptoError error={error} onRetry={load} />;
  }

  const memberCap = usage?.usage?.teamMembers?.limit;

  return (
    <UptoPage>
      <UptoHero
        title="Team & workspace"
        subtitle="Invite teammates, manage roles, and configure your workspace."
        darkMode={darkMode}
        actions={
          memberCap ? (
            <UptoBadge tone="brand">
              {members.length} / {memberCap} members
            </UptoBadge>
          ) : null
        }
      />

      <section>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <UptoSectionHeading
              label="Members"
              hint={`${members.length} active`}
              darkMode={darkMode}
            />

            <UptoCard>
              {members.length === 0 ? (
                <UptoEmptyState
                  icon={Users}
                  title="No members yet"
                  body="Invite your first teammate to get started."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="py-3 px-2">Name</th>
                        <th className="py-3 px-2">Email</th>
                        <th className="py-3 px-2">Role</th>
                        <th className="py-3 px-2">2FA</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {members.map((m) => (
                        <tr key={m.id}>
                          <td
                            className={`py-3 px-2 font-medium ${s.heading}`}
                          >
                            <div className="flex items-center gap-2">
                              {m.role === "OWNER" && (
                                <Crown className="h-3 w-3 text-amber-500" />
                              )}

                              {m.name}

                              {m.id === user?.id && (
                                <UptoBadge tone="info">You</UptoBadge>
                              )}
                            </div>
                          </td>

                          <td className={`py-3 px-2 ${s.body}`}>
                            {m.email}
                          </td>

                          <td className="py-3 px-2">
                            {isOwner && m.id !== user?.id ? (
                              <select
                                value={m.role}
                                onChange={(e) =>
                                  changeRole(m.id, e.target.value)
                                }
                                className={`rounded-lg border px-2 py-1 text-xs ${s.input}`}
                              >
                                {["OWNER", "ADMIN", "MEMBER", "VIEWER"].map(
                                  (r) => (
                                    <option key={r} value={r}>
                                      {r}
                                    </option>
                                  )
                                )}
                              </select>
                            ) : (
                              <UptoBadge tone={ROLE_TONES[m.role]}>
                                {m.role}
                              </UptoBadge>
                            )}
                          </td>

                          <td className="py-3 px-2">
                            {m.twoFactorEnabled ? (
                              <UptoBadge tone="success">On</UptoBadge>
                            ) : (
                              <UptoBadge tone="warning">Off</UptoBadge>
                            )}
                          </td>

                          <td className="py-3 px-2 text-right">
                            {isOwner && m.id !== user?.id && (
                              <UptoButton
                                variant="ghost"
                                onClick={() => removeMember(m.id)}
                                className="text-red-500"
                              >
                                Remove
                              </UptoButton>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </UptoCard>
          </div>

          <div>
              <UptoSectionHeading label="Invite" darkMode={darkMode} />

              <UptoCard>
                <form onSubmit={sendInvite} className="space-y-3">
                  <UptoInput
                    type="email"
                    label="Email address"
                    placeholder="teammate@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <UptoSelect
                    label="Role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="OWNER">Owner — complete control</option>
                    <option value="ADMIN">Admin — full access</option>
                    <option value="MEMBER">Member — create &amp; edit</option>
                    <option value="VIEWER">Viewer — read only</option>
                  </UptoSelect>

                  <UptoButton type="submit" className="w-full" disabled={sendingInvite}>
                    <Mail className="h-4 w-4" />
                    {sendingInvite ? "Sending..." : "Send Invite via Email"}
                  </UptoButton>
                </form>

                {/* Invite result feedback */}
                {inviteResult && (
                  <div className={`mt-4 rounded-xl border p-4 ${
                    inviteResult.emailSkipped
                      ? darkMode ? "border-amber-700/50 bg-amber-900/20" : "border-amber-200 bg-amber-50"
                      : darkMode ? "border-emerald-700/50 bg-emerald-900/20" : "border-emerald-200 bg-emerald-50"
                  }`}>
                    <div className="flex items-start gap-3">
                      {inviteResult.emailSkipped
                        ? <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                        : <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        {inviteResult.emailSkipped ? (
                          <>
                            <p className={`text-sm font-semibold ${darkMode ? "text-amber-400" : "text-amber-700"}`}>
                              SMTP not configured — share invite link manually
                            </p>
                            <p className={`text-xs mt-1 ${darkMode ? "text-amber-500/80" : "text-amber-600"}`}>
                              To enable email delivery, add EMAIL_USER and EMAIL_PASS to your backend .env file.
                            </p>
                            {inviteResult.inviteUrl && (
                              <div className={`mt-3 rounded-lg border p-2 flex items-center gap-2 ${
                                darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"
                              }`}>
                                <p className={`text-xs truncate flex-1 font-mono ${s.muted}`}>{inviteResult.inviteUrl}</p>
                                <button
                                  onClick={copyInviteLink}
                                  className={`shrink-0 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                                    copied
                                      ? "bg-emerald-500 text-white"
                                      : darkMode ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                  }`}
                                >
                                  <Copy className="h-3 w-3" />
                                  {copied ? "Copied!" : "Copy"}
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className={`text-sm font-semibold ${darkMode ? "text-emerald-400" : "text-emerald-700"}`}>
                            ✉️ Invite email sent to <span className="font-bold">{inviteResult.email}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {invites.length > 0 && (
                  <div className="mt-5">
                    <UptoSectionHeading
                      label="Pending"
                      darkMode={darkMode}
                    />

                    <ul className="space-y-2">
                      {invites.map((inv) => (
                        <li
                          key={inv.id}
                          className={`flex items-center justify-between rounded-xl border p-2 text-sm ${
                            darkMode
                              ? "border-slate-800"
                              : "border-slate-100"
                          }`}
                        >
                          <div className="min-w-0">
                            <p
                              className={`truncate font-medium ${s.heading}`}
                            >
                              {inv.email}
                            </p>

                            <p className={`text-xs ${s.muted}`}>
                              {inv.role} · expires{" "}
                              {new Date(inv.expiresAt).toLocaleDateString()}
                            </p>
                          </div>

                          <UptoButton
                            variant="ghost"
                            onClick={() => revokeInvite(inv.id)}
                            className="text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </UptoButton>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </UptoCard>
            </div>
        </div>
      </section>

      {isAdmin && (
        <section>
          <UptoSectionHeading
            label="Workspace Settings"
            darkMode={darkMode}
          />

          <UptoCard>
            <form
              onSubmit={saveOrg}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <UptoInput
                label="Workspace name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />

              <UptoInput
                label="Website"
                placeholder="https://example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />

              <div className="md:col-span-2">
                <UptoButton type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </UptoButton>
              </div>
            </form>
          </UptoCard>
        </section>
      )}
    </UptoPage>
  );
};

export default Team;