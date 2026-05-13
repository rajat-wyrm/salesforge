const { prisma } = require("../config/postgres");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { AppError } = require("../middleware/errorHandler");
const { recordAudit } = require("../services/auditService");
const { createNotification } = require("../services/notificationService");
const { recordActivity } = require("../services/leadActivityService");
const { publish } = require("../services/webhookService");
const { incrementUsage } = require("../services/usageService");
const slugify = require("../utils/slugify");

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || ""));

const importFromIntegration = asyncHandler(async (req, res) => {
  const { provider, items = [] } = req.body;
  if (!provider || !Array.isArray(items)) throw new AppError("provider and items are required.", 400);
  const results = { created: 0, updated: 0, skipped: 0, errors: [] };
  for (const [idx, item] of items.entries()) {
    try {
      const email = (item.email || "").toLowerCase().trim();
      if (!isEmail(email)) {
        results.skipped += 1;
        results.errors.push({ idx, error: "Invalid email" });
        continue;
      }
      const existing = await prisma.lead.findUnique({ where: { email } });
      const data = {
        name: item.name || item.firstName || email.split("@")[0],
        email,
        phone: item.phone || null,
        companyName: item.company || null,
        jobTitle: item.jobTitle || null,
        source: provider,
        orgId: req.orgId,
        addedById: req.user.id,
      };
      if (existing) {
        await prisma.lead.update({ where: { id: existing.id }, data });
        results.updated += 1;
      } else {
        const lead = await prisma.lead.create({ data });
        await recordActivity({
          leadId: lead.id, userId: req.user.id, orgId: req.orgId,
          type: "CREATED", title: `Imported from ${provider}`,
        });
        results.created += 1;
      }
    } catch (e) {
      results.errors.push({ idx, error: e.message });
    }
  }
  await recordAudit({
    userId: req.user.id, orgId: req.orgId,
    action: `integration.${provider}.import`, entityType: "Integration",
    metadata: results,
  });
  await publish({ orgId: req.orgId, event: "INTEGRATION_SYNCED", payload: { provider, ...results } });
  await createNotification({
    userId: req.user.id,
    type: "INTEGRATION_SYNCED",
    message: `${provider} import: ${results.created} created, ${results.updated} updated.`,
    link: "/app/leads",
    metadata: { provider, results },
  });
  return response.success(res, results);
});

const listProviders = (req, res) =>
  response.success(res, {
    providers: [
      { id: "hubspot", name: "HubSpot", enabled: !!process.env.HUBSPOT_ACCESS_TOKEN, configured: !!process.env.HUBSPOT_ACCESS_TOKEN },
      { id: "salesforce", name: "Salesforce", enabled: !!process.env.SALESFORCE_ACCESS_TOKEN, configured: !!process.env.SALESFORCE_ACCESS_TOKEN },
      { id: "csv", name: "CSV Upload", enabled: true, configured: true },
    ],
  });

module.exports = { importFromIntegration, listProviders };
