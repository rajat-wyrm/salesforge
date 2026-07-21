const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const apiKeyService = require("../services/apiKeyService");
const { incrementUsage } = require("../services/usageService");
const crypto = require("crypto");

const list = asyncHandler(async (req, res) => {
  console.log(`[apiKey:list] Listing API keys for orgId: ${req.orgId}`);
  const items = await apiKeyService.listApiKeys(req.orgId);
  return response.success(res, items);
});

const create = asyncHandler(async (req, res) => {
  const { name, scopes, expiresAt } = req.body;
  if (!name) {
    console.warn(`[apiKey:create] Missing name for API key. userId: ${req.user.id}`);
    throw new AppError("A name is required for the API key.", 400);
  }
  
  console.log(`[apiKey:create] Creating API key '${name}' for userId: ${req.user.id}, orgId: ${req.orgId}`);
  try {
    const apiKey = await apiKeyService.createApiKey({
      name,
      scopes: scopes || "read,write",
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      userId: req.user.id,
      orgId: req.orgId,
    });
    await incrementUsage({ userId: req.user.id, orgId: req.orgId, resource: "apiKeys" });
    console.log(`[apiKey:create] Successfully created API key '${name}' (id: ${apiKey.id})`);
    
    // Only the raw key is returned once - the client must store it securely.
    return response.created(res, apiKey);
  } catch (error) {
    console.error(`[apiKey:create] Error creating API key '${name}':`, error.message);
    throw error;
  }
});

const revoke = asyncHandler(async (req, res) => {
  console.log(`[apiKey:revoke] Revoking API key id: ${req.params.id} for orgId: ${req.orgId}`);
  try {
    await apiKeyService.revokeApiKey(req.orgId, req.params.id);
    console.log(`[apiKey:revoke] Successfully revoked API key id: ${req.params.id}`);
    return response.success(res, { message: "API key revoked." });
  } catch (error) {
    console.error(`[apiKey:revoke] Error revoking API key id: ${req.params.id}:`, error.message);
    throw error;
  }
});

const update = asyncHandler(async (req, res) => {
  const { active } = req.body;
  console.log(`[apiKey:update] Updating active status to ${!!active} for API key id: ${req.params.id} in orgId: ${req.orgId}`);
  try {
    const apiKey = await prisma.apiKey.updateMany({
      where: { id: Number(req.params.id), orgId: req.orgId },
      data: { active: !!active },
    });
    if (apiKey.count === 0) {
      console.warn(`[apiKey:update] API key not found. id: ${req.params.id}`);
      throw new AppError("API key not found.", 404);
    }
    console.log(`[apiKey:update] Successfully updated API key id: ${req.params.id}`);
    return response.success(res, { message: "API key updated." });
  } catch (error) {
    console.error(`[apiKey:update] Error updating API key id: ${req.params.id}:`, error.message);
    throw error;
  }
});

const regenerate = asyncHandler(async (req, res) => {
  console.log(`[apiKey:regenerate] Regenerating API key id: ${req.params.id} for orgId: ${req.orgId}`);
  try {
    const rawKey = crypto.randomBytes(32).toString("hex");
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.substring(0, 8);

    const result = await prisma.apiKey.updateMany({
      where: { id: Number(req.params.id), orgId: req.orgId },
      data: { keyHash, keyPrefix, lastUsedAt: null },
    });
    if (result.count === 0) {
      console.warn(`[apiKey:regenerate] API key not found. id: ${req.params.id}`);
      throw new AppError("API key not found.", 404);
    }
    
    console.log(`[apiKey:regenerate] Successfully regenerated API key id: ${req.params.id}`);
    return response.success(res, { message: "API key regenerated.", key: rawKey });
  } catch (error) {
    console.error(`[apiKey:regenerate] Error regenerating API key id: ${req.params.id}:`, error.message);
    throw error;
  }
});

module.exports = { list, create, revoke, update, regenerate };
