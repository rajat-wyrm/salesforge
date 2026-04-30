// Helper for cache key generation.
const crypto = require("crypto");

const buildKey = (req) => {
  const base = `${req.method}:${req.originalUrl || req.url}`;
  return crypto.createHash("md5").update(base).digest("hex");
};

module.exports = { buildKey };
