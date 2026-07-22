/**
 * Renders the base HTML structure for SalesForge notifications.
 * Uses a professional gradient header, Inter font family, clear action button, and custom footer.
 */
const getBaseLayout = (title, bodyHtml, actionText, actionUrl, frontendUrl) => {
  return `<!DOCTYPE html>
<html>
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
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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
    .content {
      padding: 40px 32px;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 32px;
    }
    .button-container {
      text-align: center;
      margin-bottom: 16px;
    }
    .button {
      display: inline-block;
      background-color: #e76937;
      color: #ffffff !important;
      font-weight: 600;
      font-size: 15px;
      padding: 14px 32px;
      text-decoration: none !important;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(231, 105, 87, 0.2);
    }
    .footer {
      background-color: #f1f5f9;
      padding: 24px 32px;
      text-align: center;
      font-size: 13px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .footer a {
      color: #17AA97;
      text-decoration: none;
    }
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
        <div class="message">${bodyHtml}</div>
        <div class="button-container">
          <a href="${actionUrl}" class="button" target="_blank">${actionText}</a>
        </div>
      </div>
      <div class="footer">
        <p>This email was sent by SalesForge CRM. You received this because you have email notifications enabled.</p>
        <p><a href="${frontendUrl}/notifications-prefs">Manage Preferences</a> &bull; <a href="${frontendUrl}">Visit Dashboard</a></p>
        <p>&copy; 2026 SalesForge. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Compiles a template based on the type of notification.
 * 
 * @param {string} type - The notification/event type (e.g. LEAD_CREATED, DEAL_WON).
 * @param {string} message - Plaintext notification message.
 * @param {string|null} link - Action button link suffix.
 * @param {object} metadata - Extra details (e.g. lead name, amount).
 * @returns {object} { subject, html, text }
 */
const compileTemplate = (type, message, link, metadata = {}) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const actionUrl = link ? `${frontendUrl}${link}` : `${frontendUrl}/app`;

  let title = "Notification Alert";
  let bodyHtml = `<p>${message}</p>`;
  let actionText = "View Details";

  switch (type) {
    case "LEAD_ASSIGNED": {
      const name = metadata.leadName || metadata.name || (message ? message.replace(/^Lead\s+/, '').replace(/\s+(added|assigned|was).*/i, '') : 'Not specified');
      title = "New Lead Assigned";
      bodyHtml = `
        <p>A new lead has been assigned to you. Review their details to begin engagement.</p>
        <p><strong>Lead Name:</strong> ${name}</p>
        <p><strong>Details:</strong> ${message}</p>
      `;
      actionText = "View Lead Details";
      break;
    }

    case "LEAD_CREATED": {
      const name = metadata.leadName || metadata.name || (message ? message.replace(/^Lead\s+/, '').replace(/\s+(added|assigned|was).*/i, '') : 'Not specified');
      title = "New Lead Created";
      bodyHtml = `
        <p>A new lead has been successfully added to the organization pipeline.</p>
        <p><strong>Lead Name:</strong> ${name}</p>
        <p><strong>Message:</strong> ${message}</p>
      `;
      actionText = "View Lead";
      break;
    }

    case "LEAD_UPDATED": {
      const name = metadata.leadName || metadata.name || 'Lead';
      title = "Lead Updated";
      bodyHtml = `
        <p>A lead in your pipeline has been updated.</p>
        <p><strong>Lead Name:</strong> ${name}</p>
        <p><strong>Details:</strong> ${message}</p>
      `;
      actionText = "View Lead";
      break;
    }

    case "LEAD_DELETED": {
      const name = metadata.leadName || metadata.name || 'Lead';
      title = "Lead Deleted";
      bodyHtml = `
        <p>A lead has been deleted from your organization.</p>
        <p><strong>Lead Name:</strong> ${name}</p>
        <p><strong>Details:</strong> ${message}</p>
      `;
      actionText = "View Dashboard";
      break;
    }

    case "DEAL_CREATED": {
      title = "New Deal Created";
      bodyHtml = `
        <p>A new deal has been created in your pipeline.</p>
        <p><strong>Deal Name/Title:</strong> ${metadata.dealTitle || metadata.title || 'Deal'}</p>
        <p><strong>Deal Amount:</strong> ${metadata.amount ? '$' + metadata.amount : 'N/A'}</p>
        <p><strong>Details:</strong> ${message}</p>
      `;
      actionText = "View Deal";
      break;
    }

    case "DEAL_STAGE_CHANGED":
    case "DEAL_UPDATED": {
      title = "Deal Updated";
      bodyHtml = `
        <p>An update has occurred on a deal in your sales pipeline.</p>
        <p><strong>Deal Title:</strong> ${metadata.dealTitle || metadata.title || 'Deal'}</p>
        <p><strong>Details:</strong> ${message}</p>
      `;
      actionText = "View Deal";
      break;
    }

    case "DEAL_WON":
      title = "Deal Won! 🎉";
      bodyHtml = `
        <p>Congratulations! A deal has been closed successfully as won.</p>
        <p><strong>Deal Name/Title:</strong> ${metadata.dealTitle || metadata.title || 'Deal'}</p>
        <p><strong>Deal Amount:</strong> ${metadata.amount ? '$' + metadata.amount : 'N/A'}</p>
        <p><strong>Message:</strong> ${message}</p>
      `;
      actionText = "View Deal Details";
      break;

    case "DEAL_LOST":
      title = "Deal Lost";
      bodyHtml = `
        <p>A deal has been closed and marked as lost.</p>
        <p><strong>Deal Name/Title:</strong> ${metadata.dealTitle || metadata.title || 'Deal'}</p>
        <p><strong>Deal Amount:</strong> ${metadata.amount ? '$' + metadata.amount : 'N/A'}</p>
        <p><strong>Details:</strong> ${message}</p>
      `;
      actionText = "View Deal Details";
      break;

    case "INVOICE_CREATED":
      title = "New Invoice Created";
      bodyHtml = `
        <p>A new invoice has been generated for your organization.</p>
        <p><strong>Invoice Number:</strong> ${metadata.invoiceNumber || 'N/A'}</p>
        <p><strong>Invoice Amount:</strong> ${metadata.amount ? '$' + metadata.amount : 'N/A'}</p>
        <p><strong>Message:</strong> ${message}</p>
      `;
      actionText = "View Invoice";
      break;

    case "PAYMENT_RECEIVED":
      title = "Payment Received";
      bodyHtml = `
        <p>A payment has been successfully received and processed.</p>
        <p><strong>Amount Received:</strong> ${metadata.amount ? '$' + metadata.amount : 'N/A'}</p>
        <p><strong>Description:</strong> ${metadata.description || message || 'N/A'}</p>
      `;
      actionText = "View Payments";
      break;

    case "PAYMENT_FAILED":
      title = "Payment Failed";
      bodyHtml = `
        <p>An attempted payment transaction has failed.</p>
        <p><strong>Amount:</strong> ${metadata.amount ? '$' + metadata.amount : 'N/A'}</p>
        <p><strong>Reason:</strong> ${message}</p>
        <p>Please check your billing and payment method settings.</p>
      `;
      actionText = "Update Billing Info";
      break;

    case "TEAM_MEMBER_INVITED":
    case "TEAM_INVITATION":
    case "TEAM_INVITE":
      title = "Team Invitation";
      bodyHtml = `
        <p>You have been invited to join a team on SalesForge CRM.</p>
        <p><strong>Invite Message:</strong> ${message}</p>
        <p>Click the button below to accept your invitation and join the organization.</p>
      `;
      actionText = "Accept Invitation";
      break;

    case "TEAM_MEMBER_ADDED":
    case "MEMBER_JOINED":
      title = "Team Member Joined";
      bodyHtml = `
        <p>A new member has joined your team organization on SalesForge CRM.</p>
        <p><strong>Member Name:</strong> ${metadata.memberName || 'A team member'}</p>
        <p><strong>Details:</strong> ${message}</p>
      `;
      actionText = "View Team";
      break;

    case "ROLE_CHANGED":
    case "TEAM_ROLE_UPDATED":
      title = "Team Role Updated";
      bodyHtml = `
        <p>Your access role in your organization has been updated.</p>
        <p><strong>Details:</strong> ${message}</p>
      `;
      actionText = "View Team Settings";
      break;

    case "LOGIN_ALERT":
      title = "Security Alert: New Login";
      bodyHtml = `
        <p>A new login session was detected on your account.</p>
        <p><strong>Details:</strong> ${message}</p>
        <p>If this was not you, please secure your account immediately.</p>
      `;
      actionText = "Manage Security Settings";
      break;

    case "PASSWORD_CHANGED":
      title = "Password Changed";
      bodyHtml = `
        <p>Your account password was recently changed.</p>
        <p><strong>Details:</strong> ${message}</p>
        <p>If you did not make this change, please contact support or reset your password immediately.</p>
      `;
      actionText = "Account Security";
      break;

    case "MAINTENANCE_NOTICE":
      title = "System Maintenance Notice";
      bodyHtml = `
        <p>Scheduled maintenance notification for SalesForge CRM.</p>
        <p><strong>Notice:</strong> ${message}</p>
      `;
      actionText = "View System Status";
      break;

    case "SYSTEM_ALERT":
    default:
      title = metadata.title || "System Alert";
      bodyHtml = `
        <p>An important system event has occurred on your SalesForge account.</p>
        <p><strong>Event Message:</strong> ${message}</p>
      `;
      actionText = "Go to Dashboard";
      break;
  }

  const html = getBaseLayout(title, bodyHtml, actionText, actionUrl, frontendUrl);
  const text = `${title}\n\n${message}\n\nView details: ${actionUrl}`;

  return { subject: title, html, text };
};

module.exports = {
  compileTemplate,
};
