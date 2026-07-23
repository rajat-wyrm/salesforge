import React, { useEffect, useState, useCallback } from "react";
import {
  Search, Edit3, Check, X, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle, RefreshCw, Shield, User,
} from "lucide-react";
import { api, unwrap } from "../../lib/api";

const ROLES = ["ADMIN", "OWNER", "MEMBER", "VIEWER", "STARTUP", "INVESTOR"];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/users", { params: { page, limit, search } });
      const body = res.data;
      setUsers(body.data || []);
      setTotal(body.meta?.pagination?.total || 0);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleEditRole = (user) => {
    setEditingUser(user.id);
    setEditRole(user.role);
  };

  const handleSaveRole = async (userId) => {
    setSaving(true);
    try {
      await unwrap(api.patch(`/admin/users/${userId}`, { role: editRole }));
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert(err?.message || "Failed to update user role");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "ADMIN": return "bg-red-100 text-red-700";
      case "OWNER": return "bg-purple-100 text-purple-700";
      case "MEMBER": return "bg-blue-100 text-blue-700";
      case "VIEWER": return "bg-slate-100 text-slate-600";
      case "STARTUP": return "bg-emerald-100 text-emerald-700";
      case "INVESTOR": return "bg-amber-100 text-amber-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "ADMIN": return <Shield size={12} />;
      case "OWNER": return <Shield size={12} />;
      default: return <User size={12} />;
    }
  };

  return (
    <main className="flex-1 p-8 bg-slate-50 overflow-y-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">User Management</h2>
          <p className="text-sm text-slate-500 mt-1">{total} total users on the platform</p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search users..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none w-64"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-500 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700 text-sm">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={fetchUsers} className="ml-auto text-red-600 hover:text-red-800">
            <RefreshCw size={16} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-teal-600" />
            <span className="ml-3 text-slate-500 text-sm">Loading users...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Organization</th>
                    <th className="p-4">Plan</th>
                    <th className="p-4">Joined</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                              {(user.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{user.name}</div>
                              <div className="text-slate-500 text-xs">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {editingUser === user.id ? (
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              className="px-2 py-1 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                              {getRoleIcon(user.role)} {user.role}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-600">
                          {user.organization?.name || <span className="text-slate-400 italic">None</span>}
                        </td>
                        <td className="p-4">
                          {user.organization?.plan ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
                              {user.organization.plan}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500 text-xs">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          {editingUser === user.id ? (
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => handleSaveRole(user.id)}
                                disabled={saving}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                title="Save"
                              >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                              </button>
                              <button
                                onClick={() => setEditingUser(null)}
                                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md transition-colors"
                                title="Cancel"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditRole(user)}
                              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                              title="Edit Role"
                            >
                              <Edit3 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Page {page} of {totalPages} ({total} users)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default AdminUsers;
