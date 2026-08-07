import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ToastProvider } from "@/components/toast-provider";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { themeInitScript } from "@/components/theme-toggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InterviewLab — Evidence-grounded interview coaching",
  description: "Practice behavioral interview answers and receive feedback grounded in your exact words.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "InterviewLab",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e6045",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Applies the persisted or system color theme before paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a href="#main-content" className="skip-link">Skip to content</a>
        <ToastProvider>
          <SiteHeader />
          <div id="main-content">{children}</div>
          <SiteFooter />
          <PwaInstallPrompt />
        </ToastProvider>
      </body>
    </html>
  );
}
