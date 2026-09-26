import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#1e40af",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Harsh Apex Smart Business Suite - Multi-Tenant Commercial SaaS",
  description:
    "Enterprise-grade multi-tenant commercial business platform featuring automated operational workflows, multi-tier billing, live telemetry, and team management.",
  keywords: [
    "Harsh Apex",
    "Smart Business Suite",
    "Multi-Tenant SaaS",
    "Commercial SaaS",
    "Business Management Platform",
  ],
  authors: [{ name: "Harsh Apex Digital Solutions" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            className: "border border-border shadow-lg",
            style: {
              borderRadius: "0.625rem",
            },
          }}
        />
      </body>
    </html>
  );
}
