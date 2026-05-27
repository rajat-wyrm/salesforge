const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/webhookController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");
const { enforcePlanLimit } = require("../services/usageService");

router.use(protect, tenantScope);

router.get("/", ctrl.list);
router.get("/deliveries", ctrl.listDeliveries);
router.post("/", permit("OWNER", "ADMIN"), enforcePlanLimit("webhooks", "webhooks"), ctrl.create);
router.patch("/:id", permit("OWNER", "ADMIN"), ctrl.update);
router.delete("/:id", permit("OWNER", "ADMIN"), ctrl.remove);
router.post("/:id/test", permit("OWNER", "ADMIN"), ctrl.test);
router.post("/:id/rotate-secret", permit("OWNER", "ADMIN"), ctrl.rotateSecret);

module.exports = router;
