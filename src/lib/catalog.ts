import type { GameStatusType } from "../config/status";
import type { StatusReason } from "../db/schema";
import { evaluateGameStatus } from "./status-engine";
import { GENRE_PAGE_INTROS } from "./genre-intros";
import importedGames from "../../data/imported-games.json";

export interface MonthlyActivityBin {
  month: string; // YYYY-MM
  label: string; // e.g., "Oct 26"
  patches: number;
  posts: number;
}

export interface GameAnnouncement {
  gid: string;
  title: string;
  url: string;
  date: string; // ISO string
  tags: string[];
  isPatch: boolean;
  isPatchHeuristic: boolean;
  excerpt: string;
}

export interface GameRecord {
  appid: number;
  name: string;
  slug: string;
  developers: string[];
  publishers: string[];
  genres: string[];
  tags: string[];
  isFree: boolean;
  priceCents: number | null;
  currency: string;
  headerImage: string;
  shortDescription: string;
  isEarlyAccess: boolean;
  eaStartDate: string | null;
  leftEaAt: string | null;
  reviewScoreDesc: string;
  totalPositive: number;
  totalNegative: number;
  totalReviews: number;
  adult: boolean;
  delisted: boolean;
  externalUpdatesUrl: string | null;
  status: GameStatusType;
  activityScore: number;
  lastPatchAt: string | null;
  lastDevPostAt: string | null;
  lastBuildAt: string | null;
  lastActivityAt: string | null;
  lastShipAt: string | null;
  posts12m: number;
  patches12m: number;
  post10Patches: number;
  eaDurationDays: number | null;
  reasons: StatusReason[];
  indexable: boolean;
  verdictSummary: string;
  statusChangedAt: string;
  announcements: GameAnnouncement[];
  monthlyTimeline: MonthlyActivityBin[];
}

function generate36MonthTimeline(
  announcements: GameAnnouncement[],
  refDate = new Date("2026-10-19T00:00:00Z")
): MonthlyActivityBin[] {
  const bins: MonthlyActivityBin[] = [];
  const map = new Map<string, { patches: number; posts: number }>();

  for (let i = 35; i >= 0; i--) {
    const d = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth() - i, 1));
    const ym = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    });
    bins.push({ month: ym, label, patches: 0, posts: 0 });
    map.set(ym, bins[bins.length - 1]);
  }

  for (const a of announcements) {
    const ym = a.date.slice(0, 7);
    const bin = map.get(ym);
    if (bin) {
      if (a.isPatch || a.isPatchHeuristic) {
        bin.patches += 1;
      } else {
        bin.posts += 1;
      }
    }
  }

  return bins;
}

function buildSeedGame(params: {
  appid: number;
  name: string;
  slug: string;
  developers: string[];
  publishers: string[];
  genres: string[];
  tags: string[];
  isFree?: boolean;
  priceCents: number | null;
  shortDescription: string;
  isEarlyAccess: boolean;
  eaStartDate: string | null;
  leftEaAt?: string | null;
  reviewScoreDesc: string;
  totalPositive: number;
  totalNegative: number;
  lastPatchAt: string | null;
  lastDevPostAt: string | null;
  lastBuildAt: string | null;
  posts12m: number;
  patches12m: number;
  post10Patches?: number;
  externalUpdatesUrl?: string | null;
  announcements: GameAnnouncement[];
}): GameRecord {
  const totalReviews = params.totalPositive + params.totalNegative;
  const evalResult = evaluateGameStatus({
    isEarlyAccessNow: params.isEarlyAccess,
    wasTrackedInEarlyAccess: true,
    eaStartDate: params.eaStartDate,
    leftEarlyAccessAt: params.leftEaAt ?? null,
    lastPatchAt: params.lastPatchAt ? new Date(params.lastPatchAt) : null,
    lastDevPostAt: params.lastDevPostAt ? new Date(params.lastDevPostAt) : null,
    lastBuildAt: params.lastBuildAt ? new Date(params.lastBuildAt) : null,
    posts12m: params.posts12m,
    patches12m: params.patches12m,
    post10Patches: params.post10Patches ?? 0,
    totalReviews,
    totalPosts: Math.max(params.announcements.length, 4),
    adult: false,
    delisted: false,
    externalUpdatesUrl: params.externalUpdatesUrl ?? null,
    now: new Date("2026-10-19T12:00:00Z"),
  });

  // Populate dense synthetic monthly history matching patches12m/posts12m so timeline is realistic
  const syntheticAnnouncements = [...params.announcements];
  const timeline = generate36MonthTimeline(syntheticAnnouncements);

  // Also distribute remaining 12m counts across recent 12 months of the chart for visual richness
  let remPatches = Math.max(0, params.patches12m - syntheticAnnouncements.filter((a) => a.isPatch).length);
  let remPosts = Math.max(0, params.posts12m - syntheticAnnouncements.length);
  for (let idx = timeline.length - 1; idx >= timeline.length - 12 && idx >= 0; idx--) {
    if (remPatches > 0) {
      timeline[idx].patches += 1;
      remPatches--;
    }
    if (remPosts > 0 && idx % 2 === 0) {
      timeline[idx].posts += 1;
      remPosts--;
    }
  }

  return {
    appid: params.appid,
    name: params.name,
    slug: params.slug,
    developers: params.developers,
    publishers: params.publishers,
    genres: params.genres,
    tags: params.tags,
    isFree: params.isFree ?? false,
    priceCents: params.priceCents,
    currency: "USD",
    headerImage: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${params.appid}/header.jpg`,
    shortDescription: params.shortDescription,
    isEarlyAccess: params.isEarlyAccess,
    eaStartDate: params.eaStartDate,
    leftEaAt: params.leftEaAt ?? null,
    reviewScoreDesc: params.reviewScoreDesc,
    totalPositive: params.totalPositive,
    totalNegative: params.totalNegative,
    totalReviews,
    adult: false,
    delisted: false,
    externalUpdatesUrl: params.externalUpdatesUrl ?? null,
    status: evalResult.status,
    activityScore: evalResult.activityScore,
    lastPatchAt: params.lastPatchAt,
    lastDevPostAt: params.lastDevPostAt,
    lastBuildAt: params.lastBuildAt,
    lastActivityAt: evalResult.lastActivityAt?.toISOString() ?? null,
    lastShipAt: evalResult.lastShipAt?.toISOString() ?? null,
    posts12m: params.posts12m,
    patches12m: params.patches12m,
    post10Patches: params.post10Patches ?? 0,
    eaDurationDays: evalResult.eaDurationDays,
    reasons: evalResult.reasons,
    indexable: evalResult.indexable,
    verdictSummary: evalResult.verdictSummary,
    statusChangedAt: evalResult.lastActivityAt?.toISOString() ?? "2026-10-01T00:00:00Z",
    announcements: params.announcements,
    monthlyTimeline: timeline,
  };
}

export const SEED_GAMES: GameRecord[] = [
  buildSeedGame({
    appid: 1363080,
    name: "Manor Lords",
    slug: "manor-lords",
    developers: ["Slavic Magic"],
    publishers: ["Hooded Horse"],
    genres: ["Strategy", "Simulation", "City Builder", "Early Access"],
    tags: ["strategy", "city-builder", "simulation", "medieval"],
    priceCents: 3999,
    shortDescription:
      "Manor Lords is a medieval strategy game featuring in-depth city building, large-scale tactical battles, and complex economic and social simulations.",
    isEarlyAccess: true,
    eaStartDate: "2024-04-26",
    reviewScoreDesc: "Very Positive",
    totalPositive: 56200,
    totalNegative: 6800,
    lastPatchAt: "2026-09-18T14:00:00Z",
    lastDevPostAt: "2026-10-04T11:30:00Z",
    lastBuildAt: "2026-09-29T16:20:00Z",
    posts12m: 16,
    patches12m: 9,
    announcements: [
      {
        gid: "ml-101",
        title: "Development Update: Fortifications, Butcheries & Unreal Engine 5 Optimization",
        url: "https://store.steampowered.com/news/app/1363080",
        date: "2026-10-04T11:30:00Z",
        tags: ["announcement"],
        isPatch: false,
        isPatchHeuristic: false,
        excerpt:
          "Sharing our current progress on stone castle walls, town guard patrols, and upcoming AI diplomacy tweaks scheduled for the next beta branch.",
      },
      {
        gid: "ml-100",
        title: "Patch 0.8.045 - Crossbows, Fishing Ponds & Trade Route Fixes",
        url: "https://store.steampowered.com/news/app/1363080",
        date: "2026-09-18T14:00:00Z",
        tags: ["patchnotes"],
        isPatch: true,
        isPatchHeuristic: true,
        excerpt:
          "Fixed trading post bottleneck when importing barley, added winter ice fishing mechanics, and rebalanced crossbow militia armor penetration.",
      },
      {
        gid: "ml-099",
        title: "Hotfix 0.8.032 - Crash Fixes and Granary Spoilage Balance",
        url: "https://store.steampowered.com/news/app/1363080",
        date: "2026-07-22T10:00:00Z",
        tags: ["patchnotes"],
        isPatch: true,
        isPatchHeuristic: true,
        excerpt:
          "Resolved an issue where granary workers stalled during heavy rain and adjusted spoilage rates for salt-cured meat.",
      },
    ],
  }),
  buildSeedGame({
    appid: 2694490,
    name: "Path of Exile 2",
    slug: "path-of-exile-2",
    developers: ["Grinding Gear Games"],
    publishers: ["Grinding Gear Games"],
    genres: ["Action", "RPG", "Massively Multiplayer", "Early Access"],
    tags: ["rpg", "action", "arpg", "co-op"],
    priceCents: 2999,
    shortDescription:
      "Path of Exile 2 is a next generation Action RPG from Grinding Gear Games, featuring co-op for up to six players and a brand-new skill gem system.",
    isEarlyAccess: true,
    eaStartDate: "2024-12-06",
    reviewScoreDesc: "Very Positive",
    totalPositive: 112400,
    totalNegative: 14900,
    lastPatchAt: "2026-10-12T21:00:00Z",
    lastDevPostAt: "2026-10-16T08:00:00Z",
    lastBuildAt: "2026-10-16T09:15:00Z",
    posts12m: 34,
    patches12m: 22,
    announcements: [
      {
        gid: "poe2-301",
        title: "Early Access Patch 0.4.2b Notes - Endgame Atlas & Boss Balance",
        url: "https://store.steampowered.com/news/app/2694490",
        date: "2026-10-12T21:00:00Z",
        tags: ["patchnotes"],
        isPatch: true,
        isPatchHeuristic: true,
        excerpt:
          "Adjusted pinnacle boss elemental resistance scaling, improved Waystone drop rates in Tier 14+ maps, and fixed Druid shapeshift animation cancels.",
      },
      {
        gid: "poe2-302",
        title: "Developer Q&A Recap: Act 5 Preview & Crafting Bench Changes",
        url: "https://store.steampowered.com/news/app/2694490",
        date: "2026-10-16T08:00:00Z",
        tags: ["announcement"],
        isPatch: false,
        isPatchHeuristic: false,
        excerpt:
          "Summary of this week's live Q&A covering upcoming ascendancy classes, gold respec cost reductions, and currency exchange improvements.",
      },
    ],
  }),
  buildSeedGame({
    appid: 1149460,
    name: "Icarus: First Cohort",
    slug: "icarus-first-cohort",
    developers: ["RocketWerkz"],
    publishers: ["RocketWerkz"],
    genres: ["Survival", "Adventure", "Simulation", "Early Access"],
    tags: ["survival", "crafting", "open-world", "co-op"],
    priceCents: 3499,
    shortDescription:
      "Session-based PvE survival game for up to eight co-op players or solo explorers on an alien terraforming prospect gone wrong.",
    isEarlyAccess: true,
    eaStartDate: "2023-08-14",
    reviewScoreDesc: "Mostly Positive",
    totalPositive: 28900,
    totalNegative: 9400,
    lastPatchAt: "2026-10-11T17:00:00Z",
    lastDevPostAt: "2026-10-11T17:00:00Z",
    lastBuildAt: "2026-10-12T02:00:00Z",
    posts12m: 24,
    patches12m: 20,
    announcements: [
      {
        gid: "ic-1",
        title: "Week 144 Update - Orbital Station Logistics & Exotic Mining",
        url: "https://store.steampowered.com/news/app/1149460",
        date: "2026-10-11T17:00:00Z",
        tags: ["patchnotes"],
        isPatch: true,
        isPatchHeuristic: true,
        excerpt:
          "Added automated deep-vein extractors and orbital workshop loadout presets.",
      },
    ],
  }),
  buildSeedGame({
    appid: 892970,
    name: "Valheim",
    slug: "valheim",
    developers: ["Iron Gate AB"],
    publishers: ["Coffee Stain Publishing"],
    genres: ["Survival", "Open World", "Adventure", "RPG", "Early Access"],
    tags: ["survival", "open-world", "crafting", "co-op"],
    priceCents: 1999,
    shortDescription:
      "A brutal exploration and survival game for 1-10 players, set in a procedurally-generated purgatory inspired by Viking culture.",
    isEarlyAccess: true,
    eaStartDate: "2021-02-02",
    reviewScoreDesc: "Overwhelmingly Positive",
    totalPositive: 412000,
    totalNegative: 21500,
    lastPatchAt: "2026-09-05T13:00:00Z",
    lastDevPostAt: "2026-10-08T14:00:00Z",
    lastBuildAt: "2026-09-19T10:10:00Z",
    posts12m: 11,
    patches12m: 6,
    announcements: [
      {
        gid: "vh-201",
        title: "Development Blog: Deep North Final Biome Architecture",
        url: "https://store.steampowered.com/news/app/892970",
        date: "2026-10-08T14:00:00Z",
        tags: ["announcement"],
        isPatch: false,
        isPatchHeuristic: false,
        excerpt:
          "A closer look at the aurora weather systems, frost fortresses, and how the Deep North ties into Valheim's 1.0 graduation milestone.",
      },
      {
        gid: "vh-200",
        title: "Patch 0.220.4 - Combat Stamina & Sailing Wind Improvements",
        url: "https://store.steampowered.com/news/app/892970",
        date: "2026-09-05T13:00:00Z",
        tags: ["patchnotes"],
        isPatch: true,
        isPatchHeuristic: true,
        excerpt:
          "Reduced uphill stamina drain in heavy armor and improved longship turn radius during coastal storms.",
      },
    ],
  }),
  buildSeedGame({
    appid: 108600,
    name: "Project Zomboid",
    slug: "project-zomboid",
    developers: ["The Indie Stone"],
    publishers: ["The Indie Stone"],
    genres: ["Survival", "Simulation", "RPG", "Indie", "Early Access"],
    tags: ["survival", "zombies", "sandbox", "simulation"],
    priceCents: 1999,
    shortDescription:
      "Project Zomboid is the ultimate in zombie survival. Alone or in MP: you loot, build, craft, fight, farm and fish in a struggle to survive.",
    isEarlyAccess: true,
    eaStartDate: "2013-11-08",
    reviewScoreDesc: "Very Positive",
    totalPositive: 254000,
    totalNegative: 16200,
    lastPatchAt: "2026-08-24T18:00:00Z",
    lastDevPostAt: "2026-09-28T19:00:00Z",
    lastBuildAt: "2026-09-30T15:40:00Z",
    posts12m: 12,
    patches12m: 7,
    announcements: [
      {
        gid: "pz-1",
        title: "Thursdoid #118: Build 42 Multiplayer Stress Testing & Crafting UI",
        url: "https://store.steampowered.com/news/app/108600",
        date: "2026-09-28T19:00:00Z",
        tags: ["announcement"],
        isPatch: false,
        isPatchHeuristic: false,
        excerpt:
          "Detailing animal husbandry network synchronization, blacksmithing stations, and server performance benchmarks.",
      },
      {
        gid: "pz-2",
        title: "Build 42.4 Public Beta Patch Notes",
        url: "https://store.steampowered.com/news/app/108600",
        date: "2026-08-24T18:00:00Z",
        tags: ["patchnotes"],
        isPatch: true,
        isPatchHeuristic: true,
        excerpt:
          "Overhauled basement generation lighting, bow hunting accuracy, and ragdoll physics.",
      },
    ],
  }),
  buildSeedGame({
    appid: 251570,
    name: "7 Days to Die (Legacy Mod Toolkit)",
    slug: "7-days-survival-sandbox",
    developers: ["The Fun Pimps"],
    publishers: ["The Fun Pimps Entertainment LLC"],
    genres: ["Survival", "Action", "RPG", "Early Access"],
    tags: ["survival", "zombies", "crafting", "open-world"],
    priceCents: 4499,
    shortDescription:
      "Open-world game that is a unique combination of first-person shooter, survival horror, tower defense, and role-playing games.",
    isEarlyAccess: false,
    eaStartDate: "2013-12-13",
    leftEaAt: "2024-07-25",
    reviewScoreDesc: "Very Positive",
    totalPositive: 221000,
    totalNegative: 31000,
    lastPatchAt: "2026-08-19T16:00:00Z",
    lastDevPostAt: "2026-09-12T16:00:00Z",
    lastBuildAt: "2026-09-01T12:00:00Z",
    posts12m: 9,
    patches12m: 5,
    post10Patches: 7,
    announcements: [
      {
        gid: "7d-1",
        title: "V1.4 Storm's Brewing Update Patch Notes",
        url: "https://store.steampowered.com/news/app/251570",
        date: "2026-08-19T16:00:00Z",
        tags: ["patchnotes"],
        isPatch: true,
        isPatchHeuristic: true,
        excerpt:
          "Introduced dynamic biome weather hazards, bandit camp encounters, and wardrobe armor overhaul.",
      },
    ],
  }),
  buildSeedGame({
    appid: 1203620,
    name: "Enshrouded",
    slug: "enshrouded",
    developers: ["Keen Games GmbH"],
    publishers: ["Keen Games GmbH"],
    genres: ["Survival", "Action", "RPG", "Adventure"],
    tags: ["survival", "rpg", "crafting", "open-world", "co-op"],
    priceCents: 2999,
    shortDescription:
      "You are Flameborn, last ember of hope of a dying race. Awaken, survive the terror of a corrupting fog, and reclaim the lost beauty of your kingdom.",
    isEarlyAccess: false,
    eaStartDate: "2024-01-24",
    leftEaAt: "2026-10-15",
    reviewScoreDesc: "Very Positive",
    totalPositive: 64500,
    totalNegative: 8900,
    lastPatchAt: "2026-10-15T15:00:00Z",
    lastDevPostAt: "2026-10-17T12:00:00Z",
    lastBuildAt: "2026-10-17T14:30:00Z",
    posts12m: 19,
    patches12m: 11,
    post10Patches: 2,
    announcements: [
      {
        gid: "en-102",
        title: "Hotfix 1.0.2 - Post-Launch Server Stability & Water Biome Shaders",
        url: "https://store.steampowered.com/news/app/1203620",
        date: "2026-10-17T12:00:00Z",
        tags: ["patchnotes"],
        isPatch: true,
        isPatchHeuristic: true,
        excerpt:
          "Addresses voxel water flow stuttering in 16-player co-op sessions and fixes quest progression in the Floating Isles.",
      },
      {
        gid: "en-101",
        title: "Enshrouded 1.0 Full Release - Leaving Early Access!",
        url: "https://store.steampowered.com/news/app/1203620",
        date: "2026-10-15T15:00:00Z",
        tags: ["patchnotes"],
        isPatch: true,
        isPatchHeuristic: true,
        excerpt:
          "After 32 months in Early Access and 7 major content expansions, Enshrouded 1.0 is now live with full realm water physics and endgame raids.",
      },
    ],
  }),
  buildSeedGame({
    appid: 548430,
    name: "Deep Rock Galactic: Rogue Core",
    slug: "deep-rock-galactic-rogue-core",
    developers: ["Ghost Ship Games"],
    publishers: ["Ghost Ship Publishing"],
    genres: ["Action", "Co-op", "FPS", "Roguelite", "Early Access"],
    tags: ["action", "roguelite", "co-op", "fps"],
    priceCents: 2999,
    shortDescription:
      "1-4 player co-op sci-fi action roguelite where elite dwarven Reclaimers dive into lost mining facilities on Hoxxes IV.",
    isEarlyAccess: true,
    eaStartDate: "2025-11-14",
    reviewScoreDesc: "Very Positive",
    totalPositive: 18400,
    totalNegative: 1900,
    lastPatchAt: "2026-05-28T13:00:00Z",
    lastDevPostAt: "2026-06-02T15:00:00Z",
    lastBuildAt: "2026-06-01T09:00:00Z",
    posts12m: 6,
    patches12m: 4,
    announcements: [
      {
        gid: "drg-1",
        title: "Season 02 Roadmap Delay & Summer Studio Schedule",
        url: "https://store.steampowered.com/news/app/548430",
        date: "2026-06-02T15:00:00Z",
        tags: ["announcement"],
        isPatch: false,
        isPatchHeuristic: false,
        excerpt:
          "We are restructuring the procedural core depth generator. Expect a quieter summer while we rebuild Phase 3 boss encounters.",
      },
      {
        gid: "drg-2",
        title: "Update 0.3.14 - Exosuit Overclock Balancing",
        url: "https://store.steampowered.com/news/app/548430",
        date: "2026-05-28T13:00:00Z",
        tags: ["patchnotes"],
        isPatch: true,
        isPatchHeuristic: true,
        excerpt:
          "Adjusted plasma cutter heat dissipation and fixed phase-drone pathfinding.",
      },
    ],
  }),
  buildSeedGame({
    appid: 954850,
    name: "Starsector Frontier Protocol",
    slug: "starsector-frontier-protocol",
    developers: ["Persean Sector Studios"],
    publishers: ["Persean Sector Studios"],
    genres: ["Space", "Strategy", "RPG", "Simulation", "Early Access"],
    tags: ["space", "strategy", "rpg", "simulation", "sandbox"],
    priceCents: 2499,
    shortDescription:
      "Open-world single-player space combat, fleet logistics, and planetary colony management in a fractured sector.",
    isEarlyAccess: true,
    eaStartDate: "2022-09-12",
    reviewScoreDesc: "Mostly Positive",
    totalPositive: 4120,
    totalNegative: 980,
    lastPatchAt: "2026-05-10T10:00:00Z",
    lastDevPostAt: "2026-05-19T18:00:00Z",
    lastBuildAt: "2026-05-14T11:20:00Z",
    posts12m: 4,
    patches12m: 2,
    announcements: [
      {
        gid: "sfp-1",
        title: "May Devlog: Hyperspace Storm Overhaul",
        url: "https://store.steampowered.com/news/app/954850",
        date: "2026-05-19T18:00:00Z",
        tags: ["announcement"],
        isPatch: false,
        isPatchHeuristic: false,
        excerpt:
          "Work continues on faction diplomacy wars and fleet supply consumption.",
      },
    ],
  }),
  buildSeedGame({
    appid: 1426210,
    name: "Dead Matter: Quarantine Zone",
    slug: "dead-matter-quarantine-zone",
    developers: ["Quantum Integrity Software"],
    publishers: ["Quantum Integrity Software"],
    genres: ["Survival", "Action", "Indie", "Early Access"],
    tags: ["survival", "zombies", "open-world"],
    priceCents: 2999,
    shortDescription:
      "Post-apocalyptic survival sandbox set in the Canadian Rockies after a viral outbreak.",
    isEarlyAccess: true,
    eaStartDate: "2023-07-21",
    reviewScoreDesc: "Mostly Negative",
    totalPositive: 890,
    totalNegative: 2450,
    lastPatchAt: "2025-07-04T12:00:00Z",
    lastDevPostAt: "2026-09-10T14:00:00Z",
    lastBuildAt: "2025-07-04T12:00:00Z",
    posts12m: 3,
    patches12m: 0,
    announcements: [
      {
        gid: "dm-2",
        title: "Studio Check-in: Engine Refactor Still Underway",
        url: "https://store.steampowered.com/news/app/1426210",
        date: "2026-09-10T14:00:00Z",
        tags: ["announcement"],
        isPatch: false,
        isPatchHeuristic: false,
        excerpt:
          "We know it has been over a year since our last public branch patch. Our small team is still working on netcode rewrites.",
      },
      {
        gid: "dm-1",
        title: "Patch 0.1.9 - Inventory Rewrite",
        url: "https://store.steampowered.com/news/app/1426210",
        date: "2025-07-04T12:00:00Z",
        tags: ["patchnotes"],
        isPatch: true,
        isPatchHeuristic: true,
        excerpt:
          "Updated container looting tables and fixed vehicle physics desync.",
      },
    ],
  }),
  buildSeedGame({
    appid: 1621690,
    name: "Core Keeper: Subterranean Tactics",
    slug: "subterranean-tactics",
    developers: ["Cavern Forge Interactive"],
    publishers: ["Cavern Forge Interactive"],
    genres: ["Strategy", "RPG", "Indie", "Early Access"],
    tags: ["strategy", "rpg", "roguelite", "sandbox"],
    priceCents: 1799,
    shortDescription:
      "Turn-based tactical subterranean expedition manager where you dig deep beneath collapsed dwarven citadels.",
    isEarlyAccess: true,
    eaStartDate: "2023-11-03",
    reviewScoreDesc: "Mixed",
    totalPositive: 620,
    totalNegative: 410,
    lastPatchAt: "2026-01-12T09:00:00Z",
    lastDevPostAt: "2026-03-03T16:00:00Z",
    lastBuildAt: "2026-01-14T11:00:00Z",
    posts12m: 2,
    patches12m: 1,
    announcements: [
      {
        gid: "st-1",
        title: "March Community Note: Looking at Next Milestone",
        url: "https://store.steampowered.com/news/app/1621690",
        date: "2026-03-03T16:00:00Z",
        tags: ["announcement"],
        isPatch: false,
        isPatchHeuristic: false,
        excerpt:
          "Thank you for your patience since the January patch. We will share more details when Act 2 is ready for testing.",
      },
      {
        gid: "st-2",
        title: "Patch 0.4.1 - Cavern Lighting & Mercenary Morale",
        url: "https://store.steampowered.com/news/app/1621690",
        date: "2026-01-12T09:00:00Z",
        tags: ["patchnotes"],
        isPatch: true,
        isPatchHeuristic: true,
        excerpt:
          "Fixed torch radius calculation and rebalanced deep-crawler ambush rates.",
      },
    ],
  }),
  buildSeedGame({
    appid: 1987420,
    name: "The Day Before: Echoes of New Fortune",
    slug: "echoes-of-new-fortune",
    developers: ["Vanguard Horizon Games"],
    publishers: ["Vanguard Horizon Games"],
    genres: ["Action", "Survival", "Adventure", "Early Access"],
    tags: ["survival", "action", "open-world", "zombies"],
    priceCents: 1999,
    shortDescription:
      "Open-world multiplayer survival extraction shooter set in a quarantined coastal metropolis.",
    isEarlyAccess: true,
    eaStartDate: "2023-04-11",
    reviewScoreDesc: "Mostly Negative",
    totalPositive: 1420,
    totalNegative: 3890,
    lastPatchAt: "2025-03-03T10:00:00Z",
    lastDevPostAt: "2025-03-03T10:00:00Z",
    lastBuildAt: "2025-03-04T08:15:00Z",
    posts12m: 0,
    patches12m: 0,
    announcements: [
      {
        gid: "enf-1",
        title: "Hotfix 0.2.4 - Server Disconnect Workaround",
        url: "https://store.steampowered.com/news/app/1987420",
        date: "2025-03-03T10:00:00Z",
        tags: ["patchnotes"],
        isPatch: true,
        isPatchHeuristic: true,
        excerpt:
          "Addressed lobby timeout errors when matching into District 4 extraction zones.",
      },
    ],
  }),
  buildSeedGame({
    appid: 387990,
    name: "Scrap Mechanic: Lost Colony",
    slug: "scrap-mechanic-lost-colony",
    developers: ["Axolot Bolt Studio"],
    publishers: ["Axolot Bolt Studio"],
    genres: ["Simulation", "Sandbox", "Survival", "Early Access"],
    tags: ["simulation", "sandbox", "survival", "crafting"],
    priceCents: 1999,
    shortDescription:
      "Creative multiplayer physics sandbox with engineering contraptions, logic gates, and automated agricultural bots.",
    isEarlyAccess: true,
    eaStartDate: "2016-01-20",
    reviewScoreDesc: "Mixed",
    totalPositive: 8900,
    totalNegative: 4200,
    lastPatchAt: "2024-06-18T14:00:00Z",
    lastDevPostAt: "2024-11-12T10:00:00Z",
    lastBuildAt: "2024-06-19T12:00:00Z",
    posts12m: 0,
    patches12m: 0,
    announcements: [
      {
        gid: "smlc-1",
        title: "Devblog 25: Underground Digging Preview",
        url: "https://store.steampowered.com/news/app/387990",
        date: "2024-11-12T10:00:00Z",
        tags: ["announcement"],
        isPatch: false,
        isPatchHeuristic: false,
        excerpt:
          "Showing concept art and early prototypes for subterranean drilling vehicles.",
      },
    ],
  }),
  buildSeedGame({
    appid: 296070,
    name: "Interstellar Rift: Outpost Zero",
    slug: "outpost-zero-colonization",
    developers: ["Paleon Planetary Works"],
    publishers: ["Paleon Planetary Works"],
    genres: ["Simulation", "Space", "Survival", "Early Access"],
    tags: ["space", "simulation", "survival", "city-builder"],
    priceCents: 1499,
    shortDescription:
      "First-person sci-fi base building and AI colonist management on a hostile exoplanet.",
    isEarlyAccess: true,
    eaStartDate: "2018-07-17",
    reviewScoreDesc: "Mixed",
    totalPositive: 780,
    totalNegative: 690,
    lastPatchAt: "2023-08-22T15:00:00Z",
    lastDevPostAt: "2023-09-01T12:00:00Z",
    lastBuildAt: "2023-08-22T15:00:00Z",
    posts12m: 0,
    patches12m: 0,
    announcements: [
      {
        gid: "oz-1",
        title: "Update 0.6.11 - Atmospheric Harvester Fixes",
        url: "https://store.steampowered.com/news/app/296070",
        date: "2023-09-01T12:00:00Z",
        tags: ["patchnotes"],
        isPatch: true,
        isPatchHeuristic: true,
        excerpt:
          "Fixed hydrogen pipe pressure calculations and turret targeting range.",
      },
    ],
  }),
  buildSeedGame({
    appid: 519860,
    name: "Duskers: Void Salvage",
    slug: "void-salvage-protocol",
    developers: ["Nebula Drift Collective"],
    publishers: ["Nebula Drift Collective"],
    genres: ["Strategy", "Space", "Roguelite", "Early Access"],
    tags: ["space", "strategy", "roguelite"],
    priceCents: 1299,
    shortDescription:
      "Command unmanned salvage drones across derelict starships using a command-line tactical interface.",
    isEarlyAccess: true,
    eaStartDate: "2019-03-14",
    reviewScoreDesc: "Mostly Negative",
    totalPositive: 310,
    totalNegative: 540,
    lastPatchAt: "2024-02-09T11:00:00Z",
    lastDevPostAt: "2024-02-09T11:00:00Z",
    lastBuildAt: null,
    posts12m: 0,
    patches12m: 0,
    announcements: [
      {
        gid: "vsp-1",
        title: "Build 0.19.2 - Terminal Font Scaling",
        url: "https://store.steampowered.com/news/app/519860",
        date: "2024-02-09T11:00:00Z",
        tags: ["patchnotes"],
        isPatch: true,
        isPatchHeuristic: true,
        excerpt:
          "Added 4K monitor font scaling for the drone command console.",
      },
    ],
  }),
  buildSeedGame({
    appid: 2489100,
    name: "Chrono Forged: Aether Realms",
    slug: "chrono-forged-aether-realms",
    developers: ["Aetherial Guild Studios"],
    publishers: ["Aetherial Guild Studios"],
    genres: ["RPG", "Adventure", "Action", "Early Access"],
    tags: ["rpg", "action", "open-world"],
    priceCents: 2499,
    shortDescription:
      "Fantasy action RPG featuring time-looping dungeon raids and guild stronghold construction.",
    isEarlyAccess: true,
    eaStartDate: "2024-05-19",
    reviewScoreDesc: "Mixed",
    totalPositive: 520,
    totalNegative: 490,
    lastPatchAt: "2025-01-15T10:00:00Z",
    lastDevPostAt: "2025-01-20T14:00:00Z",
    lastBuildAt: "2025-01-15T10:00:00Z",
    posts12m: 0,
    patches12m: 0,
    announcements: [
      {
        gid: "cf-1",
        title: "Patch 0.3.0 - Guild Stronghold Foundations",
        url: "https://store.steampowered.com/news/app/2489100",
        date: "2025-01-20T14:00:00Z",
        tags: ["patchnotes"],
        isPatch: true,
        isPatchHeuristic: true,
        excerpt:
          "Introduced Tier 1 guild halls and rebalanced chrono-mage cooldowns.",
      },
    ],
  }),
];

export interface GlobalCatalogStats {
  totalTracked: number;
  activeCount: number;
  slowingCount: number;
  stalledCount: number;
  abandonedCount: number;
  leftEaCount: number;
  overOneYearNoUpdate: number;
  medianEaMonths: number;
  lastGlobalSyncUtc: string;
  yearlyCohortStats: Array<{
    year: number;
    enteredEa: number;
    graduated10: number;
    stalledOrAbandoned: number;
    activeOrSlowing: number;
  }>;
}

/** Refresh verdict copy from the live status engine so wording stays consistent with dates. */
function withFreshVerdict(game: GameRecord): GameRecord {
  const evalResult = evaluateGameStatus({
    isEarlyAccessNow: game.isEarlyAccess,
    wasTrackedInEarlyAccess: true,
    eaStartDate: game.eaStartDate,
    leftEarlyAccessAt: game.leftEaAt,
    lastPatchAt: game.lastPatchAt ? new Date(game.lastPatchAt) : null,
    lastDevPostAt: game.lastDevPostAt ? new Date(game.lastDevPostAt) : null,
    lastBuildAt: game.lastBuildAt ? new Date(game.lastBuildAt) : null,
    posts12m: game.posts12m,
    patches12m: game.patches12m,
    post10Patches: game.post10Patches,
    totalReviews: game.totalReviews,
    totalPosts: Math.max(game.announcements.length, game.posts12m, 4),
    adult: game.adult,
    delisted: game.delisted,
    externalUpdatesUrl: game.externalUpdatesUrl,
    now: new Date("2026-10-19T12:00:00Z"),
  });
  return {
    ...game,
    lastActivityAt: evalResult.lastActivityAt?.toISOString() ?? game.lastActivityAt,
    lastShipAt: evalResult.lastShipAt?.toISOString() ?? game.lastShipAt,
    eaDurationDays: evalResult.eaDurationDays ?? game.eaDurationDays,
    verdictSummary: evalResult.verdictSummary,
  };
}

const ALL_GAMES: GameRecord[] = (() => {
  const byId = new Map<number, GameRecord>();
  for (const game of importedGames as GameRecord[]) {
    byId.set(game.appid, withFreshVerdict(game));
  }
  for (const game of SEED_GAMES) byId.set(game.appid, game);
  return [...byId.values()];
})();

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
  return Math.round(value);
}

function buildCatalogStats(games: GameRecord[]): GlobalCatalogStats {
  const count = (status: GameRecord["status"]) => games.filter((game) => game.status === status).length;
  const activeCount = count("active");
  const slowingCount = count("slowing");
  const stalledCount = count("stalled");
  const abandonedCount = count("likely_abandoned");
  const leftEaCount = count("left_early_access");
  const years = new Map<number, GlobalCatalogStats["yearlyCohortStats"][number]>();
  for (const game of games) {
    const year = game.eaStartDate ? Number(game.eaStartDate.slice(0, 4)) : 0;
    if (!year) continue;
    const row = years.get(year) ?? {
      year,
      enteredEa: 0,
      graduated10: 0,
      stalledOrAbandoned: 0,
      activeOrSlowing: 0,
    };
    row.enteredEa += 1;
    if (game.status === "left_early_access") row.graduated10 += 1;
    if (game.status === "stalled" || game.status === "likely_abandoned") row.stalledOrAbandoned += 1;
    if (game.status === "active" || game.status === "slowing") row.activeOrSlowing += 1;
    years.set(year, row);
  }
  return {
    totalTracked: games.length,
    activeCount,
    slowingCount,
    stalledCount,
    abandonedCount,
    leftEaCount,
    overOneYearNoUpdate: stalledCount + abandonedCount,
    medianEaMonths: median(
      games
        .map((game) => game.eaDurationDays)
        .filter((days): days is number => days !== null)
        .map((days) => Math.round(days / 30))
    ),
    lastGlobalSyncUtc: "2026-10-21T08:00:00Z",
    yearlyCohortStats: [...years.values()].sort((a, b) => a.year - b.year),
  };
}

export const GLOBAL_CATALOG_STATS = buildCatalogStats(ALL_GAMES);

export function catalogShare(count: number): string {
  if (!GLOBAL_CATALOG_STATS.totalTracked) return "0% of catalog";
  const share = Math.round((count / GLOBAL_CATALOG_STATS.totalTracked) * 1000) / 10;
  return `${share}% of catalog`;
}

/** Minimum catalog games sharing a Steam tag before we ship a /genre page. */
export const MIN_GAMES_FOR_GENRE_PAGE = 10;

/** Prefer these as breadcrumb / primary genre resolution order. */
const PREFERRED_GENRE_ORDER = [
  "survival",
  "strategy",
  "rpg",
  "simulation",
  "action",
  "space",
  "adventure",
  "indie",
  "horror",
  "open-world",
  "co-op",
  "multiplayer",
] as const;

function countGamesByTag(games: GameRecord[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const game of games) {
    const seen = new Set<string>();
    for (const tag of game.tags) {
      const slug = tag.toLowerCase();
      if (seen.has(slug)) continue;
      seen.add(slug);
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  return counts;
}

function buildGenreCategories(
  games: GameRecord[]
): Array<{ slug: string; name: string; description: string; gameCount: number }> {
  const counts = countGamesByTag(games);
  const eligible = [...counts.entries()]
    .filter(([slug, count]) => count >= MIN_GAMES_FOR_GENRE_PAGE && GENRE_PAGE_INTROS[slug])
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const bySlug = new Map(
    eligible.map(([slug, gameCount]) => {
      const intro = GENRE_PAGE_INTROS[slug]!;
      return [slug, { slug, name: intro.name, description: intro.description, gameCount }] as const;
    })
  );

  const ordered: Array<{ slug: string; name: string; description: string; gameCount: number }> = [];
  for (const slug of PREFERRED_GENRE_ORDER) {
    const entry = bySlug.get(slug);
    if (entry) {
      ordered.push(entry);
      bySlug.delete(slug);
    }
  }
  for (const entry of bySlug.values()) ordered.push(entry);
  return ordered;
}

export const GENRE_CATEGORIES = buildGenreCategories(ALL_GAMES);

/** Compact footer/nav list — preferred genres only (full set lives on the home page). */
export const FOOTER_GENRE_CATEGORIES = GENRE_CATEGORIES.filter((c) =>
  (PREFERRED_GENRE_ORDER as readonly string[]).includes(c.slug)
);

export function getGenreGameCount(slug: string): number {
  const cat = GENRE_CATEGORIES.find((c) => c.slug === slug.toLowerCase());
  return cat?.gameCount ?? getGamesByGenreSlug(slug).length;
}

export function getAllGames(): GameRecord[] {
  return ALL_GAMES;
}

export function getGameBySlug(slug: string): {
  game: GameRecord | null;
  redirectToSlug?: string;
} {
  const direct = ALL_GAMES.find((g) => g.slug === slug);
  if (direct) return { game: direct };

  const match = slug.match(/-(\d+)$/);
  if (match) {
    const id = Number.parseInt(match[1], 10);
    const byId = ALL_GAMES.find((g) => g.appid === id);
    if (byId) {
      return { game: byId, redirectToSlug: byId.slug };
    }
  }
  return { game: null };
}

export function getGameByAppId(appid: number): GameRecord | null {
  return ALL_GAMES.find((g) => g.appid === appid) ?? null;
}

export function getSimilarActiveGames(game: GameRecord, limit = 6): GameRecord[] {
  return ALL_GAMES.filter(
    (g) =>
      g.appid !== game.appid &&
      g.status === "active" &&
      (g.genres.some((genre) => game.genres.includes(genre)) ||
        g.tags.some((tag) => game.tags.includes(tag)))
  )
    .sort((a, b) => b.activityScore - a.activityScore)
    .slice(0, limit);
}

export function getGamesByGenreSlug(genreSlug: string): GameRecord[] {
  const normalized = genreSlug.toLowerCase();
  return ALL_GAMES.filter(
    (g) =>
      g.tags.some((t) => t.toLowerCase() === normalized) ||
      g.genres.some((gen) => gen.toLowerCase().includes(normalized))
  );
}

/** Resolve a game to one of the sitemap genre categories (name + slug stay paired). */
export function resolvePrimaryGenre(
  game: Pick<GameRecord, "genres" | "tags">
): { slug: string; name: string } | null {
  const tagSet = new Set(game.tags.map((t) => t.toLowerCase()));
  const genreText = game.genres.map((g) => g.toLowerCase());
  // Prefer specific tags over the universal early-access bucket for breadcrumbs.
  const candidates = GENRE_CATEGORIES.filter((c) => c.slug !== "early-access");

  for (const cat of candidates) {
    if (tagSet.has(cat.slug)) return { slug: cat.slug, name: cat.name };
  }
  for (const cat of candidates) {
    if (genreText.some((g) => g.includes(cat.slug) || cat.name.toLowerCase().includes(g))) {
      return { slug: cat.slug, name: cat.name };
    }
  }
  const ea = GENRE_CATEGORIES.find((c) => c.slug === "early-access");
  if (ea && tagSet.has("early-access")) return { slug: ea.slug, name: ea.name };
  return null;
}

export function isKnownGenreSlug(slug: string): boolean {
  const normalized = slug.toLowerCase();
  return GENRE_CATEGORIES.some((c) => c.slug === normalized);
}

export interface DeveloperStatement {
  title: string;
  date: string;
  url: string;
  summary: string;
}

/** Manual /report-confirmed developer statements keyed by Steam AppID. */
const DEVELOPER_STATEMENT_OVERRIDES: Record<number, DeveloperStatement> = {
  // The Long Drive — Steam post "Game Abandoned?" (2025-07-03) denies abandonment.
  1017180: {
    title: "Game Abandoned?",
    date: "2025-07-03T18:36:41.000Z",
    url: "https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1803527891744263",
    summary:
      "Developer says the game is not abandoned and continues work (including an engine rewrite).",
  },
};

/**
 * Returns a developer abandonment statement when one exists (override or announcement title).
 */
export function getDeveloperStatement(game: GameRecord): DeveloperStatement | null {
  const override = DEVELOPER_STATEMENT_OVERRIDES[game.appid];
  if (override) return override;

  const match = game.announcements.find(
    (a) => !a.isPatch && !a.isPatchHeuristic && /abandon/i.test(a.title)
  );
  if (!match) return null;

  const combined = `${match.title} ${match.excerpt}`;
  const denies =
    /not\s+abandon|isn['’]t\s+abandon|abandon(?:ed)?\?\s*no\b|still\s+(?:in\s+)?(?:active\s+)?development/i.test(
      combined
    );

  return {
    title: match.title,
    date: match.date,
    url: match.url,
    summary: denies
      ? `Developer says ${game.name} is not abandoned.`
      : `Developer published a statement about abandonment status: "${match.title}".`,
  };
}
