import type { Metadata } from "next";
import { SITE_URL } from "../../lib/seo";

export const metadata: Metadata = {
  title: "About EA Tracker",
  description:
    "Why we built EA Tracker to bring transparent, daily update tracking to Steam Early Access games.",
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6 text-sm text-slate-300 leading-relaxed">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-50">
        About EA Tracker
      </h1>
      <p>
        PC players frequently ask a simple question before purchasing an Early Access game:{" "}
        <em>&ldquo;When was this game last updated, and is the developer still actively working on it?&rdquo;</em>
      </p>
      <p>
        EA Tracker is an independent programmatic database that monitors Steam Early Access games&apos; official community announcements, patch notes, and public depot build timestamps. Instead of subjective opinions, we provide a transparent, deterministic status badge and 36-month update cadence chart for every tracked title.
      </p>
      <p className="text-xs text-slate-400">
        Data from public Steam APIs. Build data via steamcmd.net. Not affiliated with or endorsed by Valve Corporation.
      </p>
    </div>
  );
}
