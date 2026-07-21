const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/apiKeyController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");
const { enforcePlanLimit } = require("../services/usageService");

router.use(protect, tenantScope);

router.get("/", ctrl.list);
router.post("/", permit("OWNER", "ADMIN"), enforcePlanLimit("apiKeys", "API keys"), ctrl.create);
router.patch("/:id", permit("OWNER", "ADMIN"), ctrl.update);
router.post("/:id/regenerate", permit("OWNER", "ADMIN"), ctrl.regenerate);
router.delete("/:id", permit("OWNER", "ADMIN"), ctrl.revoke);

module.exports = router;
