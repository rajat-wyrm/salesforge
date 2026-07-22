const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const inviteService = require("../services/inviteService");
const { dispatchNotification } = require("../services/notificationService");
const { sendEmail, sendInviteEmail } = require("../utils/sendEmail");
const slugify = require("../utils/slugify");
const eventBus = require("../services/eventBus");

const listMembers = asyncHandler(async (req, res) => {
  const members = await prisma.user.findMany({
    where: { organizationId: req.orgId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
      twoFactorEnabled: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return response.success(res, members);
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const allowed = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];

  if (!allowed.includes(role)) {
    throw new AppError(
      `Role must be one of ${allowed.join(", ")}.`,
      400
    );
  }

  if (Number(id) === req.user.id) {
    throw new AppError("You cannot change your own role.", 400);
  }

  const member = await prisma.user.findFirst({
    where: {
      id: Number(id),
      organizationId: req.orgId,
    },
  });

  if (!member) {
    throw new AppError("Member not found.", 404);
  }

  // Prevent demoting the last OWNER.
  if (member.role === "OWNER" && role !== "OWNER") {
    const otherOwners = await prisma.user.count({
      where: {
        organizationId: req.orgId,
        role: "OWNER",
      },
    });

    if (otherOwners <= 1) {
      throw new AppError("Cannot demote the last owner.", 400);
    }
  }

  await prisma.user.update({
    where: { id: member.id },
    data: { role },
  });

  await prisma.orgMembership.update({
    where: {
      userId_orgId: {
        userId: member.id,
        orgId: req.orgId,
      },
    },
    data: { role },
  });

  await dispatchNotification({
    userId: member.id,
    orgId: req.orgId,
    type: "TEAM_ROLE_UPDATED",
    category: "team",
    message: `Your role has been updated to ${role}.`,
    link: "/app/settings/team",
  });

  return response.success(res, {
    message: "Role updated.",
  });
});

const removeMember = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (Number(id) === req.user.id) {
    throw new AppError("You cannot remove yourself.", 400);
  }

  const member = await prisma.user.findFirst({
    where: {
      id: Number(id),
      organizationId: req.orgId,
    },
  });

  if (!member) {
    throw new AppError("Member not found.", 404);
  }

  if (member.role === "OWNER") {
    const otherOwners = await prisma.user.count({
      where: {
        organizationId: req.orgId,
        role: "OWNER",
      },
    });

    if (otherOwners <= 1) {
      throw new AppError("Cannot remove the last owner.", 400);
    }
  }

  await prisma.user.update({
    where: { id: member.id },
    data: {
      organizationId: null,
      role: "VIEWER",
    },
  });

  await prisma.orgMembership.deleteMany({
    where: {
      userId: member.id,
      orgId: req.orgId,
    },
  });

  await dispatchNotification({
    userId: member.id,
    orgId: req.orgId,
    type: "TEAM_MEMBER_REMOVED",
    category: "team",
    message: `You have been removed from the organization.`,
    link: "/app/dashboard",
  });

  return response.success(res, {
    message: "Member removed.",
  });
});

const listInvites = asyncHandler(async (req, res) => {
  const items = await inviteService.listInvites(req.orgId);

  return response.success(res, items);
});

const sendInvite = asyncHandler(async (req, res) => {
  const { email, role = "MEMBER" } = req.body;

  // Check email is present and is a string.
  if (!email || typeof email !== "string") {
    throw new AppError("Email is required.", 400);
  }

  // Remove spaces and convert email to lowercase.
  const normalizedEmail = email.trim().toLowerCase();

  // Validate proper email format.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!emailRegex.test(normalizedEmail)) {
    throw new AppError("Please enter a valid email address.", 400);
  }

  const allowed = ["ADMIN", "MEMBER", "VIEWER"];

  if (!allowed.includes(role)) {
    throw new AppError(
      `Role must be one of ${allowed.join(", ")}.`,
      400
    );
  }

  // If the user already exists in this organization, no invite is needed.
  const existing = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existing && existing.organizationId === req.orgId) {
    throw new AppError(
      "That user is already a member of this organization.",
      409
    );
  }

  // Replace any previous pending invite for the same email.
  await prisma.teamInvite.deleteMany({
    where: {
      orgId: req.orgId,
      email: normalizedEmail,
      acceptedAt: null,
    },
  });

  const invite = await inviteService.createInvite({
    orgId: req.orgId,
    email: normalizedEmail,
    role,
    invitedById: req.user.id,
  });

  const org = await prisma.organization.findUnique({
    where: {
      id: req.orgId,
    },
  });

  const frontendUrl = (
    process.env.FRONTEND_URL || "http://localhost:5173"
  ).replace(/\/$/, "");

  const inviteUrl = `${frontendUrl}/invite/accept?token=${invite.token}`;

  const emailResult = await sendInviteEmail({
    to: invite.email,
    inviterName: req.user.name,
    orgName: org?.name || "your team",
    role,
    inviteUrl,
  });

  eventBus.publish(`org:${req.orgId}`, {
    event: "USER_INVITED",
    payload: {
      email: invite.email,
      role,
    },
    at: new Date().toISOString(),
  });

  await dispatchNotification({
    userId: req.user.id,
    orgId: req.orgId,
    type: "TEAM_MEMBER_INVITED",
    category: "team",
    message: `Invitation sent to ${invite.email} for role ${role}.`,
    link: "/app/settings/team",
    metadata: { email: invite.email, role },
  });

  return response.created(res, {
    ...invite,
    inviteUrl: emailResult.skipped ? inviteUrl : undefined,
    emailSkipped: emailResult.skipped,
  });
});

const revokeInvite = asyncHandler(async (req, res) => {
  await inviteService.revokeInvite(req.orgId, req.params.id);

  return response.success(res, {
    message: "Invite revoked.",
  });
});

const acceptInvite = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const invite = await inviteService.acceptInvite({
    token,
    userId: req.user.id,
  });

  eventBus.publish(`org:${invite.orgId}`, {
    event: "USER_JOINED",
    payload: {
      userId: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: invite.role,
    },
    at: new Date().toISOString(),
  });

  if (invite.invitedById) {
    await dispatchNotification({
      userId: invite.invitedById,
      orgId: invite.orgId,
      type: "TEAM_MEMBER_ADDED",
      category: "team",
      message: `${req.user.name || req.user.email} has accepted your team invite.`,
      link: "/app/settings/team",
    });
  }

  return response.success(res, {
    message: "Invite accepted.",
    orgId: invite.orgId,
  });
});

const previewInvite = asyncHandler(async (req, res) => {
  const invite = await inviteService.getInvite(req.params.token);

  const org = await prisma.organization.findUnique({
    where: {
      id: invite.orgId,
    },
  });

  return response.success(res, {
    email: invite.email,
    role: invite.role,
    orgName: org?.name,
    orgSlug: org?.slug,
    expiresAt: invite.expiresAt,
    invitedBy: invite.invitedById,
  });
});

const updateOrg = asyncHandler(async (req, res) => {
  const allowed = [
    "name",
    "website",
    "description",
    "region",
    "type",
    "contactName",
    "contactEmail",
    "logo",
  ];

  const data = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      data[key] = req.body[key];
    }
  }

if (data.name !== undefined) {
  data.name = String(data.name).trim();

  if (!data.name) {
    throw new AppError("Workspace name is required.", 400);
  }
}

  if (data.name) {
    data.slug = `${slugify(data.name)}-${req.orgId}`;
  }

  if (data.website !== undefined) {
  data.website = String(data.website).trim();

  if (data.website) {
    try {
      const parsedUrl = new URL(data.website);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }

      if (!parsedUrl.hostname.includes(".")) {
        throw new Error("Invalid hostname");
      }
    } catch {
      throw new AppError(
        "Please enter a valid website URL.",
        400
      );
    }
  }
}
if (data.description !== undefined) {
  data.description = String(data.description).trim();

  if (data.description.length > 500) {
    throw new AppError(
      "Workspace description must not exceed 500 characters.",
      400
    );
  }
}
  const org = await prisma.organization.update({
    where: {
      id: req.orgId,
    },
    data,
  });

  return response.success(res, org);
});

const getOrg = asyncHandler(async (req, res) => {
  const org = await prisma.organization.findUnique({
    where: {
      id: req.orgId,
    },
  });

  return response.success(res, org);
});

module.exports = {
  listMembers,
  updateMemberRole,
  removeMember,
  listInvites,
  sendInvite,
  revokeInvite,
  acceptInvite,
  previewInvite,
  updateOrg,
  getOrg,
};
