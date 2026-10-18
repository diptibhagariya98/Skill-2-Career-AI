import React from "react";
import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";
import { BRAND } from "../constants/brand.theme";

interface ResetPasswordEmailProps {
  name?: string;
  code: string;
  expiresInMinutes?: number;
}

export function ResetPasswordEmail({
  name,
  code,
  expiresInMinutes = 10,
}: ResetPasswordEmailProps) {
  const c = BRAND.colors;

  return (
    <EmailLayout preview={`Reset your ${BRAND.name} password`} title="Password Reset Request">
      <Text
        style={{
          margin: "0 0 20px",
          fontSize: "15px",
          lineHeight: "24px",
          color: c.textSecondary,
        }}
      >
        Hi {name || "there"}, we received a request to reset your password for your <strong>{BRAND.name}</strong> account.
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
            textTransform: "uppercase",
            letterSpacing: "1px",
            fontWeight: 600,
            color: c.primary,
          }}
        >
          Password Reset Code
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
        ⏱️ This code will expire in <strong>{expiresInMinutes} minutes</strong>. If you did not request a password reset, you can safely ignore this email — your account remains completely secure.
      </Text>
    </EmailLayout>
  );
}

export default ResetPasswordEmail;
