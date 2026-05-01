// Health check helpers for liveness and readiness probes.
const { prisma } = require("../config/postgres");

const liveness = async () => ({ status: "ok", uptime: Math.round(process.uptime()) });

const readiness = async () => {
  const checks = {};
  let healthy = true;
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.db = { status: "up", latencyMs: Date.now() - start };
  } catch (err) {
    checks.db = { status: "down", error: err.message };
    healthy = false;
  }
  checks.memory = {
    status: process.memoryUsage().heapUsed < 500 * 1024 * 1024 ? "ok" : "warning",
    heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
  };
  return { status: healthy ? "ready" : "not_ready", checks };
};

module.exports = { liveness, readiness };
