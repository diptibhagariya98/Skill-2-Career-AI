import React from "react";
import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";
import { BRAND } from "../constants/brand.theme";

interface WelcomeEmailProps {
  name?: string;
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  const c = BRAND.colors;

  return (
    <EmailLayout preview={`Welcome to ${BRAND.name} — Your AI Career Companion!`} title="Welcome to ResuMentor! 🎉">
      <Text
        style={{
          margin: "0 0 18px",
          fontSize: "15px",
          lineHeight: "24px",
          color: c.textSecondary,
        }}
      >
        Hi {name || "there"}, your email has been verified and your <strong>{BRAND.name}</strong> account is now fully active!
      </Text>

      <Text
        style={{
          margin: "0 0 16px",
          fontSize: "15px",
          lineHeight: "24px",
          color: c.textSecondary,
        }}
      >
        Here is what you can explore right away:
      </Text>

      <Section
        style={{
          backgroundColor: c.background,
          border: `1px solid ${c.border}`,
          borderRadius: `${BRAND.radius}px`,
          padding: "16px 20px",
          margin: "0 0 24px",
        }}
      >
        <Text style={{ margin: "0 0 10px", fontSize: "14px", color: c.text }}>
          📄 <strong>AI Resume Builder & ATS Scorer:</strong> Build ATS-optimized resumes and get immediate feedback.
        </Text>
        <Text style={{ margin: "0 0 10px", fontSize: "14px", color: c.text }}>
          🎙️ <strong>AI Mock Interview Simulator:</strong> Practice realistic role-based interviews with real-time AI scoring.
        </Text>
        <Text style={{ margin: 0, fontSize: "14px", color: c.text }}>
          💼 <strong>Live Job Finder & Scholarships:</strong> Explore curated opportunities and verified scholarship advisors.
        </Text>
      </Section>

      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
          <tr>
            <td align="center">
              <Link
                href={BRAND.url}
                style={{
                  display: "inline-block",
                  backgroundColor: c.primary,
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontWeight: 600,
                  textDecoration: "none",
                  padding: "12px 28px",
                  borderRadius: "8px",
                }}
              >
                Go to Dashboard
              </Link>
            </td>
          </tr>
        </table>
      </Section>

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
        If you have any questions or feedback, simply reply to this email or contact us at {BRAND.supportEmail}.
      </Text>
    </EmailLayout>
  );
}

export default WelcomeEmail;
