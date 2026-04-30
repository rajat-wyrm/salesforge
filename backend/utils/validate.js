// Centralized validation helpers using lightweight, dependency-free checks.
const isEmail = (s) => typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isNonEmpty = (s) => typeof s === "string" && s.trim().length > 0;
const isPositiveInt = (n) => Number.isInteger(n) && n > 0;
const isNonNegativeInt = (n) => Number.isInteger(n) && n >= 0;

const requireFields = (obj, fields) => {
  const missing = fields.filter((f) => obj[f] === undefined || obj[f] === null || obj[f] === "");
  if (missing.length) {
    const err = new Error(`Missing required fields: ${missing.join(", ")}`);
    err.status = 400;
    throw err;
  }
};

const pick = (obj, keys) => keys.reduce((acc, k) => {
  if (obj[k] !== undefined) acc[k] = obj[k];
  return acc;
}, {});

module.exports = { isEmail, isNonEmpty, isPositiveInt, isNonNegativeInt, requireFields, pick };
