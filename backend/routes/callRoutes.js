const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/callController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");
const { cacheMiddleware } = require("../utils/cache");

router.use(protect, tenantScope);

router.get("/metrics", ctrl.metrics);
router.get("/", cacheMiddleware(30), ctrl.list);
router.get("/:id", ctrl.get);
router.post("/log", permit("OWNER", "ADMIN", "MEMBER"), ctrl.log);
router.patch("/:id", permit("OWNER", "ADMIN", "MEMBER"), ctrl.update);
router.delete("/:id", permit("OWNER", "ADMIN"), ctrl.remove);

module.exports = router;
