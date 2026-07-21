// Full-text search across all entities. Uses PostgreSQL ILIKE for simplicity.
// For production scale, upgrade to PostgreSQL tsvector or Meilisearch/Algolia.
const { prisma } = require("../config/postgres");

const searchEntities = async (orgId, query, { limit = 20 } = {}) => {
  if (!query || query.length < 2) return { results: [], total: 0 };
  const q = query.trim();
  const results = [];

  // Search leads
  const leads = await prisma.lead.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { companyName: { contains: q, mode: "insensitive" } },
        { jobTitle: { contains: q, mode: "insensitive" } },
      ],
    },
    take: limit,
    select: { id: true, name: true, email: true, companyName: true, status: true },
  });
  for (const l of leads) {
    results.push({
      type: "lead",
      id: l.id,
      title: l.name,
      subtitle: `${l.email} · ${l.companyName || "—"}`,
      url: `/leads/${l.id}`,
      badge: l.status,
    });
  }

  // Search deals
  const deals = await prisma.deal.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
      ],
    },
    take: limit,
    select: { id: true, title: true, amount: true, stage: true, status: true },
  });
  for (const d of deals) {
    results.push({
      type: "deal",
      id: d.id,
      title: d.title || `Deal #${d.id}`,
      subtitle: `$${(d.amount || 0).toLocaleString()} · ${d.stage}`,
      url: `/deals`,
      badge: d.status,
    });
  }

  // Search organizations
  const orgs = await prisma.organization.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { website: { contains: q, mode: "insensitive" } },
        { contactEmail: { contains: q, mode: "insensitive" } },
      ],
    },
    take: limit,
    select: { id: true, name: true, website: true, contactEmail: true },
  });
  for (const o of orgs) {
    results.push({
      type: "organization",
      id: o.id,
      title: o.name,
      subtitle: o.website || o.contactEmail || "—",
      url: `/organizations/${o.id}`,
    });
  }

  // Search users (team members)
  const users = await prisma.user.findMany({
    where: {
      organizationId: orgId,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { mobile: { contains: q, mode: "insensitive" } },
      ],
    },
    take: limit,
    select: { id: true, name: true, email: true, role: true },
  });
  for (const u of users) {
    results.push({
      type: "user",
      id: u.id,
      title: u.name,
      subtitle: u.email,
      url: `/team`,
      badge: u.role,
    });
  }

  // Search activities
  const activities = await prisma.activity.findMany({
    where: {
      orgId,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });
  for (const a of activities) {
    results.push({
      type: "activity",
      id: a.id,
      title: a.title,
      subtitle: `${a.kind} · ${a.user?.name || "—"} · ${new Date(a.createdAt).toLocaleDateString()}`,
      url: `/activities`,
    });
  }

  // Search notes
  const notes = await prisma.leadNote.findMany({
    where: { body: { contains: q, mode: "insensitive" } },
    take: limit,
    include: { user: { select: { name: true } } },
  });
  for (const n of notes) {
    results.push({
      type: "note",
      id: n.id,
      title: n.body?.slice(0, 60) || "Note",
      subtitle: `Note by ${n.user?.name || "—"}`,
      url: `/leads`,
    });
  }

  return { results: results.slice(0, limit * 2), total: results.length };
};

module.exports = { searchEntities };