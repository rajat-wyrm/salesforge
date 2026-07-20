
import { api, unwrap, unwrapList, tokenStore } from "../lib/api";
export const leadService = {
  list: (params) => unwrapList(api.get("/leads", { params })),
  stats: () => unwrap(api.get("/leads/stats")),
  get: (id) => unwrap(api.get(`/leads/${id}`)),
  create: (data) => unwrap(api.post("/leads", data)),
  update: (id, data) => unwrap(api.patch(`/leads/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/leads/${id}`)),
  bulkUpdate: (data) => unwrap(api.post("/leads/bulk", data)),
  bulkDelete: (ids) => unwrap(api.post("/leads/bulk-delete", { ids })),
  notes: (leadId) => unwrap(api.get(`/lead-notes/${leadId}/notes`)),
  addNote: (leadId, body) => unwrap(api.post(`/lead-notes/${leadId}/notes`, { body })),
  updateNote: (leadId, id, body) => unwrap(api.patch(`/lead-notes/${leadId}/notes/${id}`, { body })),
  removeNote: (leadId, id) => unwrap(api.delete(`/lead-notes/${leadId}/notes/${id}`)),
  tasks: (leadId) => unwrap(api.get(`/lead-tasks/${leadId}/tasks`)),
  createTask: (leadId, data) => unwrap(api.post(`/lead-tasks/${leadId}/tasks`, data)),
  updateTask: (leadId, id, data) => unwrap(api.patch(`/lead-tasks/${leadId}/tasks/${id}`, data)),
  removeTask: (leadId, id) => unwrap(api.delete(`/lead-tasks/${leadId}/tasks/${id}`)),
  myTasks: (params) => unwrapList(api.get("/lead-tasks/me/tasks", { params })),
  activity: (leadId, params) => unwrapList(api.get(`/lead-activity/${leadId}/activity`, { params })),
  import: (csv) => unwrap(api.post("/csv/leads/import", { csv })),
  exportUrl: (filters = {}) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== "" && v !== null)));
    const token = typeof window !== "undefined" ? localStorage.getItem("salesforge.token") : null;
    if (token) q.append("token", token);
    return `${api.defaults.baseURL}/csv/leads/export?${q.toString()}`;
  },
};

export const tagService = {
  list: () => unwrap(api.get("/tags")),
  create: (data) => unwrap(api.post("/tags", data)),
  update: (id, data) => unwrap(api.patch(`/tags/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/tags/${id}`)),
  attach: (leadId, tagId) => unwrap(api.post(`/tags/leads/${leadId}/attach`, { tagId })),
  detach: (leadId, tagId) => unwrap(api.delete(`/tags/leads/${leadId}/detach/${tagId}`)),
  forLead: (leadId) => unwrap(api.get(`/tags/leads/${leadId}`)),
};

export const teamService = {
  org: () => unwrap(api.get("/team/org")),
  updateOrg: (data) => unwrap(api.patch("/team/org", data)),
  members: () => unwrap(api.get("/team/members")),
  updateMember: (id, data) => unwrap(api.patch(`/team/members/${id}`, data)),
  removeMember: (id) => unwrap(api.delete(`/team/members/${id}`)),
  invites: () => unwrap(api.get("/team/invites")),
  sendInvite: (data) => unwrap(api.post("/team/invites", data)),
  revokeInvite: (id) => unwrap(api.delete(`/team/invites/${id}`)),
  acceptInvite: (token) => unwrap(api.post("/team/invites/accept", { token })),
  previewInvite: (token) => unwrap(api.get(`/team/invites/preview/${token}`)),
};

export const billingService = {
  plans: () => unwrap(api.get("/billing/plans")),
  subscription: () => unwrap(api.get("/billing/subscription")),
  createOrder: (data) => unwrap(api.post("/billing/razorpay/order", data)),
  verifyPayment: (data) => unwrap(api.post("/billing/razorpay/verify", data)),
  cancel: () => unwrap(api.post("/billing/cancel")),
  payments: (params) => unwrapList(api.get("/billing/payments", { params })),
  usage: () => unwrap(api.get("/billing/usage")),
};

export const apiKeyService = {
  list: () => unwrap(api.get("/api-keys")),
  create: (data) => unwrap(api.post("/api-keys", data)),
  revoke: (id) => unwrap(api.delete(`/api-keys/${id}`)),
};

export const webhookService = {
  list: () => unwrap(api.get("/webhooks")),
  create: (data) => unwrap(api.post("/webhooks", data)),
  update: (id, data) => unwrap(api.patch(`/webhooks/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/webhooks/${id}`)),
  test: (id) => unwrap(api.post(`/webhooks/${id}/test`)),
  rotateSecret: (id) => unwrap(api.post(`/webhooks/${id}/rotate-secret`)),
  deliveries: (params) => unwrapList(api.get("/webhooks/deliveries", { params })),
};

export const savedSearchService = {
  list: (params) => unwrap(api.get("/saved-searches", { params })),
  create: (data) => unwrap(api.post("/saved-searches", data)),
  update: (id, data) => unwrap(api.patch(`/saved-searches/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/saved-searches/${id}`)),
};

export const analyticsService = {
  global: () => unwrap(api.get("/analytics/global")),
  me: () => unwrap(api.get("/analytics/me")),
  insights: () => unwrap(api.get("/analytics/insights")),
  funnel: () => unwrap(api.get("/analytics/funnel")),
  timeseries: (days) => unwrap(api.get("/analytics/timeseries", { params: { days } })),
};

export const usageService = {
  summary: () => unwrap(api.get("/usage/summary")),
  history: (params) => unwrap(api.get("/usage/history", { params })),
};

export const auditService = {
  list: (params) => unwrapList(api.get("/audit", { params })),
};

export const notificationService = {
  list: (params) => unwrap(api.get("/notifications", { params })),
  markRead: (id) => unwrap(api.patch(`/notifications/${id}/read`)),
  markAllRead: () => unwrap(api.patch("/notifications/read-all")),
  unreadCount: async () => {
    const data = await unwrap(api.get("/notifications", { params: { limit: 1 } }));
    return data?.summary?.unreadCount || 0;
  },
};

export const userService = {
  me: () => unwrap(api.get("/users/me")),
  updateMe: (data) => unwrap(api.patch("/users/me", data)),
};

export const sessionService = {
  list: () => unwrap(api.get("/sessions")),
  revoke: (id) => unwrap(api.delete(`/sessions/${id}`)),
  revokeAll: () => unwrap(api.post("/sessions/revoke-all")),
};

export const twoFactorService = {
  status: () => unwrap(api.get("/2fa/status")),
  setup: () => unwrap(api.post("/2fa/setup")),
  verify: (code) => unwrap(api.post("/2fa/verify", { code })),
  disable: (code) => unwrap(api.post("/2fa/disable", { code })),
  regenerateBackupCodes: (code) => unwrap(api.post("/2fa/backup-codes/regenerate", { code })),
};

export const integrationService = {
  list: () => unwrap(api.get("/integrations")),
  import: (provider, items) => unwrap(api.post("/integrations/import", { provider, items })),
};

export const searchService = {
  email: (email) => unwrap(api.post("/email-search", { email })),
  emailHistory: (params) => unwrapList(api.get("/email-search/history", { params })),
  domain: (domain) => unwrap(api.post("/domain-search", { domain })),
  domainHistory: (params) => unwrapList(api.get("/domain-search/history", { params })),
  social: (url) => unwrap(api.post("/social-search", { url })),
  socialHistory: () => unwrap(api.get("/social-search/history")),
};

export const aiService = {
  status: () => unwrap(api.get("/ai/status")),
  recommend: (data) => unwrap(api.post("/ai/recommend", data)),
  outreach: (data) => unwrap(api.post("/ai/outreach", data)),
  summarize: (text) => unwrap(api.post("/ai/summarize", { text })),
};

export const orgService = {
  list: (params) => unwrapList(api.get("/organizations", { params })),
  get: (id) => unwrap(api.get(`/organizations/${id}`)),
  update: (id, data) => unwrap(api.patch(`/organizations/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/organizations/${id}`)),
};

export const adminService = {
  login: (email, password) => unwrap(api.post("/admin/login", { email, password })),
  dashboard: () => unwrap(api.get("/admin/dashboard")),
  users: (params) => unwrapList(api.get("/admin/users", { params })),
  updateUser: (id, data) => unwrap(api.patch(`/admin/users/${id}`, data)),
  platformStats: () => unwrap(api.get("/admin/platform-stats")),
};

export const dealService = {
  list: (params) => unwrapList(api.get("/deals", { params })),
  get: (id) => unwrap(api.get(`/deals/${id}`)),
  create: (data) => unwrap(api.post("/deals", data)),
  update: (id, data) => unwrap(api.patch(`/deals/${id}`, data)),
  move: (id, data) => unwrap(api.post(`/deals/${id}/move`, data)),
  remove: (id) => unwrap(api.delete(`/deals/${id}`)),
  kanban: () => unwrap(api.get("/deals/kanban")),
  metrics: () => unwrap(api.get("/deals/metrics")),
  stages: () => unwrap(api.get("/deals/stages")),
  createStage: (data) => unwrap(api.post("/deals/stages", data)),
  updateStage: (id, data) => unwrap(api.patch(`/deals/stages/${id}`, data)),
  deleteStage: (id) => unwrap(api.delete(`/deals/stages/${id}`)),
  reorderStages: (order) => unwrap(api.patch("/deals/stages/reorder", { order })),
};

export const activityService = {
  list: (params) => unwrapList(api.get("/activities", { params })),
  today: () => unwrap(api.get("/activities/today")),
  upcoming: () => unwrap(api.get("/activities/upcoming")),
  overdue: () => unwrap(api.get("/activities/overdue")),
  create: (data) => unwrap(api.post("/activities", data)),
  update: (id, data) => unwrap(api.patch(`/activities/${id}`, data)),
  complete: (id, outcome) => unwrap(api.post(`/activities/${id}/complete`, { outcome })),
  remove: (id) => unwrap(api.delete(`/activities/${id}`)),
};

export const calendarService = {
  list: (params) => unwrap(api.get("/calendar", { params })),
  team: (params) => unwrap(api.get("/calendar/team", { params })),
  create: (data) => unwrap(api.post("/calendar", data)),
  update: (id, data) => unwrap(api.patch(`/calendar/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/calendar/${id}`)),
};

export const templateService = {
  list: (params) => unwrap(api.get("/templates", { params })),
  categories: () => unwrap(api.get("/templates/categories")),
  create: (data) => unwrap(api.post("/templates", data)),
  update: (id, data) => unwrap(api.patch(`/templates/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/templates/${id}`)),
  use: (id, variables) => unwrap(api.post(`/templates/${id}/use`, { variables })),
};

export const sequenceService = {
  list: (params) => unwrap(api.get("/sequences", { params })),
  get: (id) => unwrap(api.get(`/sequences/${id}`)),
  create: (data) => unwrap(api.post("/sequences", data)),
  update: (id, data) => unwrap(api.patch(`/sequences/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/sequences/${id}`)),
  enroll: (id, data) => unwrap(api.post(`/sequences/${id}/enroll`, data)),
  metrics: (id) => unwrap(api.get(`/sequences/${id}/metrics`)),
};

export const workflowService = {
  list: () => unwrap(api.get("/workflows")),
  get: (id) => unwrap(api.get(`/workflows/${id}`)),
  create: (data) => unwrap(api.post("/workflows", data)),
  update: (id, data) => unwrap(api.patch(`/workflows/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/workflows/${id}`)),
  toggle: (id) => unwrap(api.post(`/workflows/${id}/toggle`)),
  test: (id) => unwrap(api.post(`/workflows/${id}/test`)),
  runs: (params) => unwrapList(api.get("/workflows/runs", { params })),
  templates: () => unwrap(api.get("/workflows/templates")),
};

export const customFieldService = {
  list: (params) => unwrap(api.get("/custom-fields", { params })),
  create: (data) => unwrap(api.post("/custom-fields", data)),
  update: (id, data) => unwrap(api.patch(`/custom-fields/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/custom-fields/${id}`)),
};

export const commentService = {
  list: (params) => unwrap(api.get("/comments", { params })),
  create: (data) => unwrap(api.post("/comments", data)),
  remove: (id) => unwrap(api.delete(`/comments/${id}`)),
};

export const notificationPrefService = {
  list: () => unwrap(api.get("/notification-preferences")),
  update: (preferences) => unwrap(api.put("/notification-preferences", { preferences })),
};

export const integrationMarketplaceService = {
  list: () => unwrap(api.get("/integrations-marketplace")),
  catalog: () => unwrap(api.get("/integrations-marketplace/catalog")),
  install: (data) => unwrap(api.post("/integrations-marketplace/install", data)),
  sync: (id) => unwrap(api.post(`/integrations-marketplace/${id}/sync`)),
  uninstall: (id) => unwrap(api.delete(`/integrations-marketplace/${id}`)),
};

export const forecastService = {
  list: (params) => unwrap(api.get("/forecasts", { params })),
  current: () => unwrap(api.get("/forecasts/current")),
  create: (data) => unwrap(api.post("/forecasts", data)),
  remove: (id) => unwrap(api.delete(`/forecasts/${id}`)),
};

export const reportService = {
  list: () => unwrap(api.get("/reports")),
  get: (id) => unwrap(api.get(`/reports/${id}`)),
  create: (data) => unwrap(api.post("/reports", data)),
  update: (id, data) => unwrap(api.patch(`/reports/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/reports/${id}`)),
  run: (id) => unwrap(api.post(`/reports/${id}/run`)),
  templates: () => unwrap(api.get("/reports/templates")),
};

export const onboardingService = {
  progress: () => unwrap(api.get("/onboarding/progress")),
  complete: (step) => unwrap(api.post(`/onboarding/complete/${step}`)),
  skip: (step) => unwrap(api.post(`/onboarding/skip/${step}`)),
  reset: () => unwrap(api.post("/onboarding/reset")),
};

export const changelogService = {
  list: () => unwrap(api.get("/changelog")),
};

export const gdprService = {
  exportUrl: () => {
    const token = tokenStore.get();
    return `${api.defaults.baseURL}/gdpr/export${token ? `?token=${encodeURIComponent(token)}` : ""}`;
  },
  deleteAccount: (password) => unwrap(api.post("/auth/delete-account", { password, confirmation: "DELETE" })),
};

export const productService = {
  list: (params) => unwrapList(api.get("/products", { params })),
  get: (id) => unwrap(api.get(`/products/${id}`)),
  create: (data) => unwrap(api.post("/products", data)),
  update: (id, data) => unwrap(api.patch(`/products/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/products/${id}`)),
  categories: () => unwrap(api.get("/products/categories")),
};

export const priceBookService = {
  list: () => unwrap(api.get("/price-books")),
  get: (id) => unwrap(api.get(`/price-books/${id}`)),
  create: (data) => unwrap(api.post("/price-books", data)),
  addEntry: (id, data) => unwrap(api.post(`/price-books/${id}/entries`, data)),
  removeEntry: (id, productId) => unwrap(api.delete(`/price-books/${id}/entries/${productId}`)),
  remove: (id) => unwrap(api.delete(`/price-books/${id}`)),
};

export const quoteService = {
  list: (params) => unwrapList(api.get("/quotes", { params })),
  get: (id) => unwrap(api.get(`/quotes/${id}`)),
  create: (data) => unwrap(api.post("/quotes", data)),
  update: (id, data) => unwrap(api.patch(`/quotes/${id}`, data)),
  updateStatus: (id, status, metadata) => unwrap(api.patch(`/quotes/${id}/status`, { status, metadata })),
  remove: (id) => unwrap(api.delete(`/quotes/${id}`)),
  metrics: () => unwrap(api.get("/quotes/metrics")),
};

export const playbookService = {
  list: (params) => unwrap(api.get("/playbooks", { params })),
  templates: () => unwrap(api.get("/playbooks/templates")),
  installTemplate: (name) => unwrap(api.post("/playbooks/install-template", { name })),
  get: (id) => unwrap(api.get(`/playbooks/${id}`)),
  create: (data) => unwrap(api.post("/playbooks", data)),
  update: (id, data) => unwrap(api.patch(`/playbooks/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/playbooks/${id}`)),
};

export const winLossService = {
  list: (params) => unwrapList(api.get("/win-loss", { params })),
  get: (id) => unwrap(api.get(`/win-loss/${id}`)),
  create: (data) => unwrap(api.post("/win-loss", data)),
  remove: (id) => unwrap(api.delete(`/win-loss/${id}`)),
  analytics: () => unwrap(api.get("/win-loss/analytics")),
};

export const emailTrackingService = {
  events: (params) => unwrapList(api.get("/email-tracking/events", { params })),
  analytics: () => unwrap(api.get("/email-tracking/analytics")),
  log: (data) => unwrap(api.post("/email-tracking/log", data)),
};

export const contactService = {
  list: (params) => unwrapList(api.get("/contacts", { params })),
  get: (id) => unwrap(api.get(`/contacts/${id}`)),
  create: (data) => unwrap(api.post("/contacts", data)),
  update: (id, data) => unwrap(api.patch(`/contacts/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/contacts/${id}`)),
  metrics: () => unwrap(api.get("/contacts/metrics")),
};

export const territoryService = {
  list: () => unwrap(api.get("/territories")),
  get: (id) => unwrap(api.get(`/territories/${id}`)),
  create: (data) => unwrap(api.post("/territories", data)),
  update: (id, data) => unwrap(api.patch(`/territories/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/territories/${id}`)),
  metrics: () => unwrap(api.get("/territories/metrics")),
  assignAccount: (data) => unwrap(api.post("/territories/assign", data)),
};

export const quotaService = {
  list: (params) => unwrap(api.get("/quotas", { params })),
  get: (id, params) => unwrap(api.get(`/quotas/${id}`, { params })),
  create: (data) => unwrap(api.post("/quotas", data)),
  update: (id, data) => unwrap(api.patch(`/quotas/${id}`, data)),
  remove: (id, params) => unwrap(api.delete(`/quotas/${id}`, { params })),
  metrics: (params) => unwrap(api.get("/quotas/metrics", { params })),
};

export const commissionService = {
  list: (params) => unwrap(api.get("/commissions", { params })),
  get: (userId, id) => unwrap(api.get(`/commissions/${userId}/${id}`)),
  create: (data) => unwrap(api.post("/commissions", data)),
  update: (userId, id, data) => unwrap(api.patch(`/commissions/${userId}/${id}`, data)),
  remove: (userId, id) => unwrap(api.delete(`/commissions/${userId}/${id}`)),
  metrics: () => unwrap(api.get("/commissions/metrics")),
};

export const callService = {
  list: (params) => unwrapList(api.get("/calls", { params })),
  get: (id) => unwrap(api.get(`/calls/${id}`)),
  create: (data) => unwrap(api.post("/calls", data)),
  update: (id, data) => unwrap(api.patch(`/calls/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/calls/${id}`)),
  metrics: () => unwrap(api.get("/calls/metrics")),
};

export const documentService = {
  list: (params) => unwrapList(api.get("/documents", { params })),
  get: (id) => unwrap(api.get(`/documents/${id}`)),
  upload: (formData) => unwrap(api.post("/documents", formData, { headers: { "Content-Type": "multipart/form-data" } })),
  download: (id) => api.get(`/documents/${id}/download`, { responseType: "blob" }),
  update: (id, data) => unwrap(api.patch(`/documents/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/documents/${id}`)),
  metrics: () => unwrap(api.get("/documents/metrics")),
};

export const contractService = {
  list: (params) => unwrapList(api.get("/contracts", { params })),
  get: (id) => unwrap(api.get(`/contracts/${id}`)),
  create: (data) => unwrap(api.post("/contracts", data)),
  update: (id, data) => unwrap(api.patch(`/contracts/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/contracts/${id}`)),
  metrics: () => unwrap(api.get("/contracts/metrics")),
};

export const surveyService = {
  list: (params) => unwrapList(api.get("/surveys", { params })),
  get: (id) => unwrap(api.get(`/surveys/${id}`)),
  create: (data) => unwrap(api.post("/surveys", data)),
  update: (id, data) => unwrap(api.patch(`/surveys/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/surveys/${id}`)),
  respond: (id, data) => unwrap(api.post(`/surveys/${id}/respond`, data)),
  analytics: () => unwrap(api.get("/surveys/analytics")),
};

export const ticketService = {
  list: (params) => unwrapList(api.get("/tickets", { params })),
  get: (id) => unwrap(api.get(`/tickets/${id}`)),
  create: (data) => unwrap(api.post("/tickets", data)),
  update: (id, data) => unwrap(api.patch(`/tickets/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/tickets/${id}`)),
  addComment: (id, data) => unwrap(api.post(`/tickets/${id}/comment`, data)),
  metrics: () => unwrap(api.get("/tickets/metrics")),
};

export const campaignService = {
  list: (params) => unwrapList(api.get("/campaigns", { params })),
  get: (id) => unwrap(api.get(`/campaigns/${id}`)),
  create: (data) => unwrap(api.post("/campaigns", data)),
  update: (id, data) => unwrap(api.patch(`/campaigns/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/campaigns/${id}`)),
  launch: (id) => unwrap(api.post(`/campaigns/${id}/launch`)),
  pause: (id) => unwrap(api.post(`/campaigns/${id}/pause`)),
  metrics: () => unwrap(api.get("/campaigns/metrics")),
};

export const kbService = {
  list: (params) => unwrapList(api.get("/kb", { params })),
  get: (id) => unwrap(api.get(`/kb/${id}`)),
  create: (data) => unwrap(api.post("/kb", data)),
  update: (id, data) => unwrap(api.patch(`/kb/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/kb/${id}`)),
  vote: (id, helpful) => unwrap(api.post(`/kb/${id}/vote`, { helpful })),
  metrics: () => unwrap(api.get("/kb/metrics")),
};

export const healthScoreService = {
  list: () => unwrapList(api.get("/health-scores")),
  get: (leadId) => unwrap(api.get(`/health-scores/${leadId}`)),
  recompute: (leadId) => unwrap(api.post(`/health-scores/${leadId}/recompute`)),
  analytics: () => unwrap(api.get("/health-scores/analytics")),
};

export const aiScoringService = {
  insights: () => unwrap(api.get("/ai-scoring/insights")),
  score: (id) => unwrap(api.post(`/ai-scoring/score/${id}`)),
  scoreBatch: (ids) => unwrap(api.post("/ai-scoring/score-batch", { ids })),
  scoreAll: () => unwrap(api.post("/ai-scoring/score-all")),
};

export const intelService = {
  search: (data) => unwrap(api.post("/intel/search", data)),
  history: (params) => unwrapList(api.get("/intel/history", { params })),
  togglePin: (id) => unwrap(api.patch(`/intel/history/${id}/pin`)),
  deleteHistory: (id) => unwrap(api.delete(`/intel/history/${id}`)),
  saved: () => unwrap(api.get("/intel/saved")),
  saveQuery: (data) => unwrap(api.post("/intel/saved", data)),
};