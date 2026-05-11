const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordActivity } = require("../services/leadActivityService");

const ensureLeadInOrg = async (leadId, orgId) => {
  const lead = await prisma.lead.findFirst({ where: { id: Number(leadId), orgId } });
  if (!lead) throw new AppError("Lead not found.", 404);
  return lead;
};

const list = asyncHandler(async (req, res) => {
  const lead = await ensureLeadInOrg(req.params.leadId, req.orgId);
  const items = await prisma.leadNote.findMany({
    where: { leadId: lead.id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return response.success(res, items);
});

const create = asyncHandler(async (req, res) => {
  const lead = await ensureLeadInOrg(req.params.leadId, req.orgId);
  const { body } = req.body;
  if (!body || !body.trim()) throw new AppError("Note body cannot be empty.", 400);
  const note = await prisma.leadNote.create({
    data: {
      leadId: lead.id,
      userId: req.user.id,
      orgId: req.orgId,
      body: body.trim(),
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  await recordActivity({
    leadId: lead.id,
    userId: req.user.id,
    orgId: req.orgId,
    type: "NOTE_ADDED",
    title: `${req.user.name} added a note`,
    body: body.trim().slice(0, 140),
  });
  return response.created(res, note);
});

const update = asyncHandler(async (req, res) => {
  const lead = await ensureLeadInOrg(req.params.leadId, req.orgId);
  const { body } = req.body;
  if (!body || !body.trim()) throw new AppError("Note body cannot be empty.", 400);
  const result = await prisma.leadNote.updateMany({
    where: { id: Number(req.params.id), leadId: lead.id, userId: req.user.id },
    data: { body: body.trim() },
  });
  if (result.count === 0) throw new AppError("Note not found or you cannot edit it.", 404);
  return response.success(res, { message: "Note updated." });
});

const remove = asyncHandler(async (req, res) => {
  const lead = await ensureLeadInOrg(req.params.leadId, req.orgId);
  const result = await prisma.leadNote.deleteMany({
    where: { id: Number(req.params.id), leadId: lead.id, userId: req.user.id },
  });
  if (result.count === 0) throw new AppError("Note not found or you cannot delete it.", 404);
  return response.success(res, { message: "Note deleted." });
});

module.exports = { list, create, update, remove };
