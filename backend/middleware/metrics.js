// Auto-increment counters and observe response time on every request.
const metrics = require("../utils/metrics");
const { cache } = require("../utils/cache");

const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const route = req.route?.path || req.path || "unknown";
    const method = req.method;
    const status = res.statusCode;
    const family = `${Math.floor(status / 100)}xx`;
    metrics.inc("http_requests_total", 1, { method, route, status: family });
    metrics.observe("http_request_duration_ms", durationMs, { method, route });
    if (status >= 500) metrics.inc("http_errors_total", 1, { method, route });
    if (req.user?.id) metrics.gauge("active_users", cache.size(), {});
  });
  next();
};

module.exports = metricsMiddleware;
