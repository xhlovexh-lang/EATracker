import type { Metadata } from "next";
import { SITE_URL } from "../../lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for EA Tracker.",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-5 text-sm text-slate-300 leading-relaxed">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-50">
        Privacy Policy
      </h1>
      <p>
        EA Tracker does not collect, request, or store Steam user account data or Steam login credentials.
      </p>
      <h2 className="text-base font-bold text-slate-100">
        1. Information We Collect
      </h2>
      <p>
        We only collect information voluntarily submitted through our Developer Correction Form (<code className="font-mono">/report</code>), where an email address is optional and used solely to notify you when a data correction request has been reviewed.
      </p>
      <h2 className="text-base font-bold text-slate-100">
        2. Public Game Data
      </h2>
      <p>
        All game metadata, patch timestamps, and announcement titles displayed on this website originate from public Steam store and community endpoints regarding commercial software products.
      </p>
    </div>
  );
}
