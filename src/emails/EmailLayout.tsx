import React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Heading,
} from "@react-email/components";
import { BRAND } from "../constants/brand.theme";

interface EmailLayoutProps {
  preview: string;
  title?: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, title, children }: EmailLayoutProps) {
  const c = BRAND.colors;

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: "32px 12px",
          backgroundColor: c.background,
          fontFamily: BRAND.fontFamily,
          color: c.text,
        }}
      >
        <Container
          style={{
            width: "100%",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          {/* Header Brand Banner */}
          <Section style={{ padding: "8px 0 20px", textAlign: "center" }}>
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
              <tr>
                <td align="center">
                  <div
                    style={{
                      display: "inline-block",
                      backgroundColor: c.primary,
                      borderRadius: "12px",
                      padding: "8px 16px",
                    }}
                  >
                    <Heading
                      as="h2"
                      style={{
                        margin: 0,
                        color: "#FFFFFF",
                        fontSize: "20px",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                      }}
                    >
                      🎓 {BRAND.name}
                    </Heading>
                  </div>
                </td>
              </tr>
            </table>
          </Section>

          {/* Main Card Surface */}
          <Section
            style={{
              backgroundColor: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: `${BRAND.radius}px`,
              padding: "36px 28px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
            }}
          >
            {title && (
              <Heading
                as="h1"
                style={{
                  margin: "0 0 16px",
                  fontSize: "22px",
                  fontWeight: 700,
                  color: c.text,
                  lineHeight: "28px",
                }}
              >
                {title}
              </Heading>
            )}
            {children}
          </Section>

          {/* Footer Section */}
          <Section
            style={{
              padding: "24px 8px 8px",
              color: c.muted,
              fontSize: "12px",
              lineHeight: "18px",
              textAlign: "center",
            }}
          >
            <Text style={{ margin: "0 0 6px", color: c.muted, fontSize: "12px" }}>
              {BRAND.companyAddress}
            </Text>
            <Text style={{ margin: 0, color: c.muted, fontSize: "12px" }}>
              Questions? Reach out to{" "}
              <Link
                href={`mailto:${BRAND.supportEmail}`}
                style={{ color: c.primary, textDecoration: "underline" }}
              >
                {BRAND.supportEmail}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default EmailLayout;
