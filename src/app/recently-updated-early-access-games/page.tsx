import type { Metadata } from "next";
import { getAllGames } from "../../lib/catalog";
import { buildItemListJsonLd, SITE_URL } from "../../lib/seo";
import { GameCard } from "../../components/game-card";

export const revalidate = 21600; // 6 hours ISR per Spec Section 7

export const metadata: Metadata = {
  title: "Recently Updated Steam Early Access Games (Active Dev Tracker)",
  description:
    "Discover Steam Early Access games that shipped verified patches, hotfixes, or depot build updates within the past 90 days.",
  alternates: {
    canonical: `${SITE_URL}/recently-updated-early-access-games`,
  },
};

export default function RecentlyUpdatedEarlyAccessPage() {
  const activeGames = getAllGames()
    .filter((g) => g.status === "active" || g.status === "slowing")
    .sort((a, b) => {
      const da = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
      const db = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
      return db - da;
    });

  const schema = buildItemListJsonLd({
    title: "Recently Updated Steam Early Access Games",
    description:
      "Steam Early Access games ranked by most recent patch note, developer announcement, or public build update.",
    url: `${SITE_URL}/recently-updated-early-access-games`,
    games: activeGames,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2">
          Refreshed Every 6 Hours · Active Development Feed
        </p>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-50 mb-3">
          Recently Updated Steam Early Access Games
        </h1>
        <p className="max-w-3xl text-sm sm:text-base text-slate-300 leading-relaxed">
          Looking for Early Access games with reliable developer cadence? Every title below has shipped verified patches or published official developer announcements recently.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {activeGames.map((game) => (
          <GameCard key={game.appid} game={game} />
        ))}
      </div>
    </div>
  );
}
