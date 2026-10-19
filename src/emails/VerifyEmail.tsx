import React from "react";
import { Section, Text, Heading } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";
import { BRAND } from "../constants/brand.theme";

interface VerifyEmailProps {
  name?: string;
  code: string;
  expiresInMinutes?: number;
}

export function VerifyEmail({
  name,
  code,
  expiresInMinutes = 10,
}: VerifyEmailProps) {
  const c = BRAND.colors;

  return (
    <EmailLayout preview={`Your ${BRAND.name} verification code is ${code}`} title="Verify your email address">
      <Text
        style={{
          margin: "0 0 20px",
          fontSize: "15px",
          lineHeight: "24px",
          color: c.textSecondary,
        }}
      >
        Hi {name || "there"}, welcome to <strong>{BRAND.name}</strong>! Please enter the
        following 6-digit verification code to confirm your email and activate your student account.
      </Text>

      {/* 6-Digit Code Highlight Box */}
      <Section
        style={{
          backgroundColor: c.primaryLight,
          border: `1px solid ${c.border}`,
          borderRadius: `${BRAND.radius}px`,
          padding: "20px 16px",
          textAlign: "center",
          margin: "24px 0",
        }}
      >
        <Text
          style={{
            margin: "0 0 4px",
            fontSize: "12px",
            letterSpacing: "0.5px",
            fontWeight: 600,
            color: c.primary,
          }}
        >
          One-time verification code
        </Text>
        <Text
          style={{
            margin: 0,
            fontSize: "36px",
            lineHeight: "44px",
            fontWeight: 800,
            letterSpacing: "8px",
            color: c.primary,
            fontFamily: "Menlo, Consolas, 'Courier New', monospace",
          }}
        >
          {code}
        </Text>
      </Section>

      <Text
        style={{
          margin: "0 0 16px",
          fontSize: "14px",
          lineHeight: "22px",
          color: c.muted,
        }}
      >
        ⏱️ This code will expire in <strong>{expiresInMinutes} minutes</strong>. If you did not create an account on {BRAND.name}, you can safely disregard this email.
      </Text>

      <Text
        style={{
          margin: 0,
          fontSize: "13px",
          lineHeight: "20px",
          color: c.muted,
          borderTop: `1px solid ${c.border}`,
          paddingTop: "16px",
        }}
      >
        🔒 Security Note: {BRAND.name} staff will never ask you for your verification code or password.
      </Text>
    </EmailLayout>
  );
}

export default VerifyEmail;
