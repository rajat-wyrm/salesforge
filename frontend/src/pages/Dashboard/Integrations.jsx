import React, { useEffect, useState } from "react";
import { integrationMarketplaceService } from "@/services";
import { useUptoStyles, UptoPage, UptoHero, UptoSectionHeading, UptoButton, UptoBadge, UptoSpinner, UptoError, UptoEmptyState, UptoCard } from "@/components/UI/UptoHooks";
import { Plug, Plus, RefreshCw, Trash2, MessageSquare, Mail, Calendar, Linkedin, Video, CreditCard, Briefcase, Workflow, Star, Settings, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const ICON_MAP = { MessageSquare, Mail, Calendar, Linkedin, Video, CreditCard, Briefcase, Workflow };

const Integrations = () => {
  const { isAdmin } = useAuth();
  const s = useUptoStyles();
  const { darkMode } = s;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [installing, setInstalling] = useState(null);
  const [configModal, setConfigModal] = useState({ open: false, provider: null, fields: [], data: {}, isEdit: false });

  const load = async () => {
    setLoading(true);
    try { setItems(await integrationMarketplaceService.list() || []); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
  }, []);

  const handleConnectClick = (provider) => {
    install(provider, {});
  };

  const handleEditClick = (provider, currentConfig) => {
    const meta = items.find((i) => i.id === provider);
    if (meta?.configFields && meta.configFields.length > 0) {
      setConfigModal({ open: true, provider, fields: meta.configFields, data: currentConfig || {}, isEdit: true });
    } else {
      toast.info("This integration has no configurable settings.");
    }
  };

  const install = async (provider, config, code = null) => {
    setInstalling(provider);
    try {
      // Find meta if available, else just use the provider name. Backend will use actual name if omitted.
      const meta = items.length > 0 ? items.find((i) => i.id === provider) : { name: provider.charAt(0).toUpperCase() + provider.slice(1) };
      await integrationMarketplaceService.install({ provider, name: meta?.name || provider, config, code });
      toast.success(`${meta?.name || provider} connected`);
      setConfigModal((p) => ({ ...p, open: false }));
      load();
    } catch (e) { toast.error(e.message); }
    finally { setInstalling(null); }
  };

  const updateConfig = async (provider, config) => {
    setInstalling(provider);
    try {
      await integrationMarketplaceService.update(provider, { config });
      toast.success("Configuration updated");
      setConfigModal((p) => ({ ...p, open: false }));
      load();
    } catch (e) { toast.error(e.message); }
    finally { setInstalling(null); }
  };

  const validateConfig = async () => {
    try {
      await integrationMarketplaceService.validate(configModal.provider, { config: configModal.data });
      toast.success("Configuration is valid!");
    } catch (e) { toast.error(e.message); }
  };
  const sync = async (id) => {
    try { await integrationMarketplaceService.sync(id); toast.success("Sync started"); load(); }
    catch (e) { toast.error(e.message); }
  };
  const uninstall = async (id) => {
    if (!confirm("Disconnect this integration?")) return;
    try { await integrationMarketplaceService.uninstall(id); toast.success("Disconnected"); load(); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <UptoPage>
      <UptoHero title="Integrations" subtitle="Connect Fintrix to your favorite tools." darkMode={darkMode} />

      {loading ? <UptoSpinner /> : (
        <>
          {configModal.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <UptoCard className="w-full max-w-md">
                <UptoSectionHeading label={`${configModal.isEdit ? 'Edit' : 'Connect'} Integration`} darkMode={darkMode} />
                <div className="space-y-4">
                  {configModal.fields.map(f => (
                    <UptoInput 
                      key={f.key} 
                      label={f.label} 
                      type={f.type || 'text'} 
                      value={configModal.data[f.key] || ''} 
                      onChange={(e) => setConfigModal(p => ({...p, data: {...p.data, [f.key]: e.target.value}}))} 
                    />
                  ))}
                  <div className="flex justify-end gap-2 pt-4">
                    <UptoButton variant="secondary" onClick={() => setConfigModal(p => ({...p, open: false}))}>Cancel</UptoButton>
                    <UptoButton variant="secondary" onClick={validateConfig}><CheckCircle2 className="h-4 w-4 mr-1" /> Validate</UptoButton>
                    <UptoButton onClick={() => configModal.isEdit ? updateConfig(configModal.provider, configModal.data) : install(configModal.provider, configModal.data)}>
                      {configModal.isEdit ? 'Save' : 'Connect'}
                    </UptoButton>
                  </div>
                </div>
              </UptoCard>
            </div>
          )}
          <section>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <UptoCard><p className={`text-xs uppercase ${s.subtext}`}>Connected</p><p className={`mt-1 text-2xl font-bold ${s.heading}`}>{items.filter((i) => i.installed).length}</p></UptoCard>
              <UptoCard><p className={`text-xs uppercase ${s.subtext}`}>Available</p><p className={`mt-1 text-2xl font-bold ${s.heading}`}>{items.length}</p></UptoCard>
              <UptoCard><p className={`text-xs uppercase ${s.subtext}`}>Popular</p><p className={`mt-1 text-2xl font-bold ${s.heading}`}>{items.filter((i) => i.popular).length}</p></UptoCard>
              <UptoCard><p className={`text-xs uppercase ${s.subtext}`}>Categories</p><p className={`mt-1 text-2xl font-bold ${s.heading}`}>{[...new Set(items.map((i) => i.category))].length}</p></UptoCard>
            </div>
          </section>

          <section>
            <UptoSectionHeading label="Available Integrations" darkMode={darkMode} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((i) => {
                const Icon = ICON_MAP[i.icon] || Plug;
                return (
                  <UptoCard key={i.id}>
                    <div className="mb-3 flex items-start gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${darkMode ? "bg-teal-900/30 text-teal-400" : "bg-teal-50 text-teal-600"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold ${s.heading}`}>{i.name}</h3>
                          {i.popular && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                        </div>
                        <p className={`text-xs ${s.muted}`}>{i.category}</p>
                      </div>
                    </div>
                    <p className={`mb-4 text-sm ${s.body}`}>{i.description}</p>
                    {i.installed ? (
                      <div className="flex items-center gap-2">
                        <UptoBadge tone="success">Connected</UptoBadge>
                        {i.lastSyncAt && <span className={`text-xs ${s.muted}`}>last sync {new Date(i.lastSyncAt).toLocaleDateString()}</span>}
                        <div className="ml-auto flex items-center gap-1">
                          {isAdmin && <UptoButton variant="ghost" onClick={() => sync(i.id)} title="Sync now"><RefreshCw className="h-4 w-4" /></UptoButton>}
                          {isAdmin && <UptoButton variant="ghost" onClick={() => uninstall(i.id)} className="text-red-500" title="Disconnect"><Trash2 className="h-4 w-4" /></UptoButton>}
                        </div>
                      </div>
                    ) : (
                      isAdmin && (
                        <UptoButton variant="secondary" onClick={() => handleConnectClick(i.id)} disabled={installing === i.id} className="w-full">
                          {installing === i.id ? "Connecting..." : <><Plus className="h-4 w-4" /> Connect</>}
                        </UptoButton>
                      )
                    )}
                  </UptoCard>
                );
              })}
            </div>
          </section>
        </>
      )}
    </UptoPage>
  );
};

export default Integrations;
