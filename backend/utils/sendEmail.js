const { Resend } = require("resend");

let resendClient = null;

const getResend = () => {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const client = getResend();

  if (!client) {
    if (process.env.NODE_ENV !== "test") {
      console.info(`[email:skipped] RESEND_API_KEY not set. ${subject} -> ${to}`);
    }
    return { skipped: true };
  }

  try {
    const from = process.env.EMAIL_FROM || "SalesForge <onboarding@resend.dev>";
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

    const { error } = await client.emails.send({
      from,
      to,
      subject,
      html,
      text: text || subject,
      reply_to: "support@salesforge.app",
      headers: {
        "List-Unsubscribe": `<${frontendUrl}/notifications-prefs>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        "X-Entity-Ref-ID": `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
    });

    if (error) {
      if (process.env.NODE_ENV !== "test") {
        console.warn(`[email:error] ${subject} -> ${to}: ${error.message}`);
      }
      return { skipped: true, error: error.message };
    }

    return { skipped: false };
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(`[email:fallback] ${subject} -> ${to}: ${err.message}`);
    }

    if (process.env.NODE_ENV === "production" && process.env.EMAIL_FAIL_HARD !== "false") {
      throw err;
    }

    return { skipped: true, error: err.message };
  }
};

const sendResetEmail = (email, resetUrl) => {
  return sendEmail({
    to: email,
    subject: "Reset your SalesForge password",
    text: `You requested a password reset.\n\nUse the following link to choose a new password:\n${resetUrl}\n\nThis link expires in 1 hour.`,
    html: `
      <p>You requested a password reset.</p>
      <p>Use the following link to choose a new password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 1 hour.</p>
    `,
  });
};

const sendVerificationEmail = (email, otp) => {
  return sendEmail({
    to: email,
    subject: "Your SalesForge verification code",
    text: `Your verification code is: ${otp}\n\nThe code expires in 5 minutes.`,
    html: `
      <p>Your verification code is:</p>
      <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
      <p>The code expires in 5 minutes.</p>
    `,
  });
};

const sendInviteEmail = ({ to, inviterName, orgName, role, inviteUrl }) => {
  return sendEmail({
    to,
    subject: `You've been invited to join ${orgName} on SalesForge`,
    text: `${inviterName} has invited you to join ${orgName} on SalesForge as a ${role}.\n\nAccept your invitation: ${inviteUrl}\n\nThis invite expires in 7 days.`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Team Invite</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#00b5ad 0%,#0ea5e9 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">SalesForge</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Team Collaboration Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 12px;color:#f1f5f9;font-size:22px;font-weight:700;">You're invited! 🎉</h2>
              <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
                <strong style="color:#e2e8f0;">${inviterName}</strong> has invited you to join
                <strong style="color:#00b5ad;">${orgName}</strong> on SalesForge as a
                <strong style="color:#e2e8f0;">${role}</strong>.
              </p>
              <div style="background:#0f172a;border:1px solid #334155;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your Role</p>
                <p style="margin:6px 0 0;color:#00b5ad;font-size:16px;font-weight:700;">${role}</p>
              </div>
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#00b5ad,#0ea5e9);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:10px;letter-spacing:0.3px;">
                  Accept Invitation
                </a>
              </div>
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;text-align:center;">Or copy this link into your browser:</p>
              <p style="margin:0;text-align:center;">
                <a href="${inviteUrl}" style="color:#0ea5e9;font-size:12px;word-break:break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:24px 40px;border-top:1px solid #1e293b;text-align:center;">
              <p style="margin:0;color:#475569;font-size:12px;">This invite expires in <strong style="color:#64748b;">7 days</strong>.</p>
              <p style="margin:8px 0 0;color:#334155;font-size:11px;">If you didn't expect this invite, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
};

module.exports = {
  sendEmail,
  sendResetEmail,
  sendVerificationEmail,
  sendInviteEmail,
};
