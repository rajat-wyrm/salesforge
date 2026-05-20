// Contact service - manages people at companies.
// Contacts are derived from Organization's contactName/contactEmail and the
// Lead model. We expose a contact list, create, update, and remove that
// writes back to the Organization and creates a Lead for outreach tracking.
const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

const toContact = (org) => ({
  id: org.id,
  firstName: (org.contactName || "").split(" ")[0] || "—",
  lastName: (org.contactName || "").split(" ").slice(1).join(" ") || "—",
  email: org.contactEmail,
  phone: null,
  companyId: org.id,
  companyName: org.name,
  jobTitle: "Primary Contact",
  status: org.status || "active",
  createdAt: org.createdAt,
  updatedAt: org.updatedAt,
});

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, status, sortBy = "createdAt", order = "desc" } = req.query;
  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { contactEmail: { contains: search, mode: "insensitive" } },
      { contactName: { contains: search, mode: "insensitive" } },
    ];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({
      where, orderBy: { [sortBy]: order }, skip, take: Number(limit),
    }),
    prisma.organization.count({ where }),
  ]);
  const contacts = orgs.filter((o) => o.contactEmail || o.contactName).map(toContact);
  return response.paginated(res, contacts, total, page, limit);
});

const get = asyncHandler(async (req, res) => {
  const org = await prisma.organization.findFirst({
    where: { id: Number(req.params.id) },
  });
  if (!org) throw new AppError("Contact not found.", 404);
  const contact = toContact(org);
  contact.company = { id: org.id, name: org.name, industry: org.type, website: org.website };
  return response.success(res, contact);
});

const create = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, companyId, jobTitle, department, notes } = req.body;
  if (!firstName && !lastName) throw new AppError("firstName or lastName is required.", 400);
  if (!companyId) throw new AppError("companyId is required.", 400);

  const org = await prisma.organization.findFirst({ where: { id: Number(companyId) } });
  if (!org) throw new AppError("Company not found.", 404);

  const fullName = `${firstName || ""} ${lastName || ""}`.trim();
  await prisma.organization.update({
    where: { id: org.id },
    data: {
      contactName: fullName,
      contactEmail: email || org.contactEmail,
    },
  });

  if (email) {
    try {
      await prisma.lead.upsert({
        where: { email: email.toLowerCase() },
        create: {
          orgId: req.orgId,
          name: fullName,
          email: email.toLowerCase(),
          phone: phone || null,
          companyName: org.name,
          jobTitle: jobTitle || null,
          status: "new",
          source: "contact",
          addedById: req.user.id,
        },
        update: {
          name: fullName,
          phone: phone || undefined,
          companyName: org.name,
          jobTitle: jobTitle || undefined,
        },
      });
    } catch (e) { /* lead may already exist */ }
  }

  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "contact.create", entityType: "Contact", entityId: org.id, metadata: { name: fullName, email } });
  return response.created(res, {
    id: org.id,
    firstName, lastName, email, phone,
    companyId: org.id, companyName: org.name,
    jobTitle: jobTitle || "Primary Contact",
    status: "active",
  });
});

const update = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, jobTitle, notes } = req.body;
  const org = await prisma.organization.findFirst({ where: { id: Number(req.params.id) } });
  if (!org) throw new AppError("Contact not found.", 404);

  const fullName = firstName || lastName ? `${firstName || ""} ${lastName || ""}`.trim() : org.contactName;
  await prisma.organization.update({
    where: { id: org.id },
    data: {
      contactName: fullName,
      contactEmail: email !== undefined ? email : org.contactEmail,
    },
  });
  return response.success(res, { message: "Contact updated." });
});

const remove = asyncHandler(async (req, res) => {
  const org = await prisma.organization.findFirst({ where: { id: Number(req.params.id) } });
  if (!org) throw new AppError("Contact not found.", 404);
  await prisma.organization.update({
    where: { id: org.id },
    data: { contactName: null, contactEmail: null },
  });
  return response.success(res, { message: "Contact removed." });
});

const metrics = asyncHandler(async (req, res) => {
  const orgs = await prisma.organization.findMany({
    select: { contactEmail: true, contactName: true, createdAt: true, status: true },
  });
  const total = orgs.filter((o) => o.contactEmail || o.contactName).length;
  const thisMonth = orgs.filter((o) => {
    const d = new Date(o.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  return response.success(res, { total, thisMonth, totalOrgs: orgs.length });
});

module.exports = { list, get, create, update, remove, metrics };
