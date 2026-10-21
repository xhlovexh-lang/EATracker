import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";
import { SITE_NAME, SITE_URL } from "../lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `Is That Early Access Game Abandoned? | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "We track every Steam Early Access game's patch notes, developer community announcements, and depot build timestamps daily to verify whether a game is active, stalled, or abandoned.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `Is That Early Access Game Abandoned? | ${SITE_NAME}`,
    description:
      "Daily automated audit of 10,482+ Steam Early Access games. Check last patch date, developer post frequency, and 1.0 graduation status before you buy.",
    url: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "ajAjDJF1DI6raVtE2expvM3piVN8iq5GY17ZoIHG7ic",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
