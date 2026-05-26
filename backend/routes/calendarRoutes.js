const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/calendarController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");

router.use(protect, tenantScope);

router.get("/", ctrl.list);
router.get("/team", ctrl.teamView);
router.post("/", ctrl.create);
router.get("/:id", ctrl.get);
router.patch("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;
