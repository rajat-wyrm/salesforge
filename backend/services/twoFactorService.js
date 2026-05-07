const crypto = require("crypto");
const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");

// Simple TOTP implementation using HMAC-SHA1 (RFC 6238 compatible).
// Avoids a native dependency while staying standards-compliant for Google Authenticator etc.
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const base32Encode = (buffer) => {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
};

const base32Decode = (input) => {
  const cleaned = String(input || "").replace(/=+$/, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
};

const generateSecret = () => base32Encode(crypto.randomBytes(20));

const generateBackupCodes = (count = 8) => {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(5).toString("hex").slice(0, 10).toUpperCase(),
  );
};

const totp = (secret, period = 30, window = 1) => {
  const counter = Math.floor(Date.now() / 1000 / period);
  const codes = [];
  for (let w = -window; w <= window; w += 1) {
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter + w));
    const hmac = crypto.createHmac("sha1", base32Decode(secret)).update(counterBuffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    codes.push(String(code % 1_000_000).padStart(6, "0"));
  }
  return codes;
};

const verifyCode = (secret, code) => {
  if (!secret || !code) return false;
  return totp(secret).includes(String(code).trim());
};

const enable2FA = async (userId) => {
  const secret = generateSecret();
  const backupCodes = generateBackupCodes();
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: secret,
      twoFactorBackupCodes: JSON.stringify(backupCodes),
      twoFactorEnabled: true,
    },
  });
  return { secret, backupCodes };
};

const disable2FA = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      twoFactorEnabled: false,
    },
  });
};

const confirm2FA = async (userId, code) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true, twoFactorBackupCodes: true },
  });
  if (!user?.twoFactorEnabled) throw new AppError("Two-factor authentication is not enabled.", 400);
  if (verifyCode(user.twoFactorSecret, code)) return true;

  // Accept a backup code as a one-time fallback.
  const backupCodes = JSON.parse(user.twoFactorBackupCodes || "[]");
  const idx = backupCodes.indexOf(String(code).trim().toUpperCase());
  if (idx >= 0) {
    backupCodes.splice(idx, 1);
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackupCodes: JSON.stringify(backupCodes) },
    });
    return true;
  }
  return false;
};

const otpauthUrl = (secret, email) =>
  `otpauth://totp/SalesForge:${encodeURIComponent(email)}?secret=${secret}&issuer=SalesForge`;

module.exports = { generateSecret, generateBackupCodes, enable2FA, disable2FA, confirm2FA, verifyCode, otpauthUrl };
