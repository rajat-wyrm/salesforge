const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

const list = asyncHandler(async (req, res) => {
  const { from, to, view = "month" } = req.query;
  const where = { orgId: req.orgId, userId: req.user.id };
  if (from || to) {
    where.startAt = {};
    if (from) where.startAt.gte = new Date(from);
    if (to) where.startAt.lte = new Date(to);
  }
  const events = await prisma.calendarEvent.findMany({ where, orderBy: { startAt: "asc" } });
  return response.success(res, events);
});

const teamView = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const where = { orgId: req.orgId };
  if (from || to) {
    where.startAt = {};
    if (from) where.startAt.gte = new Date(from);
    if (to) where.startAt.lte = new Date(to);
  }
  const events = await prisma.calendarEvent.findMany({
    where,
    orderBy: { startAt: "asc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return response.success(res, events);
});

const get = asyncHandler(async (req, res) => {
  const event = await prisma.calendarEvent.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!event) throw new AppError("Event not found.", 404);
  return response.success(res, event);
});

const create = asyncHandler(async (req, res) => {
  const { title, description, startAt, endAt, allDay, location, meetingUrl, attendees, relatedTo, relatedId, color } = req.body;
  if (!title) throw new AppError("Title is required.", 400);
  if (!startAt || !endAt) throw new AppError("startAt and endAt are required.", 400);
  const event = await prisma.calendarEvent.create({
    data: {
      orgId: req.orgId,
      userId: req.user.id,
      title,
      description: description || null,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      allDay: !!allDay,
      location: location || null,
      meetingUrl: meetingUrl || null,
      attendees: attendees || null,
      relatedTo: relatedTo || null,
      relatedId: relatedId ? Number(relatedId) : null,
      color: color || "teal",
    },
  });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "calendar.create", entityType: "CalendarEvent", entityId: event.id });
  return response.created(res, event);
});

const update = asyncHandler(async (req, res) => {
  const data = {};
  ["title", "description", "allDay", "location", "meetingUrl", "attendees", "relatedTo", "color"].forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  if (req.body.startAt) data.startAt = new Date(req.body.startAt);
  if (req.body.endAt) data.endAt = new Date(req.body.endAt);
  if (req.body.relatedId !== undefined) data.relatedId = req.body.relatedId ? Number(req.body.relatedId) : null;
  const result = await prisma.calendarEvent.updateMany({ where: { id: Number(req.params.id), orgId: req.orgId }, data });
  if (result.count === 0) throw new AppError("Event not found.", 404);
  return response.success(res, { message: "Event updated." });
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.calendarEvent.deleteMany({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (result.count === 0) throw new AppError("Event not found.", 404);
  return response.success(res, { message: "Event deleted." });
});

module.exports = { list, teamView, get, create, update, remove };