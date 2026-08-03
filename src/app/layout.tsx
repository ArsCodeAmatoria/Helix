import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { FlhaProvider } from "@/components/providers/flha-provider";
import { TimeClockProvider } from "@/components/providers/timeclock-provider";
import { TeamProvider } from "@/components/providers/team-provider";
import { InspectionLogProvider } from "@/components/providers/inspection-log-provider";
import { DocumentReviewProvider } from "@/components/providers/document-review-provider";
import { BcCraneBinderProvider } from "@/components/providers/bc-crane-binder-provider";
import { EvaluationProvider } from "@/components/providers/evaluation-provider";
import { ToolboxProvider } from "@/components/providers/toolbox-provider";
import { SiteInspectionProvider } from "@/components/providers/site-inspection-provider";
import { DigitalFormsProvider } from "@/components/providers/digital-forms-provider";
import { NotificationsProvider } from "@/components/providers/notifications-provider";
import { PwaProvider } from "@/components/providers/pwa-provider";
import { InstallAppProvider } from "@/components/pwa/install-app-provider";
import { PwaIconPreload } from "@/components/pwa/pwa-icon-preload";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Proven",
  title: {
    default: "Proven",
    template: "%s · Proven",
  },
  description:
    "Construction workforce & safety platform for crane, rigging, concrete, and formwork crews.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Proven",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1419" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <PwaIconPreload />
      </head>
      <body className="min-h-full bg-background font-sans">
        <PwaProvider>
          <InstallAppProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
              <FlhaProvider>
                <TimeClockProvider>
                  <TeamProvider>
                    <InspectionLogProvider>
                      <DocumentReviewProvider>
                        <BcCraneBinderProvider>
                          <EvaluationProvider>
                            <ToolboxProvider>
                              <SiteInspectionProvider>
                                <DigitalFormsProvider>
                                  <NotificationsProvider>
                                    <AppShell>{children}</AppShell>
                                  </NotificationsProvider>
                                </DigitalFormsProvider>
                              </SiteInspectionProvider>
                            </ToolboxProvider>
                          </EvaluationProvider>
                        </BcCraneBinderProvider>
                      </DocumentReviewProvider>
                    </InspectionLogProvider>
                  </TeamProvider>
                </TimeClockProvider>
              </FlhaProvider>
            </ThemeProvider>
          </InstallAppProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
