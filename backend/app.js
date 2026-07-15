require("dotenv").config();

const cors = require("cors");
const express = require("express");
const morgan = require("morgan");
let helmet = null;
try { helmet = require("helmet"); } catch (_) { /* optional */ }

const { prisma } = require("./config/postgres");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const requestId = require("./middleware/requestId");
const { compressionMiddleware, securityMiddleware, responseTime } = require("./middleware/performance");
const metricsMiddleware = require("./middleware/metrics");
const accessLog = require("./middleware/accessLog");

const adminRoutes = require("./routes/adminRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const activityRoutes = require("./routes/activityRoutes");
const apiKeyRoutes = require("./routes/apiKeyRoutes");
const auditRoutes = require("./routes/auditRoutes");
const authRoutes = require("./routes/authRoutes");
const billingRoutes = require("./routes/billingRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
const changelogRoutes = require("./routes/changelogRoutes");
const commentRoutes = require("./routes/commentRoutes");
const csvRoutes = require("./routes/csvRoutes");
const customFieldRoutes = require("./routes/customFieldRoutes");
const contactRoutes = require("./routes/contactRoutes");
const territoryRoutes = require("./routes/territoryRoutes");
const quotaRoutes = require("./routes/quotaRoutes");
const commissionRoutes = require("./routes/commissionRoutes");
const callRoutes = require("./routes/callRoutes");
const documentRoutes = require("./routes/documentRoutes");
const contractRoutes = require("./routes/contractRoutes");
const surveyRoutes = require("./routes/surveyRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const kbRoutes = require("./routes/kbRoutes");
const healthScoreRoutes = require("./routes/healthScoreRoutes");
const aiScoringRoutes = require("./routes/aiScoringRoutes");
const searchRoutes = require("./routes/searchRoutes");
const intelRoutes = require("./routes/intelRoutes");
const metricsRoutes = require("./routes/metricsRoutes");
const domainSearchRoutes = require("./routes/domainSearchRoutes");
const emailSearchRoutes = require("./routes/emailSearchRoutes");
const emailTrackingRoutes = require("./routes/emailTrackingRoutes");
const forecastRoutes = require("./routes/forecastRoutes");
const gdprRoutes = require("./routes/gdprRoutes");
const playbookRoutes = require("./routes/playbookRoutes");
const priceBookRoutes = require("./routes/priceBookRoutes");
const productRoutes = require("./routes/productRoutes");
const quoteRoutes = require("./routes/quoteRoutes");
const reportRoutes = require("./routes/reportRoutes");
const winLossRoutes = require("./routes/winLossRoutes");
const integrationRoutes = require("./routes/integrationRoutes");
const integrationMarketplaceRoutes = require("./routes/integrationMarketplaceRoutes");
const leadActivityRoutes = require("./routes/leadActivityRoutes");
const leadNoteRoutes = require("./routes/leadNoteRoutes");
const leadRoutes = require("./routes/leadRoutes");
const leadTaskRoutes = require("./routes/leadTaskRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const notificationPrefRoutes = require("./routes/notificationPrefRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const savedSearchRoutes = require("./routes/savedSearchRoutes");
const sequenceRoutes = require("./routes/sequenceRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const socialSearchRoutes = require("./routes/socialSearchRoutes");
const sseRoutes = require("./routes/sseRoutes");
const tagRoutes = require("./routes/tagRoutes");
const teamRoutes = require("./routes/teamRoutes");
const templateRoutes = require("./routes/templateRoutes");
const twoFactorRoutes = require("./routes/twoFactorRoutes");
const usageRoutes = require("./routes/usageRoutes");
const userRoutes = require("./routes/userRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const webhookIncomingRoutes = require("./routes/webhookIncomingRoutes");
const workflowRoutes = require("./routes/workflowRoutes");
const chatRoutes = require("./routes/chatRoutes");

// Optional feature routes
let aiRoutes;
let blockchainRoutes;
let dealRoutes;
try { aiRoutes = require("./routes/ai.routes"); } catch (e) { /* not configured */ }
try { blockchainRoutes = require("./routes/blockchain.routes"); } catch (e) { /* not configured */ }
try { dealRoutes = require("./routes/dealRoutes"); } catch (e) { /* not configured */ }

const app = express();

const frontendUrl = process.env.FRONTEND_URL?.trim() || "http://localhost:5173";
const allowedOrigins = new Set([
  frontendUrl,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(compressionMiddleware);
app.use(securityMiddleware);
app.use(responseTime);
app.use(metricsMiddleware);
app.use(requestId);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    credentials: true,
  }),
);
app.use(
  helmet
    ? helmet({
        crossOriginResourcePolicy: false,
        contentSecurityPolicy: false,
      })
    : (req, res, next) => next(),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false, limit: "2mb" }));
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
  app.use(accessLog);
}

// Rate limiting is disabled for local UX testing. Apply the rate-limit middleware
// to route groups here before deploying to production.

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    name: "SalesForge API",
    version: "2.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", async (req, res, next) => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbMs = Date.now() - start;
    res.status(200).json({
      success: true,
      status: "ok",
      database: "connected",
      dbMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api", (req, res, next) => next());
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/email-search", emailSearchRoutes);
app.use("/api/domain-search", domainSearchRoutes);
app.use("/api/social-search", socialSearchRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/api-keys", apiKeyRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/webhooks-incoming", webhookIncomingRoutes);
app.use("/api/saved-searches", savedSearchRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/lead-notes", leadNoteRoutes);
app.use("/api/lead-tasks", leadTaskRoutes);
app.use("/api/lead-activity", leadActivityRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/2fa", twoFactorRoutes);
app.use("/api/usage", usageRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/sse", sseRoutes);
app.use("/api/csv", csvRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/sequences", sequenceRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/custom-fields", customFieldRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notification-preferences", notificationPrefRoutes);
app.use("/api/integrations-marketplace", integrationMarketplaceRoutes);
app.use("/api/forecasts", forecastRoutes);
app.use("/api/email-tracking", emailTrackingRoutes);
app.use("/api/playbooks", playbookRoutes);
app.use("/api/price-books", priceBookRoutes);
app.use("/api/products", productRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/win-loss", winLossRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/territories", territoryRoutes);
app.use("/api/quotas", quotaRoutes);
app.use("/api/commissions", commissionRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/surveys", surveyRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/kb", kbRoutes);
app.use("/api/health-scores", healthScoreRoutes);
app.use("/api/ai-scoring", aiScoringRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/intel", intelRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/changelog", changelogRoutes);
app.use("/api/gdpr", gdprRoutes);
app.use("/api/ai/chat", chatRoutes);

if (aiRoutes) app.use("/api/ai", aiRoutes);
if (blockchainRoutes) app.use("/api/blockchain", blockchainRoutes);
if (dealRoutes) app.use("/api/deals", dealRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
