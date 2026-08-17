const { Resend } = require("resend");

let resendClient = null;

const getResend = () => {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

/**
 * Sends an email using Resend.
 *
 * @param {object} opts
 * @param {string} opts.to         - Recipient email address
 * @param {string} opts.subject    - Email subject
 * @param {string} opts.html       - HTML body
 * @param {string} [opts.text]     - Plain-text fallback
 * @returns {Promise<boolean>} true if sent, false otherwise
 */
const send = async ({ to, subject, html, text }) => {
  const client = getResend();

  if (!client) {
    console.warn("[EmailService] RESEND_API_KEY not set. Skipping email to:", to);
    return false;
  }

  try {
    const from = process.env.EMAIL_FROM || "SalesForge Notifications <onboarding@resend.dev>";
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

    const { error } = await client.emails.send({
      from,

      to,
      subject,
      html,
      text: text || subject,
      // reply_to prevents "no-reply" pattern which raises spam score
      reply_to: "support@salesforge.app",
      headers: {
        // List-Unsubscribe is required by Gmail/Yahoo for bulk senders
        "List-Unsubscribe": `<${frontendUrl}/notifications-prefs>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        // Unique ID per message prevents dedup false-positives
        "X-Entity-Ref-ID": `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
    });

    if (error) {
      console.error("[EmailService] Resend API error:", error);
      return false;
    }

    console.log(`[EmailService] Email sent successfully to ${to}`);
    return true;
  } catch (err) {
    console.error("[EmailService] Failed to send email via Resend:", err);
    return false;
  }
};

/**
 * Sends a basic notification email (backward-compatible wrapper).
 *
 * @param {string} to      - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text    - Plaintext body
 * @returns {Promise<boolean>} true if sent, false otherwise
 */
const sendNotificationEmail = async (to, subject, text) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: sans-serif; color: #333; line-height: 1.5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #00b5ad;">SalesForge Notification</h2>
    <p>${text.replace(/\n/g, "<br>")}</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="font-size: 12px; color: #999;">You received this because you enabled email notifications in SalesForge.</p>
  </div>
</body>
</html>`;
  return send({ to, subject, html, text });
};

module.exports = {
  send,
  sendNotificationEmail,
};
