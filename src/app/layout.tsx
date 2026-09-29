import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ToastProvider } from "@/components/toast-provider";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { themeInitScript } from "@/components/theme-toggle";
import "./globals.css";

// Embedded so the layout still paints if the dev stylesheet URL fails
// (Turbopack chunk names contain brackets that some proxies drop).
const inlineCss = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")
  .replace(/^@import\s+["']tailwindcss["'];?\s*/m, "")
  .replace(/<\/style/gi, "<\\/style");

// Dev registrations intercept /_next assets and can answer stylesheets with HTML.
const serviceWorkerCleanupScript = `
(function () {
  if (!('serviceWorker' in navigator)) return;
  var host = location.hostname;
  if (host !== 'localhost' && host !== '127.0.0.1') return;
  navigator.serviceWorker.getRegistrations().then(function (regs) {
    if (!regs.length) return;
    Promise.all(regs.map(function (reg) { return reg.unregister(); })).then(function () {
      if (sessionStorage.getItem('interviewlab:sw-cleared')) return;
      sessionStorage.setItem('interviewlab:sw-cleared', '1');
      location.reload();
    });
  });
})();
`;

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
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Inlined so layout styles still apply if the dev CSS chunk URL fails to load. */}
        <style dangerouslySetInnerHTML={{ __html: inlineCss }} />
        {/* Applies the persisted or system color theme before paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: serviceWorkerCleanupScript }} />
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
