import type { Metadata } from "next";
import Link from "next/link";
import { loadCatalog } from "../../lib/repository";
import { buildItemListJsonLd, SITE_URL } from "../../lib/seo";
import { GameCard } from "../../components/game-card";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Games That Left Steam Early Access (1.0 Graduation & Post-Launch Tracker)",
  description:
    "Track games that graduated from Steam Early Access to 1.0 release, including how many patches and updates the developer shipped after leaving Early Access.",
  alternates: {
    canonical: `${SITE_URL}/left-early-access`,
  },
};

export default async function LeftEarlyAccessPage() {
  const catalog = await loadCatalog();
  const graduated = catalog.games.filter((g) => g.status === "left_early_access");

  const schema = buildItemListJsonLd({
    title: "Games That Left Steam Early Access (1.0 Release Tracker)",
    description:
      "Games that removed the Early Access tag on Steam, audited for post-1.0 update support.",
    url: `${SITE_URL}/left-early-access`,
    games: graduated,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-wider text-sky-400 mb-2">
          1.0 Graduation & Post-Release Audit
        </p>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-50 mb-3">
          Games That Left Steam Early Access (1.0 Release Tracker)
        </h1>
        <p className="max-w-3xl text-sm sm:text-base text-slate-300 leading-relaxed">
          A frequent player concern is whether a studio genuinely completed its Early Access roadmap or simply slapped a &ldquo;1.0&rdquo; label on an unfinished game and walked away. We keep tracking every graduated title to measure its post-1.0 patch support. For graduations in the last year, see{" "}
          <Link href="/recently-left-early-access" className="text-sky-300 hover:underline">
            Recently Left Early Access
          </Link>
          .
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {graduated.map((game) => (
          <GameCard key={game.appid} game={game} />
        ))}
      </div>
    </div>
  );
}
