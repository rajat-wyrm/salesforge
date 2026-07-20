const { prisma } = require("../config/postgres");
const intelService = require("../services/intelService");
const { AppError } = require("../middleware/errorHandler");
const { createInAppNotification } = require("../services/notificationService");
const { recordAudit } = require("../services/auditService");
const { incrementUsage } = require("../services/usageService");
const { publish } = require("../services/webhookService");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");

/**
 * Execute search query across OSINT/Sales intelligence modules
 */
const searchIntel = asyncHandler(async (req, res) => {
  const { module, query, filters } = req.body;
  if (!module || !query) {
    throw new AppError("Module type and search query are required.", 400);
  }

  // 1. Fetch OSINT results & AI insights
  const data = await intelService.searchIntel(module, query, filters);

  // 2. Save search history in the database (IntelSearch model)
  const historyItem = await prisma.intelSearch.create({
    data: {
      userId: req.user.id,
      orgId: req.orgId,
      module,
      query,
      filters: filters || {},
      results: data
    }
  });

  // 3. Increment analytics/metrics usage
  await prisma.analyticsEvent.create({
    data: {
      userId: req.user.id,
      orgId: req.orgId,
      type: "INTEL_SEARCH",
      resource: module
    }
  });

  await incrementUsage({ userId: req.user.id, orgId: req.orgId, resource: "searches" });

  // 4. Send notification
  await createInAppNotification({
    userId: req.user.id,
    orgId: req.orgId,
    type: "INTEL_SEARCH",
    category: "system",
    message: `Intelligence search on "${query}" via ${module} completed.`,
    link: `/tools/intel?module=${module}&q=${encodeURIComponent(query)}`,
    metadata: { recordId: historyItem.id, module, query }
  });

  // 5. Audit Log
  await recordAudit({
    userId: req.user.id,
    orgId: req.orgId,
    action: `intel_search.${module}`,
    entityType: "IntelSearch",
    entityId: String(historyItem.id),
    metadata: { query }
  });

  // 6. Webhook publish
  await publish({
    orgId: req.orgId,
    event: "SEARCH_COMPLETED",
    payload: { id: historyItem.id, module, query, searchedAt: historyItem.createdAt }
  });

  return response.success(res, historyItem);
});

/**
 * Retrieve search history with pagination
 */
const getHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, module } = req.query;
  const where = { userId: req.user.id };
  if (req.orgId) where.orgId = req.orgId;
  if (module) where.module = module;

  const [items, total] = await Promise.all([
    prisma.intelSearch.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      select: {
        id: true,
        module: true,
        query: true,
        filters: true,
        isPinned: true,
        createdAt: true,
        results: true // Keep results so recent item clicks can display instantly without re-fetching
      }
    }),
    prisma.intelSearch.count({ where })
  ]);

  return response.paginated(res, items, total, page, limit);
});

/**
 * Toggle pin / favorite state for a search log
 */
const togglePin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const searchId = Number(id);

  const current = await prisma.intelSearch.findFirst({
    where: { id: searchId, userId: req.user.id }
  });

  if (!current) {
    throw new AppError("Search history item not found.", 404);
  }

  const updated = await prisma.intelSearch.update({
    where: { id: searchId },
    data: { isPinned: !current.isPinned }
  });

  return response.success(res, updated);
});

/**
 * Delete a search history item
 */
const deleteHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await prisma.intelSearch.deleteMany({
    where: { id: Number(id), userId: req.user.id }
  });

  if (result.count === 0) {
    throw new AppError("Search history item not found.", 404);
  }

  return response.success(res, { message: "Search history item deleted successfully." });
});

/**
 * Manage Saved Search templates (reuse existing SavedSearch system or specialized tags)
 */
const getSavedSearches = asyncHandler(async (req, res) => {
  const where = { userId: req.user.id };
  if (req.orgId) where.orgId = req.orgId;

  // Resource can be classified as sales_intel/osint
  where.resource = "sales_intel";

  const items = await prisma.savedSearch.findMany({
    where,
    orderBy: { createdAt: "desc" }
  });
  return response.success(res, items);
});

const createSavedSearch = asyncHandler(async (req, res) => {
  const { name, module, filters } = req.body;
  if (!name || !module) {
    throw new AppError("Name and module type are required to save search.", 400);
  }

  const saved = await prisma.savedSearch.create({
    data: {
      name,
      resource: "sales_intel",
      filters: { module, filters: filters || {} },
      userId: req.user.id,
      orgId: req.orgId
    }
  });

  return response.created(res, saved);
});

module.exports = {
  searchIntel,
  getHistory,
  togglePin,
  deleteHistory,
  getSavedSearches,
  createSavedSearch
};
