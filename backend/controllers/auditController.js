const { prisma } = require("../config/postgres");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

const list = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 30,
    action,
    entityType,
    userId,
    search,
  } = req.query;

  const pageNumber = Number(page);
  const pageLimit = Number(limit);
  const skip = (pageNumber - 1) * pageLimit;

const where = {};

if (req.user?.role !== "SUPER_ADMIN") {
  where.orgId = req.orgId;
}



  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (userId) where.userId = Number(userId);

  if (search && search.trim()) {
    where.OR = [
      {
        user: {
          is: {
            name: {
              contains: search.trim(),
              mode: "insensitive",
            },
          },
        },
      },
      {
        user: {
          is: {
            email: {
              contains: search.trim(),
              mode: "insensitive",
            },
          },
        },
      },
    ];
  }
  console.log("Search =", search);

  console.log("Where =", JSON.stringify(where, null, 2));
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageLimit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);
  console.log("Returned rows =", items.length);
  return response.paginated(res, items, total, pageNumber, pageLimit);
});

module.exports = {
  list,
  recordAudit,
};
