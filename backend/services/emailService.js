const nodemailer = require("nodemailer");

// Simple generic email service setup using nodemailer
// Requires SMTP configuration in environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Sends a basic notification email.
 * 
 * @param {string} to - The recipient email address.
 * @param {string} subject - The subject of the email.
 * @param {string} text - The plaintext body of the email.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
const sendNotificationEmail = async (to, subject, text) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[EmailService] SMTP_USER or SMTP_PASS not set. Skipping email to:", to);
    return false;
  }

  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"SalesForge Notifications" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: `<div style="font-family: sans-serif; color: #333; line-height: 1.5;">
               <h2>SalesForge Notification</h2>
               <p>${text.replace(/\n/g, "<br>")}</p>
             </div>`,
    });

    console.log(`[EmailService] Notification email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("[EmailService] Failed to send email:", error);
    return false;
  }
};

module.exports = {
  sendNotificationEmail,
};
