const nodemailer = require("nodemailer");

let transporter;

const shouldSendRealEmail = () =>
  process.env.NODE_ENV === "production" || process.env.EMAIL_FORCE_DELIVERY === "true";

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  if (!shouldSendRealEmail()) {
    if (process.env.NODE_ENV !== "test") {
      console.info(`[email:dev-preview] ${subject} -> ${to}`);
    }

    return {
      skipped: true,
    };
  }

  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    if (process.env.NODE_ENV !== "test") {
      console.info(`[email:skipped] ${subject} -> ${to}`);
    }

    return {
      skipped: true,
    };
  }

  try {
    await activeTransporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    });

    return {
      skipped: false,
    };
  } catch (error) {
    transporter = null;

    if (process.env.NODE_ENV === "production" && process.env.EMAIL_FAIL_HARD !== "false") {
      throw error;
    }

    if (process.env.NODE_ENV !== "test") {
      console.warn(`[email:fallback] ${subject} -> ${to}: ${error.message}`);
    }

    return {
      skipped: true,
      error: error.message,
    };
  }
};

const sendResetEmail = (email, resetUrl) => {
  return sendEmail({
    to: email,
    subject: "Reset your SalesForge password",
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
    html: `
      <p>Your verification code is:</p>
      <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
      <p>The code expires in 5 minutes.</p>
    `,
  });
};

module.exports = {
  sendEmail,
  sendResetEmail,
  sendVerificationEmail,
};
