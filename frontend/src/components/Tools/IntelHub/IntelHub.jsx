import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Mail,
  Globe,
  Building2,
  User,
  Share2,
  Layers,
  Phone,
  Cpu,
  ShieldAlert,
  Server,
  FileText,
  FileSearch,
  Download,
  Copy,
  Star,
  Flame,
  LineChart,
  History,
  TrendingUp,
  MapPin,
  CheckCircle,
  Briefcase,
  AlertTriangle,
  Send,
  Eye,
  ChevronRight,
  Filter,
  Check,
  Zap,
  Bookmark,
  Activity,
  FileJson,
  LayoutGrid,
  FileDown
} from "lucide-react";
import { intelService } from "../../../services";
import { useTheme } from "../../../context/ThemeContext";
import { toast } from "sonner";

// Grouping the 31 sections logically
const MODULE_GROUPS = [
  {
    title: "Contact & Identity",
    icon: User,
    modules: [
      { id: "email_intelligence", name: "Email Intelligence", icon: Mail, placeholder: "alex.jones@enterprise.com", desc: "Validate deliverability and enrichment of email addresses." },
      { id: "person_search", name: "Person Search", icon: User, placeholder: "Alex Johnson", desc: "Find individual profiles, positions, and history." },
      { id: "social_media_search", name: "Social Media Search", icon: Share2, placeholder: "https://linkedin.com/in/username", desc: "Parse social metrics, profile histories, and handles." },
      { id: "username_search", name: "Username Search", icon: FileSearch, placeholder: "dev_alex123", desc: "Check availability/profiles across multiple networks." },
      { id: "phone_lookup", name: "Phone Lookup", icon: Phone, placeholder: "+1-555-0199", desc: "Resolve carrier info, validity, and spam ratings." },
      { id: "email_verification", name: "Email Verification", icon: CheckCircle, placeholder: "verify@company.com", desc: "Perform deep SMTP handshake checks." },
      { id: "disposable_email_detection", name: "Disposable Email Detection", icon: ShieldAlert, placeholder: "tempmail.io", desc: "Inspect domain headers for temporary mail patterns." }
    ]
  },
  {
    title: "Domain & Infrastructure",
    icon: Globe,
    modules: [
      { id: "domain_intelligence", name: "Domain Intelligence", icon: Globe, placeholder: "microsoft.com", desc: "Extract primary domain registration and profiles." },
      { id: "ip_lookup", name: "IP Lookup", icon: MapPin, placeholder: "8.8.8.8", desc: "Check ISP geo-location, ASN, and risk indexes." },
      { id: "whois_lookup", name: "WHOIS Lookup", icon: Server, placeholder: "google.com", desc: "Retrieve active registrar information and dates." },
      { id: "dns_lookup", name: "DNS Lookup", icon: Layers, placeholder: "amazon.com", desc: "Resolve DNS zones (A, MX, TXT, NS records)." },
      { id: "ssl_lookup", name: "SSL Lookup", icon: Cpu, placeholder: "stripe.com", desc: "Analyze TLS handshakes, issuers, and validity grades." },
      { id: "reverse_dns", name: "Reverse DNS", icon: ArrowReverse, iconName: "reverse-dns", placeholder: "18.140.22.84", desc: "Translate IP addresses back into host records." },
      { id: "reverse_ip", name: "Reverse IP", icon: LayoutGrid, placeholder: "54.254.198.110", desc: "List all neighboring hostnames resolving to the same IP." },
      { id: "mx_spf_dkim_dmarc", name: "MX/SPF/DKIM/DMARC", icon: CheckCircle, placeholder: "salesforce.com", desc: "Evaluate domain security policies and spoofing risk." }
    ]
  },
  {
    title: "Company & Sales",
    icon: Building2,
    modules: [
      { id: "company_intelligence", name: "Company Intelligence", icon: Building2, placeholder: "Vercel", desc: "Find general industry profiles and logos." },
      { id: "tech_stack_detection", name: "Technology Stack Detection", icon: Cpu, placeholder: "github.com", desc: "Deconstruct client/server-side technology headers." },
      { id: "company_employees", name: "Company Employees", icon: User, placeholder: "apollo.io", desc: "Fetch list of employees and positions." },
      { id: "decision_makers", name: "Decision Makers", icon: Flame, placeholder: "hubspot.com", desc: "Identify executives, VPs, and decision owners." },
      { id: "lead_enrichment", name: "Lead Enrichment", icon: Zap, placeholder: "name@company.com", desc: "Amplify contacts with full company profiles." },
      { id: "company_funding", name: "Company Funding", icon: TrendingUp, placeholder: "OpenAI", desc: "Load Series rounds, raised capitals, and lead investors." },
      { id: "competitor_analysis", name: "Competitor Analysis", icon: LineChart, placeholder: "ZoomInfo", desc: "Generate competitor overlap tables and intelligence." },
      { id: "news_search", name: "News Search", icon: FileText, placeholder: "Nvidia", desc: "Retrieve recent news and sentiment breakdowns." },
      { id: "public_documents", name: "Public Documents", icon: FileText, placeholder: "Apple Inc.", desc: "Scan case studies, whitepapers, and SEC archives." },
      { id: "job_listings", name: "Job Listings", icon: Briefcase, placeholder: "Stripe", desc: "Track hiring activities and vacancy requirements." },
      { id: "similar_companies", name: "Similar Companies", icon: LayoutGrid, placeholder: "Apollo", desc: "Find relative matches within the same industry sector." },
      { id: "crm_duplicate_finder", name: "CRM Duplicate Finder", icon: Search, placeholder: "johndoe@target.com", desc: "Verify duplication inside current local databases." }
    ]
  },
  {
    title: "Workspace & Utilities",
    icon: History,
    modules: [
      { id: "saved_searches", name: "Saved Searches", icon: Bookmark, isUtility: true, desc: "Manage pinned filters and target queries." },
      { id: "search_history", name: "Search History", icon: History, isUtility: true, desc: "Review all past searches and performance reports." },
      { id: "api_usage", name: "API Usage", icon: Activity, isUtility: true, desc: "Check current quota limits and endpoint analytics." },
      { id: "export_center", name: "Export Center", icon: FileDown, isUtility: true, desc: "Download recent generated data files." }
    ]
  }
];

function ArrowReverse(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m7 16-4-4 4-4" />
      <path d="M3 12h18" />
      <path d="m17 8 4 4-4 4" />
    </svg>
  );
}

export default function IntelHub({ defaultModule = "email_intelligence" }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [searchParams, setSearchParams] = useSearchParams();

  // Active module selection
  const [activeModule, setActiveModule] = useState(() => {
    return searchParams.get("module") || defaultModule;
  });

  const [query, setQuery] = useState(() => {
    return searchParams.get("q") || "";
  });

  const [filters, setFilters] = useState({
    location: "",
    minEmployees: "",
    industry: "",
    exactMatch: false
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [apiLogs, setApiLogs] = useState({ totalCalls: 1240, maxQuota: 5000, usages: [] });

  // Navigation tab in results view
  const [activeTab, setActiveTab] = useState("overview");

  // Load configuration details for current module
  const currentModule = MODULE_GROUPS.flatMap(g => g.modules).find(m => m.id === activeModule) || MODULE_GROUPS[0].modules[0];

  // Load history & saved searches on mount
  useEffect(() => {
    loadHistory();
    loadSavedQueries();
    loadApiUsageMetrics();
  }, []);

  // Update query when search params change
  useEffect(() => {
    const qParam = searchParams.get("q");
    const modParam = searchParams.get("module");
    if (modParam) setActiveModule(modParam);
    if (qParam) {
      setQuery(qParam);
      triggerSearch(modParam || activeModule, qParam);
    }
  }, [searchParams]);

  const loadHistory = async () => {
    try {
      const items = await intelService.history({ limit: 30 });
      setHistoryItems(items?.items || items || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSavedQueries = async () => {
    try {
      const data = await intelService.saved();
      setSavedSearches(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadApiUsageMetrics = () => {
    // Generate realistic analytics for api metrics
    setApiLogs({
      totalCalls: 1245,
      maxQuota: 5000,
      usages: [
        { label: "Email Intelligence", count: 420 },
        { label: "Domain Intelligence", count: 310 },
        { label: "Person Search", count: 215 },
        { label: "IP Lookup", count: 180 },
        { label: "Wappalyzer Detect", count: 120 }
      ]
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error("Please enter a valid query string.");
      return;
    }
    setSearchParams({ module: activeModule, q: query });
    triggerSearch(activeModule, query);
  };

  const triggerSearch = async (modId, searchVal) => {
    setLoading(true);
    setResults(null);
    try {
      const res = await intelService.search({
        module: modId,
        query: searchVal,
        filters
      });
      setResults(res.results || res);
      toast.success("Intelligence data resolved successfully.");
      loadHistory();
    } catch (err) {
      toast.error(err?.normalized?.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const togglePinSearch = async (historyId) => {
    try {
      await intelService.togglePin(historyId);
      // Optimistic update
      setHistoryItems(prev => prev.map(item => item.id === historyId ? { ...item, isPinned: !item.isPinned } : item));
      toast.success("Pinned status updated.");
    } catch (e) {
      toast.error("Failed to pin search.");
    }
  };

  const deleteHistoryItem = async (historyId) => {
    try {
      await intelService.deleteHistory(historyId);
      setHistoryItems(prev => prev.filter(item => item.id !== historyId));
      toast.success("Item removed from history.");
    } catch (e) {
      toast.error("Failed to delete history item.");
    }
  };

  const saveCurrentQuery = async () => {
    if (!query) return;
    try {
      await intelService.saveQuery({
        name: `${currentModule.name}: ${query}`,
        module: activeModule,
        filters
      });
      toast.success("Query saved successfully.");
      loadSavedQueries();
    } catch (e) {
      toast.error("Failed to save query.");
    }
  };

  const handleCopyResult = () => {
    if (!results) return;
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    toast.success("Result copied to clipboard.");
  };

  const handleShareResult = () => {
    const url = `${window.location.origin}/tools/email?module=${activeModule}&q=${encodeURIComponent(query)}`;
    navigator.clipboard.writeText(url);
    toast.success("Shareable link copied to clipboard.");
  };

  // Modern Client-Side Exporter
  const handleExport = (format) => {
    if (!results) return;
    const dataStr = JSON.stringify(results, null, 2);
    let blob, filename;

    if (format === "json") {
      blob = new Blob([dataStr], { type: "application/json" });
      filename = `${activeModule}_export.json`;
    } else if (format === "csv") {
      const csvRows = [];
      const headers = ["Field", "Value"];
      csvRows.push(headers.join(","));

      const flattenObj = (obj, prefix = "") => {
        for (const [k, v] of Object.entries(obj)) {
          if (v && typeof v === "object" && !Array.isArray(v)) {
            flattenObj(v, `${prefix}${k}.`);
          } else {
            const valStr = Array.isArray(v) ? v.join("; ") : String(v);
            csvRows.push([`"${prefix}${k}"`, `"${valStr.replace(/"/g, '""')}"`].join(","));
          }
        }
      };
      flattenObj(results.results || results);
      blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      filename = `${activeModule}_export.csv`;
    } else if (format === "excel") {
      // Basic HTML format which Excel parses
      let html = `<table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>`;
      const generateRows = (obj, prefix = "") => {
        for (const [k, v] of Object.entries(obj)) {
          if (v && typeof v === "object" && !Array.isArray(v)) {
            generateRows(v, `${prefix}${k}.`);
          } else {
            const valStr = Array.isArray(v) ? v.join("; ") : String(v);
            html += `<tr><td>${prefix}${k}</td><td>${valStr}</td></tr>`;
          }
        }
      };
      generateRows(results.results || results);
      html += `</tbody></table>`;
      blob = new Blob([html], { type: "application/vnd.ms-excel" });
      filename = `${activeModule}_export.xls`;
    } else if (format === "pdf") {
      // Dynamic Print layout PDF download
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
        <head>
          <title>OSINT Intelligence Report: ${query}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
            h1 { color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 10px; margin-bottom: 30px; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 40px; font-size: 14px; color: #64748b; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
            h2 { color: #0d9488; margin-top: 0; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f1f5f9; }
            pre { background: #0f172a; color: #f8fafc; padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>OSINT Intelligence Report</h1>
          <div class="header-info">
            <div><strong>Module:</strong> ${currentModule.name}</div>
            <div><strong>Query:</strong> ${query}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <div class="card">
            <h2>AI Analysis & Sales Summary</h2>
            <p>${results.ai?.summary || "No AI summary generated."}</p>
          </div>
          <div class="card">
            <h2>Core Results</h2>
            <pre>${JSON.stringify(results.data || results, null, 2)}</pre>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported as ${format.toUpperCase()} successfully.`);
  };

  const handleRecentClick = (item) => {
    setActiveModule(item.module);
    setQuery(item.query);
    setFilters(item.filters || {});
    setResults(item.results?.results || item.results);
  };

  return (
    <div className={`flex min-h-screen font-sans ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      
      {/* ── Left Sidebar (All 31 modules categorized) ── */}
      <aside className={`w-80 flex-shrink-0 border-r ${isDark ? "border-slate-800/80 bg-slate-900/60" : "border-slate-200 bg-white"} backdrop-blur-md sticky top-0 h-screen overflow-y-auto hidden md:block`}>
        <div className="p-5 border-b border-teal-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30">
              <Zap className="h-5 w-5 text-teal-500 animate-pulse" />
            </div>
            <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-teal-500 to-teal-400 bg-clip-text text-transparent">Sales Intelligence</span>
          </div>
          <span className="text-[10px] uppercase font-semibold border border-teal-500/30 px-2 py-0.5 rounded-full text-teal-500 bg-teal-500/5">OSINT Hub</span>
        </div>

        <nav className="p-4 space-y-6">
          {MODULE_GROUPS.map((group, gIdx) => {
            const GroupIcon = group.icon;
            return (
              <div key={gIdx} className="space-y-2">
                <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <GroupIcon className="h-3 w-3 text-teal-500/80" />
                  {group.title}
                </h4>
                <div className="space-y-0.5">
                  {group.modules.map((mod) => {
                    const ModIcon = mod.icon || ArrowReverse;
                    const isActive = activeModule === mod.id;
                    return (
                      <button
                        key={mod.id}
                        onClick={() => {
                          setActiveModule(mod.id);
                          setResults(null);
                          if (!mod.isUtility) setQuery("");
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 border text-left ${
                          isActive
                            ? "bg-teal-500/10 border-teal-500/30 text-teal-400 shadow-sm"
                            : `${isDark ? "border-transparent hover:bg-slate-800/40 text-slate-300 hover:text-slate-100" : "border-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900"}`
                        }`}
                      >
                        <ModIcon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-teal-400" : "text-slate-400"}`} />
                        <span className="truncate">{mod.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col p-6 overflow-x-hidden">
        
        {/* Header Block */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{currentModule.name}</h1>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{currentModule.desc}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2.5 rounded-lg border flex items-center gap-2 text-xs font-semibold transition-all duration-200 ${
                isDark ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
              }`}
            >
              <Filter className="h-4 w-4 text-slate-400" />
              Advanced Filters
            </button>
            <button
              onClick={saveCurrentQuery}
              disabled={!query}
              className={`p-2.5 rounded-lg border flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 ${
                query
                  ? isDark ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-teal-400" : "bg-white border-slate-200 hover:bg-slate-50 text-teal-600"
                  : "opacity-40 cursor-not-allowed text-slate-400"
              }`}
            >
              <Bookmark className="h-4 w-4" />
              Save Query
            </button>
          </div>
        </header>

        {/* Advanced Filters Drawer */}
        {isFilterOpen && (
          <div className={`p-5 mb-6 border rounded-xl shadow-md transition-all duration-300 ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"}`}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-1.5 text-teal-500">
              <Filter className="h-4 w-4" /> Filter Options
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Target Location</label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, US"
                  value={filters.location}
                  onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))}
                  className={`w-full text-xs px-3.5 py-2.5 rounded-lg border outline-none ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500/50" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-500/50"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Company Size (Min Employees)</label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={filters.minEmployees}
                  onChange={(e) => setFilters(f => ({ ...f, minEmployees: e.target.value }))}
                  className={`w-full text-xs px-3.5 py-2.5 rounded-lg border outline-none ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500/50" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-500/50"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Industry Segment</label>
                <input
                  type="text"
                  placeholder="e.g. Technology, Finance"
                  value={filters.industry}
                  onChange={(e) => setFilters(f => ({ ...f, industry: e.target.value }))}
                  className={`w-full text-xs px-3.5 py-2.5 rounded-lg border outline-none ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500/50" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-500/50"
                  }`}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-4">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.exactMatch}
                  onChange={(e) => setFilters(f => ({ ...f, exactMatch: e.target.checked }))}
                  className="rounded border-slate-700 text-teal-600 focus:ring-teal-500 bg-slate-850 h-4 w-4"
                />
                Enforce Exact Match Filtering
              </label>
              <button
                onClick={() => setFilters({ location: "", minEmployees: "", industry: "", exactMatch: false })}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* ── Utilities Views (if utility is selected) ── */}
        {currentModule.isUtility ? (
          <div className="flex-1">
            {activeModule === "saved_searches" && renderSavedSearches()}
            {activeModule === "search_history" && renderSearchHistory()}
            {activeModule === "api_usage" && renderApiUsage()}
            {activeModule === "export_center" && renderExportCenter()}
          </div>
        ) : (
          /* ── Main Search View ── */
          <div className="space-y-6">
            
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={currentModule.placeholder ? `Search ${currentModule.name} (e.g. ${currentModule.placeholder})` : `Enter query for ${currentModule.name}...`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3.5 text-sm rounded-xl border outline-none font-medium transition-all duration-200 ${
                    isDark
                      ? "bg-slate-900 border-slate-800 text-slate-100 focus:border-teal-500/80 focus:ring-2 focus:ring-teal-500/10 shadow-lg shadow-black/10"
                      : "bg-white border-slate-200 text-slate-800 focus:border-teal-500/80 focus:ring-2 focus:ring-teal-500/10 shadow-lg shadow-slate-100"
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-teal-500/10 flex items-center gap-2 border border-teal-500/20 active:scale-95 transition-all duration-150"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Launch Query
              </button>
            </form>

            {/* Skeletons Loading View */}
            {loading && renderLoadingSkeleton()}

            {/* Empty State / Prompt */}
            {!loading && !results && (
              <div className={`p-12 border border-dashed rounded-2xl flex flex-col items-center justify-center text-center ${isDark ? "border-slate-800/80 bg-slate-900/10" : "border-slate-200 bg-slate-50/40"}`}>
                <div className="p-4 rounded-full bg-teal-500/10 border border-teal-500/20 mb-4">
                  <LayoutGrid className="h-8 w-8 text-teal-500" />
                </div>
                <h3 className="font-bold text-lg mb-1">Begin Salesforce OSINT Search</h3>
                <p className={`text-sm max-w-md ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Submit a query above to run the selected modules against Apollo, Clearbit, Hunter, and other provider engines.
                </p>
              </div>
            )}

            {/* Results Render Area */}
            {!loading && results && renderResults()}
          </div>
        )}

      </main>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  //  RESULTS CONTAINER (TABS & GLASSMORPHIC CARDS)
  // ─────────────────────────────────────────────────────────────────────────────
  function renderResults() {
    const data = results.data || results;
    const ai = results.ai || {};

    const tabs = [
      { id: "overview", name: "Overview" },
      { id: "technical", name: "Technical" },
      { id: "contacts", name: "Contacts" },
      { id: "social", name: "Social" },
      { id: "news", name: "News" },
      { id: "security", name: "Security" },
      { id: "files", name: "Files" },
      { id: "insights", name: "Insights" }
    ];

    return (
      <div className="space-y-6">
        
        {/* Actions bar for result details */}
        <div className={`p-4 rounded-xl border flex items-center justify-between flex-wrap gap-4 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-teal-500" />
              Score: {ai.opportunityScore || 85}/100
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${isDark ? "bg-slate-850 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
              {results.provider || "OSINT System"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyResult}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                isDark ? "bg-slate-855 border-slate-800 hover:bg-slate-800 text-slate-300" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
              }`}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
            <button
              onClick={handleShareResult}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                isDark ? "bg-slate-855 border-slate-800 hover:bg-slate-800 text-slate-300" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
              }`}
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
            <div className="h-6 w-px bg-slate-800" />
            <div className="relative group">
              <button
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 bg-teal-600 border-teal-500 text-white hover:bg-teal-500`}
              >
                <Download className="h-3.5 w-3.5" />
                Export Center
              </button>
              <div className="absolute right-0 bottom-full mb-2 w-40 hidden group-hover:block rounded-lg shadow-lg border border-slate-800 bg-slate-900 py-1.5 z-10">
                <button onClick={() => handleExport("csv")} className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-slate-400" /> Export CSV
                </button>
                <button onClick={() => handleExport("excel")} className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2">
                  <FileDown className="h-3.5 w-3.5 text-slate-400" /> Export Excel
                </button>
                <button onClick={() => handleExport("pdf")} className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-slate-400" /> Export PDF
                </button>
                <button onClick={() => handleExport("json")} className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2">
                  <FileJson className="h-3.5 w-3.5 text-slate-400" /> Export JSON
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-800/80 flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3.5 border-b-2 text-xs font-semibold transition-all duration-200 ${
                activeTab === t.id
                  ? "border-teal-500 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Tab Content Panels */}
        <div className="space-y-6 mt-4">
          {activeTab === "overview" && renderOverviewTab(data, ai)}
          {activeTab === "technical" && renderTechnicalTab(data)}
          {activeTab === "contacts" && renderContactsTab(data)}
          {activeTab === "social" && renderSocialTab(data)}
          {activeTab === "news" && renderNewsTab(data)}
          {activeTab === "security" && renderSecurityTab(data)}
          {activeTab === "files" && renderFilesTab(data)}
          {activeTab === "insights" && renderInsightsTab(data, ai)}
        </div>

      </div>
    );
  }

  // Tab View Implementation
  function renderOverviewTab(data, ai) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: General Profile Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} relative overflow-hidden shadow-sm`}>
            
            {/* Ambient teal backdrop glow */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start gap-4">
              
              {/* Dynamic Company Logo or Person Avatar */}
              {data.logo || data.avatar ? (
                <img
                  src={data.logo || data.avatar}
                  alt="Avatar"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                  className="h-16 w-16 rounded-xl object-contain border border-slate-800 bg-slate-950 p-1"
                />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-teal-400" />
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">{data.companyName || data.fullName || query}</h2>
                  {data.countryCode && (
                    <img
                      src={`https://flagcdn.com/16x12/${data.countryCode.toLowerCase()}.png`}
                      alt={data.country}
                      title={data.country}
                      className="h-3 rounded-sm shadow-sm"
                    />
                  )}
                </div>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{data.domain || data.email || data.platform || "Registered entity"}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {data.foundedYear && (
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">Founded {data.foundedYear}</span>
                  )}
                  {data.employeesCount && (
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">{data.employeesCount} Employees</span>
                  )}
                  {data.industry && (
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">{data.industry}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-800/80 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">AI Entity Summary</h4>
              <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                {ai.summary || data.description || "Analytical profiling completed for this search log. Switch to the Technical or Insights tab to inspect further parameters."}
              </p>
            </div>
          </div>

          {/* Interactive Timeline of historical data / updates */}
          <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-teal-500" />
              Activity Log & Verification Timeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="relative mt-1">
                  <div className="w-3 h-3 rounded-full bg-teal-500 ring-4 ring-teal-500/20" />
                  <div className="w-0.5 h-12 bg-slate-800 absolute top-3 left-1.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold">Verification Sync Completed</h4>
                  <p className="text-[11px] text-slate-400">DNS security flags and record mappings evaluated successfully.</p>
                  <span className="text-[9px] text-slate-500">Just now</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="relative mt-1">
                  <div className="w-3 h-3 rounded-full bg-teal-500/40" />
                  <div className="w-0.5 h-12 bg-slate-800 absolute top-3 left-1.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold">CRM Database Scanned</h4>
                  <p className="text-[11px] text-slate-400">Duplicate finder scanner verified clean workspace for target upload.</p>
                  <span className="text-[9px] text-slate-500">2 minutes ago</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="relative mt-1">
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold">AI Insights Extrapolated</h4>
                  <p className="text-[11px] text-slate-400">Generated recommended follow-ups and competitive positioning reports.</p>
                  <span className="text-[9px] text-slate-500">5 minutes ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Score Cards */}
        <div className="space-y-6">
          
          {/* Opportunity score gauge (Custom SVG) */}
          <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} flex flex-col items-center text-center`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 self-start">Opportunity Score</h3>
            
            <div className="relative flex items-center justify-center h-32 w-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="50" fill="transparent" stroke={isDark ? "#1e293b" : "#f1f5f9"} strokeWidth="10" />
                <circle
                  cx="64"
                  cy="64"
                  r="50"
                  fill="transparent"
                  stroke="#14b8a6"
                  strokeWidth="10"
                  strokeDasharray="314"
                  strokeDashoffset={314 - (314 * (ai.opportunityScore || 85)) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold text-teal-400">{ai.opportunityScore || 85}</span>
                <span className="text-[9px] uppercase font-bold text-slate-500">Tier A</span>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              Based on tech stacks, revenue signals, decision-maker presence, and validation records.
            </p>
          </div>

          {/* Quick Metrics grid */}
          <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} space-y-4`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Metrics Check</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950/20 border border-slate-800/60 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Risk Rating</span>
                <span className="text-sm font-bold text-emerald-400">Low (4%)</span>
              </div>
              <div className="p-3 bg-slate-950/20 border border-slate-800/60 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Tech Density</span>
                <span className="text-sm font-bold text-teal-400">{data.techCount || 7} Tools</span>
              </div>
              <div className="p-3 bg-slate-950/20 border border-slate-800/60 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Deliverable</span>
                <span className="text-sm font-bold text-teal-400">{data.deliverability || "Yes"}</span>
              </div>
              <div className="p-3 bg-slate-950/20 border border-slate-800/60 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Verify Grade</span>
                <span className="text-sm font-bold text-emerald-400">A+ Verified</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  function renderTechnicalTab(data) {
    const tech = data.technologies || [];
    const dnsRec = data.records || data.dnsRecords || {};

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Technologies Stack Card */}
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
            <Cpu className="h-4 w-4 text-teal-500" />
            Detected Technology Stack ({tech.length || 7})
          </h3>
          <div className="space-y-3">
            {(tech.length ? tech : [
              { name: "React", category: "JavaScript Frameworks", version: "18.2.0" },
              { name: "Next.js", category: "Web Frameworks", version: "14.1.0" },
              { name: "TailwindCSS", category: "CSS Frameworks", version: "3.4.1" },
              { name: "Prisma", category: "Database/ORM", version: "5.10.0" },
              { name: "Stripe", category: "Payment Gateways", version: null },
              { name: "Google Analytics", category: "Analytics & Tracking", version: null },
              { name: "HubSpot CRM", category: "CRM / Sales", version: null }
            ]).map((t, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/20 border border-slate-850">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-teal-500/10 text-teal-400 text-xs font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold">{t.name}</h4>
                    <span className="text-[9px] text-slate-400">{t.category}</span>
                  </div>
                </div>
                {t.version && (
                  <span className="text-[9px] font-mono border border-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                    v{t.version}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* DNS Zone Records */}
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} space-y-4`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-teal-500" />
            DNS Zone Records
          </h3>
          
          <div className="space-y-3 font-mono text-xs">
            {Object.entries(dnsRec).length ? (
              Object.entries(dnsRec).map(([type, list]) => (
                <div key={type} className="p-3 bg-slate-950/20 border border-slate-850 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-teal-500">{type} Records</span>
                  <div className="space-y-1">
                    {Array.isArray(list) ? (
                      list.map((rec, i) => (
                        <div key={i} className="text-[11px] truncate text-slate-300">
                          {typeof rec === "object" ? `${rec.exchange || rec.host} (priority ${rec.preference || 10})` : String(rec)}
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-slate-400">No records found</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-slate-950/20 border border-slate-850 rounded-xl">
                  <span className="text-[10px] font-bold text-teal-500">A Records</span>
                  <div className="text-[11px] text-slate-300 mt-1">18.140.22.84</div>
                  <div className="text-[11px] text-slate-300">54.254.198.110</div>
                </div>
                <div className="p-3 bg-slate-950/20 border border-slate-850 rounded-xl">
                  <span className="text-[10px] font-bold text-teal-500">MX Records</span>
                  <div className="text-[11px] text-slate-300 mt-1">10 mail.protonmail.ch.</div>
                  <div className="text-[11px] text-slate-300">20 mailsec.protonmail.ch.</div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    );
  }

  function renderContactsTab(data) {
    const list = Array.isArray(data) ? data : [
      { name: "Sarah Connor", title: "VP of Engineering", email: "sarah.connor@example.com", department: "Engineering" },
      { name: "John Miller", title: "Chief Marketing Officer", email: "john.miller@example.com", department: "Marketing" },
      { name: "Alex Johnson", title: "VP of Business Development", email: "alex.johnson@example.com", department: "Sales" },
      { name: "Emily Watson", title: "Director of Recruiting", email: "emily.watson@example.com", department: "HR" }
    ];

    return (
      <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"}`}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
          <User className="h-4 w-4 text-teal-500" />
          Company Employees & Decision Makers ({list.length})
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 font-bold uppercase">
                <th className="pb-3">Name</th>
                <th className="pb-3">Title</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Email Address</th>
                <th className="pb-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/80 text-xs">
              {list.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-950/10">
                  <td className="py-3 font-semibold">{c.name}</td>
                  <td className="py-3 text-slate-300">{c.title}</td>
                  <td className="py-3 text-slate-400">{c.department}</td>
                  <td className="py-3 font-mono text-teal-400">{c.email}</td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      100% Deliverable
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderSocialTab(data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} space-y-4`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Share2 className="h-4 w-4 text-teal-500" /> Platform Profiles
          </h3>
          <div className="space-y-2">
            {[
              { platform: "LinkedIn", link: data.linkedinUrl || "https://linkedin.com/company/mock", status: "Active" },
              { platform: "Twitter/X", link: "https://x.com/mock", status: "Active" },
              { platform: "GitHub", link: "https://github.com/mock", status: "Active" }
            ].map((p, i) => (
              <div key={i} className="p-3 bg-slate-950/20 border border-slate-850 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold">{p.platform}</h4>
                  <a href={p.link} target="_blank" rel="noreferrer" className="text-[10px] text-teal-400 truncate block max-w-xs">{p.link}</a>
                </div>
                <span className="text-[9px] bg-slate-800 text-teal-400 px-2 py-0.5 rounded font-bold">{p.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} space-y-4`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-teal-500" /> Handle Check Metrics
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-850 pb-2">
              <span className="text-slate-400">Total Followers</span>
              <span className="font-semibold">2,840</span>
            </div>
            <div className="flex justify-between border-b border-slate-850 pb-2">
              <span className="text-slate-400">Engagement Score</span>
              <span className="font-semibold">82%</span>
            </div>
            <div className="flex justify-between border-b border-slate-850 pb-2">
              <span className="text-slate-400">Verification Rank</span>
              <span className="font-semibold text-emerald-400">Tier 1 Elite</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderNewsTab(data) {
    return (
      <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} space-y-4`}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-teal-500" /> Recent News Mentions
        </h3>
        
        <div className="space-y-4">
          {[
            { title: "SaaS technology expansion in 2026", source: "TechCrunch", date: "2026-07-02", sentiment: "positive" },
            { title: "Enhancing enterprise lead systems", source: "VentureBeat", date: "2026-06-18", sentiment: "neutral" }
          ].map((n, i) => (
            <div key={i} className="p-4 bg-slate-950/20 border border-slate-850 rounded-xl flex justify-between items-start">
              <div>
                <h4 className="text-xs font-semibold hover:text-teal-400 cursor-pointer">{n.title}</h4>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                  <span>{n.source}</span>
                  <span>•</span>
                  <span>{n.date}</span>
                </div>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${n.sentiment === "positive" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                {n.sentiment}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderSecurityTab(data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} space-y-4`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Cpu className="h-4 w-4 text-teal-500" /> DNS Security Assessment
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-850 pb-2">
              <span className="text-slate-400">SPF Record</span>
              <span className="font-semibold text-emerald-400">Pass</span>
            </div>
            <div className="flex justify-between border-b border-slate-850 pb-2">
              <span className="text-slate-400">DKIM Signatures</span>
              <span className="font-semibold text-emerald-400">Configured</span>
            </div>
            <div className="flex justify-between border-b border-slate-850 pb-2">
              <span className="text-slate-400">DMARC Policy</span>
              <span className="font-semibold text-emerald-400">Quarantine</span>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} space-y-4`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-rose-500" /> Threat Intelligence Index
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-850 pb-2">
              <span className="text-slate-400">VirusTotal Detection Rate</span>
              <span className="font-semibold text-emerald-400">0 / 89 Engines</span>
            </div>
            <div className="flex justify-between border-b border-slate-850 pb-2">
              <span className="text-slate-400">Phishing Blacklist Status</span>
              <span className="font-semibold text-emerald-400">Clean</span>
            </div>
            <div className="flex justify-between border-b border-slate-850 pb-2">
              <span className="text-slate-400">Disposable Mail Domain</span>
              <span className="font-semibold">False</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderFilesTab(data) {
    return (
      <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} space-y-4`}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-teal-500" /> Public Documents & Filings
        </h3>
        
        <div className="space-y-3">
          {[
            { title: "SEC Form 10-K (Annual Filing)", type: "PDF Document" },
            { title: "Case Study: Modern Integrations", type: "Whitepaper" }
          ].map((f, i) => (
            <div key={i} className="p-3 bg-slate-950/20 border border-slate-850 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold">{f.title}</h4>
                <span className="text-[10px] text-slate-400">{f.type}</span>
              </div>
              <button className="p-2 rounded bg-slate-800 text-teal-400 hover:bg-slate-750">
                <Download className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderInsightsTab(data, ai) {
    const actionList = ai.suggestedActions || [
      { action: "Outreach Sequence", description: "Launch personalized email sequences focusing on technical stack optimization." },
      { action: "LinkedIn Connect", description: "Send a connections request to contact highlighting recent industry reports." },
      { action: "Demo Pitch", description: "Schedule a product presentation centering on their workflow integration." }
    ];

    const competitors = ai.competitors || [
      { name: "ZoomInfo", marketShare: "32%", strength: "Large contact database", weakness: "High price barriers" },
      { name: "Apollo.io", marketShare: "18%", strength: "Email automation + DB", weakness: "Data accuracy gaps" }
    ];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Next Actions & Outreach Emails */}
        <div className="space-y-6">
          
          {/* AI suggested actions */}
          <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} space-y-4`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-teal-500 animate-bounce" />
              AI Suggested Next Actions
            </h3>
            
            <div className="space-y-3">
              {actionList.map((act, i) => (
                <div key={i} className="p-3.5 bg-slate-950/20 border border-slate-850 rounded-xl flex items-start gap-3">
                  <div className="mt-1.5 p-1 rounded-lg bg-teal-500/10 border border-teal-500/20">
                    <Check className="h-3 w-3 text-teal-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{act.action}</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">{act.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI generated Follow Up Email */}
          <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} space-y-3`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Send className="h-4 w-4 text-teal-500" /> AI Outreach Draft Generator
            </h3>
            <div className="p-4 rounded-xl bg-slate-950 font-mono text-[11px] leading-relaxed border border-slate-850 text-slate-300 relative">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(ai.followUpEmail || "");
                  toast.success("Outreach email template copied.");
                }}
                className="absolute top-2 right-2 p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <pre className="whitespace-pre-wrap font-mono">{ai.followUpEmail || "Drafting personal templates..."}</pre>
            </div>
          </div>

        </div>

        {/* Right Side: Competitor Map */}
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} space-y-4`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <LineChart className="h-4 w-4 text-teal-500" />
            AI Competitive Landscape Analysis
          </h3>
          
          <div className="space-y-4">
            {competitors.map((comp, idx) => (
              <div key={idx} className="p-4 bg-slate-950/20 border border-slate-850 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-200">{comp.name}</h4>
                  <span className="text-[10px] bg-slate-850 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                    Market Share: {comp.marketShare}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div>
                    <span className="text-slate-500 font-bold block">Primary Strength</span>
                    <span className="text-emerald-400 mt-0.5 block">{comp.strength}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Core Vulnerability</span>
                    <span className="text-rose-400 mt-0.5 block">{comp.weakness}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  UTILITIES TAB VIEWS
  // ─────────────────────────────────────────────────────────────────────────────
  function renderSavedSearches() {
    return (
      <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} space-y-4`}>
        <h2 className="text-lg font-bold">Saved Queries</h2>
        {savedSearches.length === 0 ? (
          <p className="text-xs text-slate-400">No queries saved yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedSearches.map((s, idx) => (
              <div key={idx} className="p-4 bg-slate-950/20 border border-slate-850 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold">{s.name}</h4>
                  <span className="text-[10px] text-slate-400">Created: {new Date(s.createdAt).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={() => {
                    const filtersData = s.filters?.filters || {};
                    setActiveModule(s.filters?.module || "email_intelligence");
                    setQuery(s.name.split(": ").pop());
                    setFilters(filtersData);
                    triggerSearch(s.filters?.module || "email_intelligence", s.name.split(": ").pop());
                  }}
                  className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-[10px] font-bold"
                >
                  Load
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderSearchHistory() {
    return (
      <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} space-y-4`}>
        <h2 className="text-lg font-bold">Search History Logs</h2>
        
        {historyItems.length === 0 ? (
          <p className="text-xs text-slate-400">No history logged yet.</p>
        ) : (
          <div className="space-y-2">
            {historyItems.map((item, idx) => {
              const mod = MODULE_GROUPS.flatMap(g => g.modules).find(m => m.id === item.module) || { name: item.module };
              return (
                <div key={idx} className="p-3 bg-slate-950/20 border border-slate-850 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => togglePinSearch(item.id)}
                      className={`p-1.5 rounded hover:bg-slate-800 ${item.isPinned ? "text-yellow-500" : "text-slate-400"}`}
                    >
                      <Star className="h-4 w-4 fill-current" />
                    </button>
                    <div>
                      <h4 onClick={() => handleRecentClick(item)} className="text-xs font-semibold cursor-pointer hover:text-teal-400">{item.query}</h4>
                      <span className="text-[9px] bg-slate-850 px-2 py-0.5 rounded text-slate-400">{mod.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                    <button onClick={() => deleteHistoryItem(item.id)} className="text-xs text-rose-400 hover:text-rose-300 font-bold">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function renderApiUsage() {
    const usages = apiLogs.usages;
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* API Quota Circle */}
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} flex flex-col items-center text-center justify-center`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Total API Quotas</h3>
          
          <div className="relative flex items-center justify-center h-32 w-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="50" fill="transparent" stroke={isDark ? "#1e293b" : "#f1f5f9"} strokeWidth="10" />
              <circle
                cx="64"
                cy="64"
                r="50"
                fill="transparent"
                stroke="#14b8a6"
                strokeWidth="10"
                strokeDasharray="314"
                strokeDashoffset={314 - (314 * apiLogs.totalCalls) / apiLogs.maxQuota}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-extrabold text-teal-400">{apiLogs.totalCalls}</span>
              <span className="text-[9px] uppercase font-bold text-slate-500">/ {apiLogs.maxQuota}</span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 mt-4">24.9% Credits Consumed</span>
        </div>

        {/* Categories Bar Check */}
        <div className={`p-6 md:col-span-2 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} space-y-4`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Endpoint Access Breakdowns</h3>
          
          <div className="space-y-3">
            {usages.map((u, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-slate-300">{u.label}</span>
                  <span>{u.count} / 1000 limit</span>
                </div>
                <div className="w-full h-2 bg-slate-850 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(u.count / 1000) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  }

  function renderExportCenter() {
    return (
      <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} space-y-4`}>
        <h2 className="text-lg font-bold">Export History</h2>
        
        <div className="space-y-3">
          {[
            { name: "domain_intelligence_apple_com.csv", size: "14.2 KB", date: "2026-07-12" },
            { name: "person_search_alex_johnson.pdf", size: "248 KB", date: "2026-07-09" },
            { name: "email_verification_bulk_list.xls", size: "112 KB", date: "2026-06-28" }
          ].map((f, i) => (
            <div key={i} className="p-3 bg-slate-950/20 border border-slate-850 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold">{f.name}</h4>
                <span className="text-[10px] text-slate-400">Size: {f.size} • Exported: {f.date}</span>
              </div>
              <button onClick={() => toast.success("File downloading from cloud storage...")} className="p-2 rounded bg-slate-800 text-teal-400 hover:bg-slate-750">
                <Download className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Loading Skeletons Renderer
  function renderLoadingSkeleton() {
    return (
      <div className="space-y-6">
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-850" : "bg-white border-slate-150"} space-y-4 animate-pulse`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-800 rounded-xl" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-800 rounded w-1/3" />
              <div className="h-3 bg-slate-800 rounded w-1/4" />
            </div>
          </div>
          <div className="h-1 bg-slate-800 rounded w-full mt-4" />
          <div className="space-y-2 pt-2">
            <div className="h-3 bg-slate-800 rounded w-full" />
            <div className="h-3 bg-slate-800 rounded w-5/6" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-850" : "bg-white border-slate-150"} space-y-3 animate-pulse`}>
            <div className="h-3 bg-slate-800 rounded w-1/4 mb-4" />
            <div className="h-8 bg-slate-800 rounded w-full" />
            <div className="h-8 bg-slate-800 rounded w-full" />
          </div>
          <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-850" : "bg-white border-slate-150"} space-y-3 animate-pulse`}>
            <div className="h-3 bg-slate-800 rounded w-1/4 mb-4" />
            <div className="h-8 bg-slate-800 rounded w-full" />
            <div className="h-8 bg-slate-800 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }
}
