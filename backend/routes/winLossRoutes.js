const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/winLossController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");

router.use(protect, tenantScope);

router.get("/", ctrl.list);
router.get("/analytics", ctrl.analytics);
router.post("/", permit("OWNER", "ADMIN", "MEMBER"), ctrl.create);
router.get("/:id", ctrl.get);
router.delete("/:id", permit("OWNER", "ADMIN"), ctrl.remove);

module.exports = router;
