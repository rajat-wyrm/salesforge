const test = require("node:test");
const assert = require("node:assert/strict");
const { mock } = require("node:test");

const { prisma } = require("../config/postgres");
prisma.lead = { findFirst: mock.fn(async () => null) };
prisma.leadActivity = {
  count: mock.fn(async () => 0),
  findFirst: mock.fn(async () => null),
};
prisma.leadNote = { count: mock.fn(async () => 0) };
prisma.leadTask = { count: mock.fn(async () => 0) };

const { computeHealthScore } = require("../controllers/healthScoreController");

test("health score uses status, engagement, notes, tasks, and recency", async () => {
  prisma.lead.findFirst.mock.mockImplementation(async () => ({ id: 12, status: "qualified" }));
  prisma.leadActivity.count.mock.mockImplementation(async () => 3);
  prisma.leadNote.count.mock.mockImplementation(async () => 2);
  prisma.leadTask.count.mock.mockImplementation(async () => 1);
  prisma.leadActivity.findFirst.mock.mockImplementation(async () => ({ createdAt: new Date() }));

  const result = await computeHealthScore(7, 12);

  assert.deepEqual(result, {
    score: 100,
    churnRisk: 0,
    trend: "improving",
    factors: { status: 30, engagement: 6, notes: 6, tasks: -5, recency: 15 },
  });
});

test("health score returns null for a lead outside the organization", async () => {
  prisma.lead.findFirst.mock.mockImplementation(async () => null);

  assert.equal(await computeHealthScore(7, 999), null);
});