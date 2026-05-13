const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

const CATALOG = [
  { id: "slack", name: "Slack", description: "Send notifications and updates to your team channels.", category: "Communication", icon: "MessageSquare", popular: true, configFields: [{ key: "webhookUrl", label: "Incoming Webhook URL", type: "url" }] },
  { id: "gmail", name: "Gmail", description: "Send and track emails from your Gmail account.", category: "Email", icon: "Mail", popular: true, configFields: [{ key: "email", label: "Email address", type: "email" }] },
  { id: "outlook", name: "Microsoft Outlook", description: "Connect your Outlook account for email tracking.", category: "Email", icon: "Mail", configFields: [{ key: "email", label: "Email address", type: "email" }] },
  { id: "google_calendar", name: "Google Calendar", description: "Sync meetings and events with Google Calendar.", category: "Calendar", icon: "Calendar", popular: true },
  { id: "linkedin", name: "LinkedIn", description: "Enrich leads with LinkedIn profile data.", category: "Enrichment", icon: "Linkedin" },
  { id: "zoom", name: "Zoom", description: "Schedule and join Zoom meetings directly.", category: "Video", icon: "Video" },
  { id: "stripe", name: "Stripe", description: "Sync payments and subscriptions from Stripe.", category: "Billing", icon: "CreditCard" },
  { id: "hubspot", name: "HubSpot", description: "Two-way sync with HubSpot CRM.", category: "CRM", icon: "Briefcase", popular: true },
  { id: "salesforce", name: "Salesforce", description: "Two-way sync with Salesforce.", category: "CRM", icon: "Briefcase" },
  { id: "intercom", name: "Intercom", description: "Sync customer conversations and data.", category: "Support", icon: "MessageSquare" },
  { id: "zapier", name: "Zapier", description: "Connect to 5,000+ apps via Zapier.", category: "Automation", icon: "Workflow" },
  { id: "whatsapp", name: "WhatsApp", description: "Send WhatsApp messages to leads and customers.", category: "Communication", icon: "MessageSquare" },
];

const list = asyncHandler(async (req, res) => {
  const installed = await prisma.integration.findMany({ where: { orgId: req.orgId } });
  const result = CATALOG.map((c) => {
    const inst = installed.find((i) => i.provider === c.id);
    return { ...c, installed: !!inst, status: inst?.status, lastSyncAt: inst?.lastSyncAt, error: inst?.error, id: inst?.id };
  });
  return response.success(res, result);
});

const install = asyncHandler(async (req, res) => {
  const { provider, name, config, credentials } = req.body;
  const meta = CATALOG.find((c) => c.id === provider);
  if (!meta) throw new AppError("Unknown integration provider.", 400);
  const integration = await prisma.integration.upsert({
    where: { orgId_provider: { orgId: req.orgId, provider } },
    create: { orgId: req.orgId, userId: req.user.id, provider, name: name || meta.name, config, credentials, status: "connected", lastSyncAt: new Date() },
    update: { name: name || meta.name, config, credentials, status: "connected", error: null, lastSyncAt: new Date() },
  });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "integration.install", entityType: "Integration", entityId: integration.id, metadata: { provider } });
  return response.created(res, integration);
});

const uninstall = asyncHandler(async (req, res) => {
  const result = await prisma.integration.deleteMany({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (result.count === 0) throw new AppError("Integration not found.", 404);
  return response.success(res, { message: "Integration uninstalled." });
});

const sync = asyncHandler(async (req, res) => {
  const integration = await prisma.integration.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!integration) throw new AppError("Integration not found.", 404);
  // In a real system, this would kick off an actual sync job.
  await prisma.integration.update({ where: { id: integration.id }, data: { lastSyncAt: new Date(), status: "connected" } });
  return response.success(res, { message: "Sync started.", lastSyncAt: new Date() });
});

const config = (req, res) => response.success(res, { catalog: CATALOG });

module.exports = { list, install, uninstall, sync, config, CATALOG };
