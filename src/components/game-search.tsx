"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { STATUS_META, type GameStatusType } from "../config/status";
import type { SearchableGameItem } from "../lib/search-index";
import { GameCover } from "./game-cover";

export type { SearchableGameItem };

export function GameSearchAutocomplete({
  items: initialItems,
  placeholder = "Search any Early Access game (e.g., Manor Lords, Valheim, Project Zomboid)...",
  compact = false,
}: {
  /** Optional SSR/CSR seed. Prefer omitting so the index loads on focus instead of bloating HTML. */
  items?: SearchableGameItem[];
  placeholder?: string;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SearchableGameItem[]>(initialItems ?? []);
  const [indexStatus, setIndexStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >(initialItems && initialItems.length > 0 ? "ready" : "idle");
  const router = useRouter();

  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setItems(initialItems);
      setIndexStatus("ready");
    }
  }, [initialItems]);

  const ensureIndex = () => {
    if (indexStatus === "ready" || indexStatus === "loading") return;
    if (items.length > 0) {
      setIndexStatus("ready");
      return;
    }
    setIndexStatus("loading");
    void fetch("/api/search-index")
      .then(async (res) => {
        if (!res.ok) throw new Error(`search-index ${res.status}`);
        const data = (await res.json()) as { items?: SearchableGameItem[] };
        setItems(Array.isArray(data.items) ? data.items : []);
        setIndexStatus("ready");
      })
      .catch(() => {
        setIndexStatus("error");
      });
  };

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
          onFocus={() => {
            setOpen(true);
            ensureIndex();
          }}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            ensureIndex();
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

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-slate-700 bg-slate-900/98 p-1.5 shadow-2xl backdrop-blur-md">
          {indexStatus === "loading" && (
            <p className="px-2.5 py-3 text-xs text-slate-400">Loading games…</p>
          )}
          {indexStatus === "error" && (
            <p className="px-2.5 py-3 text-xs text-rose-300">
              Search unavailable. Try again in a moment.
            </p>
          )}
          {indexStatus === "ready" && matches.length > 0 && (
            <>
              <div className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-slate-400 flex justify-between">
                <span>
                  {query.trim() ? "Matching Games" : "Popular Tracked Games"}
                </span>
                <span>Status & Score</span>
              </div>
              <ul className="divide-y divide-slate-800/60">
                {matches.map((item) => {
                  const meta = STATUS_META[item.status as GameStatusType];
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
                          priority
                          className="h-10 w-[86px] shrink-0 rounded-md object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-100">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            AppID {item.appid} · Last activity:{" "}
                            {item.lastUpdateLabel}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${meta.dotColor}`}
                            />
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
            </>
          )}
          {indexStatus === "ready" && matches.length === 0 && (
            <p className="px-2.5 py-3 text-xs text-slate-400">No matching games.</p>
          )}
        </div>
      )}
    </div>
  );
}
