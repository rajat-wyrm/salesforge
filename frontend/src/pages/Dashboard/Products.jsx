import React, { useEffect, useState } from "react";
import { productService, priceBookService } from "@/services";
import { useUptoStyles, UptoPage, UptoHero, UptoSectionHeading, UptoButton, UptoInput, UptoSelect, UptoTextarea, UptoBadge, UptoSpinner, UptoError, UptoEmptyState, UptoCard } from "@/components/UI/UptoHooks";
import { Package, Plus, Trash2, Edit, DollarSign, Tag, Layers, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";


const currencySymbols = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
};

const Products = () => {
  const { isMember } = useAuth();
  const s = useUptoStyles();
  const { darkMode } = s;
  const [tab, setTab] = useState("products");
  const [items, setItems] = useState([]);
  const [priceBooks, setPriceBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showPB, setShowPB] = useState(false);
  const [draft, setDraft] = useState({ name: "", sku: "", description: "", category: "", unitPrice: 0, cost: 0 });
  const [pbDraft, setPBDraft] = useState({ name: "", currency: "USD", isDefault: false });

  const load = async () => {
    setLoading(true);
    try {
      const [p, pb] = await Promise.all([productService.list(), priceBookService.list()]);
      setItems(p.items || []);
      setPriceBooks(pb || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();

    if (!draft.name.trim()) {
    toast.error("Product name is required");
    return;
    }

    if (!draft.sku.trim()) {
      toast.error("SKU is required");
      return;
    }

    if (draft.unitPrice < 0) {
      toast.error("Unit Price cannot be negative");
      return;
    }

    if (draft.cost < 0) {
      toast.error("Cost cannot be negative");
      return;
    }
    try { await productService.create(draft); toast.success("Product created"); setShowCreate(false); setDraft({ name: "", sku: "", description: "", category: "", unitPrice: 0, cost: 0 }); load(); }
    catch (err) { toast.error(err.message); }
  };
  const remove = async (id) => {
    if (!confirm("Delete this product?")) return;
    try { await productService.remove(id); load(); }
    catch (e) { toast.error(e.message); }
  };
  const createPB = async (e) => {
    e.preventDefault();
    try { await priceBookService.create(pbDraft); toast.success("Price book created"); setShowPB(false); setPBDraft({ name: "", currency: "USD", isDefault: false }); load(); }
    catch (err) { toast.error(err.message); }
  };

  return (
    <UptoPage>
      <UptoHero title="Products & Price Books" subtitle="Manage your product catalog and pricing for quotes." darkMode={darkMode}
        actions={isMember && (
          <div className="flex gap-2">
            {tab === "products" ? (
              <UptoButton onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New Product</UptoButton>
            ) : (
              <UptoButton onClick={() => setShowPB(true)}><Plus className="h-4 w-4" /> New Price Book</UptoButton>
            )}
          </div>
        )}
      />

      <section>
        <div className="mb-4 flex items-center gap-2">
          {["products", "pricebooks"].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === t ? "bg-[#00b5ad] text-white" : s.body + " " + (darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100")}`}>
              {t === "products" ? `Products (${items.length})` : `Price Books (${priceBooks.length})`}
            </button>
          ))}
        </div>

        {loading ? <UptoSpinner /> : error ? <UptoError error={error} onRetry={load} /> : tab === "products" ? (
          items.length === 0 ? (
            <UptoCard><UptoEmptyState icon={Package} title="No products yet" body="Add your first product to start building quotes." /></UptoCard>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <UptoCard key={p.id}>
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className={`font-semibold ${s.heading}`}>{p.name}</h3>
                      <p className={`text-xs ${s.muted}`}>SKU: {p.sku}</p>

                    </div>
                    {p.isActive ? <UptoBadge tone="success">Active</UptoBadge> : <UptoBadge tone="default">Inactive</UptoBadge>}
                  </div>
                  {p.description && <p className={`mb-3 text-sm ${s.body} line-clamp-2`}>{p.description}</p>}
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`text-lg font-bold ${s.heading}`}>
  {currencySymbols[p.currency] || "$"}{" "}
  {p.unitPrice?.toLocaleString()}
</span>
                    {p.category && <UptoBadge tone="info"><Tag className="h-3 w-3" /> {p.category}</UptoBadge>}
                  </div>
                  <div className="flex items-center gap-1">
                    {isMember && <UptoButton variant="ghost" onClick={() => remove(p.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></UptoButton>}
                  </div>
                </UptoCard>
              ))}
            </div>
          )
        ) : (
          priceBooks.length === 0 ? (
            <UptoCard><UptoEmptyState icon={Layers} title="No price books yet" body="Create price books to manage different pricing tiers." /></UptoCard>
          ) : (
            <div className="space-y-3">
              {priceBooks.map((pb) => (
                <UptoCard key={pb.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${s.heading}`}>{pb.name}</h3>
                        {pb.isDefault && <UptoBadge tone="brand">Default</UptoBadge>}
                        {!pb.active && <UptoBadge tone="default">Inactive</UptoBadge>}
                      </div>
                      <p className={`text-xs ${s.muted}`}>{pb.currency} · {pb._count?.entries || 0} entries</p>
                    </div>
                  </div>
                </UptoCard>
              ))}
            </div>
          )
        )}
      </section>

      {showCreate && (
        <section>
          <UptoCard>
            <h3 className={`text-base font-semibold mb-4 ${s.heading}`}>New Product</h3>
            <form onSubmit={create} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <UptoInput label="Name *" value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} required />
                <UptoInput label="SKU *" value={draft.sku} onChange={(e) => setDraft((p) => ({ ...p, sku: e.target.value }))} required />
               <UptoInput
  label="Unit Price"
  type="number"
  min={0}
  step="0.01"
  value={draft.unitPrice}
  onChange={(e) => {
    const value = e.target.value;

    if (value === "") {
      setDraft((p) => ({ ...p, unitPrice: "" }));
      return;
    }

    const num = Number(value);

    if (num < 0) return;

    setDraft((p) => ({
      ...p,
      unitPrice: num,
    }));
  }}
/>

<UptoInput
  label="Cost"
  type="number"
  min={0}
  step="0.01"
  value={draft.cost}
  onChange={(e) => {
    const value = e.target.value;

    if (value === "") {
      setDraft((p) => ({ ...p, cost: "" }));
      return;
    }

    const num = Number(value);

    if (num < 0) return;

    setDraft((p) => ({
      ...p,
      cost: num,
    }));
  }}
/>


                <UptoInput label="Category" value={draft.category} onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))} placeholder="SaaS, Hardware, Service" />
                <UptoSelect label="Currency" value={draft.currency || "USD"} onChange={(e) =>  setDraft((p) => ({ ...p, currency: e.target.value }))}>
    <option value="USD">USD</option>
    <option value="INR">INR</option>
    <option value="EUR">EUR</option>
    <option value="GBP">GBP</option>
</UptoSelect>
              </div>
              <UptoTextarea label="Description" value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} />
              <div className="flex gap-2">
                <UptoButton type="submit">Create</UptoButton>
                <UptoButton type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</UptoButton>
              </div>
            </form>
          </UptoCard>
        </section>
      )}

      {showPB && (
        <section>
          <UptoCard>
            <h3 className={`text-base font-semibold mb-4 ${s.heading}`}>New Price Book</h3>
            <form onSubmit={createPB} className="space-y-3">
              <UptoInput label="Name *" value={pbDraft.name} onChange={(e) => setPBDraft((p) => ({ ...p, name: e.target.value }))} required placeholder="Standard, Enterprise, Partner" />
              <UptoInput label="Currency" value={pbDraft.currency} onChange={(e) => setPBDraft((p) => ({ ...p, currency: e.target.value }))} />
              <label className={`flex items-center gap-2 text-sm ${s.body}`}>
                <input type="checkbox" checked={pbDraft.isDefault} onChange={(e) => setPBDraft((p) => ({ ...p, isDefault: e.target.checked }))} className="rounded" /> Set as default
              </label>
              <div className="flex gap-2">
                <UptoButton type="submit">Create</UptoButton>
                <UptoButton type="button" variant="secondary" onClick={() => setShowPB(false)}>Cancel</UptoButton>
              </div>
            </form>
          </UptoCard>
        </section>
      )}
    </UptoPage>
  );
};

export default Products;
