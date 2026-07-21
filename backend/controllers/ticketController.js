// Ticket / Help Desk service - customer support ticket management.
// Tickets are stored as Activity records with kind=TASK and a ticket marker
// in metadata. The full ticket subject/priority/comments live in metadata so
// we can keep the existing schema while still supporting ticket workflows.
const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

const TICKET_STATUSES = ["open", "in_progress", "waiting", "resolved", "closed"];
const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"];

// Map ticket statuses to valid ActivityStatus enum values
const TICKET_STATUS_TO_ACTIVITY = {
  open: "SCHEDULED",
  in_progress: "IN_PROGRESS",
  waiting: "SCHEDULED",
  resolved: "COMPLETED",
  closed: "COMPLETED",
};

const ACTIVITY_TO_TICKET_STATUS = Object.fromEntries(
  Object.entries(TICKET_STATUS_TO_ACTIVITY).map(([k, v]) => [v, k])
);

const generateTicketNumber = () => {
  const ts = Date.now().toString(36).toUpperCase();
  return `T-${ts}`;
};

const isTicket = (a) => a?.metadata?.isTicket === true;

const decorate = (a) => {
  if (!a) return a;
  const m = a.metadata || {};
  return {
    ...a,
    number: m.number,
    subject: m.subject || a.title,
    body: m.body,
    priority: m.priority || "medium",
    status: m.ticketStatus || ACTIVITY_TO_TICKET_STATUS[a.status] || "open",
    tags: m.tags || [],
    comments: m.comments || [],
  };
};

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status, priority, assignedTo } = req.query;
  const where = { orgId: req.orgId, kind: "TASK" };
  if (assignedTo) where.userId = Number(assignedTo);
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    prisma.activity.findMany({
      where, orderBy: { createdAt: "desc" }, skip, take: Number(limit),
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.activity.count({ where }),
  ]);
  let tickets = items.filter(isTicket).map(decorate);
  if (status) tickets = tickets.filter((t) => t.status === status);
  if (priority) tickets = tickets.filter((t) => t.priority === priority);
  return response.paginated(res, tickets, total, page, limit);
});

const get = asyncHandler(async (req, res) => {
  const ticket = await prisma.activity.findFirst({
    where: { id: Number(req.params.id), orgId: req.orgId, kind: "TASK" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!ticket || !isTicket(ticket)) throw new AppError("Ticket not found.", 404);
  return response.success(res, decorate(ticket));
});

const create = asyncHandler(async (req, res) => {
  const { subject, description, priority = "medium", status = "open", leadId, dealId, contactId, assigneeId, tags } = req.body;
  if (!subject) throw new AppError("subject is required.", 400);
  if (!description) throw new AppError("description is required.", 400);
  const number = generateTicketNumber();
  const ticket = await prisma.activity.create({
    data: {
      orgId: req.orgId,
      userId: assigneeId ? Number(assigneeId) : req.user.id,
      kind: "TASK",
      status: TICKET_STATUS_TO_ACTIVITY[status] || "SCHEDULED",
      entityType: leadId ? "LEAD" : dealId ? "DEAL" : "LEAD",
      entityId: leadId || dealId || 1,
      title: subject,
      description,
      metadata: {
        isTicket: true,
        number,
        subject,
        body: description,
        priority,
        ticketStatus: status,
        tags: tags || [],
        contactId,
        source: "web",
        comments: [],
      },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "ticket.create", entityType: "Ticket", entityId: ticket.id, metadata: { subject, priority } });
  return response.created(res, decorate(ticket));
});

const update = asyncHandler(async (req, res) => {
  const { subject, description, status, priority, assigneeId } = req.body;
  const ticket = await prisma.activity.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId, kind: "TASK" } });
  if (!ticket || !isTicket(ticket)) throw new AppError("Ticket not found.", 404);
  const meta = ticket.metadata || {};
  const data = {};
  if (subject !== undefined) {
    data.title = subject;
    meta.subject = subject;
  }
  if (description !== undefined) {
    data.description = description;
    meta.body = description;
  }
  if (status !== undefined) {
    meta.ticketStatus = status;
    data.status = TICKET_STATUS_TO_ACTIVITY[status] || "SCHEDULED";
    if (status === "resolved" || status === "closed") data.completedAt = new Date();
  }
  if (priority !== undefined) meta.priority = priority;
  if (assigneeId !== undefined) data.userId = Number(assigneeId);
  data.metadata = { ...meta };
  await prisma.activity.update({ where: { id: ticket.id }, data });
  return response.success(res, { message: "Ticket updated." });
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.activity.deleteMany({ where: { id: Number(req.params.id), orgId: req.orgId, kind: "TASK" } });
  if (result.count === 0) throw new AppError("Ticket not found.", 404);
  return response.success(res, { message: "Ticket deleted." });
});

const addComment = asyncHandler(async (req, res) => {
  const { body, isInternal = false } = req.body;
  if (!body) throw new AppError("body is required.", 400);
  const ticket = await prisma.activity.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId, kind: "TASK" } });
  if (!ticket || !isTicket(ticket)) throw new AppError("Ticket not found.", 404);
  const comments = ticket.metadata?.comments || [];
  comments.push({ userId: req.user.id, body, isInternal, createdAt: new Date() });
  await prisma.activity.update({
    where: { id: ticket.id },
    data: { metadata: { ...(ticket.metadata || {}), comments } },
  });
  return response.success(res, { message: "Comment added." });
});

const metrics = asyncHandler(async (req, res) => {
  const all = await prisma.activity.findMany({
    where: { orgId: req.orgId, kind: "TASK" },
    select: { status: true, createdAt: true, completedAt: true, metadata: true },
  });
  const tickets = all.filter(isTicket);
  const byStatus = {};
  const byPriority = {};
  let open = 0, resolved = 0;
  let totalResolutionTime = 0;
  let resolvedCount = 0;
  for (const t of tickets) {
    const ts = t.metadata?.ticketStatus || "open";
    byStatus[ts] = (byStatus[ts] || 0) + 1;
    const p = t.metadata?.priority || "medium";
    byPriority[p] = (byPriority[p] || 0) + 1;
    if (ts === "open" || ts === "in_progress" || ts === "waiting") open++;
    if (ts === "resolved" || ts === "closed") {
      resolved++;
      if (t.completedAt) {
        totalResolutionTime += new Date(t.completedAt) - new Date(t.createdAt);
        resolvedCount++;
      }
    }
  }
  const avgResolutionHours = resolvedCount > 0 ? Math.round(totalResolutionTime / resolvedCount / 3600000) : 0;
  return response.success(res, { total: tickets.length, open, resolved, byStatus, byPriority, avgResolutionHours });
});

module.exports = { list, get, create, update, remove, addComment, metrics, TICKET_STATUSES, TICKET_PRIORITIES, generateTicketNumber };
