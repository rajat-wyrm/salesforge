import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTheme } from "../../../context/ThemeContext";

// ---------------------------------------------------------------------------
// Mock data (dev-only) — open with ?mock=1 to bypass backend
// ---------------------------------------------------------------------------
const MOCK_LEADS = [
  { id: 1, name: "ACME Corp", jobTitle: "Sales Manager", location: "Bangalore", industry: "Tech", skills: "sales,crm", size: "100-200", revenue: "1Cr-5Cr", specialties: ["SaaS", "CRM"], companyTitle: "ACME Corp", founded: { day: 1, month: "Jan", year: 2000 } },
  { id: 2, name: "Beta Ltd", jobTitle: "Marketing Lead", location: "Mumbai", industry: "Retail", skills: "marketing,seo", size: "50-100", revenue: "20L-50L", specialties: ["Marketing"], companyTitle: "Beta Ltd", founded: { day: 10, month: "Feb", year: 2010 } },
];

// ---------------------------------------------------------------------------
// Inject mock into leadsService when ?mock=1 is in the URL
// ---------------------------------------------------------------------------
// (Keep your actual import below; the mock override patches it at runtime.)
// import leadsService from "../../../modules/LeadManagement/services/leads";
// import AnimationVideo from "../../../assets/Animation.mp4";

const leadsService = {
  getLeads: async (search, filters = {}) => {
    const q = (search || "").toLowerCase();
    let results = MOCK_LEADS;
    if (q) results = results.filter(l => (l.name + " " + l.jobTitle + " " + (l.skills || "")).toLowerCase().includes(q));
    if (filters.industry) results = results.filter(l => l.industry === filters.industry);
    if (filters.location) results = results.filter(l => l.location === filters.location);
    if (filters.companySize) results = results.filter(l => l.size === filters.companySize);
    if (filters.revenue) results = results.filter(l => l.revenue === filters.revenue);
    return { leads: results };
  },
  updateLead: async (id, data) => ({ id, ...data }),
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SIZE_OPTIONS = ["1-10", "10-50", "50-100", "100-200", "200-500", "500-1000"];
const REVENUE_OPTIONS = ["0-20L", "20L-50L", "50L-1Cr", "1Cr-5Cr", "5Cr-10Cr"];

const INDUSTRY_COLORS = {
  Tech: { bg: "#ede9fe", color: "#5b21b6" },
  Retail: { bg: "#fef9c3", color: "#713f12" },
  Finance: { bg: "#dcfce7", color: "#166534" },
  Healthcare: { bg: "#fee2e2", color: "#991b1b" },
};

const INDUSTRY_COLORS_DARK = {
  Tech: { bg: "#312e81", color: "#c4b5fd" },
  Retail: { bg: "#713f12", color: "#fde68a" },
  Finance: { bg: "#14532d", color: "#86efac" },
  Healthcare: { bg: "#7f1d1d", color: "#fca5a5" },
};

const defaultBadge = { bg: "#f1f5f9", color: "#475569" };
const defaultBadgeDark = { bg: "#1e293b", color: "#cbd5e1" };

// ---------------------------------------------------------------------------
// FieldRow — lives OUTSIDE DatabaseSearch so it never re-mounts on parent render
// ---------------------------------------------------------------------------
const FieldRow = ({ icon, label, hint, children, darkMode }) => {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  const child = React.isValidElement(children) ? children : null;
  const childValue = child?.props?.value;
  const hasValue = childValue !== undefined && childValue !== null && String(childValue).length > 0;

  const cloned = child
    ? React.cloneElement(child, {
        onFocus: (e) => { setFocused(true); child.props.onFocus?.(e); },
        onBlur: (e) => { setFocused(false); child.props.onBlur?.(e); },
        style: {
          ...child.props.style,
          ...(hovered ? S.inputHover : {}),
          ...(darkMode ? S.fieldInputDark : {}),
        },
      })
    : children;

  return (
    <div
      style={{
        ...S.fieldRow,
        ...(darkMode ? S.fieldRowDark : {}),
        ...(hovered ? (darkMode ? S.fieldRowHoverDark : S.fieldRowHover) : {}),
        ...(focused ? (darkMode ? S.fieldRowFocusedDark : S.fieldRowFocused) : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          ...S.iconBox,
          ...(darkMode ? S.iconBoxDark : {}),
          ...((hovered || focused) ? (darkMode ? S.iconBoxActiveDark : S.iconBoxActive) : {}),
        }}
        aria-hidden
      >
        {icon}
      </div>
      <div style={S.fieldBody}>
        {(focused || hasValue) && label && (
          <div style={{ ...S.floatingLabel, ...(darkMode ? S.floatingLabelDark : {}) }}>{label}</div>
        )}
        {!focused && !hasValue && (
          <div style={S.placeholder}>
            <span style={{ ...S.placeholderLabel, ...(darkMode ? S.placeholderLabelDark : {}) }}>{label}</span>
            {hint && <span style={{ ...S.placeholderHint, ...(darkMode ? S.placeholderHintDark : {}) }}> — {hint}</span>}
          </div>
        )}
        <div>{cloned}</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Icon components (inline SVG — no extra deps)
// ---------------------------------------------------------------------------
const Icon = ({ d, size = 16, stroke = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  briefcase: "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2ZM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2",
  pin: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z",
  factory: "M2 20V10l6-4v4l6-4v4l6-4v14H2Z",
  zap: "m13 2-3 14h2l-3 6M3 10h8M5 6h5",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  dollar: "M12 2v20M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z",
  building: "M3 21h18M9 21V7l7-4v18M3 11h6",
  calendar: "M8 2v4M16 2v4M3 10h18M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z",
  search: "m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z",
  x: "M18 6 6 18M6 6l12 12",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const DatabaseSearch = () => {
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  // Filter state
  const [tab, setTab] = useState("prospect");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");
  const [skills, setSkills] = useState("");
  const [size, setSize] = useState("");
  const [revenue, setRevenue] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [companyTitle, setCompanyTitle] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [foundedDay, setFoundedDay] = useState("");
  const [foundedMonth, setFoundedMonth] = useState("");
  const [foundedYear, setFoundedYear] = useState("");

  // UI state
  const [searchClicked, setSearchClicked] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingJobTitleId, setEditingJobTitleId] = useState(null);
  const [editingJobTitleValue, setEditingJobTitleValue] = useState("");
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [quickSearch, setQuickSearch] = useState("");

  const debounceRef = useRef(null);

  useEffect(() => {
    if (!searchClicked) return;

    const fetchLeads = async () => {
      setLoading(true);
      try {
        const filters = {};
        if (industry) filters.industry = industry;
        if (location) filters.location = location;
        if (size) filters.companySize = size;
        if (revenue) filters.revenue = revenue;

        const searchParam = quickSearch || jobTitle || "";
        const response = await leadsService.getLeads(searchParam, filters);
        setCompanies(response?.leads ?? []);
      } catch (err) {
        console.error("Failed to fetch leads:", err);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [searchClicked]);

  const filteredCompanies = useMemo(() => {
    if (tab !== "prospect") return companies;
    return companies.filter((c) => {
      if (jobTitle && !c.jobTitle?.toLowerCase().includes(jobTitle.toLowerCase())) return false;
      if (skills) {
        const want = skills.toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
        const has = (c.skills || "").toLowerCase().split(",").map(s => s.trim());
        if (!want.every(s => has.includes(s))) return false;
      }
      if (specialties && !(c.specialties || []).join(" ").toLowerCase().includes(specialties.toLowerCase())) return false;
      return true;
    });
  }, [companies, jobTitle, skills, specialties, tab]);

  const handleSearch = useCallback((e) => {
    e?.preventDefault();
    setSearchClicked(prev => {
      if (prev) {
        setCompanies([]);
        setTimeout(() => setSearchClicked(true), 0);
        return false;
      }
      return true;
    });
  }, []);

  const handleReset = useCallback(() => {
    setJobTitle(""); setLocation(""); setIndustry(""); setSkills("");
    setSize(""); setRevenue(""); setSpecialties(""); setCompanyTitle("");
    setCompanyLocation(""); setFoundedDay(""); setFoundedMonth(""); setFoundedYear("");
    setQuickSearch(""); setSearchClicked(false); setCompanies([]);
  }, []);

  const startEditingJobTitle = useCallback((id, current) => {
    setEditingJobTitleId(id);
    setEditingJobTitleValue(current || "");
  }, []);

  const cancelJobTitleEdit = useCallback(() => {
    setEditingJobTitleId(null);
    setEditingJobTitleValue("");
  }, []);

  const saveJobTitleEdit = useCallback(async (id) => {
    const trimmed = editingJobTitleValue.trim();
    if (!trimmed) { cancelJobTitleEdit(); return; }
    try {
      await leadsService.updateLead(id, { jobTitle: trimmed });
      setCompanies(prev => prev.map(p => p.id === id ? { ...p, jobTitle: trimmed } : p));
    } catch (err) {
      console.error("Failed to update jobTitle:", err);
    } finally {
      setEditingJobTitleId(null);
      setEditingJobTitleValue("");
    }
  }, [editingJobTitleValue, cancelJobTitleEdit]);

  const applyPresetFilters = useCallback(() => {
    setLocation("Bangalore");
    setJobTitle("Sales Manager");
    setSize("100-200");
    setSearchClicked(true);
  }, []);

  const handleQuickSearch = useCallback((val) => {
    setQuickSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val) setSearchClicked(true);
    }, 350);
  }, []);

  const inputStyle = {
    ...S.fieldInput,
    ...(darkMode ? S.fieldInputDark : {}),
  };

  const foundedInputStyle = {
    ...S.foundedInput,
    ...(darkMode ? S.foundedInputDark : {}),
  };

  const foundedSelectStyle = {
    ...S.foundedSelect,
    ...(darkMode ? S.foundedSelectDark : {}),
  };

  const ProspectFilters = (
    <>
      <FieldRow icon={<Icon d={ICONS.briefcase} />} label="Job title" hint="one or more titles" darkMode={darkMode}>
        <input style={inputStyle} placeholder="" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
      </FieldRow>
      <FieldRow icon={<Icon d={ICONS.pin} />} label="Location" hint="city or region" darkMode={darkMode}>
        <input style={inputStyle} placeholder="" value={location} onChange={e => setLocation(e.target.value)} />
      </FieldRow>
      <FieldRow icon={<Icon d={ICONS.factory} />} label="Industry" hint="sector" darkMode={darkMode}>
        <input style={inputStyle} placeholder="" value={industry} onChange={e => setIndustry(e.target.value)} />
      </FieldRow>
      <FieldRow icon={<Icon d={ICONS.zap} />} label="Skills" hint="comma-separated" darkMode={darkMode}>
        <input style={inputStyle} placeholder="" value={skills} onChange={e => setSkills(e.target.value)} />
      </FieldRow>
      <FieldRow icon={<Icon d={ICONS.users} />} label="Company size" hint="employees" darkMode={darkMode}>
        <select style={{ ...inputStyle, ...(darkMode ? S.selectDark : {}) }} value={size} onChange={e => setSize(e.target.value)}>
          <option value="" style={darkMode ? S.selectOptionDark : {}}>Any size</option>
          {SIZE_OPTIONS.map(o => (
            <option key={o} value={o} style={darkMode ? S.selectOptionDark : {}}>
              {o}
            </option>
          ))}
        </select>
      </FieldRow>
      <FieldRow icon={<Icon d={ICONS.dollar} />} label="Revenue" hint="range" darkMode={darkMode}>
        <select style={{ ...inputStyle, ...(darkMode ? S.selectDark : {}) }} value={revenue} onChange={e => setRevenue(e.target.value)}>
          <option value="" style={darkMode ? S.selectOptionDark : {}}>Any revenue</option>
          {REVENUE_OPTIONS.map(o => (
            <option key={o} value={o} style={darkMode ? S.selectOptionDark : {}}>
              {o}
            </option>
          ))}
        </select>
      </FieldRow>
      <FieldRow icon={<Icon d={ICONS.star} />} label="Specialties" hint="keywords" darkMode={darkMode}>
        <input style={inputStyle} placeholder="" value={specialties} onChange={e => setSpecialties(e.target.value)} />
      </FieldRow>
    </>
  );

  const CompanyFilters = (
    <>
      <FieldRow icon={<Icon d={ICONS.building} />} label="Company name" hint="title" darkMode={darkMode}>
        <input style={inputStyle} placeholder="" value={companyTitle} onChange={e => setCompanyTitle(e.target.value)} />
      </FieldRow>
      <FieldRow icon={<Icon d={ICONS.pin} />} label="Location" hint="city or region" darkMode={darkMode}>
        <input style={inputStyle} placeholder="" value={companyLocation} onChange={e => setCompanyLocation(e.target.value)} />
      </FieldRow>
      <FieldRow icon={<Icon d={ICONS.factory} />} label="Industry" hint="sector" darkMode={darkMode}>
        <input style={inputStyle} placeholder="" value={industry} onChange={e => setIndustry(e.target.value)} />
      </FieldRow>
      <FieldRow icon={<Icon d={ICONS.users} />} label="Company size" hint="employees" darkMode={darkMode}>
        <select
    style={{ ...inputStyle, ...(darkMode ? S.selectDark : {}) }}
    value={size}
    onChange={e => setSize(e.target.value)}
  >
    <option value="" style={darkMode ? S.selectOptionDark : {}}>Any size</option>
    {SIZE_OPTIONS.map(o => (
      <option key={o} value={o} style={darkMode ? S.selectOptionDark : {}}>
        {o}
      </option>
    ))}
  </select>
      </FieldRow>
      <FieldRow icon={<Icon d={ICONS.dollar} />} label="Revenue" hint="range" darkMode={darkMode}>
       <select
    style={{ ...inputStyle, ...(darkMode ? S.selectDark : {}) }}
    value={revenue}
    onChange={e => setRevenue(e.target.value)}
  >
    <option value="" style={darkMode ? S.selectOptionDark : {}}>Any revenue</option>
    {REVENUE_OPTIONS.map(o => (
      <option key={o} value={o} style={darkMode ? S.selectOptionDark : {}}>
        {o}
      </option>
    ))}
  </select>
      </FieldRow>
      <FieldRow icon={<Icon d={ICONS.star} />} label="Specialties" hint="keywords" darkMode={darkMode}>
        <input style={inputStyle} placeholder="" value={specialties} onChange={e => setSpecialties(e.target.value)} />
      </FieldRow>
      <FieldRow icon={<Icon d={ICONS.calendar} />} label="Founded" hint="DD · Mon · YYYY" darkMode={darkMode}>
        <div style={S.foundedRow}>
          <input type="number" min={1} max={31} value={foundedDay} onChange={e => setFoundedDay(e.target.value)} style={foundedInputStyle} placeholder="DD" />
          <select value={foundedMonth} onChange={e => setFoundedMonth(e.target.value)} style={foundedSelectStyle}>
            <option value="">Mon</option>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="number" min={1900} max={2100} value={foundedYear} onChange={e => setFoundedYear(e.target.value)} style={{ ...foundedInputStyle, width: 72 }} placeholder="YYYY" />
        </div>
      </FieldRow>
    </>
  );

  const ProspectTable = (
    <table style={S.table}>
      <thead>
        <tr>
          {["Company", "Job title", "Location", "Industry", "Skills", "Size", "Revenue"].map(h => (
            <th key={h} style={{ ...S.th, ...(darkMode ? S.thDark : {}) }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filteredCompanies.map(c => (
          <tr
            key={c.id}
            style={hoveredRowId === c.id ? { ...S.trHover, ...(darkMode ? S.trHoverDark : {}) } : { ...S.tr, ...(darkMode ? S.trDark : {}) }}
            onMouseEnter={() => setHoveredRowId(c.id)}
            onMouseLeave={() => setHoveredRowId(null)}
          >
            <td style={{ ...S.td, ...(darkMode ? S.tdDark : {}) }}>
              <span style={{ ...S.companyName, ...(darkMode ? S.companyNameDark : {}) }}>{c.name}</span>
            </td>
            <td style={{ ...S.td, ...(darkMode ? S.tdDark : {}) }}>
              {editingJobTitleId === c.id ? (
                <div style={{ ...S.inlineEditWrap, ...(darkMode ? S.inlineEditWrapDark : {}) }}>
                  <input
                    autoFocus
                    style={{ ...S.inlineInput, ...(darkMode ? S.inlineInputDark : {}) }}
                    value={editingJobTitleValue}
                    onChange={e => setEditingJobTitleValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") { e.preventDefault(); saveJobTitleEdit(c.id); }
                      if (e.key === "Escape") { e.preventDefault(); cancelJobTitleEdit(); }
                    }}
                  />
                  <button style={S.inlineSave} onClick={() => saveJobTitleEdit(c.id)}>✓</button>
                  <button style={S.inlineCancel} onClick={cancelJobTitleEdit}>✕</button>
                </div>
              ) : (
                <span
                  style={{
                    ...S.editableCell,
                    ...(hoveredRowId === c.id ? (darkMode ? S.editableCellHoverDark : S.editableCellHover) : {}),
                    ...(darkMode ? S.editableCellDark : {}),
                  }}
                  onClick={() => startEditingJobTitle(c.id, c.jobTitle)}
                  title="Click to edit"
                >
                  {c.jobTitle}
                  {hoveredRowId === c.id && (
                    <span style={{ ...S.editIcon, ...(darkMode ? S.editIconDark : {}) }}>
                      <Icon d={ICONS.edit} size={12} />
                    </span>
                  )}
                </span>
              )}
            </td>
            <td style={{ ...S.td, ...(darkMode ? S.tdDark : {}) }}>{c.location}</td>
            <td style={{ ...S.td, ...(darkMode ? S.tdDark : {}) }}>
              <span
                style={{
                  ...S.badge,
                  background: (darkMode
                    ? (INDUSTRY_COLORS_DARK[c.industry] || defaultBadgeDark).bg
                    : (INDUSTRY_COLORS[c.industry] || defaultBadge).bg),
                  color: (darkMode
                    ? (INDUSTRY_COLORS_DARK[c.industry] || defaultBadgeDark).color
                    : (INDUSTRY_COLORS[c.industry] || defaultBadge).color),
                }}
              >
                {c.industry}
              </span>
            </td>
            <td style={{ ...S.td, ...(darkMode ? S.tdDark : {}) }}>
              <div style={S.tagRow}>
                {(c.skills || "").split(",").map(s => s.trim()).filter(Boolean).map(s => (
                  <span key={s} style={{ ...S.tag, ...(darkMode ? S.tagDark : {}) }}>{s}</span>
                ))}
              </div>
            </td>
            <td style={{ ...S.td, ...(darkMode ? S.tdDark : {}) }}>{c.size}</td>
            <td style={{ ...S.td, ...(darkMode ? S.tdDark : {}) }}>{c.revenue}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const CompaniesTable = (
    <table style={S.table}>
      <thead>
        <tr>
          {["Company", "Title", "Location", "Founded", "Industry", "Specialties", "Revenue"].map(h => (
            <th key={h} style={{ ...S.th, ...(darkMode ? S.thDark : {}) }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filteredCompanies.map(c => (
          <tr
            key={c.id}
            style={hoveredRowId === c.id ? { ...S.trHover, ...(darkMode ? S.trHoverDark : {}) } : { ...S.tr, ...(darkMode ? S.trDark : {}) }}
            onMouseEnter={() => setHoveredRowId(c.id)}
            onMouseLeave={() => setHoveredRowId(null)}
          >
            <td style={{ ...S.td, ...(darkMode ? S.tdDark : {}) }}>
              <span style={{ ...S.companyName, ...(darkMode ? S.companyNameDark : {}) }}>{c.name}</span>
            </td>
            <td style={{ ...S.td, ...(darkMode ? S.tdDark : {}) }}>{c.companyTitle}</td>
            <td style={{ ...S.td, ...(darkMode ? S.tdDark : {}) }}>{c.location}</td>
            <td style={{ ...S.td, ...(darkMode ? S.tdDark : {}) }}>
              <span style={{ ...S.foundedText, ...(darkMode ? S.foundedTextDark : {}) }}>
                {c.founded ? `${c.founded.day} ${c.founded.month} ${c.founded.year}` : "—"}
              </span>
            </td>
            <td style={{ ...S.td, ...(darkMode ? S.tdDark : {}) }}>
              <span
                style={{
                  ...S.badge,
                  background: (darkMode
                    ? (INDUSTRY_COLORS_DARK[c.industry] || defaultBadgeDark).bg
                    : (INDUSTRY_COLORS[c.industry] || defaultBadge).bg),
                  color: (darkMode
                    ? (INDUSTRY_COLORS_DARK[c.industry] || defaultBadgeDark).color
                    : (INDUSTRY_COLORS[c.industry] || defaultBadge).color),
                }}
              >
                {c.industry}
              </span>
            </td>
            <td style={{ ...S.td, ...(darkMode ? S.tdDark : {}) }}>
              <div style={S.tagRow}>
                {(c.specialties || []).map(s => (
                  <span key={s} style={{ ...S.tag, ...(darkMode ? S.tagDark : {}) }}>{s}</span>
                ))}
              </div>
            </td>
            <td style={{ ...S.td, ...(darkMode ? S.tdDark : {}) }}>{c.revenue}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div style={{ ...S.page, ...(darkMode ? S.pageDark : {}) }}>
      <header style={{ ...S.topbar, ...(darkMode ? S.topbarDark : {}) }}>
        <div style={S.topbarLogo}>
          <div style={{ ...S.logoMark, ...(darkMode ? S.logoMarkDark : {}) }}>L</div>
          <span>LeadBase</span>
        </div>

        <div style={S.topbarSearch}>
          <span style={S.searchIcon}>
            <Icon d={ICONS.search} size={14} stroke={darkMode ? "#94a3b8" : "#94a3b8"} />
          </span>
          <input
            style={{ ...S.topbarInput, ...(darkMode ? S.topbarInputDark : {}) }}
            placeholder="Quick search leads…"
            value={quickSearch}
            onChange={e => handleQuickSearch(e.target.value)}
          />
          {quickSearch && (
            <button style={S.clearBtn} onClick={() => { setQuickSearch(""); setSearchClicked(false); }}>
              <Icon d={ICONS.x} size={12} stroke={darkMode ? "#94a3b8" : "#94a3b8"} />
            </button>
          )}
        </div>

        <div style={S.topbarActions}>
          <button style={{ ...S.topbarBtn, ...(darkMode ? S.topbarBtnDark : {}) }}>
            <Icon d={ICONS.upload} size={14} />
            <span>Import</span>
          </button>
          <button style={{ ...S.topbarBtn, ...(darkMode ? S.topbarBtnDark : {}) }}>
            <Icon d={ICONS.download} size={14} />
            <span>Export</span>
          </button>
        </div>
      </header>

      <div style={S.layout}>
        <aside style={S.sidebar}>
          <div style={{ ...S.tabWrap, ...(darkMode ? S.tabWrapDark : {}) }}>
            <button
              style={{
                ...S.tabBtn,
                ...(darkMode ? S.tabBtnDark : {}),
                ...(tab === "prospect" ? (darkMode ? S.tabBtnActiveDark : S.tabBtnActive) : {})
              }}
              onClick={() => { setTab("prospect"); setSearchClicked(false); setCompanies([]); }}
            >
              Prospect
            </button>
            <button
              style={{
                ...S.tabBtn,
                ...(darkMode ? S.tabBtnDark : {}),
                ...(tab === "companies" ? (darkMode ? S.tabBtnActiveDark : S.tabBtnActive) : {})
              }}
              onClick={() => { setTab("companies"); setSearchClicked(false); setCompanies([]); }}
            >
              Companies
            </button>
          </div>

          <form style={{ ...S.filterCard, ...(darkMode ? S.filterCardDark : {}) }} onSubmit={handleSearch}>
            <div style={S.filterHead}>
              <span style={{ ...S.filterTitle, ...(darkMode ? S.filterTitleDark : {}) }}>Search filters</span>
              <button type="button" style={{ ...S.clearAllBtn, ...(darkMode ? S.clearAllBtnDark : {}) }} onClick={handleReset}>
                Clear all
              </button>
            </div>

            {tab === "prospect" ? ProspectFilters : CompanyFilters}

            <div style={S.btnRow}>
              <button type="submit" style={S.btnPrimary}>Search</button>
              <button type="button" style={{ ...S.btnSecondary, ...(darkMode ? S.btnSecondaryDark : {}) }} onClick={handleReset}>
                Reset
              </button>
            </div>
          </form>
        </aside>

        <main style={S.content}>
          {!searchClicked ? (
            <div style={{ ...S.emptyCard, ...(darkMode ? S.emptyCardDark : {}) }}>
              <div style={{ ...S.emptyIconWrap, ...(darkMode ? S.emptyIconWrapDark : {}) }}>
                <Icon d={ICONS.search} size={32} stroke={darkMode ? "#22d3ee" : "#0891b2"} />
              </div>
              <h2 style={{ ...S.emptyTitle, ...(darkMode ? S.emptyTitleDark : {}) }}>Find your next lead</h2>
              <p style={{ ...S.emptySub, ...(darkMode ? S.emptySubDark : {}) }}>
                Apply filters on the left to search prospects and companies from your database.
              </p>

              <div style={S.suggestWrap}>
                <p style={{ ...S.suggestLabel, ...(darkMode ? S.suggestLabelDark : {}) }}>Try a quick start:</p>
                <div style={S.chips}>
                  {[
                    { label: "Location", value: "Bangalore" },
                    { label: "Job title", value: "Sales Manager" },
                    { label: "Size", value: "100–200" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ ...S.chip, ...(darkMode ? S.chipDark : {}) }}>
                      <span style={{ ...S.chipLabel, ...(darkMode ? S.chipLabelDark : {}) }}>{label}</span>
                      <span style={{ ...S.chipValue, ...(darkMode ? S.chipValueDark : {}) }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button style={S.applyBtn} onClick={applyPresetFilters} type="button">
                Apply suggested filters
              </button>
            </div>
          ) : loading ? (
            <div style={{ ...S.loadingCard, ...(darkMode ? S.loadingCardDark : {}) }}>
              <div style={{ ...S.spinner, ...(darkMode ? S.spinnerDark : {}) }} />
              <span style={{ color: darkMode ? "#94a3b8" : "#64748b", fontSize: 13 }}>Searching leads…</span>
            </div>
          ) : (
            <>
              <div style={{ ...S.resultsHeader, ...(darkMode ? S.resultsHeaderDark : {}) }}>
                <div>
                  <span style={S.resultsCount}>{filteredCompanies.length}</span>
                  <span style={{ ...S.resultsLabel, ...(darkMode ? S.resultsLabelDark : {}) }}>
                    {" "}result{filteredCompanies.length !== 1 ? "s" : ""} found
                  </span>
                </div>
                <span style={{ ...S.resultsTab, ...(darkMode ? S.resultsTabDark : {}) }}>
                  {tab === "prospect" ? "Prospect view" : "Companies view"}
                </span>
              </div>

              {filteredCompanies.length === 0 ? (
                <div style={{ ...S.noResults, ...(darkMode ? S.noResultsDark : {}) }}>
                  <p style={{ margin: 0, fontWeight: 500 }}>No results matched your filters.</p>
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: darkMode ? "#94a3b8" : "#94a3b8" }}>
                    Try broadening your search or resetting the filters.
                  </p>
                </div>
              ) : (
                <div style={{ ...S.tableWrap, ...(darkMode ? S.tableWrapDark : {}) }}>
                  {tab === "prospect" ? ProspectTable : CompaniesTable}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const S = {
  page: {
    fontFamily: "'DM Sans', system-ui, sans-serif",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    color: "#0f172a",
    transition: "background-color 180ms ease, color 180ms ease",
  },
  pageDark: {
    backgroundColor: "#020617",
    color: "#e2e8f0",
  },

  topbar: {
    height: 60,
    backgroundColor: "#0891b2",
    display: "flex",
    alignItems: "center",
    padding: "0 24px",
    gap: 16,
    position: "sticky",
    top: 0,
    zIndex: 10,
    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
    transition: "background-color 180ms ease",
  },
  topbarDark: {
    backgroundColor: "#0f172a",
    borderBottom: "1px solid #1e293b",
    boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
  },
  topbarLogo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#fff",
    fontWeight: 600,
    fontSize: 15,
    letterSpacing: 0.3,
    flexShrink: 0,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    color: "#fff",
  },
  logoMarkDark: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
  },
  topbarSearch: {
    flex: 1,
    maxWidth: 380,
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: 10,
    display: "flex",
    pointerEvents: "none",
  },
  topbarInput: {
    width: "100%",
    padding: "8px 32px 8px 34px",
    borderRadius: 8,
    border: "none",
    backgroundColor: "rgba(255,255,255,0.15)",
    color: "#fff",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
  },
  topbarInputDark: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    color: "#e2e8f0",
  },
  clearBtn: {
    position: "absolute",
    right: 8,
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    padding: 2,
  },
  topbarActions: {
    marginLeft: "auto",
    display: "flex",
    gap: 8,
    flexShrink: 0,
  },
  topbarBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    borderRadius: 7,
    border: "none",
    backgroundColor: "rgba(255,255,255,0.15)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  topbarBtnDark: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    color: "#e2e8f0",
  },

  layout: {
    display: "flex",
    gap: 20,
    padding: "20px 24px",
    alignItems: "flex-start",
  },
  sidebar: {
    width: 292,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  content: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  tabWrap: {
    display: "flex",
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  tabWrapDark: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
  },
  tabBtn: {
    flex: 1,
    padding: "8px 0",
    borderRadius: 7,
    border: "none",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "#64748b",
    fontFamily: "inherit",
    transition: "all 150ms",
  },
  tabBtnDark: {
    color: "#94a3b8",
  },
  tabBtnActive: {
    backgroundColor: "#0891b2",
    color: "#fff",
    boxShadow: "0 1px 3px rgba(8,145,178,0.3)",
  },
  tabBtnActiveDark: {
    backgroundColor: "#06b6d4",
    color: "#06202a",
    boxShadow: "0 1px 3px rgba(34,211,238,0.25)",
  },

  filterCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    padding: "18px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  filterCardDark: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
  },
  filterHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  filterTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#0f172a",
  },
  filterTitleDark: {
    color: "#f8fafc",
  },
  clearAllBtn: {
    fontSize: 12,
    color: "#0891b2",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    fontFamily: "inherit",
  },
  clearAllBtnDark: {
    color: "#22d3ee",
  },

  fieldRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 9,
    backgroundColor: "#fff",
    marginBottom: 7,
    minHeight: 56,
    boxSizing: "border-box",
    cursor: "text",
    transition: "border-color 150ms, box-shadow 150ms, background-color 150ms",
  },
  fieldRowDark: {
    border: "1px solid #334155",
    backgroundColor: "#111827",
  },
  fieldRowHover: {
    borderColor: "#94a3b8",
  },
  fieldRowHoverDark: {
    borderColor: "#475569",
  },
  fieldRowFocused: {
    borderColor: "#0891b2",
    boxShadow: "0 0 0 3px rgba(8,145,178,0.1)",
  },
  fieldRowFocusedDark: {
    borderColor: "#22d3ee",
    boxShadow: "0 0 0 3px rgba(34,211,238,0.12)",
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 7,
    backgroundColor: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: "#64748b",
    transition: "background-color 150ms, color 150ms",
  },
  iconBoxDark: {
    backgroundColor: "#1e293b",
    color: "#94a3b8",
  },
  iconBoxActive: {
    backgroundColor: "#e0f2fe",
    color: "#0891b2",
  },
  iconBoxActiveDark: {
    backgroundColor: "#083344",
    color: "#22d3ee",
  },
  fieldBody: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  floatingLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: "#0891b2",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginBottom: 2,
    lineHeight: 1,
  },
  floatingLabelDark: {
    color: "#22d3ee",
  },
  placeholder: {
    pointerEvents: "none",
  },
  placeholderLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
  },
  placeholderLabelDark: {
    color: "#cbd5e1",
  },
  placeholderHint: {
    fontSize: 12,
    color: "#94a3b8",
  },
  placeholderHintDark: {
    color: "#64748b",
  },
  fieldInput: {
    width: "100%",
    border: "none",
    outline: "none",
    fontSize: 13,
    color: "#0f172a",
    backgroundColor: "transparent",
    fontFamily: "inherit",
    padding: 0,
    appearance: "none",
    WebkitAppearance: "none",
  },
  fieldInputDark: {
    color: "#f8fafc",
  },
  inputHover: {},
  selectDark: {
    backgroundColor: "#111827",
    color: "#f8fafc",
  },
  selectOptionDark: {
    backgroundColor: "#111827",
    color: "#f8fafc",
    colorScheme: "dark",
  },

  foundedRow: {
    display: "flex",
    gap: 6,
    alignItems: "center",
    flexWrap: "wrap",
  },
  foundedInput: {
    width: 52,
    padding: "5px 7px",
    borderRadius: 6,
    border: "1px solid #e2e8f0",
    fontSize: 12,
    outline: "none",
    fontFamily: "inherit",
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  foundedInputDark: {
    border: "1px solid #334155",
    color: "#f8fafc",
    backgroundColor: "#1e293b",
  },
  foundedSelect: {
    padding: "5px 7px",
    borderRadius: 6,
    border: "1px solid #e2e8f0",
    fontSize: 12,
    outline: "none",
    fontFamily: "inherit",
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  foundedSelectDark: {
    border: "1px solid #334155",
    color: "#f8fafc",
    backgroundColor: "#1e293b",
  },

  btnRow: {
    display: "flex",
    gap: 8,
    marginTop: 8,
  },
  btnPrimary: {
    flex: 1,
    padding: "10px 0",
    borderRadius: 8,
    border: "none",
    backgroundColor: "#0891b2",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "opacity 150ms",
  },
  btnSecondary: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    backgroundColor: "#fff",
    color: "#64748b",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnSecondaryDark: {
    border: "1px solid #334155",
    backgroundColor: "#111827",
    color: "#cbd5e1",
  },

  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    padding: "52px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    textAlign: "center",
  },
  emptyCardDark: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: "50%",
    backgroundColor: "#e0f2fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyIconWrapDark: {
    backgroundColor: "#083344",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: "#0f172a",
    margin: 0,
  },
  emptyTitleDark: {
    color: "#f8fafc",
  },
  emptySub: {
    fontSize: 14,
    color: "#64748b",
    maxWidth: 340,
    lineHeight: 1.6,
    margin: 0,
  },
  emptySubDark: {
    color: "#94a3b8",
  },
  suggestWrap: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  suggestLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    margin: 0,
  },
  suggestLabelDark: {
    color: "#64748b",
  },
  chips: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 13px",
    backgroundColor: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: 20,
    whiteSpace: "nowrap",
    cursor: "default",
  },
  chipDark: {
    backgroundColor: "#083344",
    border: "1px solid #155e75",
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#0c4a6e",
  },
  chipLabelDark: {
    color: "#a5f3fc",
  },
  chipValue: {
    fontSize: 12,
    color: "#0369a1",
  },
  chipValueDark: {
    color: "#67e8f9",
  },
  applyBtn: {
    padding: "11px 28px",
    borderRadius: 9,
    border: "none",
    backgroundColor: "#0891b2",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: 4,
  },

  loadingCard: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 40,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 14,
  },
  loadingCardDark: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
  },
  spinner: {
    width: 28,
    height: 28,
    border: "3px solid #e2e8f0",
    borderTopColor: "#0891b2",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  spinnerDark: {
    border: "3px solid #334155",
    borderTopColor: "#22d3ee",
  },

  resultsHeader: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "12px 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultsHeaderDark: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
  },
  resultsCount: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0891b2",
  },
  resultsLabel: {
    fontSize: 14,
    color: "#0f172a",
  },
  resultsLabelDark: {
    color: "#e2e8f0",
  },
  resultsTab: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: 500,
  },
  resultsTabDark: {
    color: "#94a3b8",
  },
  noResults: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 40,
    textAlign: "center",
    color: "#374151",
    fontSize: 14,
  },
  noResultsDark: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    color: "#cbd5e1",
  },

  tableWrap: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    overflow: "hidden",
  },
  tableWrapDark: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    textAlign: "left",
    padding: "10px 14px",
    fontSize: 11,
    fontWeight: 600,
    color: "#64748b",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    whiteSpace: "nowrap",
  },
  thDark: {
    color: "#94a3b8",
    backgroundColor: "#111827",
    borderBottom: "1px solid #1e293b",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
  },
  trDark: {
    borderBottom: "1px solid #1e293b",
  },
  trHover: {
    borderBottom: "1px solid #f1f5f9",
    backgroundColor: "#f8fafc",
  },
  trHoverDark: {
    borderBottom: "1px solid #1e293b",
    backgroundColor: "#111827",
  },
  td: {
    padding: "11px 14px",
    color: "#334155",
    verticalAlign: "middle",
  },
  tdDark: {
    color: "#cbd5e1",
  },
  companyName: {
    fontWeight: 600,
    color: "#0f172a",
  },
  companyNameDark: {
    color: "#f8fafc",
  },
  badge: {
    display: "inline-block",
    padding: "3px 9px",
    borderRadius: 5,
    fontSize: 11,
    fontWeight: 600,
  },
  tagRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
  },
  tag: {
    display: "inline-block",
    padding: "2px 7px",
    backgroundColor: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: 4,
    fontSize: 11,
    color: "#475569",
  },
  tagDark: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    color: "#cbd5e1",
  },
  foundedText: {
    fontSize: 12,
    color: "#64748b",
  },
  foundedTextDark: {
    color: "#94a3b8",
  },

  editableCell: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 8px",
    borderRadius: 6,
    border: "1px solid transparent",
    cursor: "pointer",
    transition: "border-color 150ms",
  },
  editableCellDark: {
    color: "#e2e8f0",
  },
  editableCellHover: {
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
  },
  editableCellHoverDark: {
    borderColor: "#334155",
    backgroundColor: "#1e293b",
  },
  editIcon: {
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
  },
  editIconDark: {
    color: "#64748b",
  },
  inlineEditWrap: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    border: "1px solid #0891b2",
    borderRadius: 6,
    padding: "2px 4px",
    backgroundColor: "#fff",
    boxShadow: "0 0 0 3px rgba(8,145,178,0.1)",
  },
  inlineEditWrapDark: {
    border: "1px solid #22d3ee",
    backgroundColor: "#111827",
    boxShadow: "0 0 0 3px rgba(34,211,238,0.12)",
  },
  inlineInput: {
    border: "none",
    outline: "none",
    fontSize: 13,
    color: "#0f172a",
    fontFamily: "inherit",
    flex: 1,
    padding: "3px 4px",
    minWidth: 80,
    backgroundColor: "transparent",
  },
  inlineInputDark: {
    color: "#f8fafc",
  },
  inlineSave: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#16a34a",
    fontSize: 13,
    padding: "0 4px",
    fontFamily: "inherit",
  },
  inlineCancel: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#dc2626",
    fontSize: 13,
    padding: "0 4px",
    fontFamily: "inherit",
  },
};

if (typeof document !== "undefined" && !document.getElementById("db-spin-style")) {
  const style = document.createElement("style");
  style.id = "db-spin-style";
  style.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }

    input::placeholder,
    textarea::placeholder {
      color: #94a3b8;
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
}

export default DatabaseSearch;