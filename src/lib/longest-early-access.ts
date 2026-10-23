import type { GameRecord } from "./catalog";

export const STILL_IN_EA_TOP_N = 25;
export const LEFT_AFTER_LONG_STAY_TOP_N = 25;
/** Minimum EA stay (days) to appear in the “left after a long stay” section. */
export const LONG_STAY_MIN_DAYS = 365;

export function isStillInEarlyAccess(game: GameRecord): boolean {
  return game.isEarlyAccess && game.status !== "left_early_access" && !game.leftEaAt;
}

export function isLeftEarlyAccess(game: GameRecord): boolean {
  return !game.isEarlyAccess || game.status === "left_early_access" || Boolean(game.leftEaAt);
}

function durationDays(game: GameRecord): number {
  return game.eaDurationDays ?? 0;
}

export function listStillInEaByDuration(games: GameRecord[]): GameRecord[] {
  return games
    .filter(isStillInEarlyAccess)
    .sort((a, b) => durationDays(b) - durationDays(a));
}

export function listLeftAfterLongStay(games: GameRecord[]): GameRecord[] {
  return games
    .filter(
      (g) =>
        isLeftEarlyAccess(g) &&
        g.eaDurationDays != null &&
        g.eaDurationDays >= LONG_STAY_MIN_DAYS
    )
    .sort((a, b) => durationDays(b) - durationDays(a));
}
