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
        <Toaster position="top-right" reverseOrder={false} />
      </body>
    </html>
  );
}
