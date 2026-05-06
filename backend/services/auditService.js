const { prisma } = require("../config/postgres");

// Centralized audit logging. Use as middleware on mutating routes or call directly.
const recordAudit = async ({
  userId = null,
  orgId = null,
  action,
  entityType,
  entityId = null,
  metadata = {},
  ipAddress = null,
  userAgent = null,
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        orgId,
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        metadata,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Audit failures should never block the user request.
    console.error("[audit:error]", error.message);
  }
};

// Convenience middleware factory: recordAuditAfter("lead.create", "Lead")
const recordAuditAfter = (action, entityType, getEntityId = null) => async (req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode >= 400) return;
    const entityId = typeof getEntityId === "function" ? getEntityId(req, res) : res.locals?.created?.id;
    recordAudit({
      userId: req.user?.id || null,
      orgId: req.user?.organizationId || null,
      action,
      entityType,
      entityId,
      metadata: res.locals?.auditMeta || {},
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  });
  next();
};

module.exports = { recordAudit, recordAuditAfter };
