require("dotenv").config();

const app = require("./app");
const { connectPostgres, prisma } = require("./config/postgres");
const logger = require("./utils/logger");
const jobs = require("./jobs/followupJob");

const startServer = async (port = Number(process.env.PORT || 3000)) => {
  await connectPostgres();

  const server = app.listen(port, () => {
    if (process.env.NODE_ENV !== "test") {
      logger.info("server.started", { port, env: process.env.NODE_ENV || "development" });
      console.log(`
  ⚡ SalesForge API is LIVE
  ════════════════════════
  🚀  Port  : ${port}
  🌍  Env   : ${process.env.NODE_ENV || "development"}
  ⏰  Time  : ${new Date().toLocaleString()}
  `);
    }
  });

  // Kick off background work after the API is accepting requests.
  jobs.start();

  const shutdown = async (signal) => {
    logger.info("server.shutdown", { signal });
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    // Hard kill if shutdown stalls.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  return server;
};

if (require.main === module) {
  startServer().catch((error) => {
    logger.error("server.failed", { err: error.message });
    process.exit(1);
  });
}

module.exports = { app, startServer };
