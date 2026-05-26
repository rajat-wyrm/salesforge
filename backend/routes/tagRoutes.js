const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/tagController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");
const { enforcePlanLimit } = require("../services/usageService");

router.use(protect, tenantScope);

router.get("/", ctrl.list);
router.post("/", permit("OWNER", "ADMIN", "MEMBER"), enforcePlanLimit("tags", "tags"), ctrl.create);
router.patch("/:id", permit("OWNER", "ADMIN", "MEMBER"), ctrl.update);
router.delete("/:id", permit("OWNER", "ADMIN"), ctrl.remove);

// Tag management on individual leads
router.post("/leads/:leadId/attach", permit("OWNER", "ADMIN", "MEMBER"), ctrl.attachToLead);
router.delete("/leads/:leadId/detach/:tagId", permit("OWNER", "ADMIN", "MEMBER"), ctrl.detachFromLead);
router.get("/leads/:leadId", ctrl.listForLead);

module.exports = router;
