const nodemailer = require("nodemailer");

/**
 * Creates a Nodemailer transporter using SMTP environment variables.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Sends an email using Nodemailer.
 * 
 * @param {object} opts
 * @param {string} opts.to - The recipient email address.
 * @param {string} opts.subject - The subject of the email.
 * @param {string} opts.html - The HTML body of the email.
 * @param {string} [opts.text] - Optional text body.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
const send = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("[EmailService] EMAIL_USER or EMAIL_PASS not set. Skipping email to:", to);
    return false;
  }

  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"SalesForge Notifications" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || "",
      html,
    });

    console.log(`[EmailService] Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("[EmailService] Failed to send email via SMTP:", error);
    // Return false instead of throwing so we don't break the notification pipeline.
    return false;
  }
};

/**
 * Sends a basic notification email (backward-compatible wrapper).
 * 
 * @param {string} to - The recipient email address.
 * @param {string} subject - The subject of the email.
 * @param {string} text - The plaintext body of the email.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
const sendNotificationEmail = async (to, subject, text) => {
  const html = `<div style="font-family: sans-serif; color: #333; line-height: 1.5;">
                 <h2>SalesForge Notification</h2>
                 <p>${text.replace(/\n/g, "<br>")}</p>
               </div>`;
  return send({ to, subject, html, text });
};

module.exports = {
  send,
  sendNotificationEmail,
};
