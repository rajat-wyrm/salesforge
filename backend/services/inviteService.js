const crypto = require("crypto");
const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const createInvite = async ({ orgId, email, role, invitedById }) => {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  return prisma.teamInvite.create({
    data: {
      orgId,
      email: email.toLowerCase(),
      role,
      token,
      invitedById,
      expiresAt,
    },
  });
};

const getInvite = async (token) => {
  const invite = await prisma.teamInvite.findUnique({ where: { token } });
  if (!invite) throw new AppError("Invite not found.", 404);
  if (invite.acceptedAt) throw new AppError("Invite already accepted.", 410);
  if (invite.expiresAt < new Date()) throw new AppError("Invite has expired.", 410);
  return invite;
};

const acceptInvite = async ({ token, userId }) => {
  const invite = await getInvite(token);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { organizationId: invite.orgId, role: invite.role },
    }),
    prisma.orgMembership.upsert({
      where: { userId_orgId: { userId, orgId: invite.orgId } },
      create: { userId, orgId: invite.orgId, role: invite.role },
      update: { role: invite.role },
    }),
    prisma.teamInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ]);
  return invite;
};

const listInvites = async (orgId) => {
  return prisma.teamInvite.findMany({
    where: { orgId, acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    include: { invitedBy: { select: { id: true, name: true, email: true } } },
  });
};

const revokeInvite = async (orgId, id) => {
  const result = await prisma.teamInvite.deleteMany({
    where: { id: Number(id), orgId, acceptedAt: null },
  });
  if (result.count === 0) throw new AppError("Invite not found.", 404);
};

module.exports = { createInvite, getInvite, acceptInvite, listInvites, revokeInvite };
