const dns = require("dns").promises;
const { prisma } = require("../config/postgres");
const { createNotification } = require("../services/notificationService");
const { recordAudit } = require("../services/auditService");
const { incrementUsage } = require("../services/usageService");
const { publish } = require("../services/webhookService");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { AppError } = require("../middleware/errorHandler");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isDisposable = (domain) => {
  // Lightweight disposable email check (extend in production).
  const list = new Set(["mailinator.com", "guerrillamail.com", "tempmail.io", "10minutemail.com"]);
  return list.has(domain.toLowerCase());
};

const emailSearch = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!emailRegex.test(email)) throw new AppError("A valid email address is required.", 400);
  const domain = email.split("@")[1];

  const [mxRecords, aRecords] = await Promise.allSettled([
    dns.resolveMx(domain),
    dns.resolve4(domain).catch(() => []),
  ]);
  const mx = mxRecords.status === "fulfilled" ? mxRecords.value : [];
  const a = aRecords.status === "fulfilled" ? aRecords.value : [];
  const hasMx = mx.length > 0;
  const hasA = a.length > 0;
  let deliverability = "deliverable";
  if (!hasMx && !hasA) deliverability = "undeliverable";
  else if (!hasMx) deliverability = "no_mx";
  else if (isDisposable(domain)) deliverability = "disposable";

  const record = await prisma.emailSearch.create({
    data: { email, domain, valid: hasMx || hasA, verifiedBy: "dns", userId: req.user.id, orgId: req.orgId },
  });
  await prisma.analyticsEvent.create({
    data: { userId: req.user.id, orgId: req.orgId, type: "EMAIL_SEARCH", resource: "email" },
  });
  await incrementUsage({ userId: req.user.id, orgId: req.orgId, resource: "searches" });
  await createNotification({
    userId: req.user.id,
    type: "EMAIL_SEARCH",
    message: `Email lookup completed for ${email}.`,
    link: "/app/search/email",
    metadata: { deliverability, recordId: record.id },
  });
  await recordAudit({
    userId: req.user.id, orgId: req.orgId,
    action: "search.email", entityType: "EmailSearch", entityId: record.id,
  });
  await publish({ orgId: req.orgId, event: "SEARCH_COMPLETED", payload: { type: "email", email, deliverability } });
  return response.success(res, {
    email,
    domain,
    valid: hasMx || hasA,
    deliverability,
    mxRecordCount: mx.length,
    aRecordCount: a.length,
    disposable: isDisposable(domain),
    searchedAt: record.createdAt,
  });
});

const history = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const [items, total] = await Promise.all([
    prisma.emailSearch.findMany({
      where: { orgId: req.orgId },
      orderBy: { createdAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.emailSearch.count({ where: { orgId: req.orgId } }),
  ]);
  return response.paginated(res, items, total, page, limit);
});

module.exports = { emailSearch, history };
