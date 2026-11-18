import type { GameStatusType } from "../config/status";
import type { GameRecord } from "./catalog";
import { formatUtcDate } from "./status-engine";

/** Lean shape for header/home autocomplete — keep out of initial RSC HTML. */
export type SearchableGameItem = {
  appid: number;
  name: string;
  slug: string;
  status: GameStatusType;
  activityScore: number;
  lastUpdateLabel: string;
  headerImage: string;
};

export function buildSearchIndex(games: GameRecord[]): SearchableGameItem[] {
  return games.map((g) => ({
    appid: g.appid,
    name: g.name,
    slug: g.slug,
    status: g.status,
    activityScore: g.activityScore,
    lastUpdateLabel: formatUtcDate(g.lastActivityAt),
    headerImage: g.headerImage,
  }));
}
