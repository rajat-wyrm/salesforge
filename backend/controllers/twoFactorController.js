const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const twoFactor = require("../services/twoFactorService");

const status = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { twoFactorEnabled: true, twoFactorBackupCodes: true },
  });
  const backupCount = user?.twoFactorBackupCodes ? JSON.parse(user.twoFactorBackupCodes).length : 0;
  return response.success(res, { enabled: !!user?.twoFactorEnabled, backupCodesRemaining: backupCount });
});

const setup = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (user.twoFactorEnabled) throw new AppError("2FA is already enabled.", 400);
  const { secret, backupCodes } = await twoFactor.enable2FA(req.user.id);
  return response.success(res, {
    secret,
    otpauthUrl: twoFactor.otpauthUrl(secret, user.email),
    backupCodes,
  });
});

const verify = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) throw new AppError("Verification code is required.", 400);
  const ok = await twoFactor.confirm2FA(req.user.id, code);
  if (!ok) throw new AppError("Invalid code.", 400);
  return response.success(res, { message: "2FA verified." });
});

const disable = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) throw new AppError("Verification code is required.", 400);
  const ok = await twoFactor.confirm2FA(req.user.id, code);
  if (!ok) throw new AppError("Invalid code.", 400);
  await twoFactor.disable2FA(req.user.id);
  return response.success(res, { message: "2FA disabled." });
});

const regenerateBackupCodes = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) throw new AppError("Verification code is required.", 400);
  const ok = await twoFactor.confirm2FA(req.user.id, code);
  if (!ok) throw new AppError("Invalid code.", 400);
  const codes = twoFactor.generateBackupCodes();
  await prisma.user.update({
    where: { id: req.user.id },
    data: { twoFactorBackupCodes: JSON.stringify(codes) },
  });
  return response.success(res, { backupCodes: codes });
});

module.exports = { status, setup, verify, disable, regenerateBackupCodes };
