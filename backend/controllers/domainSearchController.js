const dns = require("dns").promises;
const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const { dispatchNotification } = require("../services/notificationService");
const { recordAudit } = require("../services/auditService");
const { incrementUsage } = require("../services/usageService");
const { publish } = require("../services/webhookService");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");

const normalizeDomain = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) throw new AppError("A domain is required.", 400);
  const sanitized = trimmed.replace(/^https?:\/\//i, "").split("/")[0].split("?")[0];
  if (!sanitized.includes(".")) throw new AppError("Please enter a valid domain name.", 400);
  return sanitized.toLowerCase();
};

const domainSearch = asyncHandler(async (req, res) => {
  const domain = normalizeDomain(req.body.domain);
  const dnsRecords = { A: [], MX: [], NS: [], TXT: [] };
  let expirationDate = null;
  let status = "resolved";
  let registrar = null;
  let ip = null;

  const resolvers = await Promise.allSettled([
    dns.resolve4(domain).catch(() => []),
    dns.resolveMx(domain).catch(() => []),
    dns.resolveNs(domain).catch(() => []),
    dns.resolveTxt(domain).catch(() => []),
  ]);
  if (resolvers[0].status === "fulfilled") {
    dnsRecords.A = resolvers[0].value;
    if (resolvers[0].value.length) ip = resolvers[0].value[0];
  }
  if (resolvers[1].status === "fulfilled") {
    dnsRecords.MX = resolvers[1].value.map((r) => ({ exchange: r.exchange, preference: r.priority }));
  } else if (status === "resolved") {
    status = "partial";
  }
  if (resolvers[2].status === "fulfilled") {
    dnsRecords.NS = resolvers[2].value;
  } else if (status === "resolved") {
    status = "partial";
  }
  if (resolvers[3].status === "fulfilled") {
    dnsRecords.TXT = resolvers[3].value.flat();
  }
  if (dnsRecords.A.length === 0 && dnsRecords.MX.length === 0 && dnsRecords.NS.length === 0) {
    status = "lookup_failed";
  }

  const record = await prisma.domainSearch.create({
    data: {
      domain,
      status,
      expirationDate,
      dnsRecords,
      userId: req.user.id,
      orgId: req.orgId,
    },
  });
  await prisma.analyticsEvent.create({
    data: { userId: req.user.id, orgId: req.orgId, type: "DOMAIN_SEARCH", resource: "domain" },
  });
  await incrementUsage({ userId: req.user.id, orgId: req.orgId, resource: "searches" });
  await dispatchNotification({
    userId: req.user.id,
    orgId: req.orgId,
    type: "DOMAIN_SEARCH",
    category: "system",
    message: `Domain lookup completed for ${domain}.`,
    link: "/app/search/domain",
    metadata: { status, recordId: record.id, ip },
  });
  await recordAudit({
    userId: req.user.id, orgId: req.orgId,
    action: "search.domain", entityType: "DomainSearch", entityId: record.id,
  });
  await publish({ orgId: req.orgId, event: "SEARCH_COMPLETED", payload: { type: "domain", domain, status } });
  return response.success(res, { domain, status, expirationDate, dnsRecords, ip, registrar, searchedAt: record.createdAt });
});

const history = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const [items, total] = await Promise.all([
    prisma.domainSearch.findMany({
      where: { orgId: req.orgId },
      orderBy: { createdAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.domainSearch.count({ where: { orgId: req.orgId } }),
  ]);
  return response.paginated(res, items, total, page, limit);
});

module.exports = { domainSearch, history };
