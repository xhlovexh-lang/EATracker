import type { Metadata } from "next";
import Link from "next/link";
import { loadCatalog } from "../../lib/repository";
import { buildItemListJsonLd, SITE_URL } from "../../lib/seo";
import {
  formatDurationDays,
  formatUtcDate,
} from "../../lib/status-engine";
import { MIN_GAMES_FOR_LEFT_EA_INDEX } from "../../config/discovery";
import type { GameRecord } from "../../lib/catalog";

export const revalidate = 86400;

function post10Status(game: GameRecord): string {
  if (game.post10Patches <= 0) return "No post-1.0 patches recorded";
  if (game.status === "left_early_access") {
    // Re-score post-1.0 cadence from lastShipAt relative to now via activity fields.
    if (game.patches12m >= 3) return "Active";
    if (game.patches12m >= 1) return "Slowing after 1.0";
    return "Slowing after 1.0";
  }
  return game.status === "active" ? "Active" : "Slowing after 1.0";
}

function eaDays(game: GameRecord): number | null {
  if (game.eaDurationDays != null) return game.eaDurationDays;
  if (!game.eaStartDate || !game.leftEaAt) return null;
  const start = new Date(game.eaStartDate).getTime();
  const end = new Date(game.leftEaAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.floor((end - start) / (24 * 3600 * 1000));
}

/** Brief #7: this page lists 2026 Early Access graduations only. */
function leftEaIn2026(game: GameRecord): boolean {
  return Boolean(game.leftEaAt?.startsWith("2026-"));
}

function listLeftEa2026(games: GameRecord[]): GameRecord[] {
  return games
    .filter((g) => (g.status === "left_early_access" || Boolean(g.leftEaAt)) && leftEaIn2026(g))
    .sort((a, b) => (b.leftEaAt ?? "").localeCompare(a.leftEaAt ?? ""));
}

export async function generateMetadata(): Promise<Metadata> {
  const catalog = await loadCatalog();
  const graduated = listLeftEa2026(catalog.games);
  const indexable = graduated.length >= MIN_GAMES_FOR_LEFT_EA_INDEX;

  return {
    title: "Games That Left Steam Early Access in 2026 (Updated Daily)",
    description:
      "Steam games that dropped the Early Access tag in 2026, with release date and whether developers kept updating after 1.0. Of the games we track.",
    alternates: {
      canonical: `${SITE_URL}/left-early-access`,
    },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default async function LeftEarlyAccessPage() {
  const catalog = await loadCatalog();
  const graduated = listLeftEa2026(catalog.games);

  const schema = buildItemListJsonLd({
    title: "Games That Left Steam Early Access in 2026 (Updated Daily)",
    description:
      "Of the games EA Tracker follows, titles that left Steam Early Access in 2026, with 1.0 date and post-1.0 update counts.",
    url: `${SITE_URL}/left-early-access`,
    games: graduated,
  });

  const shortAnswer = `Of the ${catalog.gameCount.toLocaleString()} games EA Tracker follows, these left Steam Early Access in 2026. For each one we show the 1.0 date, how long it spent in Early Access, and how many updates it has shipped since 1.0, based on public Steam announcements.`;

  const faqs = [
    {
      q: "Do games still get updates after leaving Early Access?",
      a: `Of the ${graduated.length} graduated titles we list here, ${
        graduated.filter((g) => g.post10Patches > 0).length
      } have at least one post-1.0 patch or update announcement on Steam. Counts come only from games we track.`,
    },
    {
      q: "What's the difference between leaving Early Access and being abandoned in Early Access?",
      a: "Leaving Early Access means Steam removed the Early Access genre tag (usually at a 1.0 release). Being classified as likely abandoned means a game still in Early Access has had no public Steam patch, build, or developer announcement for over 365 days. These are different signals.",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-wider text-sky-400 mb-2">
          1.0 Graduation · Updated Daily
          {graduated.length < MIN_GAMES_FOR_LEFT_EA_INDEX
            ? ` · noindex (under ${MIN_GAMES_FOR_LEFT_EA_INDEX} games)`
            : ""}
        </p>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-50 mb-3">
          Games That Left Steam Early Access in 2026 (Updated Daily)
        </h1>
        <p className="max-w-3xl text-sm sm:text-base text-slate-300 leading-relaxed mb-4">
          {shortAnswer}
        </p>
        <p className="max-w-3xl text-xs text-slate-400 leading-relaxed">
          For graduations in the last year, see{" "}
          <Link href="/recently-left-early-access" className="text-sky-300 hover:underline">
            Recently Left Early Access
          </Link>
          .
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 mb-10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Game</th>
              <th className="px-4 py-3 font-medium">EA start</th>
              <th className="px-4 py-3 font-medium">1.0 date</th>
              <th className="px-4 py-3 font-medium">Time in EA</th>
              <th className="px-4 py-3 font-medium">Updates since 1.0</th>
              <th className="px-4 py-3 font-medium">Post-1.0 status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {graduated.map((game) => (
              <tr key={game.appid} className="bg-slate-950/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/game/${game.slug}`}
                    className="font-medium text-slate-100 hover:text-emerald-300"
                  >
                    {game.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                  {formatUtcDate(game.eaStartDate)}
                </td>
                <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                  {formatUtcDate(game.leftEaAt)}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {formatDurationDays(eaDays(game))}
                </td>
                <td className="px-4 py-3 text-slate-300">{game.post10Patches}</td>
                <td className="px-4 py-3 text-slate-300">{post10Status(game)}</td>
              </tr>
            ))}
            {graduated.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No graduated titles in the current catalog yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-base font-semibold text-slate-100 mb-4">FAQ</h2>
        <dl className="space-y-4">
          {faqs.map((item) => (
            <div key={item.q}>
              <dt className="text-sm font-semibold text-slate-100">{item.q}</dt>
              <dd className="mt-1.5 text-sm text-slate-300 leading-relaxed">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
