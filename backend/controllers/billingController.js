const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { getPlan, currentPeriod, checkLimit } = require("../utils/planLimits");

const PLAN_PRICING = {
  FREE: { monthly: 0, yearly: 0, features: ["Up to 100 leads", "Basic search tools", "1 team member"] },
  STARTER: { monthly: 29, yearly: 290, features: ["Up to 1,000 leads", "All search tools", "5 team members", "API access"] },
  PRO: { monthly: 99, yearly: 990, features: ["Up to 10,000 leads", "Advanced analytics", "25 team members", "Webhooks", "Priority support"] },
  ENTERPRISE: { monthly: null, yearly: null, features: ["Unlimited leads", "Custom integrations", "Dedicated support", "SLA", "SSO"] },
};

const getCurrentSubscription = asyncHandler(async (req, res) => {
  const sub = await prisma.subscription.findFirst({
    where: { OR: [{ userId: req.user.id }, { orgId: req.orgId }] },
    orderBy: { createdAt: "desc" },
  });
  const org = await prisma.organization.findUnique({ where: { id: req.orgId } });
  const plan = sub?.plan || org?.plan || "FREE";
  return response.success(res, {
    plan,
    status: sub?.status || org?.status || "TRIALING",
    currentPeriodStart: sub?.currentPeriodStart,
    currentPeriodEnd: sub?.currentPeriodEnd,
    trialEndsAt: sub?.trialEndsAt || org?.trialEndsAt,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd || false,
    pricing: PLAN_PRICING[plan] || PLAN_PRICING.FREE,
    limits: getPlan(plan),
  });
});

const listPlans = asyncHandler(async (req, res) => {
  return response.success(res, Object.entries(PLAN_PRICING).map(([id, info]) => ({
    id,
    ...info,
  })));
});

// Dev-only checkout - in production this would create a Stripe checkout session.
const checkout = asyncHandler(async (req, res) => {
  const { plan, interval = "monthly" } = req.body;
  if (!PLAN_PRICING[plan]) throw new AppError("Invalid plan.", 400);
  const price = PLAN_PRICING[plan][interval];
  if (price === null) {
    return response.success(res, {
      contactSales: true,
      message: "Our team will reach out to set up Enterprise.",
    });
  }
  // Activate immediately for the demo so the rest of the system is testable.
  const start = new Date();
  const end = new Date(start);
  if (interval === "yearly") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);

  const sub = await prisma.subscription.upsert({
    where: { orgId: req.orgId },
    create: {
      orgId: req.orgId,
      userId: req.user.id,
      plan,
      status: "ACTIVE",
      currentPeriodStart: start,
      currentPeriodEnd: end,
    },
    update: {
      plan,
      status: "ACTIVE",
      currentPeriodStart: start,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: false,
    },
  });
  await prisma.organization.update({
    where: { id: req.orgId },
    data: { plan, status: "ACTIVE" },
  });
  await prisma.payment.create({
    data: {
      userId: req.user.id,
      orgId: req.orgId,
      amount: price,
      currency: "USD",
      status: "SUCCEEDED",
      description: `${plan} (${interval})`,
    },
  });
  return response.success(res, { subscription: sub, charged: price });
});

const cancel = asyncHandler(async (req, res) => {
  const sub = await prisma.subscription.findFirst({ where: { orgId: req.orgId } });
  if (!sub) throw new AppError("No active subscription.", 404);
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: true, status: "CANCELED" },
  });
  return response.success(res, { message: "Subscription will end at the period close." });
});

const listPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where: { orgId: req.orgId },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.payment.count({ where: { orgId: req.orgId } }),
  ]);
  return response.paginated(res, items, total, page, limit);
});

const usage = asyncHandler(async (req, res) => {
  const period = currentPeriod();
  const records = await prisma.usageRecord.findMany({
    where: { orgId: req.orgId, period },
  });
  const plan = (await prisma.organization.findUnique({ where: { id: req.orgId } }))?.plan || "FREE";
  const limits = getPlan(plan);
  const summary = {};
  for (const [resource, limit] of Object.entries(limits)) {
    const used = records.find((r) => r.resource === resource)?.count || 0;
    const check = checkLimit(plan, resource, used);
    summary[resource] = { used, limit: check.limit, allowed: check.allowed };
  }
  return response.success(res, { period, plan, usage: summary });
});

module.exports = { getCurrentSubscription, listPlans, checkout, cancel, listPayments, usage, PLAN_PRICING };
