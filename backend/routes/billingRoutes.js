const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/billingController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");

// Public - used by the pricing page.
router.get("/plans", optionalAuth, ctrl.listPlans);

// Everything below requires authentication + organization membership.
router.use(protect, tenantScope);
router.get("/subscription", ctrl.getCurrentSubscription);
router.post("/razorpay/order", permit("OWNER", "ADMIN"), ctrl.createOrder);
router.post("/razorpay/verify", permit("OWNER", "ADMIN"), ctrl.verifyPayment);
router.post("/cancel", permit("OWNER"), ctrl.cancel);
router.get("/payments", ctrl.listPayments);
router.get("/usage", ctrl.usage);
router.post("/invoice", permit("OWNER", "ADMIN"), ctrl.createInvoice);

module.exports = router;

