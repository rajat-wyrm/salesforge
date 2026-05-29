const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/priceBookController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");

router.use(protect, tenantScope);

router.get("/", ctrl.list);
router.post("/", permit("OWNER", "ADMIN"), ctrl.create);
router.get("/:id", ctrl.get);
router.post("/:id/entries", permit("OWNER", "ADMIN"), ctrl.addEntry);
router.delete("/:id/entries/:productId", permit("OWNER", "ADMIN"), ctrl.removeEntry);
router.delete("/:id", permit("OWNER", "ADMIN"), ctrl.remove);

module.exports = router;
