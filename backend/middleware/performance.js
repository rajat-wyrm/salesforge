// Optional performance/security middleware. All three external deps
// (compression, helmet, response-time-style) are loaded via lazy require so
// the server still boots if any of them is missing in a given environment.

const crypto = require("crypto");

const safeRequire = (name) => {
  try { return require(name); } catch (_) { return null; }
};

const compressionLib = safeRequire("compression");
const helmetLib = safeRequire("helmet");

const noop = (req, res, next) => next();

const compressionMiddleware = compressionLib
  ? compressionLib({ level: 6, threshold: 1024, filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compressionLib.filter ? compressionLib.filter(req, res) : true;
    } })
  : noop;

const securityMiddleware = helmetLib
  ? helmetLib({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https:", "wss:"],
          frameSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  : noop;

const requestId = (req, res, next) => {
  req.id = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("x-request-id", req.id);
  next();
};

const responseTime = (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    if (!res.headersSent) res.setHeader("x-response-time", `${durationMs.toFixed(2)}ms`);
  });
  next();
};

module.exports = {
  compressionMiddleware,
  securityMiddleware,
  requestId,
  responseTime,
};
