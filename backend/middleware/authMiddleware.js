const jwt = require("jsonwebtoken");

const { prisma } = require("../config/postgres");
const sessionService = require("../services/sessionService");

const extractToken = (req) => {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.split(" ")[1];
  if (req.query && req.query.token) return req.query.token;
  return null;
};

const protect = async (req, res, next) => {
  const token = extractToken(req);
  console.log("Authorization:", req.headers.authorization);
  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: Number(decoded.id || decoded.userId) } });
    if (!user) {
      return res.status(401).json({ success: false, message: "The authenticated user could not be found." });
    }
    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      return res.status(423).json({ success: false, message: "Account locked. Try again later." });
    }
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      twoFactorEnabled: user.twoFactorEnabled,
    };
    req.sessionToken = token.startsWith("sess_") ? token : null;
    if (req.sessionToken) {
      // Touch in the background; failures shouldn't block the request.
      sessionService.touchSession(req.sessionToken).catch(() => {});
    }
    next();

    //
 } catch (error) {
  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      code: "JWT_EXPIRED",
      message: "Your session has expired. Please log in again.",
    });
  }

  if (
    error.name === "JsonWebTokenError" ||
    error.name === "NotBeforeError"
  ) {
    return res.status(401).json({
      success: false,
      code: "JWT_INVALID",
      message: "Your authentication token is invalid.",
    });
  }

  return next(error);
}
//
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Authentication required." });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "You do not have permission to access this resource." });
  }
  next();
};

const isAdmin = authorize("ADMIN");

// Optional auth: parses token if present but does not require it.
const optionalAuth = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: Number(decoded.id || decoded.userId) } });
    if (user) {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        twoFactorEnabled: user.twoFactorEnabled,
      };
    }
  } catch {
    // ignore
  }
  next();
};

module.exports = { protect, authorize, isAdmin, optionalAuth };
