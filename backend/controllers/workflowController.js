const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");
const { recordActivity } = require("../services/leadActivityService");

const VALID_TRIGGERS = ["LEAD_CREATED", "LEAD_STATUS_CHANGED", "LEAD_SCORE_CHANGED", "DEAL_CREATED", "DEAL_STAGE_CHANGED", "DEAL_WON", "DEAL_LOST", "ACTIVITY_COMPLETED", "FORM_SUBMITTED", "EMAIL_OPENED", "EMAIL_REPLIED", "SCHEDULED_TIME", "WEBHOOK_RECEIVED"];
const VALID_ACTIONS = ["SEND_EMAIL", "CREATE_TASK", "UPDATE_FIELD", "ASSIGN_OWNER", "ADD_TAG", "REMOVE_TAG", "NOTIFY_USER", "CREATE_DEAL", "WEBHOOK", "WAIT", "BRANCH"];

const list = asyncHandler(async (req, res) => {
  const items = await prisma.workflow.findMany({
    where: { orgId: req.orgId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { runs: true } } },
  });
  return response.success(res, items);
});

const get = asyncHandler(async (req, res) => {
  const w = await prisma.workflow.findFirst({
    where: { id: Number(req.params.id), orgId: req.orgId },
    include: { runs: { take: 20, orderBy: { startedAt: "desc" } } },
  });
  if (!w) throw new AppError("Workflow not found.", 404);
  return response.success(res, w);
});

const create = asyncHandler(async (req, res) => {
  const { name, description, trigger, conditions, actions, active = true } = req.body;
  if (!name) throw new AppError("name is required.", 400);
  if (!trigger || !VALID_TRIGGERS.includes(trigger)) throw new AppError(`trigger must be one of: ${VALID_TRIGGERS.join(", ")}.`, 400);
  if (!Array.isArray(actions) || actions.length === 0) throw new AppError("actions must be a non-empty array.", 400);
  const wf = await prisma.workflow.create({
    data: { orgId: req.orgId, userId: req.user.id, name, description: description || null, trigger, conditions: conditions || null, actions, active },
  });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "workflow.create", entityType: "Workflow", entityId: wf.id });
  return response.created(res, wf);
});

const update = asyncHandler(async (req, res) => {
  const data = {};
  ["name", "description", "trigger", "conditions", "actions", "active"].forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  const result = await prisma.workflow.updateMany({ where: { id: Number(req.params.id), orgId: req.orgId }, data });
  if (result.count === 0) throw new AppError("Workflow not found.", 404);
  return response.success(res, { message: "Workflow updated." });
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.workflow.deleteMany({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (result.count === 0) throw new AppError("Workflow not found.", 404);
  return response.success(res, { message: "Workflow deleted." });
});

const toggle = asyncHandler(async (req, res) => {
  const wf = await prisma.workflow.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!wf) throw new AppError("Workflow not found.", 404);
  await prisma.workflow.update({ where: { id: wf.id }, data: { active: !wf.active } });
  return response.success(res, { active: !wf.active });
});

const executeActions = async (actions, context) => {
  const log = [];
  for (const action of actions) {
    try {
      if (action.type === "CREATE_TASK" && context.leadId) {
        await prisma.activity.create({
          data: {
            orgId: context.orgId, userId: context.userId, kind: "TASK",
            status: "SCHEDULED", entityType: "LEAD", entityId: context.leadId,
            title: action.title || "Workflow task", description: action.description,
            dueAt: action.dueInDays ? new Date(Date.now() + action.dueInDays * 86400000) : null,
          },
        });
        log.push({ action: action.type, status: "ok" });
      } else if (action.type === "ADD_TAG" && context.leadId && action.tagId) {
        await prisma.leadTag.upsert({
          where: { leadId_tagId: { leadId: context.leadId, tagId: action.tagId } },
          create: { leadId: context.leadId, tagId: action.tagId },
          update: {},
        }).catch(() => {});
        log.push({ action: action.type, status: "ok" });
      } else if (action.type === "REMOVE_TAG" && context.leadId && action.tagId) {
        await prisma.leadTag.deleteMany({ where: { leadId: context.leadId, tagId: action.tagId } });
        log.push({ action: action.type, status: "ok" });
      } else if (action.type === "ASSIGN_OWNER" && context.leadId && action.userId) {
        await prisma.lead.update({ where: { id: context.leadId }, data: { assignedToId: action.userId } });
        log.push({ action: action.type, status: "ok" });
      } else if (action.type === "UPDATE_FIELD" && context.leadId) {
        const allowed = ["status", "score", "companyName", "jobTitle", "phone"];
        const update = {};
        if (allowed.includes(action.field)) update[action.field] = action.value;
        if (Object.keys(update).length) {
          await prisma.lead.update({ where: { id: context.leadId }, data: update });
          log.push({ action: action.type, status: "ok" });
        }
      } else if (action.type === "NOTIFY_USER" && action.userId) {
        await prisma.notification.create({
          data: {
            userId: action.userId,
            type: "WORKFLOW",
            message: action.message || "Workflow notification",
            link: context.leadId ? `/app/leads/${context.leadId}` : null,
            metadata: { workflow: context.workflowName },
          },
        });
        log.push({ action: action.type, status: "ok" });
      } else if (action.type === "SEND_EMAIL" && action.to) {
        const { sendEmail } = require("../utils/sendEmail");
        await sendEmail({ to: action.to, subject: action.subject || "Workflow email", html: action.body || "" });
        log.push({ action: action.type, status: "ok" });
      } else {
        log.push({ action: action.type, status: "skipped", reason: "missing context" });
      }
    } catch (e) {
      log.push({ action: action.type, status: "error", error: e.message });
    }
  }
  return log;
};

const trigger = async ({ orgId, userId, trigger, entityType, entityId, payload = {} }) => {
  const workflows = await prisma.workflow.findMany({ where: { orgId, trigger, active: true } });
  for (const wf of workflows) {
    const run = await prisma.workflowRun.create({
      data: { workflowId: wf.id, trigger, entityType, entityId, status: "running" },
    });
    try {
      const log = await executeActions(wf.actions, { orgId, userId, leadId: entityType === "LEAD" ? entityId : null, workflowName: wf.name });
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: { status: "completed", log, completedAt: new Date() },
      });
      await prisma.workflow.update({ where: { id: wf.id }, data: { runCount: { increment: 1 }, lastRunAt: new Date() } });
    } catch (e) {
      await prisma.workflowRun.update({ where: { id: run.id }, data: { status: "failed", error: e.message, completedAt: new Date() } });
    }
  }
};

const test = asyncHandler(async (req, res) => {
  const wf = await prisma.workflow.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!wf) throw new AppError("Workflow not found.", 404);
  const log = await executeActions(wf.actions, {
    orgId: req.orgId, userId: req.user.id, leadId: null, workflowName: wf.name,
  });
  return response.success(res, { executed: log.length, log });
});

const runs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const where = { workflow: { orgId: req.orgId } };
  if (status) where.status = status;
  const [items, total] = await Promise.all([
    prisma.workflowRun.findMany({ where, orderBy: { startedAt: "desc" }, skip: (Number(page) - 1) * Number(limit), take: Number(limit) }),
    prisma.workflowRun.count({ where }),
  ]);
  return response.paginated(res, items, total, page, limit);
});

const TEMPLATES = [
  {
    name: "Auto-assign new leads", trigger: "LEAD_CREATED", actions: [
      { type: "ASSIGN_OWNER", userId: null },
      { type: "NOTIFY_USER", userId: null, message: "New lead assigned to you" },
    ],
  },
  {
    name: "Follow-up after 3 days of no contact", trigger: "LEAD_STATUS_CHANGED", conditions: { to: "new" }, actions: [
      { type: "CREATE_TASK", title: "Follow up with lead", dueInDays: 3 },
    ],
  },
  {
    name: "Notify team on deal won", trigger: "DEAL_WON", actions: [
      { type: "NOTIFY_USER", userId: null, message: "🎉 Deal won!" },
    ],
  },
];

module.exports = { list, get, create, update, remove, toggle, test, runs, trigger, executeActions, TEMPLATES, VALID_TRIGGERS, VALID_ACTIONS };
