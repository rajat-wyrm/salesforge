import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { leadService, orgService, tagService } from "@/services";

const ACTIONS = [
  { id: "nav:dashboard", label: "Go to Dashboard", group: "Navigate", action: (n) => n("/dashboard") },
  { id: "nav:leads", label: "Go to Leads", group: "Navigate", action: (n) => n("/leads") },
  { id: "nav:deals", label: "Go to Deals (Kanban)", group: "Navigate", action: (n) => n("/deals") },
  { id: "nav:activities", label: "Go to Activities", group: "Navigate", action: (n) => n("/activities") },
  { id: "nav:calendar", label: "Go to Calendar", group: "Navigate", action: (n) => n("/calendar") },
  { id: "nav:insights", label: "Go to Insights", group: "Navigate", action: (n) => n("/insights") },
  { id: "nav:organizations", label: "Go to Organizations", group: "Navigate", action: (n) => n("/organizations") },
  { id: "nav:team", label: "Go to Team", group: "Navigate", action: (n) => n("/team") },
  { id: "nav:billing", label: "Go to Billing", group: "Navigate", action: (n) => n("/billing") },
  { id: "nav:api-keys", label: "Go to API keys", group: "Navigate", action: (n) => n("/api-keys") },
  { id: "nav:webhooks", label: "Go to Webhooks", group: "Navigate", action: (n) => n("/webhooks") },
  { id: "nav:integrations", label: "Go to Integrations", group: "Navigate", action: (n) => n("/integrations") },
  { id: "nav:templates", label: "Go to Email templates", group: "Navigate", action: (n) => n("/templates") },
  { id: "nav:sequences", label: "Go to Sequences", group: "Navigate", action: (n) => n("/sequences") },
  { id: "nav:workflows", label: "Go to Workflows", group: "Navigate", action: (n) => n("/workflows") },
  { id: "nav:reports", label: "Go to Reports", group: "Navigate", action: (n) => n("/reports") },
  { id: "nav:custom-fields", label: "Go to Custom fields", group: "Navigate", action: (n) => n("/custom-fields") },
  { id: "nav:changelog", label: "Go to Changelog", group: "Navigate", action: (n) => n("/changelog") },
  { id: "nav:settings", label: "Go to Settings", group: "Navigate", action: (n) => n("/settings") },
  { id: "nav:tools-email", label: "Go to Email search", group: "Navigate", action: (n) => n("/tools/email") },
  { id: "nav:tools-domain", label: "Go to Domain search", group: "Navigate", action: (n) => n("/tools/domain") },
  { id: "nav:tools-url", label: "Go to Social URL search", group: "Navigate", action: (n) => n("/tools/url") },
  { id: "nav:tools-database", label: "Go to Database search", group: "Navigate", action: (n) => n("/tools/database") },
  { id: "action:new-lead", label: "Create new lead", group: "Actions", action: (n) => n("/leads") },
  { id: "action:new-deal", label: "Create new deal", group: "Actions", action: (n) => n("/deals") },
  { id: "action:new-activity", label: "Log an activity", group: "Actions", action: (n) => n("/activities") },
  { id: "action:new-event", label: "Create calendar event", group: "Actions", action: (n) => n("/calendar") },
];

const CommandPalette = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  const close = useCallback(() => { setOpen(false); setQuery(""); setActive(0); }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen((p) => !p); }
      if (e.key === "Escape" && open) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const run = async () => {
      const q = query.toLowerCase().trim();
      const items = [];
      for (const a of ACTIONS) {
        if (!q || a.label.toLowerCase().includes(q)) items.push({ ...a, type: "action" });
      }
      if (q) {
        try {
          const [leads, orgs, tags] = await Promise.all([
            leadService.list({ search: query, limit: 5 }).catch(() => ({ items: [] })),
            orgService.list({ search: query, limit: 5 }).catch(() => ({ items: [] })),
            tagService.list().catch(() => []),
          ]);
          for (const l of (leads.items || []).slice(0, 5)) {
            items.push({ id: `lead:${l.id}`, label: `${l.name} · ${l.email}`, group: "Leads", type: "lead", action: (n) => n(`/leads/${l.id}`) });
          }
          for (const o of (orgs.items || []).slice(0, 3)) {
            items.push({ id: `org:${o.id}`, label: `${o.name}`, group: "Organizations", type: "org", action: (n) => n(`/organizations/${o.id}`) });
          }
        } catch {}
      }
      setResults(items.slice(0, 12));
      setActive(0);
    };
    const t = setTimeout(run, 120);
    return () => clearTimeout(t);
  }, [query, open]);

  const run = (item) => {
    close();
    item.action(navigate);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-24" onClick={close}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
              if (e.key === "Enter") { const item = results[active]; if (item) run(item); }
            }}
            placeholder="Search leads, organizations, or jump anywhere…"
            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
          />
          <kbd className="rounded border border-gray-300 px-1.5 py-0.5 text-[10px] font-mono text-gray-500 dark:border-gray-700">ESC</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-1">
          {results.length === 0 && (
            <li className="px-3 py-4 text-center text-sm text-gray-500">No results.</li>
          )}
          {results.map((r, i) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => run(r)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm ${i === active ? "bg-teal-50 dark:bg-teal-500/10" : ""}`}
              >
                <span className="truncate text-gray-900 dark:text-white">{r.label}</span>
                <span className="ml-2 shrink-0 text-xs text-gray-500">{r.group}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-gray-200 px-3 py-2 text-[10px] text-gray-500 dark:border-gray-800">
          <span>↑↓ navigate · ↵ select</span>
          <span>Powered by SalesForge</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
