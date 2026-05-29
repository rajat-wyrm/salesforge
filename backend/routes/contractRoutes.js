const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/contractController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");
const { cacheMiddleware } = require("../utils/cache");

router.use(protect, tenantScope);

router.get("/metrics", ctrl.metrics);
router.get("/", cacheMiddleware(60), ctrl.list);
router.get("/:id", ctrl.get);
router.post("/", permit("OWNER", "ADMIN"), ctrl.create);
router.patch("/:id", permit("OWNER", "ADMIN"), ctrl.update);
router.delete("/:id", permit("OWNER", "ADMIN"), ctrl.remove);

module.exports = router;
