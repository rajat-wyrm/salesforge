// Sanitize error messages to avoid leaking stack traces in production.
const SANITIZE = process.env.NODE_ENV === "production";

const sanitizeError = (err) => {
  if (!err) return "Unknown error";
  if (SANITIZE) {
    if (err.code === "P2002") return "A record with that unique value already exists.";
    if (err.code === "P2025") return "Record not found.";
    if (err.code && err.code.startsWith("P")) return "Database error.";
    return "Internal server error.";
  }
  return err.message || String(err);
};

module.exports = { sanitizeError };
