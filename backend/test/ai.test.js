const test = require("node:test");
const assert = require("node:assert");

// 1. Mock setup before requiring components
process.env.AI_URL = "http://localhost:5005/recommend";
process.env.AI_TIMEOUT = "2000";

const axios = require("axios");
const { mock } = require("node:test");

// Mock axios.create for aiEmailService.js
const mockAxiosInstance = {
  post: mock.fn(async () => ({ data: { output: "mocked output" } }))
};
mock.method(axios, "create", () => mockAxiosInstance);

// Mock auditService and usageService to avoid database calls
const auditService = require("../services/auditService");
const usageService = require("../services/usageService");

const incrementUsageMock = mock.method(usageService, "incrementUsage", async () => {});
const recordAuditMock = mock.method(auditService, "recordAudit", async () => {});

// Now import the services and controllers to test
const aiEmailService = require("../services/aiEmailService");
const aiController = require("../controllers/ai.controller");
const { AppError } = require("../middleware/errorHandler");

// Helper to create mock request, response and next
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
  res.send = function () {
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

test("AI Email Service Tests", async (t) => {
  await t.test("generateOutreachMessage - should successfully return message output", async () => {
    // Setup mock post response
    mockAxiosInstance.post.mock.mockImplementationOnce(async () => {
      return { data: { output: "Hello Bob, let's connect!" } };
    });

    const result = await aiEmailService.generateOutreachMessage({
      name: "Bob",
      company: "Acme",
      purpose: "Partnership"
    });

    assert.deepStrictEqual(result, { output: "Hello Bob, let's connect!" });
  });

  await t.test("generateOutreachMessage - should handle downstream API failures gracefully", async () => {
    mockAxiosInstance.post.mock.mockImplementationOnce(async () => {
      throw new Error("Connection failed");
    });

    await assert.rejects(
      async () => {
        await aiEmailService.generateOutreachMessage({
          name: "Bob",
          company: "Acme",
          purpose: "Partnership"
        });
      },
      (err) => {
        assert.strictEqual(err.message, "AI outreach service unavailable");
        return true;
      }
    );
  });

  await t.test("summarizeContent - should successfully return summary output", async () => {
    mockAxiosInstance.post.mock.mockImplementationOnce(async () => {
      return { data: { output: "Brief summary." } };
    });

    const result = await aiEmailService.summarizeContent("Long text payload");
    assert.deepStrictEqual(result, { output: "Brief summary." });
  });

  await t.test("summarizeContent - should handle downstream API failures gracefully", async () => {
    mockAxiosInstance.post.mock.mockImplementationOnce(async () => {
      throw new Error("Timeout");
    });

    await assert.rejects(
      async () => {
        await aiEmailService.summarizeContent("Long text payload");
      },
      (err) => {
        assert.strictEqual(err.message, "AI summarization service unavailable");
        return true;
      }
    );
  });
});

test("AI Controller Tests", async (t) => {
  await t.test("list - should return configured endpoints", async () => {
    const req = {};
    const res = mockRes();
    aiController.list(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);
    assert.deepStrictEqual(res.jsonData.data.endpoints, [
      "POST /api/ai/recommend",
      "POST /api/ai/outreach",
      "POST /api/ai/summarize",
      "GET  /api/ai/status"
    ]);
  });

  await t.test("status - online state", async () => {
    const originalAiUrl = process.env.AI_URL;
    process.env.AI_URL = "http://localhost:5005/recommend";

    const getMock = mock.method(axios, "get", async () => {
      return { data: { version: "1.0.0" } };
    });

    const req = {};
    const res = mockRes();
    const next = mockNext();

    aiController.status(req, res, next);
    await Promise.race([res.promise, next.promise]);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.data.status, "online");
    assert.strictEqual(res.jsonData.data.url, "http://localhost:5005/recommend");
    assert.deepStrictEqual(res.jsonData.data.service, { version: "1.0.0" });

    getMock.mock.restore();
    process.env.AI_URL = originalAiUrl;
  });

  await t.test("status - offline state", async () => {
    const originalAiUrl = process.env.AI_URL;
    process.env.AI_URL = "http://localhost:5005/recommend";

    const getMock = mock.method(axios, "get", async () => {
      throw new Error("Connection refused");
    });

    const req = {};
    const res = mockRes();
    const next = mockNext();

    aiController.status(req, res, next);
    await Promise.race([res.promise, next.promise]);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.data.status, "offline");

    getMock.mock.restore();
    process.env.AI_URL = originalAiUrl;
  });

  await t.test("status - unconfigured state", async () => {
    const originalAiUrl = process.env.AI_URL;
    delete process.env.AI_URL;

    const req = {};
    const res = mockRes();
    const next = mockNext();

    aiController.status(req, res, next);
    await Promise.race([res.promise, next.promise]);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.data.status, "unconfigured");

    process.env.AI_URL = originalAiUrl;
  });

  await t.test("recommend - unconfigured returns 503 AppError", async () => {
    const originalAiUrl = process.env.AI_URL;
    delete process.env.AI_URL;

    const req = {};
    const res = mockRes();
    const next = mockNext();

    aiController.recommend(req, res, next);
    await next.promise;

    assert.strictEqual(next.mock.calls.length, 1);
    const error = next.mock.calls[0].arguments[0];
    assert.ok(error instanceof AppError);
    assert.strictEqual(error.statusCode, 503);
    assert.strictEqual(error.message, "AI service is not configured.");

    process.env.AI_URL = originalAiUrl;
  });

  await t.test("recommend - downstream returns error (502 path)", async () => {
    const req = {
      body: { query: "test" },
      user: { id: 1 },
      orgId: 10
    };
    const res = mockRes();
    const next = mockNext();

    const postMock = mock.method(axios, "post", async () => {
      const err = new Error("Bad Gateway");
      err.response = { data: "Downstream stack overflow" };
      throw err;
    });

    aiController.recommend(req, res, next);
    await Promise.race([res.promise, next.promise]);

    assert.strictEqual(res.statusCode, 502);
    assert.strictEqual(res.jsonData.success, false);
    assert.strictEqual(res.jsonData.message, "AI service returned an error.");
    assert.strictEqual(res.jsonData.details, "Downstream stack overflow");

    postMock.mock.restore();
  });

  await t.test("recommend - downstream offline (503 AppError path)", async () => {
    const req = {
      body: { query: "test" },
      user: { id: 1 },
      orgId: 10
    };
    const res = mockRes();
    const next = mockNext();

    const postMock = mock.method(axios, "post", async () => {
      throw new Error("Network down");
    });

    aiController.recommend(req, res, next);
    await next.promise;

    assert.strictEqual(next.mock.calls.length, 1);
    const error = next.mock.calls[0].arguments[0];
    assert.ok(error instanceof AppError);
    assert.strictEqual(error.statusCode, 503);
    assert.strictEqual(error.message, "AI service is unavailable.");

    postMock.mock.restore();
  });

  await t.test("recommend - success", async () => {
    const req = {
      body: { query: "test" },
      user: { id: 1 },
      orgId: 10
    };
    const res = mockRes();
    const next = mockNext();

    const postMock = mock.method(axios, "post", async () => {
      return { data: { recommendation: "Do X" } };
    });

    recordAuditMock.mock.resetCalls();

    aiController.recommend(req, res, next);
    await Promise.race([res.promise, next.promise]);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);
    assert.deepStrictEqual(res.jsonData.data, { recommendation: "Do X" });
    assert.strictEqual(recordAuditMock.mock.calls.length, 1);
    assert.deepStrictEqual(recordAuditMock.mock.calls[0].arguments[0], {
      userId: 1,
      orgId: 10,
      action: "ai.recommend",
      entityType: "AI"
    });

    postMock.mock.restore();
  });

  await t.test("outreach - validation failure when fields are missing", async () => {
    const req = {
      body: { name: "Bob" } // missing company, purpose
    };
    const res = mockRes();
    const next = mockNext();

    aiController.outreach(req, res, next);
    await Promise.race([res.promise, next.promise]);

    assert.strictEqual(next.mock.calls.length, 1);
    const error = next.mock.calls[0].arguments[0];
    assert.ok(error instanceof AppError);
    assert.strictEqual(error.statusCode, 400);
    assert.strictEqual(error.message, "name, company, and purpose are required.");
  });

  await t.test("outreach - success invokes email service and logs audit/usage", async () => {
    const req = {
      body: { name: "Bob", company: "Acme", purpose: "Sales" },
      user: { id: 1 },
      orgId: 10
    };
    const res = mockRes();
    const next = mockNext();

    const generateMock = mock.method(aiEmailService, "generateOutreachMessage", async () => {
      return { output: "Outreach message response" };
    });

    recordAuditMock.mock.resetCalls();
    incrementUsageMock.mock.resetCalls();

    aiController.outreach(req, res, next);
    await Promise.race([res.promise, next.promise]);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);
    assert.deepStrictEqual(res.jsonData.data, { output: "Outreach message response" });

    assert.strictEqual(generateMock.mock.calls.length, 1);
    assert.strictEqual(recordAuditMock.mock.calls.length, 1);
    assert.strictEqual(incrementUsageMock.mock.calls.length, 1);

    assert.deepStrictEqual(incrementUsageMock.mock.calls[0].arguments[0], {
      userId: 1,
      orgId: 10,
      resource: "aiCalls"
    });
    assert.deepStrictEqual(recordAuditMock.mock.calls[0].arguments[0], {
      userId: 1,
      orgId: 10,
      action: "ai.outreach",
      entityType: "AI"
    });

    generateMock.mock.restore();
  });

  await t.test("summarize - validation failure when text is missing", async () => {
    const req = {
      body: {}
    };
    const res = mockRes();
    const next = mockNext();

    aiController.summarize(req, res, next);
    await Promise.race([res.promise, next.promise]);

    assert.strictEqual(next.mock.calls.length, 1);
    const error = next.mock.calls[0].arguments[0];
    assert.ok(error instanceof AppError);
    assert.strictEqual(error.statusCode, 400);
    assert.strictEqual(error.message, "text is required for summarization.");
  });

  await t.test("summarize - success invokes summarize content and logs audit/usage", async () => {
    const req = {
      body: { text: "Long text summary request" },
      user: { id: 2 },
      orgId: 20
    };
    const res = mockRes();
    const next = mockNext();

    const summarizeMock = mock.method(aiEmailService, "summarizeContent", async () => {
      return { output: "Summary output" };
    });

    recordAuditMock.mock.resetCalls();
    incrementUsageMock.mock.resetCalls();

    aiController.summarize(req, res, next);
    await Promise.race([res.promise, next.promise]);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);
    assert.deepStrictEqual(res.jsonData.data, { output: "Summary output" });

    assert.strictEqual(summarizeMock.mock.calls.length, 1);
    assert.strictEqual(recordAuditMock.mock.calls.length, 1);
    assert.strictEqual(incrementUsageMock.mock.calls.length, 1);

    assert.deepStrictEqual(incrementUsageMock.mock.calls[0].arguments[0], {
      userId: 2,
      orgId: 20,
      resource: "aiCalls"
    });
    assert.deepStrictEqual(recordAuditMock.mock.calls[0].arguments[0], {
      userId: 2,
      orgId: 20,
      action: "ai.summarize",
      entityType: "AI"
    });

    summarizeMock.mock.restore();
  });
});