const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { getPlan, currentPeriod, checkLimit } = require("../utils/planLimits");
const { dispatchNotification } = require("../services/notificationService");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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

// Shared activation logic used by both the free-plan path and the paid/verified
// Razorpay path.
//
// Fixes issue #5 (unique constraint crash): `Subscription.userId` is @unique,
// so a user can only ever have ONE subscription row, even across orgs. If this
// user already has a row (e.g. they switched workspaces), we transfer/update
// that existing row to the current org + plan instead of trying to insert a
// second row for the same userId, which used to throw a Prisma P2002 error.
const activatePlan = async ({ userId, orgId, plan, interval, price, paymentRef }) => {
  const start = new Date();
  const end = new Date(start);
  if (interval === "yearly") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);

  const existingByUser = await prisma.subscription.findUnique({ where: { userId } });

  const sub = existingByUser
    ? await prisma.subscription.update({
        where: { userId },
        data: { orgId, plan, status: "ACTIVE", currentPeriodStart: start, currentPeriodEnd: end, cancelAtPeriodEnd: false },
      })
    : await prisma.subscription.create({
        data: { userId, orgId, plan, status: "ACTIVE", currentPeriodStart: start, currentPeriodEnd: end },
      });

  await prisma.organization.update({ where: { id: orgId }, data: { plan, status: "ACTIVE" } });

  if (price > 0) {
    await prisma.payment.create({
      data: {
        userId, orgId, amount: price, currency: "INR", status: "SUCCEEDED",
        description: `${plan} (${interval})`,
        stripePaymentId: paymentRef, // reused as a generic external payment-gateway reference id
      },
    });
  }

  await dispatchNotification({
    userId,
    orgId,
    type: "BILLING_UPDATE",
    category: "billing",
    message: `Your workspace has been upgraded to ${plan}.`,
    link: "/app/settings/billing",
  });

  return sub;
};

// Step 1: create a real Razorpay order so the frontend can open the secure
// Razorpay payment modal (card / UPI / netbanking). We never collect card
// details ourselves — that's Razorpay's job, and it's what real billing
// systems do (PCI compliance is not something to build by hand).
const createOrder = asyncHandler(async (req, res) => {
  const { plan, interval = "monthly" } = req.body;
  if (!PLAN_PRICING[plan]) throw new AppError("Invalid plan.", 400);
  const price = PLAN_PRICING[plan][interval];

  if (price === null) {
    return response.success(res, { contactSales: true, message: "Our team will reach out to set up Enterprise." });
  }
  if (price === 0) {
    const sub = await activatePlan({ userId: req.user.id, orgId: req.orgId, plan, interval, price: 0, paymentRef: null });
    return response.success(res, { free: true, subscription: sub });
  }

  const amountPaise = Math.round(price * 100); // Razorpay amounts are in the smallest currency unit
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `org_${req.orgId}_${Date.now()}`,
    notes: { plan, interval, orgId: String(req.orgId), userId: String(req.user.id) },
  });

  return response.success(res, {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    plan,
    interval,
  });
});

// Step 2: verify the signature Razorpay's checkout returns after a successful
// payment, then activate the plan. Never trust the frontend's word alone that
// a payment succeeded — the HMAC signature is the only proof that's real.
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, interval = "monthly" } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError("Missing payment verification fields.", 400);
  }
  if (!PLAN_PRICING[plan]) throw new AppError("Invalid plan.", 400);
  const price = PLAN_PRICING[plan][interval];
  if (price === null || price === undefined) throw new AppError("Invalid plan/interval.", 400);

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    await dispatchNotification({
      userId: req.user.id,
      orgId: req.orgId,
      type: "PAYMENT_FAILED",
      category: "billing",
      message: `Payment failed or could not be verified.`,
      link: "/app/settings/billing",
    });
    throw new AppError("Payment verification failed. Signature mismatch.", 400);
  }

  const sub = await activatePlan({ userId: req.user.id, orgId: req.orgId, plan, interval, price, paymentRef: razorpay_payment_id });

  await dispatchNotification({
    userId: req.user.id,
    orgId: req.orgId,
    type: "PAYMENT_RECEIVED",
    category: "billing",
    message: `Payment of $${price} received successfully.`,
    link: "/app/settings/billing",
  });

  return response.success(res, { subscription: sub, charged: price });
});

const cancel = asyncHandler(async (req, res) => {
  const sub = await prisma.subscription.findFirst({ where: { orgId: req.orgId } });
  if (!sub) throw new AppError("No active subscription.", 404);
  // Real-world behaviour: cancelling does NOT downgrade immediately. The plan
  // stays ACTIVE and fully usable until the current billing period actually
  // ends — same as Netflix/Spotify/every SaaS billing system. We intentionally
  // do not auto-downgrade anywhere else in this file either.
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: true, status: "ACTIVE" },
  });
  return response.success(res, { message: "Subscription will remain active until the current billing period ends." });
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

const createInvoice = asyncHandler(async (req, res) => {
  const { amount = 99 } = req.body;
  const invoice = await prisma.invoice.create({
    data: {
      orgId: req.orgId,
      amount: Number(amount),
      status: "DRAFT",
      dueAt: new Date(Date.now() + 30 * 86400000),
      number: `INV-${Date.now()}`,
    }
  });

  await dispatchNotification({
    userId: req.user.id,
    orgId: req.orgId,
    type: "INVOICE_CREATED",
    category: "billing",
    message: `New invoice #${invoice.number} created for $${amount}.`,
    link: "/app/settings/billing",
  });

  return response.created(res, invoice);
});

module.exports = { getCurrentSubscription, listPlans, createOrder, verifyPayment, cancel, listPayments, usage, createInvoice, PLAN_PRICING };
