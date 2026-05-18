const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

const VALID_CATEGORIES = ["general", "competitor", "objection", "discovery", "closing", "follow_up"];

const list = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const where = { orgId: req.orgId, isPublished: true };
  if (category) where.category = category;
  if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }];
  const items = await prisma.playbook.findMany({
    where, orderBy: { updatedAt: "desc" },
    include: { _count: { select: { steps: true } }, createdBy: { select: { id: true, name: true } } },
  });
  return response.success(res, items);
});

const get = asyncHandler(async (req, res) => {
  const playbook = await prisma.playbook.findFirst({
    where: { id: Number(req.params.id), orgId: req.orgId },
    include: { steps: { orderBy: { position: "asc" } }, createdBy: { select: { id: true, name: true } } },
  });
  if (!playbook) throw new AppError("Playbook not found.", 404);
  return response.success(res, playbook);
});

const create = asyncHandler(async (req, res) => {
  const { name, description, category, tags, steps = [] } = req.body;
  if (!name) throw new AppError("name is required.", 400);
  const playbook = await prisma.playbook.create({
    data: {
      orgId: req.orgId, name,
      description: description || null,
      category: VALID_CATEGORIES.includes(category) ? category : "general",
      tags: tags || null,
      createdById: req.user.id,
      steps: { create: steps.map((s, i) => ({ title: s.title, content: s.content || "", type: s.type || "text", position: i })) },
    },
    include: { steps: { orderBy: { position: "asc" } } },
  });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "playbook.create", entityType: "Playbook", entityId: playbook.id });
  return response.created(res, playbook);
});

const update = asyncHandler(async (req, res) => {
  const data = {};
  ["name", "description", "category", "tags", "isPublished"].forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  const result = await prisma.playbook.updateMany({ where: { id: Number(req.params.id), orgId: req.orgId }, data });
  if (result.count === 0) throw new AppError("Playbook not found.", 404);
  if (req.body.steps) {
    await prisma.playbookStep.deleteMany({ where: { playbookId: Number(req.params.id) } });
    await prisma.playbookStep.createMany({
      data: req.body.steps.map((s, i) => ({
        playbookId: Number(req.params.id),
        title: s.title, content: s.content || "", type: s.type || "text", position: i,
      })),
    });
  }
  return response.success(res, { message: "Playbook updated." });
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.playbook.deleteMany({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (result.count === 0) throw new AppError("Playbook not found.", 404);
  return response.success(res, { message: "Playbook deleted." });
});

const TEMPLATES = [
  {
    name: "BANT Qualification",
    category: "discovery",
    description: "Budget, Authority, Need, Timeline — the classic qualification framework.",
    steps: [
      { type: "question", title: "Budget", content: "What budget have you allocated for this initiative? Who controls the budget?" },
      { type: "question", title: "Authority", content: "Who else is involved in this decision? What does your evaluation process look like?" },
      { type: "question", title: "Need", content: "What problem are you trying to solve? What happens if you don't solve it?" },
      { type: "question", title: "Timeline", content: "What's your ideal timeline? Are there any external drivers?" },
    ],
  },
  {
    name: "Objection: Too Expensive",
    category: "objection",
    description: "Handle pricing objections by reframing value vs cost.",
    steps: [
      { type: "tip", title: "Acknowledge", content: "I understand budget is a concern. Can you share what you're comparing it against?" },
      { type: "tip", title: "Reframe to value", content: "Let's look at the ROI. Based on the metrics you shared, our solution pays for itself in X months." },
      { type: "tip", title: "Break it down", content: "On a per-user, per-month basis, that's less than a coffee. Can we work with that?" },
      { type: "tip", title: "Offer options", content: "We have tiered plans — would Starter or Pro be a better fit to start?" },
    ],
  },
  {
    name: "Competitor: Salesforce",
    category: "competitor",
    description: "Battle card for when prospects mention Salesforce as an alternative.",
    steps: [
      { type: "warning", title: "Their Strengths", content: "Enterprise brand recognition, large app ecosystem, deep customization." },
      { type: "tip", title: "Our Advantages", content: "Faster time-to-value, modern UX, built-in AI workflows, transparent pricing, no consultant required." },
      { type: "question", title: "Discovery", content: "What's most important to you — breadth of features, ease of use, or total cost of ownership?" },
      { type: "tip", title: "Land the Close", content: "Many teams switch FROM Salesforce TO us for simplicity. Ask: how much time does your team spend on customization?" },
    ],
  },
  {
    name: "Closing: Assumptive Close",
    category: "closing",
    description: "Move the deal forward by assuming the decision is made.",
    steps: [
      { type: "question", title: "Confirm the fit", content: "Based on what we've discussed, does this feel like the right solution for your team?" },
      { type: "tip", title: "Assume the close", content: "Great — should we start the Pro plan with the team onboarding, or the Enterprise plan with the dedicated CSM?" },
      { type: "question", title: "Resolve final concerns", content: "Before we move forward — is there anything still holding you back?" },
      { type: "tip", title: "Create urgency", content: "We have a pricing lock for this quarter. Shall I get the contract drafted today?" },
    ],
  },
  {
    name: "Follow-up: Post-Demo",
    category: "follow_up",
    description: "Structured follow-up after a product demo.",
    steps: [
      { type: "checklist", title: "Send within 24 hours", content: "✓ Personalized thank-you email\n✓ Demo recording link\n✓ Relevant case study (1-2)\n✓ Proposal draft (if discussed)" },
      { type: "question", title: "Day 3 check-in", content: "Did you have a chance to share the recording with your team? Any questions that came up?" },
      { type: "tip", title: "Day 7 follow-up", content: "Share a relevant case study or ROI calculator. Reference a specific pain point they mentioned." },
      { type: "tip", title: "Day 14 final touch", content: "If no engagement, send a breakup email: 'Should I close your file or is this still a priority?'" },
    ],
  },
];

const installTemplate = asyncHandler(async (req, res) => {
  const template = TEMPLATES.find((t) => t.name === req.body.name);
  if (!template) throw new AppError("Template not found.", 404);
  const playbook = await prisma.playbook.create({
    data: {
      orgId: req.orgId, name: template.name, description: template.description,
      category: template.category, tags: "template", createdById: req.user.id,
      steps: { create: template.steps.map((s, i) => ({ title: s.title, content: s.content, type: s.type, position: i })) },
    },
    include: { steps: { orderBy: { position: "asc" } } },
  });
  return response.created(res, playbook);
});

module.exports = { list, get, create, update, remove, TEMPLATES, installTemplate, VALID_CATEGORIES };
