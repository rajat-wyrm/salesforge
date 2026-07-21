const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/teamController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");

// ─────────────────────────────────────────────────────────────────────────────
// Public-ish invite routes: the receiver has NO org yet, so tenantScope would
// reject them. Register these BEFORE the router-level tenantScope middleware.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/invites/accept",          protect, ctrl.acceptInvite);
router.get("/invites/preview/:token",   protect, ctrl.previewInvite);

// ─────────────────────────────────────────────────────────────────────────────
// All routes below require the caller to be authenticated AND belong to an org.
// ─────────────────────────────────────────────────────────────────────────────
router.use(protect, tenantScope);

// Org info
router.get("/org",    ctrl.getOrg);
router.patch("/org",  permit("OWNER", "ADMIN"), ctrl.updateOrg);

// Members
router.get("/members", ctrl.listMembers);
router.patch("/members/:id", permit("OWNER"), ctrl.updateMemberRole);
router.delete("/members/:id", permit("OWNER"), ctrl.removeMember);

// Invites
router.get("/invites", ctrl.listInvites);
router.post("/invites", ctrl.sendInvite);
router.delete("/invites/:id", permit("OWNER", "ADMIN"), ctrl.revokeInvite);

module.exports = router;
