const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/integrationMarketplaceController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");

router.use(protect, tenantScope);

router.get("/", ctrl.list);
router.get("/catalog", ctrl.config);
router.post("/install", permit("OWNER", "ADMIN"), ctrl.install);
router.post("/:id/sync", permit("OWNER", "ADMIN"), ctrl.sync);
router.delete("/:id", permit("OWNER", "ADMIN"), ctrl.uninstall);

module.exports = router;
