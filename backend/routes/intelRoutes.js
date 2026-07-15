const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/intelController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const validate = require("../middleware/validate");
const {
  searchIntelSchema,
  getHistorySchema,
  togglePinSchema,
  deleteHistorySchema,
  createSavedSearchSchema
} = require("../validations/intelValidation");

// Enforce auth and tenant isolation
router.use(protect, tenantScope);

router.post("/search", validate(searchIntelSchema), ctrl.searchIntel);
router.get("/history", validate(getHistorySchema, "query"), ctrl.getHistory);
router.patch("/history/:id/pin", validate(togglePinSchema, "params"), ctrl.togglePin);
router.delete("/history/:id", validate(deleteHistorySchema, "params"), ctrl.deleteHistory);
router.get("/saved", ctrl.getSavedSearches);
router.post("/saved", validate(createSavedSearchSchema), ctrl.createSavedSearch);

module.exports = router;
