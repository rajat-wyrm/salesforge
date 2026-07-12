const express = require("express");
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  logout,
  forgotPassword,
  resetPassword,
  me,
  changePassword,
  deleteAccount,
  sendOtp,
  verifyOtp,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
  forgotPasswordSchema,
  loginSchema,
  otpEmailSchema,
  registerSchema,
  resetPasswordSchema,
  verifyOtpSchema,
  changePasswordSchema,
} = require("../validations/authValidation");

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/google", googleLogin);
router.post("/logout", protect, logout);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.post("/change-password", protect, validate(changePasswordSchema), changePassword);
router.delete("/me", protect, deleteAccount);
router.get("/me", protect, me);
router.post("/send-otp", validate(otpEmailSchema), sendOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);

module.exports = router;
