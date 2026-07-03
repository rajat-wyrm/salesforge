import { Link, useNavigate, useLocation } from "react-router-dom";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Database, Globe, LayoutDashboard, Link2, LogOut, Mail, Settings, Users,
  Building2, Briefcase, CreditCard, Key, Webhook, Shield, BarChart3, Activity,
  Calendar, Zap, Workflow, MessageSquare, Sparkles, Bell, Plug, FileText,
  TrendingUp, Search, Package, FileText as QuoteIcon, BookOpen, TrendingUp as AnalyticsIcon,
  UsersRound, Map, Target, DollarSign, Phone, FolderOpen, FileSignature,
  MessageCircle, Ticket, Megaphone, Heart, Brain,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import "./sidebar.css";

const NAV = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Insights", icon: BarChart3, path: "/insights" },
  { name: "Leads", icon: Briefcase, path: "/leads" },
  { name: "Deals", icon: TrendingUp, path: "/deals" },
  { name: "Quotes", icon: QuoteIcon, path: "/quotes" },
  { name: "Products", icon: Package, path: "/products" },
  { name: "Playbooks", icon: BookOpen, path: "/playbooks" },
  { name: "Analytics", icon: AnalyticsIcon, path: "/analytics" },
  { name: "Activities", icon: Activity, path: "/activities" },
  { name: "Calendar", icon: Calendar, path: "/calendar" },
  { name: "Organizations", icon: Building2, path: "/organizations" },
  { name: "Contacts", icon: UsersRound, path: "/contacts" },
  { name: "Territories", icon: Map, path: "/territories" },
  { name: "Sales", icon: null, children: [
    { name: "Quotas", icon: Target, path: "/quotas" },
    { name: "Commissions", icon: DollarSign, path: "/commissions" },
  ]},
  { name: "Calls", icon: Phone, path: "/calls" },
  { name: "Documents", icon: FolderOpen, path: "/documents" },
  { name: "Contracts", icon: FileSignature, path: "/contracts" },
  { name: "Searches", icon: Search, path: null, children: [
    { name: "Email", icon: Mail, path: "/tools/email" },
    { name: "Domain", icon: Globe, path: "/tools/domain" },
    { name: "Database", icon: Database, path: "/tools/database" },
    { name: "Social URL", icon: Link2, path: "/tools/url" },
  ]},
  { name: "Automation", icon: null, children: [
    { name: "Sequences", icon: Workflow, path: "/sequences" },
    { name: "Workflows", icon: Zap, path: "/workflows" },
    { name: "Templates", icon: Mail, path: "/templates" },
    { name: "Custom fields", icon: Sparkles, path: "/custom-fields" },
  ]},
  { name: "Support", icon: null, children: [
    { name: "Tickets", icon: Ticket, path: "/tickets" },
    { name: "Surveys", icon: MessageCircle, path: "/surveys" },
    { name: "Knowledge base", icon: BookOpen, path: "/kb" },
  ]},
  { name: "Marketing", icon: null, children: [
    { name: "Campaigns", icon: Megaphone, path: "/campaigns" },
    { name: "Health scores", icon: Heart, path: "/health-scores" },
    { name: "AI insights", icon: Brain, path: "/ai-insights" },
  ]},
  { name: "Team", icon: Users, path: "/team" },
  { name: "Billing", icon: CreditCard, path: "/billing" },
  { name: "Developer", icon: null, children: [
    { name: "API keys", icon: Key, path: "/api-keys" },
    { name: "Webhooks", icon: Webhook, path: "/webhooks" },
    { name: "Integrations", icon: Plug, path: "/integrations" },
  ]},
  { name: "Account", icon: null, children: [
    { name: "Usage", icon: Activity, path: "/usage" },
    { name: "Changelog", icon: Sparkles, path: "/changelog" },
    { name: "Notifications", icon: Bell, path: "/notifications-prefs" },
    { name: "Data & privacy", icon: Shield, path: "/data" },
  ]},
  { name: "Audit log", icon: Shield, path: "/audit", adminOnly: true },
  { name: "Settings", icon: Settings, path: "/settings" },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, organization, logout, isAdmin } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const userInitial = user?.name?.trim().charAt(0).toUpperCase() || "U";
  const visibleNav = NAV.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`sidebar-scroll hidden h-full shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-100/95 px-3 py-4 shadow-xl transition-all duration-300 dark:border-gray-700 dark:bg-gray-800/95 dark:shadow-black/30 md:flex md:flex-col ${
        isExpanded ? "w-72" : "w-24"
      }`}
    >
      <Link to="/dashboard">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="mb-6 flex items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-sm transition-colors duration-300 dark:bg-gray-900"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 text-lg font-bold text-white shadow-lg shadow-teal-500/30">
            U
          </div>
          {isExpanded && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                UptoSkills
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                Lead intelligence suite
              </p>
            </div>
          )}
        </motion.div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {visibleNav.map((item) => {
          if (item.children) {
            return (
              <div key={item.name}>
                <div className={`mt-3 flex w-full items-center rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 ${
                  isExpanded ? "justify-start" : "justify-center"
                }`}>
                  {item.name}
                </div>
                {item.children.map((child) => {
                  const isActive = location.pathname === child.path;
                  return (
                    <motion.button
                      key={child.path}
                      type="button"
                      whileHover={{ x: isExpanded ? 3 : 0 }}
                      onClick={() => navigate(child.path)}
                      className={`group relative flex w-full items-center rounded-2xl px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                        isExpanded ? "justify-start" : "justify-center"
                      } ${
                        isActive
                          ? "bg-gradient-to-r from-teal-50 to-teal-100/50 text-teal-700 shadow-sm dark:from-teal-500/10 dark:to-teal-500/5 dark:text-teal-300"
                          : "text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      {child.icon && <child.icon className={`h-4 w-4 shrink-0 ${isExpanded ? "mr-2" : ""}`} />}
                      {isExpanded && <span className="truncate">{child.name}</span>}
                      {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-teal-500 dark:bg-teal-400 animate-pulse" />}
                    </motion.button>
                  );
                })}
              </div>
            );
          }
          const isActive = location.pathname === item.path;
          return (
            <motion.button
              key={item.path}
              type="button"
              whileHover={{ x: isExpanded ? 3 : 0 }}
              onClick={() => navigate(item.path)}
              className={`group relative flex w-full items-center rounded-2xl px-4 py-3 text-sm font-medium transition-colors duration-300 ${
                isExpanded ? "justify-start" : "justify-center"
              } ${
                isActive
                  ? "bg-gradient-to-r from-teal-50 to-teal-100/50 text-teal-700 shadow-sm dark:from-teal-500/10 dark:to-teal-500/5 dark:text-teal-300"
                  : "text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
              title={isExpanded ? undefined : item.name}
            >
              {item.icon && <item.icon className={`h-5 w-5 shrink-0 ${isExpanded ? "mr-3" : ""}`} />}
              {isExpanded && <span className="truncate">{item.name}</span>}
              {isActive && (
                <motion.span
                  layoutId="activeNav"
                  className="ml-auto h-2.5 w-2.5 rounded-full bg-teal-500 dark:bg-teal-400 shadow-lg shadow-teal-500/50"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-gray-200 pt-4 transition-colors duration-300 dark:border-gray-700">
        <Link to="/settings">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`mb-3 flex items-center rounded-2xl bg-white px-3 py-3 shadow-sm dark:bg-gray-900 ${
              isExpanded ? "justify-start" : "justify-center"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-500/30">
              {userInitial}
            </div>
            {isExpanded && (
              <div className="ml-3 min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.name || "Account"}</p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.role || "Member"}</p>
              </div>
            )}
          </motion.div>
        </Link>
        <motion.button
          type="button"
          whileHover={{ x: 3 }}
          onClick={handleLogout}
          className={`flex w-full items-center rounded-2xl px-3 py-2 text-sm text-gray-600 hover:bg-white hover:text-red-500 dark:text-gray-300 dark:hover:bg-gray-700 ${
            isExpanded ? "justify-start" : "justify-center"
          }`}
        >
          <LogOut className={`h-4 w-4 ${isExpanded ? "mr-2" : ""}`} />
          {isExpanded && "Sign out"}
        </motion.button>
      </div>
    </aside>
  );
};

export default Sidebar;
