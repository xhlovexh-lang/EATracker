/**
 * Demo/fake `/game/[slug]` URLs that shipped with the hardcoded SEED_GAMES catalog.
 * Kept so crawlers and old links get a proper 301/410 instead of a soft 404.
 *
 * Real titles resolve by Steam appid against the live catalog (Neon or JSON),
 * so once the crawler inserts the game the redirect targets the real slug page.
 * Invented titles (wrong appid / no real equivalent) are HTTP 410 via proxy.
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

/** Demo slugs that map to a real Steam appid (301 → current `/game/{slug}`). */
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
  /** Fake demo slug → real 7 Days to Die page. */
  "7-days-survival-sandbox": {
    kind: "real",
    appid: 251570,
    fallbackPath: "/left-early-access",
  },
  /** Fake "Starsector…" title sat on KSP2's appid. */
  "starsector-frontier-protocol": {
    kind: "real",
    appid: 954850,
    fallbackPath: "/",
  },
  "deep-rock-galactic-rogue-core": {
    kind: "real",
    appid: 548430,
    fallbackPath: "/left-early-access",
  },
  "subterranean-tactics": {
    kind: "real",
    appid: 1621690,
    fallbackPath: "/left-early-access",
  },
  "scrap-mechanic-lost-colony": {
    kind: "real",
    appid: 387990,
    fallbackPath: "/left-early-access",
  },
};

/**
 * Invented demo titles whose seed appids pointed at unrelated Steam games
 * (or no game). Served as HTTP 410 Gone.
 */
export const LEGACY_GONE_SLUGS: ReadonlySet<string> = new Set([
  "dead-matter-quarantine-zone",
  "echoes-of-new-fortune",
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
