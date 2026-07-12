// Shared UptoSkills design tokens. Import this in any page to get the exact
// colors, spacing, and component styles from the original UptoSkills codebase.
import React, { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";

// Re-export from UptoStyles so pages can import everything from one place.
export { UptoPage, UptoToolCard } from "./UptoStyles";

export const useUptoStyles = () => {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  return {
    darkMode,
    // Backgrounds
    pageBg: darkMode ? "min-h-screen transition-colors duration-300 bg-slate-950" : "min-h-screen transition-colors duration-300 bg-gradient-to-br from-slate-50 via-white to-slate-100",
    card: darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100",
    // Typography
    heading: darkMode ? "text-white" : "text-slate-900",
    subtext: darkMode ? "text-slate-400" : "text-slate-500",
    body: darkMode ? "text-slate-300" : "text-slate-600",
    muted: darkMode ? "text-slate-500" : "text-slate-400",
    // Borders
    divider: darkMode ? "border-slate-800" : "border-slate-200",
    input: darkMode ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400",
    // Brand
    brand: "#00b5ad",
    brandLight: "#2dd4bf",
    accent: "#e76937",
    pill: darkMode ? "bg-teal-900/50 text-teal-400" : "bg-teal-50 text-teal-700",
    brandBtn: "bg-[#00b5ad] text-white hover:bg-[#2dd4bf] shadow-sm",
    secondaryBtn: darkMode
      ? "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
      : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    dangerBtn: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
  };
};

export const UptoSectionHeading = ({ label, darkMode, action = null }) => (
  <div className="mb-7 flex items-end justify-between">
    <div>
      <h2 className={`text-xl font-semibold mb-2 ${darkMode ? "text-white" : "text-slate-900"}`}>{label}</h2>
      <div className="w-10 h-[3px] bg-linear-to-r from-[#00b5ad] to-[#e76937] rounded-full" />
    </div>
    {action}
  </div>
);

export const UptoHero = ({ title, subtitle, darkMode, actions = null }) => {
  const s = useUptoStyles();
  const isDark = darkMode ?? s.darkMode;

  return (
    <div className={`relative overflow-hidden -mx-6 md:-mx-10 lg:-mx-16 rounded-b-3xl border px-6 md:px-10 lg:px-16 py-10 md:py-14 shadow-sm backdrop-blur-sm ${isDark ? "border-slate-800 bg-slate-900/95" : "border-slate-200 bg-white/90"}`}>
      <div className={`absolute inset-0 pointer-events-none bg-linear-to-r from-[#00b5ad]/10 via-transparent to-[#e76937]/10 ${isDark ? "opacity-80" : "opacity-100"}`} />
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl ${isDark ? "bg-[#00b5ad]/15" : "bg-[#00b5ad]/10"}`} />
        <div className={`absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl ${isDark ? "bg-[#e76937]/10" : "bg-[#e76937]/8"}`} />
      </div>
      <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className={`text-3xl md:text-4xl font-semibold mb-2 leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>{title}</h1>
          {subtitle && <p className={`text-base ${isDark ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};

export const UptoButton = ({ as: Component = "button", children, variant = "primary", className = "", ...props }) => {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const variants = {
    primary: "bg-[#00b5ad] text-white hover:bg-[#2dd4bf] shadow-sm",
    secondary: darkMode
      ? "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
      : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    ghost: darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
  };
  return (
    <Component
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {children}
    </Component>
  );
};

export const UptoInput = ({ label, darkMode, ...props }) => {
  const s = useUptoStyles();
  return (
    <label className="block">
      {label && <span className={`mb-1 block text-sm font-medium ${s.darkMode ? "text-slate-300" : "text-slate-700"}`}>{label}</span>}
      <input
        {...props}
        className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm transition focus:border-[#00b5ad] focus:outline-none focus:ring-2 focus:ring-[#00b5ad]/20 ${s.input} ${props.className || ""}`}
      />
    </label>
  );
};

export const UptoSelect = ({ label, children, darkMode, ...props }) => {
  const s = useUptoStyles();
  return (
    <label className="block">
      {label && <span className={`mb-1 block text-sm font-medium ${s.darkMode ? "text-slate-300" : "text-slate-700"}`}>{label}</span>}
      <select
        {...props}
        className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm transition focus:border-[#00b5ad] focus:outline-none focus:ring-2 focus:ring-[#00b5ad]/20 ${s.input}`}
      >
        {children}
      </select>
    </label>
  );
};

export const UptoTextarea = ({ label, rows = 3, ...props }) => {
  const s = useUptoStyles();
  return (
    <label className="block">
      {label && <span className={`mb-1 block text-sm font-medium ${s.darkMode ? "text-slate-300" : "text-slate-700"}`}>{label}</span>}
      <textarea
        rows={rows}
        {...props}
        className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm transition focus:border-[#00b5ad] focus:outline-none focus:ring-2 focus:ring-[#00b5ad]/20 ${s.input}`}
      />
    </label>
  );
};

export const UptoBadge = ({ children, tone = "default" }) => {
  const tones = {
    default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    brand: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone] || tones.default}`}>{children}</span>;
};

export const UptoEmptyState = ({ icon: Icon, title, body, action = null }) => {
  const s = useUptoStyles();
  return (
    <div className={`rounded-2xl border border-dashed p-10 text-center ${s.darkMode ? "border-slate-700 bg-slate-900/40" : "border-slate-300 bg-slate-50/40"}`}>
      {Icon && <Icon className={`mx-auto mb-3 h-8 w-8 ${s.muted}`} />}
      <p className={`text-base font-semibold ${s.heading}`}>{title}</p>
      {body && <p className={`mt-1 text-sm ${s.subtext}`}>{body}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
};

export const UptoSpinner = ({ label = "Loading..." }) => {
  const s = useUptoStyles();
  return (
    <div className={`flex h-full min-h-[300px] items-center justify-center text-sm ${s.subtext}`}>
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#00b5ad] border-t-transparent mr-2" />
      {label}
    </div>
  );
};

export const UptoError = ({ error, onRetry = null }) => {
  const s = useUptoStyles();
  return (
    <div className={`mb-4 flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${s.darkMode ? "border-red-900/40 bg-red-900/20 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`}>
      <span>{error || "Something went wrong."}</span>
      {onRetry && <UptoButton variant="ghost" onClick={onRetry}>Try again</UptoButton>}
    </div>
  );
};

export const UptoCard = ({ children, className = "" }) => {
  const s = useUptoStyles();
  return (
    <div className={`rounded-2xl border p-6 shadow-sm transition-colors duration-300 ${s.card} ${className}`}>
      {children}
    </div>
  );
};

export const UptoCopyButton = ({ value, className = "" }) => {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  return (
    <button
      type="button"
      onClick={handle}
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium transition ${
        copied ? "border-emerald-300 bg-emerald-50 text-emerald-700" : ""
      } ${className}`}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
};

export const UptoProgressBar = ({ value, max = 100, darkMode }) => (
  <div className={`h-2 w-full overflow-hidden rounded-full ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
    <div className="h-full bg-linear-to-r from-[#00b5ad] to-[#2dd4bf] transition-all" style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
  </div>
);
