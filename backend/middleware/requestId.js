const crypto = require("crypto");

// Attach a stable per-request ID so logs and audit entries can be correlated.
const requestId = (req, res, next) => {
  const incoming = req.headers["x-request-id"];
  req.id = incoming && /^[a-zA-Z0-9_-]{6,80}$/.test(incoming) ? incoming : crypto.randomUUID();
  res.setHeader("x-request-id", req.id);
  next();
};

module.exports = requestId;
