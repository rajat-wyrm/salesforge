const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/socialSearchController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");

router.use(protect, tenantScope);

router.post("/", ctrl.socialSearch);
router.get("/history", ctrl.history);

module.exports = router;
