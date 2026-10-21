import type { Metadata } from "next";
import Link from "next/link";
import { loadCatalog } from "../../lib/repository";
import { buildItemListJsonLd, SITE_URL } from "../../lib/seo";
import { GameCard } from "../../components/game-card";
import { formatUtcDate } from "../../lib/status-engine";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Recently Left Early Access — Steam 1.0 Graduations",
  description:
    "Games that recently removed Steam Early Access (genre 70) and graduated to 1.0, sorted by leave date, with post-1.0 patch tracking.",
  alternates: {
    canonical: `${SITE_URL}/recently-left-early-access`,
  },
};

const RECENT_DAYS = 365;

export default async function RecentlyLeftEarlyAccessPage() {
  const catalog = await loadCatalog();
  const cutoff = Date.now() - RECENT_DAYS * 86400_000;

  const recentlyLeft = catalog.games
    .filter((g) => {
      if (g.isEarlyAccess) return false;
      if (!g.leftEaAt && g.status !== "left_early_access") return false;
      const leftAt = g.leftEaAt ? new Date(g.leftEaAt).getTime() : 0;
      return leftAt >= cutoff || (!g.leftEaAt && g.status === "left_early_access");
    })
    .sort((a, b) => {
      const aTime = a.leftEaAt ? new Date(a.leftEaAt).getTime() : 0;
      const bTime = b.leftEaAt ? new Date(b.leftEaAt).getTime() : 0;
      return bTime - aTime;
    });

  const schema = buildItemListJsonLd({
    title: "Recently Left Early Access — Steam 1.0 Graduations",
    description: `Games that left Steam Early Access in the last ${RECENT_DAYS} days.`,
    url: `${SITE_URL}/recently-left-early-access`,
    games: recentlyLeft,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-wider text-sky-400 mb-2">
          Recent 1.0 Graduations
        </p>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-50 mb-3">
          Recently Left Early Access
        </h1>
        <p className="max-w-3xl text-sm sm:text-base text-slate-300 leading-relaxed">
          Titles that dropped Steam genre 70 (Early Access) within the last {RECENT_DAYS}{" "}
          days. We keep tracking post-1.0 patches so you can see whether graduation came with
          ongoing support. For the full historical list, see{" "}
          <Link href="/left-early-access" className="text-sky-300 hover:underline">
            Games That Left Early Access
          </Link>
          .
        </p>
        <p className="mt-2 font-mono text-xs text-slate-400">
          {recentlyLeft.length} graduation{recentlyLeft.length === 1 ? "" : "s"}
        </p>
      </div>

      {recentlyLeft.length === 0 ? (
        <p className="text-sm text-slate-400">
          No recent graduations in the current catalog window. Check{" "}
          <Link href="/left-early-access" className="text-sky-300 hover:underline">
            /left-early-access
          </Link>{" "}
          for the full list.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {recentlyLeft.map((game) => (
            <div key={game.appid} className="space-y-1">
              <GameCard game={game} />
              <p className="px-1 text-[11px] text-sky-300/90">
                Left EA: {formatUtcDate(game.leftEaAt)} · {game.post10Patches} post-1.0
                patch{game.post10Patches === 1 ? "" : "es"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
