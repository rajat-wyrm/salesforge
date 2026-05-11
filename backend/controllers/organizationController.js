const { prisma } = require("../config/postgres");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { AppError } = require("../middleware/errorHandler");
const { recordAudit } = require("../services/auditService");
const slugify = require("../utils/slugify");
const { publish } = require("../services/webhookService");

const buildOrgWhere = (orgId, search) => {
  const where = { OR: [{ id: orgId }, { id: { not: orgId } }] };
  // Show only same-org records by default; admin can see system-wide ones (id != orgId)
  delete where.OR;
  const base = { id: orgId };
  if (search) {
    base.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { website: { contains: search, mode: "insensitive" } },
      { region: { contains: search, mode: "insensitive" } },
      { contactName: { contains: search, mode: "insensitive" } },
    ];
  }
  return base;
};

const getAllOrganizations = asyncHandler(async (req, res) => {
  // Backwards-compat endpoint: returns the caller's organization. Multi-org UI uses /api/team/org.
  const org = await prisma.organization.findUnique({ where: { id: req.orgId } });
  return response.paginated(res, org ? [org] : [], org ? 1 : 0, 1, 12);
});

const getOrganizationById = asyncHandler(async (req, res) => {
  if (Number(req.params.id) !== req.orgId) throw new AppError("Organization not found.", 404);
  const org = await prisma.organization.findUnique({ where: { id: req.orgId } });
  if (!org) throw new AppError("Organization not found.", 404);
  return response.success(res, org);
});

const createOrganization = asyncHandler(async (req, res) => {
  // In this SaaS model users don't create orgs directly - they get a personal workspace on signup.
  throw new AppError("Organizations are created automatically. Invite teammates instead.", 400);
});

const updateOrganization = asyncHandler(async (req, res) => {
  if (req.params.id !== String(req.orgId)) throw new AppError("Organization not found.", 404);
  const allowed = ["name", "website", "region", "type", "contactName", "contactEmail", "logo"];
  const data = {};
  for (const key of allowed) if (req.body[key] !== undefined) data[key] = req.body[key];
  if (data.name) data.slug = `${slugify(data.name)}-${req.orgId}`;
  const org = await prisma.organization.update({ where: { id: req.orgId }, data });
  await recordAudit({
    userId: req.user.id,
    orgId: req.orgId,
    action: "organization.update",
    entityType: "Organization",
    entityId: org.id,
    metadata: { fields: Object.keys(data) },
  });
  return response.success(res, org);
});

const deleteOrganization = asyncHandler(async (req, res) => {
  if (req.params.id !== String(req.orgId)) throw new AppError("Organization not found.", 404);
  if (req.user.role !== "OWNER") throw new AppError("Only owners can delete the organization.", 403);
  // For safety: just mark canceled. A real production app would do soft-delete with grace period.
  await prisma.organization.update({
    where: { id: req.orgId },
    data: { status: "CANCELED" },
  });
  return response.success(res, { message: "Organization canceled." });
});

module.exports = {
  getAllOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  // Internal export for the webhook service
  publish,
};
