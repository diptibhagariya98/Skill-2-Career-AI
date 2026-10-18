import { render } from "@react-email/render";
import React from "react";
import VerifyEmail from "@/emails/VerifyEmail";
import WelcomeEmail from "@/emails/WelcomeEmail";
import ResetPasswordEmail from "@/emails/ResetPasswordEmail";

export type EmailTemplateKey = "verify-email" | "welcome" | "reset-password";

export interface RenderTemplateOptions {
  template: EmailTemplateKey;
  data: {
    name?: string;
    code?: string;
    expiresInMinutes?: number;
  };
}

/**
 * Render React Email component to responsive HTML and Plaintext versions.
 */
export async function renderTemplate({ template, data }: RenderTemplateOptions): Promise<{
  subject: string;
  html: string;
  text: string;
}> {
  let element: React.ReactElement;
  let subject = "";

  switch (template) {
    case "verify-email":
      element = React.createElement(VerifyEmail, {
        name: data.name,
        code: data.code || "000000",
        expiresInMinutes: data.expiresInMinutes || 10,
      });
      subject = "Verify your email for ResuMentor";
      break;

    case "welcome":
      element = React.createElement(WelcomeEmail, {
        name: data.name,
      });
      subject = "Welcome to ResuMentor!";
      break;

    case "reset-password":
      element = React.createElement(ResetPasswordEmail, {
        name: data.name,
        code: data.code || "000000",
        expiresInMinutes: data.expiresInMinutes || 10,
      });
      subject = "Reset your ResuMentor password";
      break;

    default:
      throw new Error(`Unknown email template: ${template}`);
  }

  const html = await render(element);
  const text = await render(element, { plainText: true });

  return { subject, html, text };
}
