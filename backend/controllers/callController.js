// Call logging service - track phone calls with outcomes and notes.
const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

// Calls are stored as Activity records with kind="CALL" and additional
// metadata in the JSON metadata field. This gives us full call tracking
// without adding a new schema model.

const CALL_OUTCOMES = ["connected", "left_voicemail", "no_answer", "busy", "wrong_number", "callback_scheduled"];
const CALL_DIRECTIONS = ["outbound", "inbound"];

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, leadId, dealId, outcome, direction, from, to } = req.query;
  const where = { orgId: req.orgId, kind: "CALL" };
  if (leadId) where.entityId = Number(leadId);
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    prisma.activity.findMany({
      where, orderBy: { createdAt: "desc" }, skip, take: Number(limit),
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.activity.count({ where }),
  ]);
  // Filter by outcome/direction from metadata
  const filtered = items.filter((a) => {
    if (outcome && a.metadata?.outcome !== outcome) return false;
    if (direction && a.metadata?.direction !== direction) return false;
    if (dealId && a.metadata?.dealId !== Number(dealId)) return false;
    return true;
  });
  return response.paginated(res, filtered, total, page, limit);
});

const get = asyncHandler(async (req, res) => {
  const call = await prisma.activity.findFirst({
    where: { id: Number(req.params.id), orgId: req.orgId, kind: "CALL" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!call) throw new AppError("Call not found.", 404);
  return response.success(res, call);
});

// "create" handler — the frontend sends POST /calls with body fields.
// Maps frontend field names to the Activity model.
const create = asyncHandler(async (req, res) => {
  const {
    phone, phoneNumber,                          // frontend may send either
    title, description, notes,
    direction = "outbound", outcome, duration = 0,
    leadId, dealId, contactId,
    recordingUrl, transcript,
  } = req.body;

  // Accept either "phone" or "phoneNumber" from the frontend
  const phoneVal = phone || phoneNumber;
  if (!phoneVal && !title) throw new AppError("phone or title is required.", 400);

  const call = await prisma.activity.create({
    data: {
      orgId: req.orgId,
      userId: req.user.id,
      kind: "CALL",
      status: "COMPLETED",
      entityType: leadId ? "LEAD" : dealId ? "DEAL" : "LEAD",
      entityId: Number(leadId) || Number(dealId) || 1,
      title: title || `${direction === "outbound" ? "Outbound" : "Inbound"} call to ${phoneVal}`,
      description: description || notes || null,
      metadata: {
        phone: phoneVal, direction, outcome, duration: Number(duration) || 0,
        leadId, dealId, contactId,
        recordingUrl, transcript,
        sentiment: null,
      },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "call.log", entityType: "Call", entityId: call.id, metadata: { phone: phoneVal, outcome } });
  return response.created(res, call);
});

const update = asyncHandler(async (req, res) => {
  const call = await prisma.activity.findFirst({
    where: { id: Number(req.params.id), orgId: req.orgId, kind: "CALL" },
  });
  if (!call) throw new AppError("Call not found.", 404);
  const { outcome, notes, description, duration, transcript, sentiment, title } = req.body;
  const metadata = { ...(call.metadata || {}), outcome, duration, transcript, sentiment };
  const data = { metadata, status: "COMPLETED" };
  if (notes !== undefined || description !== undefined) data.description = notes || description;
  if (title !== undefined) data.title = title;
  const updated = await prisma.activity.update({
    where: { id: call.id },
    data,
  });
  return response.success(res, updated);
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.activity.deleteMany({
    where: { id: Number(req.params.id), orgId: req.orgId, kind: "CALL" },
  });
  if (result.count === 0) throw new AppError("Call not found.", 404);
  return response.success(res, { message: "Call deleted." });
});

const metrics = asyncHandler(async (req, res) => {
  const calls = await prisma.activity.findMany({
    where: { orgId: req.orgId, kind: "CALL" },
    select: { metadata: true, createdAt: true },
  });
  let total = calls.length;
  let connected = 0;
  let totalDuration = 0;
  let voicemails = 0;
  const byDay = {};
  for (const c of calls) {
    const m = c.metadata || {};
    if (m.outcome === "connected") connected++;
    if (m.outcome === "left_voicemail") voicemails++;
    totalDuration += m.duration || 0;
    const day = new Date(c.createdAt).toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
  }
  const connectRate = total > 0 ? Math.round((connected / total) * 100) : 0;
  const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;
  return response.success(res, {
    total, connected, voicemails, connectRate, avgDuration, totalDuration, byDay,
  });
});

module.exports = { list, get, create, update, remove, metrics, CALL_OUTCOMES, CALL_DIRECTIONS };
