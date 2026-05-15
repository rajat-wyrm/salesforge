const { prisma } = require("../config/postgres");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

const exportOrgData = asyncHandler(async (req, res) => {
  const orgId = req.orgId;
  const [org, users, leads, deals, activities, webhooks, apiKeys, workflows, sequences, templates, comments, notifications] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.user.findMany({ where: { organizationId: orgId } }),
    prisma.lead.findMany({ where: { orgId } }),
    prisma.deal.findMany({ where: { orgId } }),
    prisma.activity.findMany({ where: { orgId } }),
    prisma.webhook.findMany({ where: { orgId } }),
    prisma.apiKey.findMany({ where: { orgId } }),
    prisma.workflow.findMany({ where: { orgId } }),
    prisma.sequence.findMany({ where: { orgId } }),
    prisma.emailTemplate.findMany({ where: { orgId } }),
    prisma.comment.findMany({ where: { orgId } }),
    prisma.notification.findMany({ where: { userId: req.user.id } }),
  ]);
  const payload = {
    exportedAt: new Date().toISOString(),
    organization: org,
    users: users.map((u) => ({ ...u, password: undefined })),
    leads, deals, activities, webhooks, apiKeys: apiKeys.map((k) => ({ ...k, keyHash: undefined })),
    workflows, sequences, templates, comments, notifications,
  };
  await recordAudit({ userId: req.user.id, orgId, action: "gdpr.export", entityType: "Organization", entityId: orgId });
  res.setHeader("Content-Disposition", `attachment; filename="salesforge-export-${orgId}-${Date.now()}.json"`);
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(payload, null, 2));
});

const deleteAccount = asyncHandler(async (req, res) => {
  const { password, confirmation } = req.body;
  if (confirmation !== "DELETE") throw new Error("Type DELETE to confirm");
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const bcrypt = require("bcryptjs");
  if (!password || !(await bcrypt.compare(password, user.password))) throw new Error("Password is incorrect");
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.apiKey.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);
  return response.success(res, { message: "Account deleted." });
});

module.exports = { exportOrgData, deleteAccount };
