const test = require("node:test");
const assert = require("node:assert");
const { mock } = require("node:test");

const { prisma } = require("../config/postgres");

prisma.deal = {
  count: mock.fn(async () => 0),
  findMany: mock.fn(async () => []),
  aggregate: mock.fn(async () => ({ _sum: { amount: 0 } })),
};

const { metrics } = require("../controllers/dealController");

const mockRes = () => {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  const res = { statusCode: 200, jsonData: null, promise };
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

test("deal metrics returns frontend-safe pipeline totals", async () => {
  prisma.deal.count.mock.mockImplementation(async ({ where }) => {
    if (where.status === "COMPLETED") return 1;
    if (where.status === "INACTIVE") return 1;
    return 4;
  });
  prisma.deal.findMany.mock.mockImplementation(async () => [
    { amount: 1000, probability: 90 },
    { amount: 500, probability: 60 },
    { amount: 200, probability: 25 },
  ]);
  prisma.deal.aggregate.mock.mockImplementation(async ({ where }) => ({
    _sum: { amount: where.status === "COMPLETED" ? 800 : 300 },
  }));

  const req = { orgId: 10 };
  const res = mockRes();
  const next = mock.fn();

  metrics(req, res, next);
  await res.promise;

  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.jsonData.data.open, { count: 3, amount: 1700 });
  assert.deepStrictEqual(res.jsonData.data.commit, { count: 1, amount: 1000 });
  assert.deepStrictEqual(res.jsonData.data.bestCase, { count: 2, amount: 1500 });
  assert.strictEqual(res.jsonData.data.weightedPipeline, 1250);
  assert.strictEqual(res.jsonData.data.wonRate, 25);
});
