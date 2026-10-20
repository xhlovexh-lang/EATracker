import type { Metadata } from "next";
import { SITE_URL } from "../../lib/seo";

export const metadata: Metadata = {
  title: "Terms of Use & Disclaimers",
  description: "Terms of Use and Valve/Steam non-affiliation disclaimers for EA Tracker.",
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-5 text-sm text-slate-300 leading-relaxed">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-50">
        Terms of Use &amp; Disclaimers
      </h1>
      <p>
        All data on EA Tracker is provided &ldquo;as is&rdquo; for informational purposes only. Status classifications (Active, Slowing Down, Stalled, Likely Abandoned, Left Early Access) are generated automatically by deterministic algorithms based solely on public Steam activity.
      </p>
      <p>
        Some game developers publish development updates on external platforms (such as Discord, Patreon, or studio websites) or push builds exclusively to password-protected testing branches. A &ldquo;Likely Abandoned&rdquo; or &ldquo;Stalled&rdquo; badge reflects inactivity on public Steam channels only and makes no claim regarding developer intent.
      </p>
      <p className="text-xs text-slate-400">
        Not affiliated with or endorsed by Valve Corporation. Steam and the Steam logo are trademarks of Valve Corporation. Game titles and header images are copyright of their respective developers and publishers and are used strictly for identification with direct links back to the official Steam Store.
      </p>
    </div>
  );
}
