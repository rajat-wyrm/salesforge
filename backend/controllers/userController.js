const { prisma } = require("../config/postgres");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");

const getSafeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  mobile: user.mobile,
  isVerified: user.isVerified,
  twoFactorEnabled: user.twoFactorEnabled,
  createdAt: user.createdAt,
  organizationId: user.organizationId,
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return response.error(res, "User not found.", 404);
  return response.success(res, getSafeUser(user));
});

const updateCurrentUser = asyncHandler(async (req, res) => {
  const allowed = ["name", "mobile"];
  const data = {};
  for (const key of allowed) if (req.body[key] !== undefined) data[key] = req.body[key];
  if (data.name) data.name = data.name.trim();
  const user = await prisma.user.update({ where: { id: req.user.id }, data });
  return response.success(res, getSafeUser(user));
});

const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, search } = req.query;
  const where = { organizationId: req.orgId };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      select: {
        id: true, name: true, email: true, role: true, isVerified: true,
        twoFactorEnabled: true, lastLoginAt: true, createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);
  return response.paginated(res, users, total, page, limit);
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await prisma.user.findFirst({
    where: { id: Number(req.params.id), organizationId: req.orgId },
    select: {
      id: true, name: true, email: true, role: true, mobile: true,
      isVerified: true, twoFactorEnabled: true, lastLoginAt: true, createdAt: true,
    },
  });
  if (!user) return response.error(res, "User not found.", 404);
  return response.success(res, user);
});

module.exports = { getCurrentUser, updateCurrentUser, listUsers, getUserById };
