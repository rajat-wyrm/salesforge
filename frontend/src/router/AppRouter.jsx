import React, { useLayoutEffect } from "react";
import {
  BrowserRouter, Routes, Route, Navigate, useLocation,
} from "react-router-dom";
import ErrorBoundary from "../ErrorBoundary";
import { useAuth } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";
import ChatBot from "../components/ChatBot";
import CommandPalette from "@/components/CommandPalette";

import Login from "../pages/Auth/Login";
import AdminLogin from "../pages/Auth/AdminLogin";
import AcceptInvite from "../pages/Auth/AcceptInvite";
import Landing from "../pages/Landing/LandingPage";
import DashboardLayout from "../components/layout/DashboardLayout";

import Dashboard from "../pages/Dashboard/Dashboard";
import Leads from "../pages/Dashboard/Leads";
import LeadDetail from "../pages/Dashboard/LeadDetail";
import Deals from "../pages/Dashboard/Deals";
import Activities from "../pages/Dashboard/Activities";
import Calendar from "../pages/Dashboard/Calendar";
import Billing from "../pages/Dashboard/Billing";
import Team from "../pages/Dashboard/Team";
import Templates from "../pages/Dashboard/Templates";
import Sequences from "../pages/Dashboard/Sequences";
import Workflows from "../pages/Dashboard/Workflows";
import Reports from "../pages/Dashboard/Reports";
import Integrations from "../pages/Dashboard/Integrations";
import { ApiKeys, Webhooks } from "../pages/Dashboard/ApiKeys";
import { Usage, Audit, Sessions, TwoFactor } from "../pages/Dashboard/Settings";
import { Changelog, Onboarding, NotificationPreferences, DataExport } from "../pages/Dashboard/Extras";
import AdminDashboard from "../pages/Dashboard/AdminDashboard";
import Quotes from "../pages/Dashboard/Quotes";
import QuoteDetail from "../pages/Dashboard/QuoteDetail";
import Products from "../pages/Dashboard/Products";
import Playbooks from "../pages/Dashboard/Playbooks";
import Analytics from "../pages/Dashboard/Analytics";
import Contacts from "../pages/Dashboard/Contacts";
import Quotas from "../pages/Dashboard/Quotas";
import Commissions from "../pages/Dashboard/Commissions";
import Territories from "../pages/Dashboard/Territories";
import Calls from "../pages/Dashboard/Calls";
import Documents from "../pages/Dashboard/Documents";
import Contracts from "../pages/Dashboard/Contracts";
import Tickets from "../pages/Dashboard/Tickets";
import Surveys from "../pages/Dashboard/Surveys";
import Campaigns from "../pages/Dashboard/Campaigns";
import KB from "../pages/Dashboard/KB";
import HealthScores from "../pages/Dashboard/HealthScores";
import AIInsights from "../pages/Dashboard/AIInsights";

import EmailSearch from "../components/Tools/Email/EmailSearch";
import DomainSearch from "../components/Tools/Domain/DomainSearch";
import DatabaseSearch from "../components/Tools/Database/DatabaseSearch";
import URLSearch from "../components/Tools/SocialUrl/SocialUrlSearch";
import IntelHub from "../components/Tools/IntelHub/IntelHub";
import Settings1 from "../components/Tools/Settings1/Settings1";
import Notifications from "../components/Tools/Notifications/Notification";

import InsightDashboard from "../modules/InsightDashboard/Insight";
import {
  OrganizationsList, AddOrganization, EditOrganization, OrganizationDetails,
} from "../modules/Organization";

import CustomFields from "../pages/Dashboard/CustomFields";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useLayoutEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const App = () => (
    <ChatProvider>
      <BrowserRouter>
        <ScrollToTop />
      <Routes>
        <Route path="/" element={<ErrorBoundary><RootRedirect /></ErrorBoundary>} />
        <Route path="/login-gateway" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
        <Route path="/signup" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/reset-password" element={<Navigate to="/login" replace />} />
        <Route path="/admin-login" element={<ErrorBoundary><AdminLogin /></ErrorBoundary>} />
        <Route path="/invite/accept" element={<ErrorBoundary><AcceptInvite /></ErrorBoundary>} />

        <Route element={<RequireAuth><ErrorBoundary><DashboardLayout /></ErrorBoundary></RequireAuth>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />

          <Route path="/insights" element={<InsightDashboard />} />
          <Route path="/insights/reports" element={<InsightDashboard />} />
          <Route path="/insights/trend-analysis" element={<InsightDashboard />} />
          <Route path="/insights/feedback" element={<InsightDashboard />} />

          {/* Legacy analytics dashboard route */}
          <Route path="/analytics/dashboard" element={<Navigate to="/dashboard" replace />} />

          {/* CRM */}
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadDetail />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/quotes/:id" element={<QuoteDetail />} />
          <Route path="/products" element={<Products />} />
          <Route path="/playbooks" element={<Playbooks />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/calendar" element={<Calendar />} />

          <Route path="/organizations" element={<OrganizationsList />} />
          <Route path="/organizations/add" element={<AddOrganization />} />
          <Route path="/organizations/:id" element={<OrganizationDetails />} />
          <Route path="/organizations/:id/edit" element={<EditOrganization />} />

          <Route path="/contacts" element={<Contacts />} />
          <Route path="/territories" element={<Territories />} />
          <Route path="/quotas" element={<Quotas />} />
          <Route path="/commissions" element={<Commissions />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/surveys" element={<Surveys />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/kb" element={<KB />} />
          <Route path="/health-scores" element={<HealthScores />} />
          <Route path="/ai-insights" element={<AIInsights />} />

          <Route path="/tools/email" element={<IntelHub defaultModule="email_intelligence" />} />
          <Route path="/tools/domain" element={<IntelHub defaultModule="domain_intelligence" />} />
          <Route path="/tools/database" element={<IntelHub defaultModule="person_search" />} />
          <Route path="/tools/url" element={<IntelHub defaultModule="social_media_search" />} />
          <Route path="/tools/intel" element={<IntelHub />} />

          {/* Automation */}
          <Route path="/templates" element={<Templates />} />
          <Route path="/sequences" element={<Sequences />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/custom-fields" element={<CustomFields />} />

          {/* Insights & reports */}
          <Route path="/reports" element={<Reports />} />
          <Route path="/changelog" element={<Changelog />} />

          {/* Team & billing */}
          <Route path="/team" element={<Team />} />
          <Route path="/billing" element={<Billing />} />

          {/* Developer */}
          <Route path="/api-keys" element={<ApiKeys />} />
          <Route path="/webhooks" element={<Webhooks />} />
          <Route path="/integrations" element={<Integrations />} />

          {/* Account */}
          <Route path="/usage" element={<Usage />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/notifications-prefs" element={<NotificationPreferences />} />
          <Route path="/data" element={<DataExport />} />
          <Route path="/settings" element={<Settings1 />} />
          <Route path="/settings/sessions" element={<Sessions />} />
          <Route path="/settings/2fa" element={<TwoFactor />} />

          <Route path="/admin-dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="/admin" element={<Navigate to="/admin-dashboard" replace />} />

          <Route path="/notifications" element={<Notifications />} />
          <Route path="/Maindashboard" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatBot />
      <CommandPalette />
    </BrowserRouter>
    </ChatProvider>
);

const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const RequireAdmin = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role !== "ADMIN") return <Navigate to="/" replace />;
  return children;
};

const RootRedirect = () => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
    </div>
  );
  if (isAuthenticated) {
    // Role-based redirect: ADMIN users go to admin dashboard
    if (user?.role === "ADMIN") return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <ErrorBoundary><Landing /></ErrorBoundary>;
};

export default App;
