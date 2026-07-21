const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordActivity } = require("../services/leadActivityService");
const { createInAppNotification } = require("../services/notificationService");

const ensureLeadInOrg = async (leadId, orgId) => {
  const lead = await prisma.lead.findFirst({ where: { id: Number(leadId), orgId } });
  if (!lead) throw new AppError("Lead not found.", 404);
  return lead;
};

const list = asyncHandler(async (req, res) => {
  const lead = await ensureLeadInOrg(req.params.leadId, req.orgId);
  const { status } = req.query;
  const where = { leadId: lead.id };
  if (status) where.status = status;
  const items = await prisma.leadTask.findMany({
    where,
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  return response.success(res, items);
});

const create = asyncHandler(async (req, res) => {
  const lead = await ensureLeadInOrg(req.params.leadId, req.orgId);
  const { title, description, dueAt, priority, userId } = req.body;
  if (!title) throw new AppError("Task title is required.", 400);
  const assignee = userId
    ? await prisma.user.findFirst({ where: { id: Number(userId), organizationId: req.orgId } })
    : req.user;
  if (!assignee) throw new AppError("Assignee not found in your organization.", 404);

  const task = await prisma.leadTask.create({
    data: {
      leadId: lead.id,
      userId: assignee.id,
      createdById: req.user.id,
      orgId: req.orgId,
      title,
      description: description || null,
      dueAt: dueAt ? new Date(dueAt) : null,
      priority: priority || "MEDIUM",
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  await recordActivity({
    leadId: lead.id,
    userId: req.user.id,
    orgId: req.orgId,
    type: "TASK_CREATED",
    title: `${req.user.name} created task "${title}"`,
    body: priority ? `Priority: ${priority}` : null,
    metadata: { taskId: task.id, assigneeId: assignee.id },
  });

  if (assignee.id !== req.user.id) {
    await createInAppNotification({
      userId: assignee.id,
      orgId: req.orgId,
      type: "TASK_ASSIGNED",
      category: "team",
      message: `${req.user.name} assigned you a task: "${title}".`,
      link: `/app/leads/${lead.id}`,
    });
  }

  return response.created(res, task);
});

const update = asyncHandler(async (req, res) => {
  const lead = await ensureLeadInOrg(req.params.leadId, req.orgId);
  const { title, description, dueAt, priority, status, userId } = req.body;
  const data = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (dueAt !== undefined) data.dueAt = dueAt ? new Date(dueAt) : null;
  if (priority !== undefined) data.priority = priority;
  if (status !== undefined) {
    data.status = status;
    if (status === "DONE") data.completedAt = new Date();
    if (status !== "DONE") data.completedAt = null;
  }
  if (userId !== undefined) data.userId = Number(userId);
  const result = await prisma.leadTask.updateMany({
    where: { id: Number(req.params.id), leadId: lead.id },
    data,
  });
  if (result.count === 0) throw new AppError("Task not found.", 404);
  if (status === "DONE") {
    await recordActivity({
      leadId: lead.id,
      userId: req.user.id,
      orgId: req.orgId,
      type: "TASK_COMPLETED",
      title: `${req.user.name} completed a task`,
    });
  }

  if (userId !== undefined && Number(userId) !== req.user.id) {
    await createInAppNotification({
      userId: Number(userId),
      orgId: req.orgId,
      type: "TASK_ASSIGNED",
      category: "team",
      message: `${req.user.name} reassigned a task to you.`,
      link: `/app/leads/${lead.id}`,
    });
  }

  return response.success(res, { message: "Task updated." });
});

const remove = asyncHandler(async (req, res) => {
  const lead = await ensureLeadInOrg(req.params.leadId, req.orgId);
  const result = await prisma.leadTask.deleteMany({
    where: { id: Number(req.params.id), leadId: lead.id },
  });
  if (result.count === 0) throw new AppError("Task not found.", 404);
  return response.success(res, { message: "Task deleted." });
});

const myTasks = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const where = { userId: req.user.id, lead: { orgId: req.orgId } };
  if (status) where.status = status;
  const items = await prisma.leadTask.findMany({
    where,
    orderBy: [{ dueAt: "asc" }, { priority: "desc" }],
    include: { lead: { select: { id: true, name: true, email: true } } },
  });
  return response.success(res, items);
});

module.exports = { list, create, update, remove, myTasks };
