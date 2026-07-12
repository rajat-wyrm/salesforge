// UptoSkills design system tokens and page wrapper.
// Based on the original UptoSkills components: Maindashboard.jsx, EmailSearch.jsx, etc.
import React from "react";
import { useTheme } from "@/context/ThemeContext";

export const uptoskillsTokens = (darkMode) => ({
  // Page backgrounds
  pageBg: darkMode
    ? "min-h-screen transition-colors duration-300 bg-slate-950"
    : "min-h-screen transition-colors duration-300 bg-gradient-to-br from-slate-50 via-white to-slate-100",

  // Cards
  card: darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100",
  cardBorder: darkMode ? "border-slate-800" : "border-slate-100",
  cardHover: darkMode ? "hover:border-slate-700" : "hover:border-slate-200",

  // Typography
  heading: darkMode ? "text-white" : "text-slate-900",
  subtext: darkMode ? "text-slate-400" : "text-slate-500",
  body: darkMode ? "text-slate-300" : "text-slate-600",
  muted: darkMode ? "text-slate-500" : "text-slate-400",

  // Brand colors
  brand: "#00b5ad",
  brandLight: "#2dd4bf",
  accent: "#e76937",
  brandBg: darkMode ? "bg-teal-900/30" : "bg-teal-50",
  brandText: darkMode ? "text-teal-400" : "text-teal-700",
  brandBorder: darkMode ? "border-teal-800/50" : "border-teal-200",

  // Borders
  divider: darkMode ? "border-slate-800" : "border-slate-200",
  subtleDivider: darkMode ? "border-slate-800/50" : "border-slate-100",

  // Pill
  pill: darkMode ? "bg-teal-900/50 text-teal-400" : "bg-teal-50 text-teal-700",

  // Chart colors
  chartBar: darkMode ? "#2dd4bf" : "#00b5ad",
  chartGrid: darkMode ? "#1e293b" : "#f1f5f9",
  chartAxis: darkMode ? "#475569" : "#94a3b8",
  chartLine: darkMode ? "#2dd4bf" : "#00b5ad",
  chartColors: darkMode
    ? ["#2dd4bf", "#5eead4", "#99f6e4", "#ccfbf1"]
    : ["#00b5ad", "#2dd4bf", "#5eead4", "#99f6e4"],

  // Tooltip
  tooltipBg: darkMode ? "#1e293b" : "#ffffff",
  tooltipBorder: darkMode ? "#334155" : "#e2e8f0",
  tooltipText: darkMode ? "#e2e8f0" : "#0f172a",
});

export const SectionHeading = ({ label, darkMode }) => (
  <div className="mb-7">
    <h2 className={`text-xl font-semibold mb-2 ${darkMode ? "text-white" : "text-slate-900"}`}>
      {label}
    </h2>
    <div className="w-10 h-[3px] bg-linear-to-r from-[#00b5ad] to-[#e76937] rounded-full" />
  </div>
);

// UptoSkills page wrapper with the same background animation as Maindashboard
export const UptoPage = ({ children, noPadding = false }) => {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  return (
    <div className={uptoskillsTokens(darkMode).pageBg}>
      <div className={`${noPadding ? "" : "px-6 md:px-10 lg:px-16 pb-24 space-y-12"}`}>
        {children}
      </div>
    </div>
  );
};

// UptoSkills analytics card (same as Maindashboard AnalyticsCard)
export const UptoCard = ({ title, value, icon: Icon, trend, color = "primary", darkMode }) => {
  const colorMap = {
    primary: {
      light: { bg: "bg-blue-50", text: "text-blue-600", icon: "bg-blue-100 text-blue-600", trend: "text-blue-500" },
      dark:  { bg: "bg-blue-950/40", text: "text-blue-400", icon: "bg-blue-900/60 text-blue-400", trend: "text-blue-400" },
    },
    success: {
      light: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "bg-emerald-100 text-emerald-600", trend: "text-emerald-500" },
      dark:  { bg: "bg-emerald-950/40", text: "text-emerald-400", icon: "bg-emerald-900/60 text-emerald-400", trend: "text-emerald-400" },
    },
    warning: {
      light: { bg: "bg-amber-50", text: "text-amber-600", icon: "bg-amber-100 text-amber-600", trend: "text-amber-500" },
      dark:  { bg: "bg-amber-950/40", text: "text-amber-400", icon: "bg-amber-900/60 text-amber-400", trend: "text-amber-400" },
    },
    info: {
      light: { bg: "bg-purple-50", text: "text-purple-600", icon: "bg-purple-100 text-purple-600", trend: "text-purple-500" },
      dark:  { bg: "bg-purple-950/40", text: "text-purple-400", icon: "bg-purple-900/60 text-purple-400", trend: "text-purple-400" },
    },
    teal: {
      light: { bg: "bg-teal-50", text: "text-teal-600", icon: "bg-teal-100 text-teal-600", trend: "text-teal-500" },
      dark:  { bg: "bg-teal-950/40", text: "text-teal-400", icon: "bg-teal-900/60 text-teal-400", trend: "text-teal-400" },
    },
  };
  const palette = darkMode ? colorMap[color]?.dark : colorMap[color]?.light;
  if (!palette) return null;
  return (
    <div
      className={`rounded-2xl p-6 border transition-colors duration-300 ${
        darkMode ? `${palette.bg} border-slate-700/50` : `${palette.bg} border-transparent`
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          {title}
        </span>
        <div className={`p-2 rounded-xl ${palette.icon}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className={`text-3xl font-semibold mb-1 ${darkMode ? "text-white" : "text-slate-900"}`}>
        {value}
      </p>
      {trend && <p className={`text-xs font-medium ${palette.trend}`}>{trend}</p>}
    </div>
  );
};

export const UptoToolCard = ({ title, description, path, buttonText, icon: Icon, color = "primary", darkMode, onClick }) => {
  const palettes = {
    primary: {
      light: { gradient: "from-blue-50 to-blue-100/40", border: "border-blue-200", accent: "bg-blue-500 hover:bg-blue-600" },
      dark:  { gradient: "from-blue-950/50 to-blue-900/30", border: "border-blue-800/50", accent: "bg-blue-600 hover:bg-blue-500" },
    },
    success: {
      light: { gradient: "from-emerald-50 to-emerald-100/40", border: "border-emerald-200", accent: "bg-emerald-500 hover:bg-emerald-600" },
      dark:  { gradient: "from-emerald-950/50 to-emerald-900/30", border: "border-emerald-800/50", accent: "bg-emerald-600 hover:bg-emerald-500" },
    },
    warning: {
      light: { gradient: "from-amber-50 to-amber-100/40", border: "border-amber-200", accent: "bg-amber-500 hover:bg-amber-600" },
      dark:  { gradient: "from-amber-950/50 to-amber-900/30", border: "border-amber-800/50", accent: "bg-amber-600 hover:bg-amber-500" },
    },
    info: {
      light: { gradient: "from-purple-50 to-purple-100/40", border: "border-purple-200", accent: "bg-purple-500 hover:bg-purple-600" },
      dark:  { gradient: "from-purple-950/50 to-purple-900/30", border: "border-purple-800/50", accent: "bg-purple-600 hover:bg-purple-500" },
    },
    teal: {
      light: { gradient: "from-teal-50 to-teal-100/40", border: "border-teal-200", accent: "bg-teal-500 hover:bg-teal-600" },
      dark:  { gradient: "from-teal-950/50 to-teal-900/30", border: "border-teal-800/50", accent: "bg-teal-600 hover:bg-teal-500" },
    },
  };
  const palette = darkMode ? palettes[color]?.dark : palettes[color]?.light;
  if (!palette) return null;
  return (
    <div
      onClick={onClick || (() => {})}
      className={`group relative bg-linear-to-br ${palette.gradient} border ${palette.border} rounded-2xl p-7 cursor-pointer overflow-hidden transition-transform duration-200 hover:scale-[1.015]`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="relative">
        <div className={`inline-flex items-center justify-center p-2.5 rounded-xl mb-4 text-white ${palette.accent.split(" ")[0]}`}>
          {Icon && <Icon size={20} />}
        </div>
        <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-white" : "text-slate-900"}`}>
          {title}
        </h3>
        <p className={`text-sm leading-relaxed mb-6 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
          {description}
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); onClick ? onClick() : (path && (window.location.href = path)); }}
          className={`inline-flex items-center gap-2 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-200 ${palette.accent} shadow-sm hover:shadow-md`}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};
