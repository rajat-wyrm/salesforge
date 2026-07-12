const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/quoteController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");

router.use(protect, tenantScope);

router.get("/metrics", ctrl.metrics);
router.get("/", ctrl.list);
router.get("/:id", ctrl.get);
router.post("/", permit("OWNER", "ADMIN", "MEMBER"), ctrl.create);
router.patch("/:id", permit("OWNER", "ADMIN", "MEMBER"), ctrl.update);
router.patch("/:id/status", permit("OWNER", "ADMIN", "MEMBER"), ctrl.updateStatus);
router.delete("/:id", permit("OWNER", "ADMIN"), ctrl.remove);

module.exports = router;
