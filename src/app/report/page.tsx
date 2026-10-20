import type { Metadata } from "next";
import { ReportForm } from "../../components/report-form";
import { SITE_URL } from "../../lib/seo";

export const metadata: Metadata = {
  title: "Report Incorrect Data or Submit External Developer Updates",
  description:
    "Are you a game developer who posts Early Access updates on an external blog or Discord? Submit a verification link so we can update your game's status within 72 hours.",
  alternates: {
    canonical: `${SITE_URL}/report`,
  },
};

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ appid?: string; game?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2">
          Developer &amp; Community Correction Portal · 72-Hour SLA
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-50 mb-3">
          Developer? Report Incorrect Data or External Updates
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          EA Tracker calculates status automatically from public Steam Community Announcements and Steam PICS branch timestamps. If your studio posts changelogs on an external website, Patreon, or Discord—or pushes builds primarily to a non-default Steam beta branch—submit the details below. Once verified, we display your external update link and cap the status at{" "}
          <strong className="text-amber-300">Slowing Down</strong> instead of Stalled/Abandoned.
        </p>
      </div>

      <ReportForm
        defaultAppId={params.appid ?? ""}
        defaultGameName={params.game ?? ""}
      />
    </div>
  );
}
