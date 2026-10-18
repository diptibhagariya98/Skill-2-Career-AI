import nodemailer from "nodemailer";
import { BRAND } from "@/constants/brand.theme";

// Check if SMTP configuration is present in environment
const hasSmtpConfig = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
);

export const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT) === 465, // false for 587 (STARTTLS), true for 465 (SSL)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    })
  : null;

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Send branded transactional email.
 * Falls back to console output if SMTP credentials are not yet configured in .env.local.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const isGmail = (process.env.SMTP_HOST || "").toLowerCase().includes("gmail");
  const senderEmail = isGmail && process.env.SMTP_USER
    ? process.env.SMTP_USER
    : (process.env.MAIL_FROM || process.env.SMTP_USER || "no-reply@resumentor.app");

  const from = `"${BRAND.name}" <${senderEmail}>`;
  const replyTo = process.env.MAIL_FROM || senderEmail;

  if (!transporter) {
    console.info(`[MailDev] [SMTP Not Configured] Email to: ${to} | Subject: "${subject}"`);
    console.info(`[MailDev] Text Preview:\n${text.substring(0, 300)}...`);
    return {
      success: true,
      simulated: true,
      messageId: `dev-simulated-${Date.now()}`,
    };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      replyTo,
      subject,
      html,
      text,
    });
    console.info(`[Nodemailer Success] Dispatched email to ${to} (MessageId: ${info.messageId})`);
    return {
      success: true,
      simulated: false,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error(`[Nodemailer Error] Failed to send email to ${to}:`, error.message);
    throw error;
  }
}
