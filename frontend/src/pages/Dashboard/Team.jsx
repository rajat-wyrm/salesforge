import React, { useEffect, useState } from "react";
import { teamService, usageService } from "@/services";
import { useAuth } from "@/context/AuthContext";
import { useUptoStyles, UptoPage, UptoHero, UptoSectionHeading, UptoButton, UptoInput, UptoSelect, UptoBadge, UptoSpinner, UptoError, UptoEmptyState, UptoCard, UptoCopyButton } from "@/components/UI/UptoHooks";
import { Users, UserPlus, X, Crown, Building2 } from "lucide-react";
import { toast } from "sonner";

const ROLE_TONES = { OWNER: "brand", ADMIN: "info", MEMBER: "default", VIEWER: "warning" };

const Team = () => {
  const { user, isOwner, isAdmin, organization, updateOrganization } = useAuth();
  const s = useUptoStyles();
  const { darkMode } = s;
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [orgName, setOrgName] = useState(organization?.name || "");
  const [website, setWebsite] = useState(organization?.website || "");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [m, i, u] = await Promise.all([teamService.members(), teamService.invites(), usageService.summary()]);
      setMembers(m || []);
      setInvites(i || []);
      setUsage(u);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const sendInvite = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await teamService.sendInvite({ email, role });
      toast.success(`Invite sent to ${email}`);
      setEmail("");
      await load();
    } catch (err) { toast.error(err.message); }
  };

  const revokeInvite = async (id) => {
    if (!confirm("Revoke this invite?")) return;
    try { await teamService.revokeInvite(id); toast.success("Invite revoked"); await load(); }
    catch (e) { toast.error(e.message); }
  };

  const changeRole = async (id, newRole) => {
    try { await teamService.updateMember(id, { role: newRole }); toast.success("Role updated"); await load(); }
    catch (e) { toast.error(e.message); }
  };

  const removeMember = async (id) => {
    if (!confirm("Remove this member from the workspace?")) return;
    try { await teamService.removeMember(id); toast.success("Member removed"); await load(); }
    catch (e) { toast.error(e.message); }
  };

  const saveOrg = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await teamService.updateOrg({ name: orgName, website });
      updateOrganization(updated);
      toast.success("Workspace updated");
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <UptoSpinner />;
  if (error) return <UptoError error={error} onRetry={load} />;

  const memberCap = usage?.usage?.teamMembers?.limit;

  return (
    <UptoPage>
      <UptoHero
        title="Team & workspace"
        subtitle="Invite teammates, manage roles, and configure your workspace."
        darkMode={darkMode}
        actions={memberCap ? <UptoBadge tone="brand">{members.length} / {memberCap} members</UptoBadge> : null}
      />

      <section>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <UptoSectionHeading label="Members" hint={`${members.length} active`} darkMode={darkMode} />
            <UptoCard>
              {members.length === 0 ? (
                <UptoEmptyState icon={Users} title="No members yet" body="Invite your first teammate to get started." />
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
                          <td className={`py-3 px-2 font-medium ${s.heading}`}>
                            <div className="flex items-center gap-2">
                              {m.role === "OWNER" && <Crown className="h-3 w-3 text-amber-500" />}
                              {m.name}
                              {m.id === user?.id && <UptoBadge tone="info">You</UptoBadge>}
                            </div>
                          </td>
                          <td className={`py-3 px-2 ${s.body}`}>{m.email}</td>
                          <td className="py-3 px-2">
                            {isAdmin && m.id !== user?.id ? (
                              <select value={m.role} onChange={(e) => changeRole(m.id, e.target.value)} className={`rounded-lg border px-2 py-1 text-xs ${s.input}`}>
                                {["OWNER", "ADMIN", "MEMBER", "VIEWER"].map((r) => <option key={r} value={r}>{r}</option>)}
                              </select>
                            ) : (
                              <UptoBadge tone={ROLE_TONES[m.role]}>{m.role}</UptoBadge>
                            )}
                          </td>
                          <td className="py-3 px-2">{m.twoFactorEnabled ? <UptoBadge tone="success">On</UptoBadge> : <UptoBadge tone="warning">Off</UptoBadge>}</td>
                          <td className="py-3 px-2 text-right">
                            {isAdmin && m.id !== user?.id && <UptoButton variant="ghost" onClick={() => removeMember(m.id)} className="text-red-500">Remove</UptoButton>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </UptoCard>
          </div>

          {isAdmin && (
            <div>
              <UptoSectionHeading label="Invite" darkMode={darkMode} />
              <UptoCard>
                <form onSubmit={sendInvite} className="space-y-3">
                  <UptoInput type="email" label="Email" placeholder="teammate@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  <UptoSelect label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="ADMIN">Admin — full access</option>
                    <option value="MEMBER">Member — create & edit</option>
                    <option value="VIEWER">Viewer — read only</option>
                  </UptoSelect>
                  <UptoButton type="submit" className="w-full"><UserPlus className="h-4 w-4" /> Send Invite</UptoButton>
                </form>
                {invites.length > 0 && (
                  <div className="mt-5">
                    <UptoSectionHeading label="Pending" darkMode={darkMode} />
                    <ul className="space-y-2">
                      {invites.map((inv) => (
                        <li key={inv.id} className={`flex items-center justify-between rounded-xl border p-2 text-sm ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
                          <div className="min-w-0">
                            <p className={`truncate font-medium ${s.heading}`}>{inv.email}</p>
                            <p className={`text-xs ${s.muted}`}>{inv.role} · expires {new Date(inv.expiresAt).toLocaleDateString()}</p>
                          </div>
                          <UptoButton variant="ghost" onClick={() => revokeInvite(inv.id)} className="text-red-500"><X className="h-4 w-4" /></UptoButton>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </UptoCard>
            </div>
          )}
        </div>
      </section>

      {isAdmin && (
        <section>
          <UptoSectionHeading label="Workspace Settings" darkMode={darkMode} />
          <UptoCard>
            <form onSubmit={saveOrg} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <UptoInput label="Workspace name" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
              <UptoInput label="Website" placeholder="https://example.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
              <div className="md:col-span-2">
                <UptoButton type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</UptoButton>
              </div>
            </form>
          </UptoCard>
        </section>
      )}
    </UptoPage>
  );
};

export default Team;
