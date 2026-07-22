const { prisma } = require("../config/postgres");
const { dispatchNotification } = require("../services/notificationService");
const { updateLeadScore } = require("../services/leadScoringService");
const { recordActivity, diffLead, summarizeChanges } = require("../services/leadActivityService");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { AppError } = require("../middleware/errorHandler");
const { recordAudit } = require("../services/auditService");
const { incrementUsage, enforcePlanLimit } = require("../services/usageService");
const { publish } = require("../services/webhookService");

const LEAD_INCLUDE = {
  addedBy: { select: { id: true, name: true, email: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
  tags: { include: { tag: true } },
  _count: { select: { notes: true, tasks: true, activities: true } },
};

const buildLeadWhere = ({ search, status, source, tagId, assigneeId, scoreMin, scoreMax }) => {
  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { domain: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
      { jobTitle: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;
  if (source) where.source = source;
  if (assigneeId) where.assignedToId = Number(assigneeId);
  if (tagId) where.tags = { some: { tagId: Number(tagId) } };
  if (scoreMin !== undefined || scoreMax !== undefined) {
    where.score = {};
    if (scoreMin !== undefined) where.score.gte = Number(scoreMin);
    if (scoreMax !== undefined) where.score.lte = Number(scoreMax);
  }
  return where;
};

const mapCreateInput = (body) => ({
  name: body.name.trim(),
  email: body.email.toLowerCase(),
  phone: body.phone || null,
  domain: body.domain?.trim().toLowerCase() || null,
  status: body.status || "new",
  source: body.source || "other",
  engagement: body.engagement,
  jobTitle: body.jobTitle || null,
  managementLevel: body.managementLevel || null,
  department: body.department || null,
  location: body.location || null,
  industry: body.industry || null,
  skills: body.skills || null,
  companyLocation: body.companyLocation || null,
  companySize: body.companySize || null,
  revenue: body.revenue || null,
  companyName: body.companyName || null,
});

const mapUpdateInput = (body) => {
  const out = {};
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    if (key === "name") out.name = String(value).trim();
    else if (key === "email") out.email = String(value).toLowerCase();
    else if (["phone", "domain"].includes(key)) out[key] = value ? String(value).trim().toLowerCase() : null;
    else if (key === "assignedToId") out.assignedToId = value ? Number(value) : null;
    else out[key] = value;
  }
  return out;
};

const createLead = asyncHandler(async (req, res) => {
  const lead = await prisma.lead.create({
    data: {
      ...mapCreateInput(req.body),
      orgId: req.orgId,
      addedById: req.user.id,
    },
    include: LEAD_INCLUDE,
  });
  await updateLeadScore(lead.id);
  const updated = await prisma.lead.findUnique({ where: { id: lead.id }, include: LEAD_INCLUDE });
  
  // Notify the assigned owner (if any), otherwise notify the creator
  const targetUserId = lead.ownerId ? lead.ownerId : req.user.id;
  await dispatchNotification({
    userId: targetUserId,
    orgId: req.orgId,
    type: "LEAD_CREATED",
    category: "lead",
    message: `Lead ${lead.name} added to your pipeline.`,
    link: `/app/leads/${lead.id}`,
    metadata: { leadId: lead.id, leadName: lead.name },
  });
  await recordActivity({
    leadId: lead.id,
    userId: req.user.id,
    orgId: req.orgId,
    type: "CREATED",
    title: `${req.user.name} created this lead`,
  });
  await incrementUsage({ userId: req.user.id, orgId: req.orgId, resource: "leads" });
  await recordAudit({
    userId: req.user.id,
    orgId: req.orgId,
    action: "lead.create",
    entityType: "Lead",
    entityId: lead.id,
  });
  await publish({ orgId: req.orgId, event: "LEAD_CREATED", payload: { leadId: lead.id, name: lead.name } });
  return response.created(res, updated);
});

const getLeads = asyncHandler(async (req, res) => {
  const { page, limit, search, status, source, sortBy, order, tagId, assigneeId, scoreMin, scoreMax } = req.query;
  const where = { orgId: req.orgId, ...buildLeadWhere({ search, status, source, tagId, assigneeId, scoreMin, scoreMax }) };
  const skip = (page - 1) * limit;
  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: LEAD_INCLUDE,
      orderBy: { [sortBy]: order },
      skip,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);
  return response.paginated(res, leads, total, page, limit);
});

const getLeadById = asyncHandler(async (req, res) => {
  const lead = await prisma.lead.findFirst({
    where: { id: Number(req.params.id), orgId: req.orgId },
    include: {
      ...LEAD_INCLUDE,
      notes: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      tasks: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!lead) throw new AppError("Lead not found.", 404);
  return response.success(res, lead);
});

const updateLead = asyncHandler(async (req, res) => {
  const before = await prisma.lead.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!before) throw new AppError("Lead not found.", 404);

  const data = mapUpdateInput(req.body);
  const lead = await prisma.lead.update({
    where: { id: before.id },
    data,
    include: LEAD_INCLUDE,
  });

  // Record activity for meaningful changes.
  const changes = diffLead(before, lead);
  if (changes.length) {
    await recordActivity({
      leadId: lead.id,
      userId: req.user.id,
      orgId: req.orgId,
      type: "UPDATED",
      title: `${req.user.name} updated ${changes.length} field${changes.length > 1 ? "s" : ""}`,
      body: summarizeChanges(changes),
      metadata: { changes },
    });
  }
  if (req.body.status && before.status !== lead.status) {
    await recordActivity({
      leadId: lead.id,
      userId: req.user.id,
      orgId: req.orgId,
      type: "STATUS_CHANGED",
      title: `Status: ${before.status} → ${lead.status}`,
      metadata: { from: before.status, to: lead.status },
    });
    await publish({
      orgId: req.orgId,
      event: "LEAD_STATUS_CHANGED",
      payload: { leadId: lead.id, from: before.status, to: lead.status },
    });
  }
  if (req.body.assignedToId !== undefined && before.assignedToId !== lead.assignedToId) {
    await recordActivity({
      leadId: lead.id,
      userId: req.user.id,
      orgId: req.orgId,
      type: "ASSIGNED",
      title: lead.assignedToId ? `Assigned to user #${lead.assignedToId}` : "Unassigned",
    });
  }

  // Re-score if engagement-related fields changed.
  if (changes.some((c) => ["engagement", "source"].includes(c.field))) {
    await updateLeadScore(lead.id);
  }

  await recordAudit({
    userId: req.user.id,
    orgId: req.orgId,
    action: "lead.update",
    entityType: "Lead",
    entityId: lead.id,
    metadata: { fields: changes.map((c) => c.field) },
  });
  await publish({ orgId: req.orgId, event: "LEAD_UPDATED", payload: { leadId: lead.id } });

  if (changes.length > 0) {
    const targetUserId = lead.ownerId ? lead.ownerId : req.user.id;
    // Don't notify the user if they made the change themselves, unless they are the only one to notify
    if (targetUserId !== req.user.id || !lead.ownerId) {
      await dispatchNotification({
        userId: targetUserId,
        orgId: req.orgId,
        type: "LEAD_UPDATED",
        category: "lead",
        message: `Lead ${lead.name} was updated by ${req.user.name}.`,
        link: `/app/leads/${lead.id}`,
        metadata: { leadId: lead.id, leadName: lead.name, changes: changes.map(c => c.field) },
      });
    }
  }

  const refreshed = await prisma.lead.findUnique({ where: { id: lead.id }, include: LEAD_INCLUDE });
  return response.success(res, refreshed);
});

const deleteLead = asyncHandler(async (req, res) => {
  const lead = await prisma.lead.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!lead) throw new AppError("Lead not found.", 404);
  await prisma.lead.delete({ where: { id: lead.id } });
  await recordAudit({
    userId: req.user.id,
    orgId: req.orgId,
    action: "lead.delete",
    entityType: "Lead",
    entityId: lead.id,
    metadata: { name: lead.name },
  });
  await publish({ orgId: req.orgId, event: "LEAD_DELETED", payload: { leadId: lead.id, name: lead.name } });
  await dispatchNotification({
    userId: req.user.id,
    orgId: req.orgId,
    type: "LEAD_DELETED",
    category: "lead",
    message: `Lead ${lead.name} was deleted.`,
    link: "/app/leads",
    metadata: { leadId: lead.id, leadName: lead.name },
  });
  return response.success(res, { message: "Lead deleted." });
});

const bulkUpdate = asyncHandler(async (req, res) => {
  const { ids, status, assignedToId, tagId } = req.body;
  if (!Array.isArray(ids) || !ids.length) throw new AppError("ids must be a non-empty array.", 400);
  const data = {};
  if (status) data.status = status;
  if (assignedToId !== undefined) data.assignedToId = assignedToId ? Number(assignedToId) : null;
  const result = await prisma.lead.updateMany({
    where: { id: { in: ids.map(Number) }, orgId: req.orgId },
    data,
  });
  if (tagId) {
    await prisma.leadTag.createMany({
      data: ids.map((id) => ({ leadId: Number(id), tagId: Number(tagId) })),
      skipDuplicates: true,
    });
  }
  await recordAudit({
    userId: req.user.id,
    orgId: req.orgId,
    action: "lead.bulk_update",
    entityType: "Lead",
    metadata: { count: result.count, status, assignedToId, tagId },
  });
  return response.success(res, { updated: result.count });
});

const bulkDelete = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) throw new AppError("ids must be a non-empty array.", 400);
  const result = await prisma.lead.deleteMany({
    where: { id: { in: ids.map(Number) }, orgId: req.orgId },
  });
  await recordAudit({
    userId: req.user.id,
    orgId: req.orgId,
    action: "lead.bulk_delete",
    entityType: "Lead",
    metadata: { count: result.count },
  });
  return response.success(res, { deleted: result.count });
});

const stats = asyncHandler(async (req, res) => {
  const orgId = req.orgId;
  const [byStatus, bySource, totals, recentLeads, topScored] = await Promise.all([
    prisma.lead.groupBy({ by: ["status"], where: { orgId }, _count: { status: true } }),
    prisma.lead.groupBy({ by: ["source"], where: { orgId }, _count: { source: true } }),
    prisma.lead.aggregate({
      where: { orgId },
      _avg: { score: true },
      _max: { score: true },
      _min: { score: true },
      _count: { _all: true },
    }),
    prisma.lead.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, status: true, score: true, createdAt: true },
    }),
    prisma.lead.findMany({
      where: { orgId },
      orderBy: { score: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, score: true, status: true },
    }),
  ]);
  return response.success(res, {
    totals: {
      count: totals._count._all,
      avgScore: totals._avg.score || 0,
      maxScore: totals._max.score || 0,
      minScore: totals._min.score || 0,
    },
    byStatus: byStatus.map((b) => ({ status: b.status, count: b._count.status })),
    bySource: bySource.map((b) => ({ source: b.source, count: b._count.source })),
    recentLeads,
    topScored,
  });
});

module.exports = { createLead, getLeads, getLeadById, updateLead, deleteLead, bulkUpdate, bulkDelete, stats, buildLeadWhere };
