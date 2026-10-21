import Link from "next/link";
import { Activity, ShieldCheck, BarChart3, Clock, AlertTriangle, Sparkles } from "lucide-react";
import { loadCatalog } from "../lib/repository";
import { formatUtcDate } from "../lib/status-engine";
import { GameSearchAutocomplete } from "./game-search";

export async function SiteHeader() {
  const catalog = await loadCatalog();
  const searchItems = catalog.games.map((g) => ({
    appid: g.appid,
    name: g.name,
    slug: g.slug,
    status: g.status,
    activityScore: g.activityScore,
    lastUpdateLabel: formatUtcDate(g.lastActivityAt),
    headerImage: g.headerImage,
  }));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-slate-100 font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
              <Activity className="h-4 w-4" />
            </span>
            <span>
              EA<span className="text-emerald-400">Tracker</span>
              <span className="ml-1.5 hidden sm:inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-normal text-slate-300">
                DAILY STEAM AUDIT
              </span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-300">
            <Link
              href="/abandoned-early-access-games"
              className="inline-flex items-center gap-1 hover:text-rose-300 transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              Abandoned List
            </Link>
            <Link
              href="/longest-early-access-games"
              className="inline-flex items-center gap-1 hover:text-amber-300 transition-colors"
            >
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              Longest in EA
            </Link>
            <Link
              href="/recently-updated-early-access-games"
              className="inline-flex items-center gap-1 hover:text-emerald-300 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              Recently Updated
            </Link>
            <Link
              href="/coming-to-1-0-soon"
              className="inline-flex items-center gap-1 hover:text-violet-300 transition-colors"
            >
              <Clock className="h-3.5 w-3.5 text-violet-400" />
              Coming to 1.0
            </Link>
            <Link
              href="/recently-left-early-access"
              className="inline-flex items-center gap-1 hover:text-sky-300 transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
              Left EA
            </Link>
            <Link
              href="/stats"
              className="inline-flex items-center gap-1 hover:text-slate-100 transition-colors"
            >
              <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
              Stats
            </Link>
            <Link
              href="/methodology"
              className="hover:text-slate-100 transition-colors"
            >
              Methodology
            </Link>
          </nav>
        </div>

        <div className="w-56 sm:w-72">
          <GameSearchAutocomplete
            items={searchItems}
            placeholder="Quick check game..."
            compact
          />
        </div>
      </div>
    </header>
  );
}
