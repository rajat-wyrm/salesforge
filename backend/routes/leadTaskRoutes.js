const express = require("express");
const router = express.Router({ mergeParams: true });
const ctrl = require("../controllers/leadTaskController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");

router.use(protect, tenantScope);

router.get("/:leadId/tasks", ctrl.list);
router.post("/:leadId/tasks", permit("OWNER", "ADMIN", "MEMBER"), ctrl.create);
router.patch("/:leadId/tasks/:id", ctrl.update);
router.delete("/:leadId/tasks/:id", permit("OWNER", "ADMIN", "MEMBER"), ctrl.remove);

router.get("/me/tasks", ctrl.myTasks);

module.exports = router;
