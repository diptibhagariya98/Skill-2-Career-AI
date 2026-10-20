import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NativeAppProvider } from "@/shared/platform";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ResuMentor",
  description: "Your personalized AI-powered career assistant with Resume Builder, Job Finder, AI Interview, and Scholarship eligibility check.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} font-sans bg-gray-100 text-gray-800 antialiased`}>
        <TooltipProvider>
          <NativeAppProvider>
            {children}
          </NativeAppProvider>
        </TooltipProvider>
        <Toaster
          position="top-center"
          reverseOrder={false}
          containerStyle={{
            top: "calc(var(--sat, 0px) + 16px)",
            left: "16px",
            right: "16px",
            pointerEvents: "none",
          }}
          gutter={8}
          toastOptions={{
            duration: 4000,
            className: "resumentor-global-toast",
            style: {
              pointerEvents: "auto",
              maxWidth: "92vw",
              borderRadius: "14px",
              padding: "12px 18px",
              fontSize: "14px",
              fontWeight: 500,
              background: "#1e293b",
              color: "#ffffff",
              boxShadow: "0 12px 30px -4px rgba(0, 0, 0, 0.25), 0 6px 12px -3px rgba(0, 0, 0, 0.15)",
            },
            success: {
              duration: 3500,
              style: {
                background: "#065f46",
                color: "#ffffff",
              },
              iconTheme: {
                primary: "#34d399",
                secondary: "#065f46",
              },
            },
            error: {
              duration: 5000,
              style: {
                background: "#991b1b",
                color: "#ffffff",
              },
              iconTheme: {
                primary: "#f87171",
                secondary: "#991b1b",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
