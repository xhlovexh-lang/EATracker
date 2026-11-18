"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { StillInEaListItem } from "../lib/longest-early-access";
import { formatDurationDays, formatUtcDate } from "../lib/status-engine";
import { RankingCover } from "./ranking-cover";
import { StatusBadge } from "./status-badge";

function StillInEaClientRow({
  game,
  rank,
}: {
  game: StillInEaListItem;
  rank: number;
}) {
  return (
    <tr className="hover:bg-slate-800/40 transition-colors align-top">
      <td className="py-3.5 px-4 font-mono text-slate-400">{rank}</td>
      <td className="py-3.5 px-4 font-semibold text-slate-100">
        <Link
          href={`/game/${game.slug}`}
          className="flex items-center gap-3 hover:text-emerald-400"
        >
          <RankingCover
            src={game.headerImage}
            className="hidden h-10 w-[86px] shrink-0 rounded-md object-cover sm:block"
          />
          <span>
            <span className="block">{game.name}</span>
            <span className="block text-[11px] font-normal text-slate-400">
              {game.developers.join(", ")}
            </span>
          </span>
        </Link>
        {game.statement && (
          <p className="mt-2 max-w-md text-[11px] font-normal leading-relaxed text-sky-200/90">
            Dev says &ldquo;{game.statement.quote}&rdquo; (
            {formatUtcDate(game.statement.date)},{" "}
            <a
              href={game.statement.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-sky-100"
            >
              source
            </a>
            )
          </p>
        )}
      </td>
      <td className="py-3.5 px-4 font-mono text-slate-300">
        {formatUtcDate(game.eaStartDate)}
      </td>
      <td className="py-3.5 px-4 font-semibold text-amber-300">
        {formatDurationDays(game.eaDurationDays)}{" "}
        <span className="text-xs font-normal text-slate-400">
          ({game.eaDurationDays?.toLocaleString()}d)
        </span>
      </td>
      <td className="py-3.5 px-4 text-slate-300">
        {formatUtcDate(game.lastPatchAt)}
      </td>
      <td className="py-3.5 px-4">
        <StatusBadge
          status={game.status}
          size="sm"
          label={game.statusShortLabel}
        />
      </td>
      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-200">
        {game.activityScore}/100
      </td>
    </tr>
  );
}

/**
 * Collapsed-by-default “Show all” for still-in-EA beyond the SSR Top-N.
 * Fetches the remainder only when the user expands the details element,
 * so the first HTML response does not embed hundreds of rows / images.
 */
export function StillInEaShowAll({
  totalCount,
  offset,
}: {
  totalCount: number;
  offset: number;
}) {
  const [games, setGames] = useState<StillInEaListItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRest = useCallback(async () => {
    if (games || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/longest-early-access/still-in-ea?offset=${offset}`
      );
      if (!res.ok) {
        throw new Error(`Failed to load ranking (${res.status})`);
      }
      const data = (await res.json()) as { games?: StillInEaListItem[] };
      setGames(Array.isArray(data.games) ? data.games : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ranking");
    } finally {
      setLoading(false);
    }
  }, [games, loading, offset]);

  return (
    <details
      className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40"
      onToggle={(event) => {
        if ((event.currentTarget as HTMLDetailsElement).open) {
          void loadRest();
        }
      }}
    >
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-200 hover:text-emerald-300">
        Show all tracked still-in-EA ({totalCount.toLocaleString()} games)
      </summary>
      <div className="overflow-x-auto border-t border-slate-800">
        {error && (
          <p className="px-4 py-6 text-sm text-rose-300" role="alert">
            {error}{" "}
            <button
              type="button"
              className="underline hover:text-rose-200"
              onClick={() => void loadRest()}
            >
              Retry
            </button>
          </p>
        )}
        {!error && loading && !games && (
          <p className="px-4 py-6 text-sm text-slate-400">Loading ranking…</p>
        )}
        {games && (
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-400">
              <tr>
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Game</th>
                <th className="py-3.5 px-4">EA Start</th>
                <th className="py-3.5 px-4">Time in EA</th>
                <th className="py-3.5 px-4">Last Patch</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {games.map((g, idx) => (
                <StillInEaClientRow
                  key={g.appid}
                  game={g}
                  rank={offset + idx + 1}
                />
              ))}
              {games.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    No additional still-in-Early-Access titles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </details>
  );
}
