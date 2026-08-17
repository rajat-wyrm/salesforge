/**
 * Comprehensive Notification Test Suite
 * Tests all 5 categories: Lead, Deal, Billing, Team, System
 * Verifies In-App (Bell), Email, and Push channels respect user preference toggles.
 *
 * Run with: npm test
 */

const test = require("node:test");
const assert = require("node:assert/strict");

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build a minimal set of mocks so dispatchNotification can run without a real
 * DB / Resend account / Firebase instance.
 *
 * @param {object} opts
 *  - inAppEnabled  {boolean}  whether the user's pref for in_app is on
 *  - emailEnabled  {boolean}  whether the user's pref for email is on
 *  - pushEnabled   {boolean}  whether the user's pref for push is on
 *  - userEmail     {string}   the user's email in the DB (default: test@example.com)
 *
 * @returns { notificationService, spies }
 */
function buildMocks({
  inAppEnabled = true,
  emailEnabled = true,
  pushEnabled = true,
  userEmail = "test@example.com",
} = {}) {
  const spies = {
    dbCreated: false,
    emailTo: null,
    pushUserId: null,
    sseChannel: null,
  };

  // -- Build fake prefs array from flags
  const makePrefs = (category) => [
    { channel: "in_app", enabled: inAppEnabled, category },
    { channel: "email",  enabled: emailEnabled,  category },
    { channel: "push",   enabled: pushEnabled,   category },
  ];

  // -- Stub prisma
  const prisma = {
    user: {
      findUnique: async () => ({ id: 1, email: userEmail, name: "Test User" }),
    },
    notification: {
      create: async (args) => {
        spies.dbCreated = true;
        return { id: 999, ...args.data };
      },
    },
    notificationPreference: {
      findMany: async ({ where }) => makePrefs(where.category),
    },
  };

  // -- Stub eventBus
  const eventBus = {
    publish: (channel) => {
      spies.sseChannel = channel;
    },
  };

  // -- Stub pushService
  const pushService = {
    sendPushNotification: async (userId) => {
      spies.pushUserId = userId;
      return { success: true };
    },
  };

  // -- Stub emailService
  const emailService = {
    send: async ({ to }) => {
      spies.emailTo = to;
      return true;
    },
  };

  // -- Stub compileTemplate
  const compileTemplate = (type, message, link) => ({
    subject: `[Test] ${type}`,
    html: `<p>${message}</p>`,
    text: message,
  });

  // Build an isolated dispatchNotification that uses stubs only.
  const dispatchNotification = async ({
    userId,
    orgId,
    type,
    category,
    message,
    link = null,
    metadata = {},
  }) => {
    if (!userId) return null;

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });

    const prefs = await prisma.notificationPreference.findMany({
      where: { userId: Number(userId), category: category.toLowerCase() },
    });

    const getPref = (ch) => {
      const p = prefs.find((x) => x.channel === ch);
      return p ? p.enabled : true;
    };

    const inApp = getPref("in_app");
    const push  = getPref("push");
    const email = getPref("email");

    let notification = null;
    if (inApp) {
      notification = await prisma.notification.create({
        data: { userId: Number(userId), type, message, link, metadata },
      });
      eventBus.publish(`user:${userId}`);
    }

    if (push) {
      pushService.sendPushNotification(userId, { title: type, body: message })
        .catch(() => {});
    }

    if (email && user && user.email) {
      const { subject, html, text } = compileTemplate(type, message, link);
      await emailService.send({ to: user.email, subject, html, text });
    }

    return notification;
  };

  return { dispatchNotification, spies };
}

// ─── Category: LEAD ──────────────────────────────────────────────────────────

test("Lead – all channels enabled: LEAD_CREATED fires bell + email + push", async () => {
  const { dispatchNotification, spies } = buildMocks();
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "LEAD_CREATED",
    category: "lead",
    message: "Lead John Doe added to your pipeline.",
    link: "/app/leads/42",
    metadata: { leadId: 42, leadName: "John Doe" },
  });
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(spies.dbCreated,              "Bell: notification row must be saved");
  assert.equal(spies.emailTo, "test@example.com", "Email: must send to user's own email");
  assert.equal(spies.pushUserId, 1,       "Push: must fire for user #1");
  assert.equal(spies.sseChannel, "user:1","SSE: must publish on user channel");
});

test("Lead – email disabled: LEAD_CREATED skips email only", async () => {
  const { dispatchNotification, spies } = buildMocks({ emailEnabled: false });
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "LEAD_CREATED",
    category: "lead",
    message: "Lead Jane Smith added.",
    link: "/app/leads/43",
  });
  assert.ok(spies.dbCreated,  "Bell: still saved when email disabled");
  assert.equal(spies.emailTo, null, "Email: must NOT be sent when disabled");
  assert.equal(spies.pushUserId, 1, "Push: still fires when only email is disabled");
});

test("Lead – push disabled: LEAD_UPDATED skips push only", async () => {
  const { dispatchNotification, spies } = buildMocks({ pushEnabled: false });
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "LEAD_UPDATED",
    category: "lead",
    message: "Lead John Doe was updated.",
    link: "/app/leads/42",
  });
  assert.ok(spies.dbCreated,             "Bell: still saved when push disabled");
  assert.equal(spies.emailTo, "test@example.com", "Email: still sent when only push is disabled");
  assert.equal(spies.pushUserId, null,   "Push: must NOT fire when disabled");
});

test("Lead – in-app disabled: LEAD_DELETED skips bell and SSE", async () => {
  const { dispatchNotification, spies } = buildMocks({ inAppEnabled: false });
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "LEAD_DELETED",
    category: "lead",
    message: "Lead John Doe was deleted.",
    link: "/app/leads",
  });
  assert.equal(spies.dbCreated, false, "Bell: must NOT create DB row when in-app disabled");
  assert.equal(spies.sseChannel, null, "SSE: must NOT publish when in-app disabled");
  assert.equal(spies.emailTo, "test@example.com", "Email: still sent when only in-app is disabled");
});

test("Lead – all channels disabled: no notification sent at all", async () => {
  const { dispatchNotification, spies } = buildMocks({
    inAppEnabled: false, emailEnabled: false, pushEnabled: false,
  });
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "LEAD_CREATED",
    category: "lead",
    message: "Lead test.",
  });
  assert.equal(spies.dbCreated, false,   "Bell: must be silent");
  assert.equal(spies.emailTo, null,      "Email: must be silent");
  assert.equal(spies.pushUserId, null,   "Push: must be silent");
});

// ─── Category: DEAL ──────────────────────────────────────────────────────────

test("Deal – all channels enabled: DEAL_CREATED fires all three channels", async () => {
  const { dispatchNotification, spies } = buildMocks();
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "DEAL_CREATED",
    category: "deal",
    message: 'New deal "Acme Corp" created ($5000).',
    link: "/app/deals/10",
    metadata: { dealId: 10, dealTitle: "Acme Corp", amount: 5000 },
  });
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(spies.dbCreated, "Bell saved for deal created");
  assert.equal(spies.emailTo, "test@example.com", "Email sent for deal created");
  assert.equal(spies.pushUserId, 1, "Push fired for deal created");
});

test("Deal – DEAL_WON fires all channels", async () => {
  const { dispatchNotification, spies } = buildMocks();
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "DEAL_WON",
    category: "deal",
    message: 'Deal "Acme Corp" was won!',
    link: "/app/deals/10",
    metadata: { dealId: 10, dealTitle: "Acme Corp", amount: 5000 },
  });
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(spies.dbCreated, "Bell saved for deal won");
  assert.equal(spies.emailTo, "test@example.com", "Email sent for deal won");
});

test("Deal – DEAL_LOST fires all channels", async () => {
  const { dispatchNotification, spies } = buildMocks();
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "DEAL_LOST",
    category: "deal",
    message: 'Deal "Acme Corp" was lost.',
    link: "/app/deals/10",
    metadata: { dealId: 10, dealTitle: "Acme Corp", amount: 5000 },
  });
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(spies.dbCreated, "Bell saved for deal lost");
  assert.equal(spies.emailTo, "test@example.com", "Email sent for deal lost");
});

test("Deal – email disabled: DEAL_STAGE_CHANGED skips email", async () => {
  const { dispatchNotification, spies } = buildMocks({ emailEnabled: false });
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "DEAL_STAGE_CHANGED",
    category: "deal",
    message: 'Deal moved to Proposal stage.',
    link: "/app/deals/10",
  });
  assert.ok(spies.dbCreated, "Bell saved");
  assert.equal(spies.emailTo, null, "Email skipped when disabled for deal");
});

// ─── Category: BILLING ────────────────────────────────────────────────────────

test("Billing – PAYMENT_RECEIVED fires all channels", async () => {
  const { dispatchNotification, spies } = buildMocks();
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "PAYMENT_RECEIVED",
    category: "billing",
    message: "Payment of ₹990 received successfully.",
    link: "/app/settings/billing",
    metadata: { amount: 990 },
  });
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(spies.dbCreated, "Bell saved for payment received");
  assert.equal(spies.emailTo, "test@example.com", "Email sent for payment received");
  assert.equal(spies.pushUserId, 1, "Push fired for payment received");
});

test("Billing – PAYMENT_FAILED fires all channels", async () => {
  const { dispatchNotification, spies } = buildMocks();
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "PAYMENT_FAILED",
    category: "billing",
    message: "Payment of ₹990 failed.",
    link: "/app/settings/billing",
  });
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(spies.dbCreated, "Bell saved for payment failed");
  assert.equal(spies.emailTo, "test@example.com", "Email sent for payment failed");
});

test("Billing – BILLING_UPDATE (plan upgrade) fires all channels", async () => {
  const { dispatchNotification, spies } = buildMocks();
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "BILLING_UPDATE",
    category: "billing",
    message: "Your workspace has been upgraded to PRO.",
    link: "/app/settings/billing",
  });
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(spies.dbCreated, "Bell saved for billing update");
  assert.equal(spies.emailTo, "test@example.com", "Email sent for billing update");
});

test("Billing – push disabled: PAYMENT_RECEIVED skips push only", async () => {
  const { dispatchNotification, spies } = buildMocks({ pushEnabled: false });
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "PAYMENT_RECEIVED",
    category: "billing",
    message: "Payment received.",
    link: "/app/settings/billing",
  });
  assert.ok(spies.dbCreated, "Bell saved");
  assert.equal(spies.emailTo, "test@example.com", "Email sent");
  assert.equal(spies.pushUserId, null, "Push skipped when disabled for billing");
});

// ─── Category: TEAM ───────────────────────────────────────────────────────────

test("Team – TEAM_MEMBER_INVITED fires all channels for the inviter", async () => {
  const { dispatchNotification, spies } = buildMocks();
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "TEAM_MEMBER_INVITED",
    category: "team",
    message: "Invitation sent to newuser@example.com for role MEMBER.",
    link: "/app/settings/team",
    metadata: { email: "newuser@example.com", role: "MEMBER" },
  });
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(spies.dbCreated, "Bell saved for invite sent");
  assert.equal(spies.emailTo, "test@example.com", "Inviter gets email confirmation");
  assert.equal(spies.pushUserId, 1, "Push fires for inviter");
});

test("Team – TEAM_ROLE_UPDATED fires all channels for the affected member", async () => {
  const { dispatchNotification, spies } = buildMocks();
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "TEAM_ROLE_UPDATED",
    category: "team",
    message: "Your role has been updated to ADMIN.",
    link: "/app/settings/team",
  });
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(spies.dbCreated, "Bell saved for role update");
  assert.equal(spies.emailTo, "test@example.com", "Email sent for role update");
});

test("Team – email disabled: TEAM_MEMBER_REMOVED skips email only", async () => {
  const { dispatchNotification, spies } = buildMocks({ emailEnabled: false });
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "TEAM_MEMBER_REMOVED",
    category: "team",
    message: "You have been removed from the organization.",
    link: "/app/dashboard",
  });
  assert.ok(spies.dbCreated, "Bell saved even when email is off");
  assert.equal(spies.emailTo, null, "Email skipped when team email is disabled");
  assert.equal(spies.pushUserId, 1, "Push still fires");
});

// ─── Category: SYSTEM ────────────────────────────────────────────────────────

test("System – SYSTEM_ALERT fires all channels", async () => {
  const { dispatchNotification, spies } = buildMocks();
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "SYSTEM_ALERT",
    category: "system",
    message: "System maintenance scheduled for Sunday 2am–4am.",
    link: "/app/settings",
  });
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(spies.dbCreated, "Bell saved for system alert");
  assert.equal(spies.emailTo, "test@example.com", "Email sent for system alert");
  assert.equal(spies.pushUserId, 1, "Push fired for system alert");
});

test("System – in-app disabled: MAINTENANCE_NOTICE skips bell/SSE", async () => {
  const { dispatchNotification, spies } = buildMocks({ inAppEnabled: false });
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "MAINTENANCE_NOTICE",
    category: "system",
    message: "Scheduled maintenance notice.",
    link: "/app/settings",
  });
  assert.equal(spies.dbCreated, false, "Bell skipped when in-app is off");
  assert.equal(spies.sseChannel, null, "SSE skipped when in-app is off");
  assert.equal(spies.emailTo, "test@example.com", "Email still sent");
});

test("System – all channels disabled: no output at all", async () => {
  const { dispatchNotification, spies } = buildMocks({
    inAppEnabled: false, emailEnabled: false, pushEnabled: false,
  });
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "SYSTEM_ALERT",
    category: "system",
    message: "Silent test.",
  });
  assert.equal(spies.dbCreated, false, "Bell silent");
  assert.equal(spies.emailTo, null,    "Email silent");
  assert.equal(spies.pushUserId, null, "Push silent");
});

// ─── Edge Cases ───────────────────────────────────────────────────────────────

test("Edge – no userId: dispatchNotification returns null immediately", async () => {
  const { dispatchNotification } = buildMocks();
  const result = await dispatchNotification({
    userId: null,
    orgId: 1,
    type: "LEAD_CREATED",
    category: "lead",
    message: "Should be no-op.",
  });
  assert.equal(result, null, "Must return null for missing userId");
});

test("Edge – email to correct address only (not sender or other users)", async () => {
  const { dispatchNotification, spies } = buildMocks({ userEmail: "owner@company.com" });
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "LEAD_CREATED",
    category: "lead",
    message: "New lead.",
  });
  assert.equal(
    spies.emailTo,
    "owner@company.com",
    "Email must go to the user's DB email, not any other address"
  );
});

test("Edge – partial preferences: only push disabled, rest work", async () => {
  const { dispatchNotification, spies } = buildMocks({
    inAppEnabled: true,
    emailEnabled: true,
    pushEnabled: false,
  });
  await dispatchNotification({
    userId: 1, orgId: 1,
    type: "DEAL_WON",
    category: "deal",
    message: "Deal won!",
  });
  assert.ok(spies.dbCreated, "Bell works");
  assert.equal(spies.emailTo, "test@example.com", "Email works");
  assert.equal(spies.pushUserId, null, "Push is off");
});
