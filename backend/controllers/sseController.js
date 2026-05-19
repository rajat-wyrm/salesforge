// Server-Sent Events stream for real-time updates (notifications, lead changes, webhook events).
const eventBus = require("../services/eventBus");
const asyncHandler = require("../utils/asyncHandler");

const stream = asyncHandler(async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const userId = req.user.id;
  const orgId = req.orgId;
  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send("ready", { userId, orgId, at: new Date().toISOString() });

  const orgChannel = `org:${orgId}`;
  const userChannel = `user:${userId}`;
  const offOrg = eventBus.subscribe(orgChannel, (msg) => {
    send(msg.event || "message", msg);
  });
  const offUser = eventBus.subscribe(userChannel, (msg) => {
    send(msg.event || "message", msg);
  });

  const heartbeat = setInterval(() => {
    res.write(": ping\n\n");
  }, 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    offOrg();
    offUser();
    res.end();
  });
});

module.exports = { stream };
