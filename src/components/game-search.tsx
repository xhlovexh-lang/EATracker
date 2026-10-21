"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { STATUS_META, type GameStatusType } from "../config/status";
import { GameCover } from "./game-cover";

export interface SearchableGameItem {
  appid: number;
  name: string;
  slug: string;
  status: GameStatusType;
  activityScore: number;
  lastUpdateLabel: string;
  headerImage: string;
}

export function GameSearchAutocomplete({
  items,
  placeholder = "Search any Early Access game (e.g., Manor Lords, Valheim, Project Zomboid)...",
  compact = false,
}: {
  items: SearchableGameItem[];
  placeholder?: string;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 6);
    return items
      .filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          String(item.appid).includes(q) ||
          item.slug.includes(q)
      )
      .slice(0, 8);
  }, [query, items]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (matches.length > 0) {
      setOpen(false);
      router.push(`/game/${matches[0].slug}`);
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <Search
          className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 ${
            compact ? "h-4 w-4" : "h-5 w-5"
          }`}
        />
        <input
          type="search"
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          aria-label="Search Steam Early Access games"
          className={`w-full rounded-xl border border-slate-700/80 bg-slate-900/90 text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
            compact
              ? "pl-9 pr-3 py-1.5 text-xs"
              : "pl-11 pr-28 py-3.5 text-sm sm:text-base shadow-xl"
          }`}
        />
        {!compact && (
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
          >
            Check Status
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-slate-700 bg-slate-900/98 p-1.5 shadow-2xl backdrop-blur-md">
          <div className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-slate-400 flex justify-between">
            <span>{query.trim() ? "Matching Games" : "Popular Tracked Games"}</span>
            <span>Status & Score</span>
          </div>
          <ul className="divide-y divide-slate-800/60">
            {matches.map((item) => {
              const meta = STATUS_META[item.status];
              return (
                <li key={item.appid}>
                  <Link
                    href={`/game/${item.slug}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 hover:bg-slate-800/80 transition-colors"
                  >
                    <GameCover
                      src={item.headerImage}
                      alt=""
                      width={92}
                      height={43}
                      className="h-10 w-[86px] shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-100">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        AppID {item.appid} · Last activity: {item.lastUpdateLabel}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dotColor}`} />
                        {meta.shortLabel}
                      </span>
                      <span className="font-mono text-xs text-slate-400 w-9 text-right">
                        {item.activityScore}/100
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
