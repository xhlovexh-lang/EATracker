import Link from "next/link";
import type { GameRecord } from "../lib/catalog";
import { formatDurationDays, formatUtcDate } from "../lib/status-engine";
import { StatusBadge } from "./status-badge";
import { GameCover } from "./game-cover";
import { ExternalLink } from "lucide-react";

export function GameCard({ game }: { game: GameRecord }) {
  const priceDisplay = game.isFree
    ? "Free"
    : game.priceCents
      ? `$${(game.priceCents / 100).toFixed(2)}`
      : "—";

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-xl border border-slate-800/90 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900 transition-all">
      <Link href={`/game/${game.slug}`} aria-label={`${game.name} header image`} className="block bg-slate-950">
        <GameCover
          src={game.headerImage}
          alt={`${game.name} header`}
          width={460}
          height={215}
          className="aspect-[460/215] w-full object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col justify-between p-4">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <Link
            href={`/game/${game.slug}`}
            className="text-base font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1"
          >
            {game.name}
          </Link>
          <StatusBadge status={game.status} size="sm" />
        </div>

        <p className="text-xs text-slate-300 mb-3 line-clamp-2 leading-relaxed">
          {game.verdictSummary}
        </p>
      </div>

      <div>
        <dl className="grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-3 text-xs">
          <div>
            <dt className="text-slate-400">Last Activity</dt>
            <dd className="font-medium text-slate-200 mt-0.5">
              {formatUtcDate(game.lastActivityAt ?? game.lastPatchAt)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">EA Duration</dt>
            <dd className="font-medium text-slate-200 mt-0.5">
              {formatDurationDays(game.eaDurationDays)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Activity Score</dt>
            <dd className="font-mono font-semibold text-slate-200 mt-0.5">
              {game.activityScore}/100
            </dd>
          </div>
        </dl>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/50 pt-2.5">
          <span>
            {game.developers[0] || "Indie Studio"} · {priceDisplay}
          </span>
          <div className="flex items-center gap-3">
            <Link
              href={`/game/${game.slug}`}
              className="font-medium text-emerald-400 hover:underline"
            >
              Audit Report →
            </Link>
            <a
              href={`https://store.steampowered.com/app/${game.appid}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-slate-400 hover:text-slate-200"
              title={`View ${game.name} on Steam Store`}
            >
              Steam <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
      </div>
    </article>
  );
}
