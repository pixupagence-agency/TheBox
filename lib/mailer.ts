import nodemailer from "nodemailer";

// Default sender user if SMTP_USER is not explicitly provided
const DEFAULT_SMTP_USER = "pixup.agence@gmail.com";

export function getMailTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const user = process.env.SMTP_USER || DEFAULT_SMTP_USER;
  const rawPass = process.env.SMTP_PASS || "";
  const pass = rawPass.replace(/\s+/g, "");

  if (!pass) {
    throw new Error("SMTP_PASS is not configured in server environment variables.");
  }

  // If using Gmail, using service: 'gmail' is the most robust transport across all serverless environments
  if (host === "smtp.gmail.com" || user.endsWith("@gmail.com")) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });
  }

  // Generic SMTP transport
  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user,
      pass,
    },
  });
}

export const DEFAULT_FROM_EMAIL = process.env.SMTP_FROM || '"The Box" <pixup.agence@gmail.com>';
export const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "pixup.agence@gmail.com";
