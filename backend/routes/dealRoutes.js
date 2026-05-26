const express = require("express");
const router = express.Router({ mergeParams: true });
const ctrl = require("../controllers/dealController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");

router.use(protect, tenantScope);

// Pipeline stages
router.get("/stages", ctrl.listStages);
router.post("/stages", permit("OWNER", "ADMIN"), ctrl.createStage);
router.patch("/stages/reorder", permit("OWNER", "ADMIN"), ctrl.reorderStages);
router.patch("/stages/:id", permit("OWNER", "ADMIN"), ctrl.updateStage);
router.delete("/stages/:id", permit("OWNER", "ADMIN"), ctrl.deleteStage);

// Deals
router.get("/kanban", ctrl.kanbanView);
router.get("/metrics", ctrl.metrics);
router.get("/", ctrl.listDeals);
router.get("/:id", ctrl.getDeal);
router.post("/", permit("OWNER", "ADMIN", "MEMBER"), ctrl.createDeal);
router.patch("/:id", permit("OWNER", "ADMIN", "MEMBER"), ctrl.updateDeal);
router.post("/:id/move", permit("OWNER", "ADMIN", "MEMBER"), ctrl.moveDeal);
router.delete("/:id", permit("OWNER", "ADMIN"), ctrl.deleteDeal);

module.exports = router;
