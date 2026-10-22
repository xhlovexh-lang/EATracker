/**
 * Demo/fake `/game/[slug]` URLs that shipped with the hardcoded SEED_GAMES catalog.
 * Kept so crawlers and old links get a proper 301/410 instead of a soft 404.
 *
 * Real titles resolve by Steam appid against the live catalog (Neon or JSON),
 * so once the crawler inserts the game the redirect targets the real slug page.
 * Invented titles are permanently gone (HTTP 410 via middleware).
 */

export type LegacyRealGameSlug = {
  kind: "real";
  /** Canonical Steam AppID for this demo slug. */
  appid: number;
  /** Genre hub (or `/`) when the appid is not in the catalog yet. */
  fallbackPath: string;
};

export type LegacyGoneSlug = {
  kind: "gone";
};

export type LegacySlugEntry = LegacyRealGameSlug | LegacyGoneSlug;

/** Real Steam games that used demo slugs / invented subtitles in SEED_GAMES. */
export const LEGACY_REAL_GAME_SLUGS: Record<string, LegacyRealGameSlug> = {
  "manor-lords": {
    kind: "real",
    appid: 1363080,
    fallbackPath: "/genre/strategy",
  },
  "icarus-first-cohort": {
    kind: "real",
    appid: 1149460,
    fallbackPath: "/genre/survival",
  },
  valheim: {
    kind: "real",
    appid: 892970,
    fallbackPath: "/genre/survival",
  },
  enshrouded: {
    kind: "real",
    appid: 1203620,
    fallbackPath: "/genre/survival",
  },
};

/**
 * Clearly invented demo titles (names/slugs that never matched a real Steam page
 * under that URL). Served as HTTP 410 Gone.
 */
export const LEGACY_GONE_SLUGS: ReadonlySet<string> = new Set([
  "7-days-survival-sandbox",
  "deep-rock-galactic-rogue-core",
  "starsector-frontier-protocol",
  "dead-matter-quarantine-zone",
  "subterranean-tactics",
  "echoes-of-new-fortune",
  "scrap-mechanic-lost-colony",
  "outpost-zero-colonization",
  "void-salvage-protocol",
  "chrono-forged-aether-realms",
]);

export function getLegacySlugEntry(slug: string): LegacySlugEntry | null {
  const real = LEGACY_REAL_GAME_SLUGS[slug];
  if (real) return real;
  if (LEGACY_GONE_SLUGS.has(slug)) return { kind: "gone" };
  return null;
}

export function isLegacyGoneSlug(slug: string): boolean {
  return LEGACY_GONE_SLUGS.has(slug);
}
