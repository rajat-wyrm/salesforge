const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");

router.use(protect, tenantScope);

router.get("/", ctrl.listNotifications);
router.patch("/read-all", ctrl.readAllNotifications);
router.patch("/:id/read", ctrl.readNotification);
router.post("/broadcast", permit("OWNER", "ADMIN"), ctrl.broadcast);

module.exports = router;
