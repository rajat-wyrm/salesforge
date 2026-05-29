const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/emailTrackingController");

// Public tracking endpoints (no auth — called from email clients)
router.get("/open/:messageId", ctrl.trackOpen);
router.get("/click/:messageId", ctrl.trackClick);

// Authenticated management endpoints
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
router.post("/log", protect, tenantScope, ctrl.logEvent);
router.get("/events", protect, tenantScope, ctrl.listEvents);
router.get("/analytics", protect, tenantScope, ctrl.analytics);

module.exports = router;
