const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/notificationPrefController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");

router.use(protect, tenantScope);

router.get("/", ctrl.list);
router.put("/", ctrl.update);

module.exports = router;
