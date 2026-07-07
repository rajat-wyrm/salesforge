const test = require("node:test");
const assert = require("node:assert");
const { mock } = require("node:test");

const { prisma } = require("../config/postgres");
const auditService = require("../services/auditService");

// Mock audit service to prevent actual database log insertion
const recordAuditMock = mock.method(auditService, "recordAudit", async () => {});

// Reassign Prisma properties with mock.fn to bypass Proxy descriptor issues
prisma.lead = {
  findFirst: mock.fn(async () => null),
  findMany: mock.fn(async () => []),
  update: mock.fn(async () => ({})),
  count: mock.fn(async () => 0),
  groupBy: mock.fn(async () => [])
};
prisma.leadActivity = {
  count: mock.fn(async () => 0)
};
prisma.leadNote = {
  count: mock.fn(async () => 0)
};

// Now load the controller
const aiScoringController = require("../controllers/aiScoringController");
const { AppError } = require("../middleware/errorHandler");

// Helpers for mock request/response/next
const mockRes = () => {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  const res = {
    statusCode: 200,
    jsonData: null,
    promise
  };
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };
  res.json = function (data) {
    this.jsonData = data;
    resolve(this);
    return this;
  };
  return res;
};

const mockNext = () => {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  const next = mock.fn((err) => {
    resolve(err);
  });
  next.promise = promise;
  return next;
};

// --- Test Suite ---

test("AI Lead Scoring Calculation (scoreLead)", async (t) => {
  await t.test("scoreLead - returns null if lead does not exist", async () => {
    prisma.lead.findFirst.mock.mockImplementationOnce(async () => null);
    const result = await aiScoringController.scoreLead(10, 101);
    assert.strictEqual(result, null);
  });

  await t.test("scoreLead - evaluates a lead with basic details and scores accordingly", async () => {
    const mockLead = {
      id: 101,
      orgId: 10,
      email: "test@example.com",
      phone: "123456",
      companyName: "Acme Corp",
      jobTitle: "CEO",
      industry: "SaaS",
      companySize: "1000+",
      source: "referral",
      score: 0
    };

    prisma.lead.findFirst.mock.mockImplementationOnce(async () => mockLead);
    prisma.leadActivity.count.mock.mockImplementationOnce(async () => 5); // 5 * 2 = 10 pts
    prisma.leadNote.count.mock.mockImplementationOnce(async () => 2);     // 2 * 3 = 6 pts -> 16 pts engagement

    const result = await aiScoringController.scoreLead(10, 101);
    assert.ok(result);
    assert.ok(result.score > 50); // should be a high score
    assert.strictEqual(result.grade, "A");
    assert.strictEqual(result.factors.companySize.signal, "1000+");
    assert.strictEqual(result.factors.seniority.signal, "CEO");
  });
});

test("AI Lead Scoring Controller Actions", async (t) => {
  await t.test("scoreOne - throws 404 AppError if lead not found", async () => {
    prisma.lead.findFirst.mock.mockImplementationOnce(async () => null);

    const req = {
      orgId: 10,
      params: { id: "999" },
      user: { id: 1 }
    };
    const res = mockRes();
    const next = mockNext();

    aiScoringController.scoreOne(req, res, next);
    await next.promise;

    assert.strictEqual(next.mock.calls.length, 1);
    const error = next.mock.calls[0].arguments[0];
    assert.ok(error instanceof AppError);
    assert.strictEqual(error.statusCode, 404);
    assert.strictEqual(error.message, "Lead not found.");
  });

  await t.test("scoreOne - scores successfully and saves update/audit log", async () => {
    const mockLead = {
      id: 101,
      orgId: 10,
      email: "test@example.com",
      score: 0
    };
    prisma.lead.findFirst.mock.mockImplementationOnce(async () => mockLead);
    
    // reset mock stats
    prisma.lead.update.mock.resetCalls();
    recordAuditMock.mock.resetCalls();

    const req = {
      orgId: 10,
      params: { id: "101" },
      user: { id: 1 }
    };
    const res = mockRes();
    const next = mockNext();

    aiScoringController.scoreOne(req, res, next);
    await Promise.race([res.promise, next.promise]);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);
    assert.strictEqual(prisma.lead.update.mock.calls.length, 1);
    assert.strictEqual(recordAuditMock.mock.calls.length, 1);
  });

  await t.test("scoreBatch - validation fails if leadIds is not an array", async () => {
    const req = {
      orgId: 10,
      body: { leadIds: "invalid" }
    };
    const res = mockRes();
    const next = mockNext();

    aiScoringController.scoreBatch(req, res, next);
    await next.promise;

    assert.strictEqual(next.mock.calls.length, 1);
    const error = next.mock.calls[0].arguments[0];
    assert.ok(error instanceof AppError);
    assert.strictEqual(error.statusCode, 400);
    assert.strictEqual(error.message, "leadIds must be an array.");
  });

  await t.test("scoreBatch - updates multiple leads in a batch", async () => {
    const mockLead = { id: 1, orgId: 10, score: 0 };
    prisma.lead.findFirst.mock.mockImplementation(async () => mockLead);
    prisma.lead.update.mock.resetCalls();

    const req = {
      orgId: 10,
      body: { leadIds: [1, 2] }
    };
    const res = mockRes();
    const next = mockNext();

    aiScoringController.scoreBatch(req, res, next);
    await Promise.race([res.promise, next.promise]);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.data.scored, 2);
    assert.strictEqual(prisma.lead.update.mock.calls.length, 2);
  });

  await t.test("insights - returns summary, factors, and topLeads fields to match frontend contract", async () => {
    const mockLeads = [
      { id: 1, name: "Alice", score: 90 },
      { id: 2, name: "Bob", score: 55 },
      { id: 3, name: "Charlie", score: 10 }
    ];

    prisma.lead.findMany.mock.mockImplementation(async (query) => {
      // Return mock leads for both findMany queries (one in main filter, one for topLeads)
      return mockLeads;
    });

    const req = {
      orgId: 10
    };
    const res = mockRes();
    const next = mockNext();

    aiScoringController.insights(req, res, next);
    await Promise.race([res.promise, next.promise]);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);
    
    const data = res.jsonData.data;
    assert.ok(data.summary);
    assert.ok(data.summary.includes("Analyzed 3 scored leads"));
    assert.ok(data.summary.includes("1 high-priority hot leads"));
    assert.ok(data.summary.includes("1 warm leads")); // 55 is warm

    assert.ok(Array.isArray(data.factors));
    assert.strictEqual(data.factors.length, 6);
    assert.strictEqual(data.factors[0].factor, "Engagement Activities");

    assert.ok(Array.isArray(data.topLeads));
    assert.strictEqual(data.topLeads.length, 3);
    assert.strictEqual(data.topLeads[0].name, "Alice");
  });
});