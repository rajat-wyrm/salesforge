const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const { checkLimit, currentPeriod } = require("../utils/planLimits");

const getOrgPlan = async (orgId) => {
  if (!orgId) return "FREE";
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true },
  });
  return org?.plan || "FREE";
};

// Tracks usage by incrementing a row per (user, org, resource, period).
const incrementUsage = async ({ userId, orgId, resource, count = 1, metadata = null }) => {
  if (!userId || !resource) return;
  const period = currentPeriod();
  try {
    await prisma.usageRecord.upsert({
      where: {
        userId_orgId_resource_period: {
          userId,
          orgId: orgId || null,
          resource,
          period,
        },
      },
      create: {
        userId,
        orgId: orgId || null,
        resource,
        count,
        period,
        metadata,
      },
      update: {
        count: { increment: count },
      },
    });
  } catch (error) {
    console.error("[usage:error]", error.message);
  }
};

const getUsage = async (userId, orgId, resource) => {
  const period = currentPeriod();
  return prisma.usageRecord.findUnique({
    where: {
      userId_orgId_resource_period: {
        userId,
        orgId: orgId || null,
        resource,
        period,
      },
    },
  });
};

// Middleware factory: enforcePlanLimit("leads", "lead")
const enforcePlanLimit = (resource, label = resource) => async (req, res, next) => {
  try {
    if (!req.user) return next();
    const orgId = req.user.organizationId;
    const plan = await getOrgPlan(orgId);
    const usage = await getUsage(req.user.id, orgId, resource);
    const current = usage?.count || 0;
    const { allowed, limit } = checkLimit(plan, resource, current);
    if (!allowed) {
      return next(
        new AppError(
          `Plan limit reached for ${label}. Your ${plan} plan allows ${limit} ${label} per month. Upgrade to add more.`,
          402,
        ),
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { incrementUsage, getUsage, getOrgPlan, enforcePlanLimit };
