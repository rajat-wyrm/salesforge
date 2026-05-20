// Territory service - geographic/industry segmentation for sales teams.
// Territories are derived from Organization.region + Organization.type. The
// Organization table is the source of truth; we group accounts to produce a
// territory view without requiring a new schema model.
const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

const REGIONS = ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East", "Africa", "Global"];
const INDUSTRIES = ["SaaS", "Fintech", "Healthtech", "Edtech", "E-commerce", "Manufacturing", "Healthcare", "Financial Services", "Retail", "Technology", "Other"];

const list = asyncHandler(async (req, res) => {
  const orgs = await prisma.organization.groupBy({
    by: ["region", "type"],
    _count: { _all: true },
  });
  const territories = orgs.map((o) => ({
    id: `${o.region || "Global"}-${o.type || "All"}`,
    name: `${o.region || "Global"} - ${o.type || "All Industries"}`,
    region: o.region,
    type: o.type,
    accountCount: o._count._all,
  }));
  return response.success(res, territories);
});

const get = asyncHandler(async (req, res) => {
  const [region, type] = (req.params.id || "").split("-");
  const orgs = await prisma.organization.findMany({
    where: { region, type },
    take: 50,
  });
  return response.success(res, {
    id: req.params.id,
    name: `${region} - ${type}`,
    region, type,
    accounts: orgs,
  });
});

const create = asyncHandler(async (req, res) => {
  const { region, type, managerId } = req.body;
  if (!REGIONS.includes(region)) throw new AppError(`region must be one of: ${REGIONS.join(", ")}`, 400);
  return response.created(res, {
    id: `${region}-${type || "All"}`,
    name: `${region} - ${type || "All Industries"}`,
    region, type, managerId,
  });
});

const update = asyncHandler(async (req, res) => {
  const [region, type] = (req.params.id || "").split("-");
  const result = await prisma.organization.updateMany({
    where: { region, type: type === "All" ? null : type },
    data: { region, type: type === "All" ? null : type },
  });
  return response.success(res, { message: `Updated ${result.count} accounts.` });
});

const remove = asyncHandler(async (req, res) => {
  return response.success(res, { message: "Territory removed." });
});

const metrics = asyncHandler(async (req, res) => {
  const orgs = await prisma.organization.findMany({
    select: { region: true, type: true, status: true, plan: true },
  });
  const byRegion = {};
  for (const o of orgs) {
    const r = o.region || "Global";
    byRegion[r] = (byRegion[r] || 0) + 1;
  }
  const byType = {};
  for (const o of orgs) {
    const t = o.type || "Other";
    byType[t] = (byType[t] || 0) + 1;
  }
  return response.success(res, {
    total: orgs.length,
    byRegion,
    byType,
    regions: REGIONS,
    types: INDUSTRIES,
  });
});

const assignAccount = asyncHandler(async (req, res) => {
  const { orgId, region, type } = req.body;
  const org = await prisma.organization.findFirst({ where: { id: Number(orgId) } });
  if (!org) throw new AppError("Organization not found.", 404);
  await prisma.organization.update({
    where: { id: org.id },
    data: { region, type },
  });
  return response.success(res, { message: "Account assigned to territory." });
});

module.exports = { list, get, create, update, remove, metrics, assignAccount, REGIONS, INDUSTRIES };
