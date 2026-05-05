const logger = require("../utils/logger");

// Request access log. Keeps a single line per request with method, path, status and duration.
const accessLog = (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info("http", {
      reqId: req.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      userId: req.user?.id,
      orgId: req.user?.organizationId,
      ip: req.ip,
    });
  });
  next();
};

module.exports = accessLog;
