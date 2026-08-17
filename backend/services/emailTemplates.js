/**
 * Email template compiler for SalesForge notifications.
 *
 * INBOX DELIVERY RULES — all templates must follow these to avoid Gmail spam:
 *  ✗  No money/currency symbols in subject ($, ₹, €)
 *  ✗  No spam words: "failed", "alert", "warning", "urgent", "verify", "free"
 *  ✗  No exclamation marks in subjects  (Deal Won! → Deal closed as won)
 *  ✗  No ALL-CAPS words in subject or body
 *  ✗  No "immediately", "click here", "limited time", "act now"
 *  ✗  Plain-text body must be substantive — never just a bare URL
 *  ✓  Subject always prefixed with [SalesForge] for consistent sender identity
 *  ✓  Reply-To should be set in the sending service
 */

/**
 * Renders the base HTML email layout.
 */
const getBaseLayout = (title, bodyHtml, actionText, actionUrl, frontendUrl) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 0; }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #17AA97 0%, #0e8870 100%);
      padding: 32px;
      text-align: center;
    }
    .logo {
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      text-decoration: none;
    }
    .content { padding: 40px 32px; }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .body-text {
      font-size: 15px;
      line-height: 1.65;
      color: #475569;
      margin-bottom: 28px;
    }
    .body-text p { margin: 0 0 12px; }
    .body-text strong { color: #1e293b; }
    .btn-wrap { text-align: center; margin-bottom: 16px; }
    .btn {
      display: inline-block;
      background-color: #17AA97;
      color: #ffffff !important;
      font-weight: 600;
      font-size: 15px;
      padding: 13px 32px;
      text-decoration: none !important;
      border-radius: 8px;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 24px 32px;
      text-align: center;
      font-size: 13px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .footer a { color: #17AA97; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="${frontendUrl}" class="logo">SalesForge</a>
      </div>
      <div class="content">
        <h2 class="title">${title}</h2>
        <div class="body-text">${bodyHtml}</div>
        <div class="btn-wrap">
          <a href="${actionUrl}" class="btn" target="_blank">${actionText}</a>
        </div>
      </div>
      <div class="footer">
        <p>You received this because you have email notifications enabled in SalesForge.</p>
        <p>
          <a href="${frontendUrl}/notifications-prefs">Manage preferences</a>
          &bull;
          <a href="${frontendUrl}">Visit dashboard</a>
        </p>
        <p>&copy; 2026 SalesForge. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Compiles an inbox-safe notification email for the given event type.
 *
 * @param {string} type       - Notification type enum (e.g. "LEAD_CREATED")
 * @param {string} message    - Plain-text notification message
 * @param {string|null} link  - Relative path for the action button (e.g. "/app/leads/1")
 * @param {object} metadata   - Extra data (leadName, dealTitle, amount, …)
 * @returns {{ subject: string, html: string, text: string }}
 */
const compileTemplate = (type, message, link, metadata = {}) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const actionUrl   = link ? `${frontendUrl}${link}` : `${frontendUrl}/app`;

  let title      = "SalesForge account update";
  let bodyHtml   = `<p>${message}</p>`;
  let actionText = "View in SalesForge";

  switch (type) {

    // ── LEAD ─────────────────────────────────────────────────────────────────
    case "LEAD_ASSIGNED": {
      const name = metadata.leadName || metadata.name || "a contact";
      title = "A lead has been assigned to you";
      bodyHtml = `
        <p>A new contact has been assigned to you in SalesForge. Review their profile and start building the relationship.</p>
        <p><strong>Contact:</strong> ${name}</p>
        <p>${message}</p>`;
      actionText = "Open Lead";
      break;
    }

    case "LEAD_CREATED": {
      const name = metadata.leadName || metadata.name || "a contact";
      title = "New lead added to your pipeline";
      bodyHtml = `
        <p>A new contact has been added to your SalesForge pipeline and is ready for follow-up.</p>
        <p><strong>Contact:</strong> ${name}</p>
        <p>${message}</p>`;
      actionText = "Open Lead";
      break;
    }

    case "LEAD_UPDATED": {
      const name = metadata.leadName || metadata.name || "A contact";
      title = "Lead profile updated";
      bodyHtml = `
        <p>${name}'s profile in your pipeline has been updated.</p>
        <p>${message}</p>`;
      actionText = "View Changes";
      break;
    }

    case "LEAD_DELETED": {
      const name = metadata.leadName || metadata.name || "A contact";
      title = "Lead removed from pipeline";
      bodyHtml = `
        <p>${name} has been removed from your SalesForge pipeline.</p>
        <p>${message}</p>`;
      actionText = "View Pipeline";
      break;
    }

    case "LEAD_FOLLOWUP": {
      const name = metadata.leadName || metadata.name || "a contact";
      title = "Follow-up reminder";
      bodyHtml = `
        <p>This is a friendly reminder to follow up with ${name}.</p>
        <p>${message}</p>`;
      actionText = "Open Contact";
      break;
    }

    // ── DEAL ─────────────────────────────────────────────────────────────────
    case "DEAL_CREATED": {
      const dealTitle = metadata.dealTitle || metadata.title || "a deal";
      title = `New deal added: ${dealTitle}`;
      bodyHtml = `
        <p>A new deal has been added to your SalesForge pipeline.</p>
        <p><strong>Deal:</strong> ${dealTitle}</p>
        <p>${message}</p>`;
      actionText = "Open Deal";
      break;
    }

    case "DEAL_STAGE_CHANGED":
    case "DEAL_UPDATED": {
      const dealTitle = metadata.dealTitle || metadata.title || "A deal";
      title = `Deal update: ${dealTitle}`;
      bodyHtml = `
        <p>There has been a change to <strong>${dealTitle}</strong> in your pipeline.</p>
        <p>${message}</p>`;
      actionText = "Open Deal";
      break;
    }

    case "DEAL_WON": {
      const dealTitle = metadata.dealTitle || metadata.title || "A deal";
      title = `Deal closed as won: ${dealTitle}`;
      bodyHtml = `
        <p>Great news — <strong>${dealTitle}</strong> has been closed and marked as won.</p>
        <p>${message}</p>`;
      actionText = "View Deal";
      break;
    }

    case "DEAL_LOST": {
      const dealTitle = metadata.dealTitle || metadata.title || "A deal";
      title = `Deal closed: ${dealTitle}`;
      bodyHtml = `
        <p><strong>${dealTitle}</strong> has been closed and marked as inactive in your pipeline.</p>
        <p>${message}</p>`;
      actionText = "View Pipeline";
      break;
    }

    // ── BILLING ──────────────────────────────────────────────────────────────
    case "INVOICE_CREATED": {
      title = "Your SalesForge invoice is ready";
      bodyHtml = `
        <p>A new invoice has been generated for your SalesForge organization.</p>
        ${metadata.invoiceNumber ? `<p><strong>Invoice:</strong> ${metadata.invoiceNumber}</p>` : ""}
        <p>${message}</p>`;
      actionText = "View Invoice";
      break;
    }

    // "Payment Received" / "Payment Failed" are high-risk spam subjects.
    // Use neutral transactional phrasing instead.
    case "PAYMENT_RECEIVED":
    case "BILLING_SUCCESS": {
      title = "Your SalesForge subscription has been updated";
      bodyHtml = `
        <p>Your subscription transaction was processed and your SalesForge plan is now active.</p>
        <p>${message}</p>
        <p>You can review your billing history in your account settings.</p>`;
      actionText = "View Billing";
      break;
    }

    case "PAYMENT_FAILED":
    case "BILLING_ISSUE": {
      // Avoid "failed" in subject — use neutral action-needed language
      title = "Action needed on your SalesForge subscription";
      bodyHtml = `
        <p>There was an issue processing your most recent subscription transaction. Please review your billing details to keep your account active.</p>
        <p>${message}</p>`;
      actionText = "Review Billing";
      break;
    }

    case "BILLING_UPDATE": {
      title = "Your SalesForge plan has been updated";
      bodyHtml = `
        <p>Your SalesForge subscription plan has changed. The new plan is now active for your organization.</p>
        <p>${message}</p>`;
      actionText = "View Plan Details";
      break;
    }

    // ── TEAM ─────────────────────────────────────────────────────────────────
    case "TEAM_MEMBER_INVITED":
    case "TEAM_INVITATION":
    case "TEAM_INVITE": {
      title = "Team invitation sent";
      bodyHtml = `
        <p>An invitation has been sent to a new member to join your SalesForge organization.</p>
        <p>${message}</p>`;
      actionText = "View Team";
      break;
    }

    case "TEAM_MEMBER_ADDED":
    case "MEMBER_JOINED": {
      const memberName = metadata.memberName || "A new member";
      title = `${memberName} joined your organization`;
      bodyHtml = `
        <p><strong>${memberName}</strong> has accepted their invitation and joined your SalesForge organization.</p>
        <p>${message}</p>`;
      actionText = "View Team";
      break;
    }

    case "TEAM_MEMBER_REMOVED": {
      title = "Team membership update";
      bodyHtml = `
        <p>A change has been made to team membership in your SalesForge organization.</p>
        <p>${message}</p>`;
      actionText = "View Team";
      break;
    }

    case "ROLE_CHANGED":
    case "TEAM_ROLE_UPDATED": {
      title = "Your organization role has been updated";
      bodyHtml = `
        <p>Your access role in your SalesForge organization has been updated by an administrator.</p>
        <p>${message}</p>`;
      actionText = "View Settings";
      break;
    }

    // ── SYSTEM ───────────────────────────────────────────────────────────────
    case "LOGIN_ALERT": {
      // "Security Alert" is a major phishing keyword — avoid it
      title = "New login to your SalesForge account";
      bodyHtml = `
        <p>A new login was recorded for your SalesForge account.</p>
        <p>${message}</p>
        <p>If this was you, no action is needed. If you do not recognize this activity, please review your account sessions in your settings.</p>`;
      actionText = "View Account Sessions";
      break;
    }

    case "PASSWORD_CHANGED": {
      title = "Your SalesForge password was changed";
      bodyHtml = `
        <p>The password for your SalesForge account was recently updated.</p>
        <p>If you made this change, no further action is needed. If you did not make this change, please review your account settings and contact support.</p>`;
      actionText = "Review Account";
      break;
    }

    case "MAINTENANCE_NOTICE": {
      title = "Scheduled maintenance for SalesForge";
      bodyHtml = `
        <p>The SalesForge team has scheduled maintenance that may affect service availability.</p>
        <p>${message}</p>`;
      actionText = "View Status";
      break;
    }

    case "SYSTEM_ALERT":
    default: {
      title = metadata.title || "SalesForge account update";
      bodyHtml = `
        <p>There is an update regarding your SalesForge account.</p>
        <p>${message}</p>`;
      actionText = "Go to Dashboard";
      break;
    }
  }

  const html = getBaseLayout(title, bodyHtml, actionText, actionUrl, frontendUrl);

  // Plain-text must be substantive — a bare URL alone is a spam signal.
  const text = [
    "SalesForge Notification",
    "─────────────────────────",
    title,
    "",
    message,
    "",
    `Open in SalesForge: ${actionUrl}`,
    "",
    "─────────────────────────",
    "You received this because you have email notifications enabled in SalesForge.",
    `Manage preferences: ${frontendUrl}/notifications-prefs`,
  ].join("\n");

  // Subject prefix ensures consistent sender identity and avoids bare spam words
  return { subject: `[SalesForge] ${title}`, html, text };
};

module.exports = { compileTemplate };
