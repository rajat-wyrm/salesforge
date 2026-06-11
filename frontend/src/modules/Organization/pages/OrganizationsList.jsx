import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Trash2, Edit2, X, AlertTriangle, Loader2, Mail, Globe, Building2, MapPin, Briefcase } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

// --- API SETUP ---
const API_BASE_URL = 'http://localhost:3000/api/organizations';

// --- BRAND COLORS (light) ---
const C = {
  primary:      '#00c6b6',
  primaryDark:  '#009999',
  primaryLight: '#1ae0d0',
};

// --- THEME TOKENS ---
const makeT = (dark) => ({
  pageBg:        dark ? '#0b1120'                         : '#ffffff',
  pageGrad:      dark
    ? 'radial-gradient(circle at 15% 20%, rgba(0,198,182,0.07), transparent 45%), radial-gradient(circle at 85% 80%, rgba(0,153,153,0.06), transparent 50%), #0b1120'
    : 'radial-gradient(circle at 15% 20%, rgba(0,198,182,0.06), transparent 45%), radial-gradient(circle at 85% 80%, rgba(0,153,153,0.05), transparent 50%), #f4fffe',
  containerBg:   dark ? 'rgba(17,27,48,0.96)'             : '#ffffff',
  containerBdr:  dark ? '1px solid rgba(0,198,182,0.15)'  : '1px solid #e0e0e0',
  cardBg:        dark ? 'rgba(22,34,60,0.95)'             : '#ffffff',
  cardBdr:       dark ? 'rgba(0,198,182,0.18)'            : 'rgba(0,198,182,0.20)',
  cardRowBg:     dark ? 'rgba(0,198,182,0.07)'            : 'rgba(0,198,182,0.08)',
  cardRowBdr:    dark ? 'rgba(0,198,182,0.14)'            : 'rgba(0,198,182,0.20)',
  heading:       dark ? '#e2f4f2'                         : '#333333',
  subtext:       dark ? '#64748b'                         : '#666666',
  rowLabel:      dark ? '#4a8a84'                         : '#666666',
  rowValue:      dark ? '#c8e8e5'                         : '#333333',
  inputBg:       dark ? '#131e32'                         : '#ffffff',
  inputColor:    dark ? '#e2e8f0'                         : '#333333',
  inputBdr:      dark ? 'rgba(255,255,255,0.10)'          : '#e0e0e0',
  modalBg:       dark ? 'rgba(17,27,48,0.98)'             : '#ffffff',
  modalBdr:      dark ? '1px solid rgba(0,198,182,0.18)'  : '1px solid #e0e0e0',
  backdropBg:    dark ? 'rgba(0,0,0,0.60)'                : 'rgba(255,255,255,0.40)',
  errorBg:       dark ? 'rgba(239,68,68,0.12)'            : '#fef2f2',
  errorBdr:      dark ? 'rgba(239,68,68,0.30)'            : '#fecaca',
  errorText:     dark ? '#fca5a5'                         : '#b91c1c',
  cancelBg:      dark ? 'rgba(255,255,255,0.06)'          : 'transparent',
  cancelBdr:     dark ? 'rgba(255,255,255,0.12)'          : '#e0e0e0',
  cancelColor:   dark ? '#c8d8f0'                         : '#333333',
  divider:       dark ? 'rgba(255,255,255,0.07)'          : '#e0e0e0',
  emptyChip:     dark ? 'rgba(0,198,182,0.12)'            : 'rgba(0,198,182,0.15)',
  searchBg:      dark ? '#131e32'                         : '#ffffff',
});

// --- ANIMATIONS ---
const styles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes scaleInCard {
    from { opacity: 0; transform: scale(0.9) translateY(20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes float {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-10px); }
  }
  @keyframes pulse-glow {
    0%,100% { box-shadow: 0 0 20px rgba(0,198,182,0.4); }
    50%     { box-shadow: 0 0 40px rgba(0,198,182,0.7); }
  }
  @keyframes shimmerOrg {
    0%   { left: -40%; opacity: 0.2; }
    15%  { opacity: 0.8; }
    55%  { opacity: 0.65; }
    100% { left: 110%; opacity: 0.15; }
  }
  .fade-in-up      { animation: fadeInUp 0.6s ease-out; }
  .slide-in-left   { animation: slideInLeft 0.6s ease-out; }
  .scale-in-card   { animation: scaleInCard 0.6s cubic-bezier(0.34,1.56,0.64,1); }
  .float-animation { animation: float 6s ease-in-out infinite; }
  .pulse-glow      { animation: pulse-glow 3s ease-in-out infinite; }
  .org-card {
    animation: scaleInCard 0.6s cubic-bezier(0.34,1.56,0.64,1);
    transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
    position: relative; overflow: hidden;
  }
  .org-card:hover {
    transform: translateY(-12px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0,198,182,0.22);
  }
`;

if (typeof document !== 'undefined') {
  const el = document.createElement('style');
  el.textContent = styles;
  document.head.appendChild(el);
}

// --- BACKDROP ---
const Backdrop = ({ onClick, dark }) => (
  <div
    onClick={onClick}
    style={{
      position: 'fixed', inset: 0, zIndex: 40,
      background: dark ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.40)',
      backdropFilter: 'blur(4px)',
      transition: 'opacity 300ms',
    }}
  />
);

// --- THEMED INPUT ---
const ThemedInput = ({ T, error, name, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      name={name}
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
      style={{
        width: '100%', padding: '10px 14px', fontSize: 15,
        borderRadius: 10, outline: 'none',
        background: T.inputBg, color: T.inputColor,
        border: `2px solid ${error ? '#ef4444' : focused ? C.primary : T.inputBdr}`,
        boxShadow: focused ? `0 0 0 3px ${error ? 'rgba(239,68,68,0.15)' : 'rgba(0,198,182,0.18)'}` : 'none',
        transition: 'all 200ms ease',
        boxSizing: 'border-box',
      }}
    />
  );
};

// --- FORM MODAL ---
const OrganizationFormModal = ({ isOpen, onClose, onSubmit, initialData, isLoading, T }) => {
  const isEditMode = !!initialData?._id;
  const [formData, setFormData]   = useState({ name:'', website:'', region:'', type:'', contactName:'' });
  const [errors, setErrors]       = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const urlRegex   = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData
        ? { name: initialData.name||'', website: initialData.website||'', region: initialData.region||'', type: initialData.type||'', contactName: initialData.contactName||'' }
        : { name:'', website:'', region:'', type:'', contactName:'' }
      );
      setErrors({});
    }
  }, [isOpen, initialData]);

  const validate = () => {
    const e = {};
    if (!formData.name.trim())        e.name        = 'Organization name is required';
    if (!formData.contactName.trim()) e.contactName = 'Contact email is required';
    else if (!emailRegex.test(formData.contactName.trim())) e.contactName = 'Please enter a valid email address';
    if (!formData.region.trim())      e.region      = 'Region is required';
    if (!formData.type.trim())        e.type        = 'Type is required';
    if (formData.website.trim() && !urlRegex.test(formData.website.trim())) e.website = 'Please enter a valid website URL';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    const w = formData.website.trim();
    const payload = {
      name: formData.name.trim(),
      website: w ? (w.startsWith('http') ? w : `https://${w}`) : '',
      region: formData.region.trim(),
      type:   formData.type.trim(),
      contactName: formData.contactName.trim(),
    };
    try {
      await onSubmit(initialData?._id || null, payload);
      onClose();
    } catch (err) {
      setErrors({ global: err.message || 'Failed to save organization' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const fields = [
    { key: 'name',        label: 'Organization Name', type: 'text',  placeholder: 'Enter organization name',   required: true },
    { key: 'website',     label: 'Website',            type: 'text',  placeholder: 'example.com',               required: false },
    { key: 'region',      label: 'Region',             type: 'text',  placeholder: 'e.g., North America, APAC', required: true },
    { key: 'type',        label: 'Type',               type: 'text',  placeholder: 'e.g., Active, Prospect',    required: true },
    { key: 'contactName', label: 'Contact Email',      type: 'email', placeholder: 'contact@example.com',       required: true },
  ];

  return (
    <>
      <Backdrop onClick={onClose} dark={T === makeT(true)} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, pointerEvents: 'none' }}>
        <div
          className="fade-in-up"
          style={{
            background: T.modalBg, border: T.modalBdr,
            borderTop: `4px solid ${C.primary}`,
            borderRadius: 20, width: '100%', maxWidth: 460,
            pointerEvents: 'auto', position: 'relative', overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.30)',
          }}
        >
          {/* Shimmer accent */}
          <div style={{ position: 'absolute', top: 0, left: '-40%', width: '40%', height: 4, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent)', animation: 'shimmerOrg 2.4s linear infinite' }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${T.divider}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 8, borderRadius: 10, background: `${C.primary}22` }}>
                <Building2 size={22} style={{ color: C.primary }} />
              </div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.heading }}>
                {isEditMode ? 'Edit Organization' : 'New Organization'}
              </h2>
            </div>
            <button onClick={onClose} disabled={isSubmitting} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: T.subtext, opacity: isSubmitting ? 0.5 : 1 }}>
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px' }}>
            {errors.global && (
              <div style={{ padding: '12px 16px', background: T.errorBg, border: `1px solid ${T.errorBdr}`, borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={16} style={{ color: T.errorText, flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.errorText }}>{errors.global}</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {fields.map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: T.heading }}>
                    {f.label}{f.required && ' *'}
                  </label>
                  <ThemedInput
                    T={T} error={errors[f.key]}
                    type={f.type} name={f.key}
                    placeholder={f.placeholder}
                    value={formData[f.key]}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  {errors[f.key] && <p style={{ margin: '4px 0 0', fontSize: 12, color: T.errorText }}>{errors[f.key]}</p>}
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12, color: T.subtext, margin: '14px 0 0' }}>Fields marked with * are required</p>

            <div style={{ display: 'flex', gap: 12, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.divider}` }}>
              <button
                type="button" onClick={onClose} disabled={isSubmitting}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
                  background: T.cancelBg, border: `2px solid ${T.cancelBdr}`, color: T.cancelColor,
                  opacity: isSubmitting ? 0.5 : 1, transition: 'all 200ms ease',
                }}
              >Cancel</button>
              <button
                type="submit" disabled={isSubmitting || isLoading}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px 0', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
                  background: `linear-gradient(90deg, ${C.primary}, ${C.primaryDark})`,
                  border: 'none', color: '#fff',
                  opacity: (isSubmitting || isLoading) ? 0.6 : 1,
                  boxShadow: '0 4px 14px rgba(0,198,182,0.30)',
                  transition: 'all 200ms ease',
                }}
              >
                {isSubmitting ? <><Loader2 size={16} className="animate-spin" />{isEditMode ? 'Saving...' : 'Adding...'}</> : (isEditMode ? 'Save Changes' : 'Add Organization')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

// --- CONFIRM DELETE MODAL ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, orgName, isLoading, T }) => {
  if (!isOpen) return null;
  return (
    <>
      <Backdrop onClick={onClose} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, pointerEvents: 'none' }}>
        <div
          className="fade-in-up"
          style={{
            background: T.modalBg, border: T.modalBdr,
            borderRadius: 20, width: '100%', maxWidth: 420,
            pointerEvents: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.30)',
          }}
        >
          <div style={{ padding: '36px 32px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: 16, borderRadius: '50%', background: T.errorBg, marginBottom: 20 }}>
              <AlertTriangle size={32} style={{ color: T.errorText }} />
            </div>
            <h3 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 800, color: T.heading }}>Delete Organization?</h3>
            <p style={{ margin: '0 0 28px', color: T.subtext, lineHeight: 1.6 }}>
              Are you sure you want to delete <strong style={{ color: T.heading }}>{orgName}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={onClose} disabled={isLoading}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
                  background: T.cancelBg, border: `2px solid ${T.cancelBdr}`, color: T.cancelColor,
                  opacity: isLoading ? 0.5 : 1, transition: 'all 200ms ease',
                }}
              >Cancel</button>
              <button
                onClick={onConfirm} disabled={isLoading}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 0', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
                  background: 'linear-gradient(90deg, #ef4444, #dc2626)',
                  border: 'none', color: '#fff',
                  opacity: isLoading ? 0.6 : 1,
                  boxShadow: '0 4px 14px rgba(239,68,68,0.30)',
                  transition: 'all 200ms ease',
                }}
              >
                {isLoading ? <><Loader2 size={16} className="animate-spin" />Deleting...</> : <><Trash2 size={16} />Delete</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// --- MAIN ---
const OrganizationsList = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const T = makeT(dark);

  const [organizations,    setOrganizations]    = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [globalError,      setGlobalError]      = useState(null);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [isFormModalOpen,  setIsFormModalOpen]  = useState(false);
  const [editingOrg,       setEditingOrg]       = useState(null);
  const [isConfirmOpen,    setIsConfirmOpen]    = useState(false);
  const [orgToDelete,      setOrgToDelete]      = useState(null);
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [searchFocused,    setSearchFocused]    = useState(false);

  const getHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')||''}`, 'Content-Type': 'application/json' });

  const fetchOrganizations = useCallback(async () => {
    setLoading(true); setGlobalError(null);
    try {
      const res = await fetch(API_BASE_URL, { headers: getHeaders() });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setOrganizations((data.data || []).map(o => ({
        ...o, _id: o.id || o._id,
        createdAt: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A',
      })));
    } catch (err) {
      setGlobalError('Failed to load organizations. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrganizations(); }, [fetchOrganizations]);

  const handleFormSubmit = async (orgId, payload) => {
    setIsSubmitting(true);
    const isEdit = !!orgId;
    try {
      const res = await fetch(isEdit ? `${API_BASE_URL}/${orgId}` : API_BASE_URL, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || `HTTP ${res.status}`); }
      await fetchOrganizations();
      setIsFormModalOpen(false); setEditingOrg(null);
    } catch (err) { throw err; }
    finally { setIsSubmitting(false); }
  };

  const handleConfirmDelete = async () => {
    if (!orgToDelete?._id) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/${orgToDelete._id}`, { method: 'DELETE', headers: getHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchOrganizations();
      setIsConfirmOpen(false); setOrgToDelete(null);
    } catch (err) {
      setGlobalError(`Failed to delete: ${err.message}`);
    } finally { setIsSubmitting(false); }
  };

  const filtered = organizations.filter(o =>
    o.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.contactName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: T.pageGrad, transition: 'background 300ms ease', position: 'relative', padding: '32px 16px 60px' }}>

      {/* Decorative blobs */}
      <div className="float-animation" style={{ position: 'absolute', top: 80, right: 40, width: 280, height: 280, borderRadius: '50%', background: `radial-gradient(circle, ${C.primary}, transparent 70%)`, opacity: dark ? 0.07 : 0.08, filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div className="float-animation" style={{ position: 'absolute', bottom: 80, left: 40, width: 360, height: 360, borderRadius: '50%', background: `radial-gradient(circle, ${C.primary}, transparent 70%)`, opacity: dark ? 0.06 : 0.07, filter: 'blur(80px)', animationDelay: '2s', pointerEvents: 'none' }} />

      {/* ── Theme toggle ─────────────────────────────────────────────────── */}
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="slide-in-left" style={{ maxWidth: 1200, margin: '0 auto 28px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="pulse-glow" style={{ padding: 12, borderRadius: 18, background: `${C.primary}22` }}>
            <Building2 size={32} style={{ color: C.primary }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: C.primary }}>Organizations</h1>
            <p style={{ margin: 0, fontSize: 16, color: T.subtext }}>Manage and organize all your business contacts</p>
          </div>
        </div>
      </div>

      {/* ── Main container ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div
          className="fade-in-up"
          style={{
            background: T.containerBg, border: T.containerBdr,
            borderTop: `4px solid ${C.primary}`,
            borderRadius: 24, padding: '28px 24px',
            boxShadow: dark ? '0 24px 64px rgba(0,0,0,0.40)' : '0 8px 32px rgba(0,198,182,0.10)',
            backdropFilter: 'blur(10px)',
            transition: 'background 300ms ease, border 300ms ease',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Shimmer accent */}
          <div style={{ position: 'absolute', top: 0, left: '-40%', width: '40%', height: 4, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent)', animation: 'shimmerOrg 2.4s linear infinite' }} />

          {/* Controls row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 28, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', minWidth: 200, flex: '1 1 220px', maxWidth: 300 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.primary }} />
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={{
                  width: '100%', paddingLeft: 44, paddingRight: 14, paddingTop: 11, paddingBottom: 11,
                  fontSize: 14, borderRadius: 12, outline: 'none',
                  background: T.searchBg, color: T.inputColor,
                  border: `2px solid ${searchFocused ? C.primary : T.inputBdr}`,
                  boxShadow: searchFocused ? '0 0 0 3px rgba(0,198,182,0.18)' : 'none',
                  transition: 'all 200ms ease', boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={() => { setEditingOrg(null); setIsFormModalOpen(true); }}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '11px 22px', borderRadius: 12, border: 'none',
                background: `linear-gradient(90deg, ${C.primary}, ${C.primaryDark})`,
                color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,198,182,0.30)',
                opacity: loading ? 0.7 : 1,
                transition: 'all 220ms ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <Plus size={18} /> Add Organization
            </button>
          </div>

          {/* Global error */}
          {globalError && (
            <div style={{ padding: '14px 18px', background: T.errorBg, border: `1px solid ${T.errorBdr}`, borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }} className="fade-in-up">
              <AlertTriangle size={18} style={{ color: T.errorText, flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: T.errorText }}>Connection Error</p>
                <p style={{ margin: 0, fontSize: 13, color: T.errorText, opacity: 0.85 }}>{globalError}</p>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Loader2 size={44} className="animate-spin" style={{ color: C.primary, margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontWeight: 700, fontSize: 16, color: C.primary }}>Loading organizations...</p>
            </div>

          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }} className="fade-in-up">
              <div className="float-animation" style={{ display: 'inline-block', padding: 24, borderRadius: 24, background: T.emptyChip, marginBottom: 20 }}>
                <Building2 size={44} style={{ color: C.primary }} />
              </div>
              <p style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: T.heading }}>No organizations found</p>
              <p style={{ color: T.subtext, marginBottom: 28 }}>
                {searchQuery ? 'Try a different search' : 'Create your first organization to get started'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => { setEditingOrg(null); setIsFormModalOpen(true); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '12px 28px', borderRadius: 12, border: 'none',
                    background: `linear-gradient(90deg, ${C.primary}, ${C.primaryDark})`,
                    color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,198,182,0.28)',
                  }}
                >
                  <Plus size={18} /> Create Organization
                </button>
              )}
            </div>

          ) : (
            // Cards grid
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 22 }}>
              {filtered.map((org, idx) => (
                <div
                  key={org._id}
                  className="org-card"
                  style={{ animationDelay: `${idx * 0.08}s`, background: T.cardBg, border: `2px solid ${T.cardBdr}`, borderRadius: 18 }}
                >
                  {/* Card header */}
                  <div style={{ padding: '18px 20px', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, color: '#fff', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Building2 size={18} />
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org.name}</h3>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.80 }}>Organization Details</p>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      org.type        && { icon: <Briefcase size={16} style={{ color: C.primary }} />, label: 'TYPE',    value: org.type },
                      org.region      && { icon: <MapPin    size={16} style={{ color: C.primary }} />, label: 'REGION',  value: org.region },
                      org.website     && { icon: <Globe     size={16} style={{ color: C.primary }} />, label: 'WEBSITE', value: org.website, href: org.website.startsWith('http') ? org.website : `https://${org.website}` },
                      org.contactName && { icon: <Mail      size={16} style={{ color: C.primary }} />, label: 'EMAIL',   value: org.contactName, href: `mailto:${org.contactName}` },
                    ].filter(Boolean).map((row, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: T.cardRowBg, border: `1px solid ${T.cardRowBdr}` }}>
                        {row.icon}
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: T.rowLabel, letterSpacing: 0.6 }}>{row.label}</p>
                          {row.href
                            ? <a href={row.href} target="_blank" rel="noopener noreferrer" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.primary, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{row.value}</a>
                            : <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.rowValue, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</p>
                          }
                        </div>
                      </div>
                    ))}

                    {org.createdAt && (
                      <div style={{ paddingTop: 10, borderTop: `1px solid ${T.cardRowBdr}`, marginTop: 2 }}>
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.rowLabel, letterSpacing: 0.5 }}>CREATED</p>
                        <p style={{ margin: '3px 0 0', fontSize: 12, color: T.subtext }}>{org.createdAt}</p>
                      </div>
                    )}
                  </div>

                  {/* Card actions */}
                  <div style={{ padding: '12px 20px 16px', display: 'flex', gap: 10, borderTop: `1px solid ${T.cardRowBdr}` }}>
                    <button
                      onClick={() => { setEditingOrg(org); setIsFormModalOpen(true); }}
                      disabled={isSubmitting}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '9px 0', borderRadius: 10, border: 'none',
                        background: `linear-gradient(90deg, ${C.primary}, ${C.primaryDark})`,
                        color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,198,182,0.22)',
                        opacity: isSubmitting ? 0.65 : 1, transition: 'all 200ms ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => { setOrgToDelete(org); setIsConfirmOpen(true); }}
                      disabled={isSubmitting}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '9px 0', borderRadius: 10, border: 'none',
                        background: 'linear-gradient(90deg, #ef4444, #dc2626)',
                        color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(239,68,68,0.22)',
                        opacity: isSubmitting ? 0.65 : 1, transition: 'all 200ms ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <OrganizationFormModal
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setEditingOrg(null); }}
        onSubmit={handleFormSubmit}
        initialData={editingOrg}
        isLoading={isSubmitting}
        T={T}
      />
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        orgName={orgToDelete?.name}
        isLoading={isSubmitting}
        T={T}
      />
    </div>
  );
};

export default OrganizationsList;
