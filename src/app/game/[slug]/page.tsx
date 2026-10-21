import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Cpu,
  MessageSquare,
  HelpCircle,
  Flag,
} from "lucide-react";
import {
  getAllGames,
  getDeveloperStatement,
  getGameBySlug,
  getSimilarActiveGames,
  isKnownGenreSlug,
  resolvePrimaryGenre,
} from "../../../lib/catalog";
import {
  buildGameFaqItems,
  buildGameJsonLd,
  buildGameSeoMeta,
} from "../../../lib/seo";
import { formatDurationDays, formatUtcDate } from "../../../lib/status-engine";
import { STATUS_META } from "../../../config/status";
import { StatusBadge } from "../../../components/status-badge";
import { GameCover } from "../../../components/game-cover";
import { UpdateTimelineChart } from "../../../components/update-timeline-chart";
import { GameCard } from "../../../components/game-card";

export const revalidate = 86400; // 24h ISR + on-demand revalidation via /api/revalidate

export async function generateStaticParams() {
  return getAllGames().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { game } = getGameBySlug(slug);
  if (!game) {
    return {
      title: "Game Not Found",
      robots: { index: false, follow: false },
    };
  }

  const seo = buildGameSeoMeta(game);

  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: {
      canonical: seo.canonical,
    },
    robots: game.indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: seo.canonical,
      type: "article",
      images: game.headerImage ? [{ url: game.headerImage }] : undefined,
    },
  };
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { game, redirectToSlug } = getGameBySlug(slug);

  if (redirectToSlug && redirectToSlug !== slug) {
    permanentRedirect(`/game/${redirectToSlug}`);
  }

  if (!game) {
    notFound();
  }

  const schemas = buildGameJsonLd(game);
  const faqs = buildGameFaqItems(game);
  const similarActive = getSimilarActiveGames(game, 6);
  const statusMeta = STATUS_META[game.status];
  const primaryGenre = resolvePrimaryGenre(game);
  const developerStatement = getDeveloperStatement(game);
  const genreTags = game.tags.filter((tag) => isKnownGenreSlug(tag));

  const positivePct =
    game.totalReviews > 0
      ? Math.round((game.totalPositive / game.totalReviews) * 100)
      : 0;

  const priceDisplay = game.isFree
    ? "Free to Play"
    : game.priceCents
      ? `$${(game.priceCents / 100).toFixed(2)} USD`
      : "—";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      {/* Structured Data: VideoGame + FAQPage + BreadcrumbList (No aggregateRating) */}
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 text-xs text-slate-400"
      >
        <Link href="/" className="hover:text-slate-200">
          Home
        </Link>
        <span>/</span>
        {primaryGenre ? (
          <Link
            href={`/genre/${primaryGenre.slug}`}
            className="hover:text-slate-200"
          >
            {primaryGenre.name}
          </Link>
        ) : (
          <Link
            href="/abandoned-early-access-games"
            className="hover:text-slate-200"
          >
            Abandoned Early Access Games
          </Link>
        )}
        <span>/</span>
        <span className="text-slate-200 font-medium truncate">{game.name}</span>
      </nav>

      {/* Delisted Banner (Spec Section 8.5) */}
      {game.delisted && (
        <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-sm text-amber-200">
          <strong>Notice:</strong> This title is no longer available for purchase on the Steam store. Historical update records are preserved below.
        </div>
      )}

      {/* 1. Header Section: Steam Header Image + Title + Studio + Price + View on Steam (Spec 8.1.1) */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7 mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-full md:w-72 shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
            <GameCover
              src={game.headerImage}
              alt={`${game.name} Steam header capsule`}
              width={460}
              height={215}
              className="aspect-[460/215] w-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-2">
              <span className="font-mono">Steam AppID #{game.appid}</span>
              <span>·</span>
              <span>Developer: {game.developers.join(", ") || "Unknown"}</span>
              <span>·</span>
              <span>Publisher: {game.publishers.join(", ") || "Self-published"}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-50 mb-3">
              Is {game.name} Abandoned?
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              {game.shortDescription}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`https://store.steampowered.com/app/${game.appid}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-white transition-colors"
              >
                View on Steam Store ({priceDisplay})
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              {genreTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/genre/${tag.toLowerCase()}`}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-xs text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300 capitalize"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. First-Screen Verdict Card + Status Badge (Spec 8.1.2 & GEO Direct Answer Box) */}
      <section
        aria-label="Abandonment Status Verdict"
        className={`rounded-2xl border p-5 sm:p-6 mb-6 ${statusMeta.badgeBg} ${statusMeta.badgeBorder}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <StatusBadge status={game.status} size="lg" />
            <span className="font-mono text-xs sm:text-sm font-semibold text-slate-200 bg-slate-950/60 px-3 py-1 rounded-full border border-slate-800">
              Activity Score: {game.activityScore} / 100
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Verified UTC · Updated Daily
          </span>
        </div>

        {/* First paragraph conclusion sentence for Google Featured Snippet & AI Overview citation */}
        <p className="text-base sm:text-lg font-semibold text-slate-100 leading-snug">
          {game.verdictSummary}
        </p>

        {game.status === "likely_abandoned" && (
          <p className="mt-2.5 text-xs text-rose-200/90 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Based on Steam activity only. Some developers post updates elsewhere.
          </p>
        )}

        {game.externalUpdatesUrl && (
          <p className="mt-2.5 text-xs text-emerald-300">
            Developer verified external updates channel:{" "}
            <a
              href={game.externalUpdatesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {game.externalUpdatesUrl}
            </a>
          </p>
        )}
      </section>

      {developerStatement && (
        <section
          aria-label="Developer statement"
          className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-5 sm:p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-sky-300" />
            <h2 className="text-base font-semibold text-slate-100">
              Developer statement
            </h2>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">
            {developerStatement.summary}{" "}
            <span className="text-slate-400">
              ({formatUtcDate(developerStatement.date)})
            </span>
          </p>
          <a
            href={developerStatement.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-sky-300 hover:underline"
          >
            Read &ldquo;{developerStatement.title}&rdquo; on Steam
            <ExternalLink className="h-3 w-3" />
          </a>
        </section>
      )}

      {/* 3. Key Metric Cards & Structured Entity Fact Sheet Table (Spec 8.1.3 + GEO Optimization) */}
      <section className="mb-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 mb-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>{game.isEarlyAccess ? "In Early Access" : "EA Duration"}</span>
            </div>
            <p className="mt-1.5 text-sm font-bold text-slate-100">
              {formatDurationDays(game.eaDurationDays)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Since {formatUtcDate(game.eaStartDate)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              <span>Last Patch</span>
            </div>
            <p className="mt-1.5 text-sm font-bold text-slate-100">
              {formatUtcDate(game.lastPatchAt)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Official patchnotes
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
              <span>Last Dev Post</span>
            </div>
            <p className="mt-1.5 text-sm font-bold text-slate-100">
              {formatUtcDate(game.lastDevPostAt)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Community feed
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Cpu className="h-3.5 w-3.5 text-purple-400" />
              <span>Last Build Update</span>
            </div>
            <p className="mt-1.5 text-sm font-bold text-slate-100">
              {game.lastBuildAt ? formatUtcDate(game.lastBuildAt) : "Not recorded"}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              via steamcmd.net
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Updates (Last 12m)</span>
            </div>
            <p className="mt-1.5 text-sm font-bold text-slate-100">
              {game.patches12m} patches · {game.posts12m} posts
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Past 365 days
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Steam Reviews</span>
            </div>
            <p className="mt-1.5 text-sm font-bold text-slate-100">
              {game.reviewScoreDesc} ({positivePct}%)
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {game.totalReviews.toLocaleString()} reviews
            </p>
          </div>
        </div>
      </section>

      {/* 4. "Why this status?" Signals & Dates Breakdown (Spec 8.1.4) */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 mb-8">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-base font-semibold text-slate-100">
            Why This Status? (Deterministic Signal Audit)
          </h2>
          <Link
            href="/methodology"
            className="text-xs text-emerald-400 hover:underline"
          >
            View full rule thresholds →
          </Link>
        </div>
        <ul className="space-y-2.5 text-sm text-slate-200">
          {game.reasons.map((r, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span>{r.label}</span>
                {r.date && (
                  <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-slate-300">
                    Signal Date: {r.date}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 5. 36-Month Update Timeline Chart (Spec 8.1.5) */}
      <section className="mb-8">
        <UpdateTimelineChart
          bins={game.monthlyTimeline}
          gameName={game.name}
        />
      </section>

      {/* 6. Recent Developer Announcements (Up to 10 items, excerpt <=300 chars, link to Steam) (Spec 8.1.6) */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Recent Official Developer Announcements
            </h2>
            <p className="text-xs text-slate-400">
              Filtered strictly to official Steam Community Announcements (feed_type = 1), excluding third-party press articles.
            </p>
          </div>
        </div>

        {game.announcements.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">
            No developer announcements found in the `steam_community_announcements` feed.
          </p>
        ) : (
          <div className="divide-y divide-slate-800">
            {game.announcements.slice(0, 10).map((item) => (
              <article key={item.gid} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">
                      {formatUtcDate(item.date)}
                    </span>
                    {item.isPatch && (
                      <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-300">
                        Patchnotes
                      </span>
                    )}
                    {!item.isPatch && item.isPatchHeuristic && (
                      <span className="rounded bg-teal-500/15 border border-teal-500/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-teal-300">
                        Update / Changelog
                      </span>
                    )}
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:underline"
                  >
                    Read full post on Steam <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <h3 className="text-sm font-semibold text-slate-100 mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.excerpt}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 7. Automated FAQ Section + FAQPage Schema (Spec 8.1.7) */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="h-4 w-4 text-emerald-400" />
          <h2 className="text-base font-semibold text-slate-100">
            Frequently Asked Questions About {game.name}
          </h2>
        </div>
        <dl className="space-y-4 divide-y divide-slate-800/80">
          {faqs.map((faq, idx) => (
            <div key={idx} className="pt-4 first:pt-0">
              <dt className="text-sm font-semibold text-slate-100">
                {faq.question}
              </dt>
              <dd className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 8. Similar Early Access Games That Are Still Active (Spec 8.1.8 & Section 12 Monetization safety) */}
      {similarActive.length > 0 && (
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-100">
              Similar Early Access Games That Are Still Active
            </h2>
            <p className="text-xs text-slate-400">
              Looking for actively maintained alternatives in{" "}
              {game.genres.slice(0, 2).join(" & ")}? These titles shipped verified updates within the last 90 days.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {similarActive.map((sim) => (
              <GameCard key={sim.appid} game={sim} />
            ))}
          </div>
        </section>
      )}

      {/* 9. Disclaimer & Developer Correction Callout (Spec 8.1.9) */}
      <section className="rounded-xl border border-slate-800/80 bg-slate-950 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
        <p>
          Status is calculated automatically from public Steam data (Community Announcements &amp; Steam PICS depot timestamps).
        </p>
        <Link
          href={`/report?appid=${game.appid}&game=${encodeURIComponent(game.name)}`}
          className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-medium text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors"
        >
          <Flag className="h-3.5 w-3.5 text-emerald-400" />
          Developer? Report incorrect data
        </Link>
      </section>
    </div>
  );
}
