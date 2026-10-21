import Link from "next/link";
import { FOOTER_GENRE_CATEGORIES } from "../lib/catalog";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-slate-950 text-xs text-slate-400">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          <div>
            <p className="text-sm font-bold text-slate-100 mb-2">
              EA<span className="text-emerald-400">Tracker</span>
            </p>
            <p className="leading-relaxed text-slate-400">
              Independent programmatic tracker monitoring patch frequency, community announcements,
              and depot build timestamps across Steam Early Access games.
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">
              Rankings & Lists
            </p>
            <ul className="space-y-2">
              <li>
                <Link href="/abandoned-early-access-games" className="hover:text-slate-200">
                  Abandoned Early Access Games
                </Link>
              </li>
              <li>
                <Link href="/longest-early-access-games" className="hover:text-slate-200">
                  Longest in Early Access
                </Link>
              </li>
              <li>
                <Link href="/recently-updated-early-access-games" className="hover:text-slate-200">
                  Recently Updated Games
                </Link>
              </li>
              <li>
                <Link href="/left-early-access" className="hover:text-slate-200">
                  Left Early Access (1.0)
                </Link>
              </li>
              <li>
                <Link href="/recently-left-early-access" className="hover:text-slate-200">
                  Recently Left Early Access
                </Link>
              </li>
              <li>
                <Link href="/coming-to-1-0-soon" className="hover:text-slate-200">
                  Coming to 1.0 Soon
                </Link>
              </li>
              <li>
                <Link href="/stats" className="hover:text-slate-200">
                  Global Early Access Statistics
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">
              Browse by Genre
            </p>
            <ul className="space-y-2">
              {FOOTER_GENRE_CATEGORIES.map((g) => (
                <li key={g.slug}>
                  <Link href={`/genre/${g.slug}`} className="hover:text-slate-200">
                    {g.name} Early Access
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">
              Transparency & Legal
            </p>
            <ul className="space-y-2">
              <li>
                <Link href="/methodology" className="hover:text-slate-200">
                  Scoring Methodology & Rules
                </Link>
              </li>
              <li>
                <Link href="/report" className="hover:text-emerald-400 font-medium">
                  Developer? Report Incorrect Data
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-slate-200">
                  About & Data Sources
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-slate-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-slate-200">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-slate-200">
                  Contact
                </Link>
              </li>
              <li>
                <a href="/llms.txt" className="hover:text-slate-200 font-mono text-[11px]">
                  /llms.txt (AI & LLM Index)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>
            Data from public Steam APIs. Build data via steamcmd.net.{" "}
            <strong className="font-medium text-slate-300">
              Not affiliated with or endorsed by Valve Corporation.
            </strong>{" "}
            Steam and the Steam logo are trademarks of Valve Corporation.
          </p>
          <p className="shrink-0">
            Status classifications are automated, deterministic, and neutral.
          </p>
        </div>
      </div>
    </footer>
  );
}
