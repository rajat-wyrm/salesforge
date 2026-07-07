const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "jwt-expiry-test-secret";

const { protect } = require("../middleware/authMiddleware");
const generateToken = require("../utils/generateToken");

const createResponse = () => ({
  statusCode: null,
  body: null,

  status(code) {
    this.statusCode = code;
    return this;
  },

  json(body) {
    this.body = body;
    return this;
  },
});

test("generated JWT contains the configured expiry", () => {
  process.env.JWT_EXPIRE = "1s";

  const token = generateToken({
    id: 1,
    email: "test@example.com",
    role: "MEMBER",
    name: "Test User",
  });

  const decoded = jwt.decode(token);

  assert.equal(decoded.exp - decoded.iat, 1);
});

test("expired JWT returns JWT_EXPIRED", async () => {
  const token = jwt.sign(
    { id: 1 },
    process.env.JWT_SECRET,
    { expiresIn: -1 },
  );

  const req = {
    headers: {
      authorization: `Bearer ${token}`,
    },
  };

  const res = createResponse();
  let nextCalled = false;

  await protect(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.code, "JWT_EXPIRED");
});