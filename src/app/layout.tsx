import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { FlhaProvider } from "@/components/providers/flha-provider";
import { TimeClockProvider } from "@/components/providers/timeclock-provider";
import { TeamProvider } from "@/components/providers/team-provider";
import { InspectionLogProvider } from "@/components/providers/inspection-log-provider";
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
  title: "Helix",
  description:
    "Construction workforce & safety platform for crane, rigging, concrete, and formwork crews.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Helix",
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
      <body className="min-h-full bg-background font-sans">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <FlhaProvider>
            <TimeClockProvider>
              <TeamProvider>
                <InspectionLogProvider>
                  <AppShell>{children}</AppShell>
                </InspectionLogProvider>
              </TeamProvider>
            </TimeClockProvider>
          </FlhaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
