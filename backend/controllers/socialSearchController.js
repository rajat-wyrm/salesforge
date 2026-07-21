const { AppError } = require("../middleware/errorHandler");
const { dispatchNotification } = require("../services/notificationService");
const { recordAudit } = require("../services/auditService");
const { incrementUsage } = require("../services/usageService");
const { publish } = require("../services/webhookService");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { prisma } = require("../config/postgres");

const platformMatchers = [
  { platform: "LinkedIn", hosts: ["linkedin.com"], type: "profile" },
  { platform: "GitHub", hosts: ["github.com"], type: "profile" },
  { platform: "X", hosts: ["x.com", "twitter.com"], type: "profile" },
  { platform: "Instagram", hosts: ["instagram.com"], type: "profile" },
  { platform: "Facebook", hosts: ["facebook.com"], type: "profile" },
  { platform: "YouTube", hosts: ["youtube.com", "youtu.be"], type: "channel" },
  { platform: "TikTok", hosts: ["tiktok.com"], type: "profile" },
  { platform: "Reddit", hosts: ["reddit.com"], type: "profile" },
  { platform: "Medium", hosts: ["medium.com"], type: "profile" },
  { platform: "Pinterest", hosts: ["pinterest.com"], type: "profile" },
];

const parseSocialUrl = (input) => {
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new AppError("A valid social profile URL is required.", 400);
  }
  const host = url.hostname.replace(/^www\./, "");
  const matcher = platformMatchers.find((item) => item.hosts.includes(host));
  if (!matcher) throw new AppError("Unsupported social platform URL.", 400);

  const segments = url.pathname.split("/").map((s) => s.trim()).filter(Boolean);
  const skip = new Set(["in", "company", "channel", "c", "user", "p", "reel", "reels", "status", "video", "watch"]);
  let handle = null;
  for (const seg of segments) {
    if (skip.has(seg.toLowerCase())) continue;
    handle = seg;
    break;
  }

  return {
    platform: matcher.platform,
    type: matcher.type,
    normalizedUrl: `${url.origin}${url.pathname}`.replace(/\/$/, ""),
    handle: handle || null,
    pathSegments: segments,
  };
};

const socialSearch = asyncHandler(async (req, res) => {
  const parsed = parseSocialUrl(req.body.url);
  await prisma.analyticsEvent.create({
    data: { userId: req.user.id, orgId: req.orgId, type: "SOCIAL_SEARCH", resource: "social" },
  });
  await incrementUsage({ userId: req.user.id, orgId: req.orgId, resource: "searches" });
  await dispatchNotification({
    userId: req.user.id,
    orgId: req.orgId,
    type: "SOCIAL_SEARCH",
    category: "system",
    message: `Parsed ${parsed.platform} URL successfully.`,
    metadata: parsed,
    link: "/app/search/social",
  });
  await recordAudit({
    userId: req.user.id, orgId: req.orgId,
    action: "search.social", entityType: "SocialSearch",
    metadata: parsed,
  });
  await publish({ orgId: req.orgId, event: "SEARCH_COMPLETED", payload: { type: "social", ...parsed } });
  return response.success(res, parsed);
});

const history = asyncHandler(async (req, res) => {
  const events = await prisma.analyticsEvent.findMany({
    where: { orgId: req.orgId, type: "SOCIAL_SEARCH" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return response.success(res, events);
});

module.exports = { socialSearch, history };
