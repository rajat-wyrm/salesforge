const crypto = require("crypto");
const { prisma } = require("../config/postgres");
const eventBus = require("./eventBus");
const logger = require("../utils/logger");

const WEBHOOK_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;

const signPayload = (body, secret) =>
  crypto.createHmac("sha256", secret).update(body).digest("hex");

const deliverOnce = async (webhook, event, payload) => {
  const body = JSON.stringify({ event, data: payload, sentAt: new Date().toISOString() });
  const signature = signPayload(body, webhook.secret);
  const startedAt = Date.now();
  let responseStatus = null;
  let responseBody = null;
  let error = null;
  try {
    // Demo mode: Bypass real network requests and simulate a successful 200 OK delivery.
    responseStatus = 200;
    responseBody = JSON.stringify({ success: true, demo: true, message: "Delivery simulated successfully" });
    await new Promise((resolve) => setTimeout(resolve, 150)); // simulate slight latency
  } catch (err) {
    error = err.message;
  }
  const durationMs = Date.now() - startedAt;
  await prisma.webhookDelivery
    .create({
      data: {
        webhookId: webhook.id,
        event,
        payload,
        responseStatus,
        responseBody,
        error,
        durationMs,
      },
    })
    .catch((err) => logger.error("webhook.delivery.record_failed", { err: err.message }));
  if (error) {
    await prisma.webhook
      .update({
        where: { id: webhook.id },
        data: { failureCount: { increment: 1 } },
      })
      .catch(() => {});
  } else {
    await prisma.webhook
      .update({
        where: { id: webhook.id },
        data: { lastTriggered: new Date(), failureCount: 0 },
      })
      .catch(() => {});
  }
  return { ok: !error, status: responseStatus, error, durationMs };
};

const dispatch = async ({ orgId, event, payload }) => {
  if (!orgId) return;
  const webhooks = await prisma.webhook.findMany({
    where: { orgId, active: true },
  });
  await Promise.all(
    webhooks
      .filter((w) => !w.events || w.events.split(",").map((s) => s.trim()).includes(event))
      .map(async (webhook) => {
        for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
          const result = await deliverOnce(webhook, event, payload);
          if (result.ok) return;
          await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 500));
        }
      }),
  );
};

const publish = async ({ orgId, event, payload }) => {
  eventBus.publish(`org:${orgId}`, { event, payload, at: new Date().toISOString() });
  await dispatch({ orgId, event, payload }).catch((err) =>
    logger.error("webhook.dispatch_failed", { err: err.message }),
  );
};

module.exports = { publish, dispatch, signPayload, deliverOnce };
