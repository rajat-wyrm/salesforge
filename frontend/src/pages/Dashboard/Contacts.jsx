// Generic resource list page template. Used for Contacts page.
import React, { useEffect, useState } from "react";
import { contactService } from "@/services";
import {
  UptoPage, UptoHero, UptoSectionHeading, UptoButton, UptoInput,
  UptoBadge, UptoSpinner, UptoError, UptoEmptyState, UptoCard,
} from "@/components/UI/UptoHooks";
import { Users, Plus, Search, Mail, Building2 } from "lucide-react";
import { toast } from "sonner";

const Contacts = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ firstName: "", lastName: "", email: "", phone: "", companyId: "", jobTitle: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await contactService.list({ search, limit: 100 });
      setItems(res?.items || res || []);
      setError(null);
    } catch (e) {
      setError(e?.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await contactService.create(draft);
      toast.success("Contact created");
      setShowCreate(false);
      setDraft({ firstName: "", lastName: "", email: "", phone: "", companyId: "", jobTitle: "" });
      load();
    } catch (err) {
      toast.error(err?.message || "Create failed");
    }
  };

  return (
    <UptoPage>
      <UptoHero
        title="Contacts"
        subtitle="People at your customer and prospect companies"
        actions={<UptoButton onClick={() => setShowCreate(true)}><Plus className="mr-1 h-4 w-4 inline" /> New contact</UptoButton>}
      />

      <UptoCard>
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-slate-400" />
          <UptoInput placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {loading && <UptoSpinner />}
        {error && <UptoError message={error} onRetry={load} />}
        {!loading && !error && items.length === 0 && (
          <UptoEmptyState icon={Users} title="No contacts yet" body="Add your first contact to get started." />
        )}
        {!loading && !error && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-2 font-medium">{c.firstName} {c.lastName}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{c.email || "—"}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{c.companyName || "—"}</td>
                    <td className="px-3 py-2"><UptoBadge>{c.status || "active"}</UptoBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </UptoCard>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">New contact</h3>
            <div className="space-y-3">
              <UptoInput label="First name" value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} required />
              <UptoInput label="Last name" value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} />
              <UptoInput label="Email" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
              <UptoInput label="Phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
              <UptoInput label="Company ID" value={draft.companyId} onChange={(e) => setDraft({ ...draft, companyId: e.target.value })} required />
              <UptoInput label="Job title" value={draft.jobTitle} onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <UptoButton type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</UptoButton>
              <UptoButton type="submit">Create</UptoButton>
            </div>
          </form>
        </div>
      )}
    </UptoPage>
  );
};

export default Contacts;
