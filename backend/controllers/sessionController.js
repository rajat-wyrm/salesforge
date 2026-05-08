const { prisma } = require("../config/postgres");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const sessionService = require("../services/sessionService");

const list = asyncHandler(async (req, res) => {
  const items = await sessionService.listSessions(req.user.id);
  return response.success(res, items);
});

const revoke = asyncHandler(async (req, res) => {
  const ok = await sessionService.revokeSession(req.user.id, req.params.id);
  if (!ok) return response.error(res, "Session not found.", 404);
  sessionService.publishSessionChange(req.user.id, "revoked", { id: Number(req.params.id) });
  return response.success(res, { message: "Session revoked." });
});

const revokeAll = asyncHandler(async (req, res) => {
  await prisma.session.deleteMany({ where: { userId: req.user.id } });
  sessionService.publishSessionChange(req.user.id, "revoked_all", {});
  return response.success(res, { message: "All other sessions revoked." });
});

module.exports = { list, revoke, revokeAll };
