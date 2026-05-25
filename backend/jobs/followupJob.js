// Background jobs. All time-based work runs in a single scheduler with safety guards
// so a slow iteration never overlaps the next one.
const cron = require("node-cron");
const { prisma } = require("../config/postgres");
const { sendEmail } = require("../utils/sendEmail");
const { createNotification } = require("../services/notificationService");
const { recordAudit } = require("../services/auditService");
const logger = require("../utils/logger");

let running = false;

const tasks = {
  // Every minute: nudge new leads that haven't been contacted.
  async followupNewLeads() {
    const leads = await prisma.lead.findMany({
      where: { status: "new", followupSent: false, createdAt: { lt: new Date(Date.now() - 60_000) } },
      take: 50,
      include: { addedBy: true },
    });
    for (const lead of leads) {
      try {
        await createNotification({
          userId: lead.addedById,
          type: "LEAD_FOLLOWUP",
          message: `Don't forget to follow up with ${lead.name}.`,
          link: `/app/leads/${lead.id}`,
          metadata: { leadId: lead.id },
        });
        await prisma.lead.update({ where: { id: lead.id }, data: { followupSent: true } });
      } catch (e) {
        logger.error("job.followup.error", { leadId: lead.id, err: e.message });
      }
    }
    if (leads.length) logger.info("job.followup", { count: leads.length });
  },

  // Daily at 02:00: log a snapshot of platform metrics.
  async dailySnapshot() {
    const [users, orgs, leads, deals, activeSubs] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.lead.count(),
      prisma.deal.count(),
      prisma.organization.count({ where: { plan: { in: ["STARTER", "PRO", "ENTERPRISE"] } } }),
    ]);
    await recordAudit({
      action: "system.daily_snapshot",
      entityType: "System",
      metadata: { users, orgs, leads, deals, activeSubs, date: new Date().toISOString() },
    });
    logger.info("job.snapshot", { users, orgs, leads, deals, activeSubs });
  },
};

const run = async () => {
  if (running) return;
  running = true;
  try {
    await tasks.followupNewLeads();
  } catch (e) {
    logger.error("job.tick.error", { err: e.message });
  } finally {
    running = false;
  }
};

const start = () => {
  if (process.env.DISABLE_CRON === "true") return;
  cron.schedule("* * * * *", run);
  cron.schedule("0 2 * * *", tasks.dailySnapshot);
  logger.info("jobs.scheduled");
};

module.exports = { start, tasks };
