const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/activityController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");

router.use(protect, tenantScope);

router.get("/", ctrl.list);
router.get("/today", ctrl.today);
router.get("/upcoming", ctrl.upcoming);
router.get("/overdue", ctrl.overdue);
router.post("/", permit("OWNER", "ADMIN", "MEMBER"), ctrl.create);
router.get("/:id", ctrl.get);
router.patch("/:id", ctrl.update);
router.post("/:id/complete", ctrl.complete);
router.delete("/:id", ctrl.remove);

module.exports = router;
