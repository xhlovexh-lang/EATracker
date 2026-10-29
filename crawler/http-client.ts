import PQueue from "p-queue";
import { request } from "undici";

const DEFAULT_UA =
  process.env.CRAWLER_USER_AGENT ||
  "EATrackerBot/1.0 (+https://eatracker.clear-frames.com/methodology)";

export type HostBucket =
  | "store.steampowered.com"
  | "api.steampowered.com"
  | "api.steamcmd.net"
  | "steamspy.com";

/**
 * Global per-host rate limiters (Spec Section 6.1 - 6.6):
 * - store.steampowered.com: 1 req / 2000ms, concurrency = 1 (strictly <= 150 req / 5 min)
 * - api.steampowered.com: 4 req / 1000ms (<100k/day limit)
 * - api.steamcmd.net: 1 req / 1000ms (optional PICS build signal)
 * - steamspy.com: 1 req / 1000ms
 */
const queues: Record<HostBucket, PQueue> = {
  "store.steampowered.com": new PQueue({
    concurrency: 1,
    intervalCap: 1,
    interval: 2000,
    carryoverIntervalCount: true,
  }),
  "api.steampowered.com": new PQueue({
    concurrency: 2,
    intervalCap: 4,
    interval: 1000,
    carryoverIntervalCount: true,
  }),
  "api.steamcmd.net": new PQueue({
    concurrency: 1,
    intervalCap: 1,
    interval: 1000,
    carryoverIntervalCount: true,
  }),
  "steamspy.com": new PQueue({
    concurrency: 1,
    intervalCap: 1,
    interval: 1000,
    carryoverIntervalCount: true,
  }),
};

const hostCircuitPausedUntil: Partial<Record<HostBucket, number>> = {};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class HostForbiddenError extends Error {
  constructor(public host: HostBucket, message: string) {
    super(message);
    this.name = "HostForbiddenError";
  }
}

export async function rateLimitedGetJson<T>(
  host: HostBucket,
  url: string,
  options?: { maxRetries?: number }
): Promise<T | null> {
  const maxRetries = options?.maxRetries ?? 2;
  const q = queues[host];

  return q.add(async () => {
    const pausedUntil = hostCircuitPausedUntil[host];
    if (pausedUntil && Date.now() < pausedUntil) {
      throw new HostForbiddenError(
        host,
        `Host ${host} is paused due to earlier HTTP 403 until ${new Date(pausedUntil).toISOString()}`
      );
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const started = Date.now();
      try {
        const res = await request(url, {
          method: "GET",
          headers: {
            "User-Agent": DEFAULT_UA,
            Accept: "application/json",
          },
          headersTimeout: 20_000,
          bodyTimeout: 20_000,
        });

        const elapsed = Date.now() - started;
        console.log(`[HTTP] ${host} GET ${url} -> ${res.statusCode} (${elapsed}ms)`);

        if (res.statusCode === 429) {
          // Section 6.6: 429 -> wait 5 minutes
          console.warn(`[RateLimit 429] ${host} returned 429. Backing off for 5 minutes...`);
          await res.body.dump();
          await sleep(5 * 60 * 1000);
          continue;
        }

        if (res.statusCode === 403) {
          // Section 6.6: 403 -> pause host for 30 minutes & alert
          await res.body.dump();
          const pauseUntil = Date.now() + 30 * 60 * 1000;
          hostCircuitPausedUntil[host] = pauseUntil;
          console.error(
            `[ALERT 403] ${host} returned 403 Forbidden! Halting host tasks for 30 minutes.`
          );
          throw new HostForbiddenError(host, `HTTP 403 from ${host} on ${url}`);
        }

        if (res.statusCode >= 500) {
          await res.body.dump();
          if (attempt < maxRetries) {
            await sleep(2000 * (attempt + 1));
            continue;
          }
          return null;
        }

        if (res.statusCode !== 200) {
          await res.body.dump();
          return null;
        }

        const text = await res.body.text();
        return JSON.parse(text) as T;
      } catch (err) {
        if (err instanceof HostForbiddenError) {
          throw err;
        }
        if (attempt < maxRetries) {
          await sleep(1500 * (attempt + 1));
          continue;
        }
        console.error(`[HTTP Error] ${host} ${url}:`, err);
        return null;
      }
    }
    return null;
  }) as Promise<T | null>;
}

/** Rate-limited HTML/text GET (same host buckets as JSON). */
export async function rateLimitedGetRawText(
  host: HostBucket,
  url: string,
  options?: { maxRetries?: number }
): Promise<string | null> {
  const maxRetries = options?.maxRetries ?? 2;
  const q = queues[host];

  return q.add(async () => {
    const pausedUntil = hostCircuitPausedUntil[host];
    if (pausedUntil && Date.now() < pausedUntil) {
      throw new HostForbiddenError(
        host,
        `Host ${host} is paused due to earlier HTTP 403 until ${new Date(pausedUntil).toISOString()}`
      );
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await request(url, {
          method: "GET",
          headers: {
            "User-Agent": DEFAULT_UA,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            Cookie: "birthtime=0; lastagecheckage=1-0-1980; wants_mature_content=1",
          },
          headersTimeout: 20_000,
          bodyTimeout: 20_000,
        });

        if (res.statusCode === 429) {
          await res.body.dump();
          await sleep(5 * 60 * 1000);
          continue;
        }
        if (res.statusCode === 403) {
          await res.body.dump();
          hostCircuitPausedUntil[host] = Date.now() + 30 * 60 * 1000;
          throw new HostForbiddenError(host, `HTTP 403 from ${host} on ${url}`);
        }
        if (res.statusCode >= 500) {
          await res.body.dump();
          if (attempt < maxRetries) {
            await sleep(2000 * (attempt + 1));
            continue;
          }
          return null;
        }
        if (res.statusCode !== 200) {
          await res.body.dump();
          return null;
        }
        return await res.body.text();
      } catch (err) {
        if (err instanceof HostForbiddenError) throw err;
        if (attempt < maxRetries) {
          await sleep(1500 * (attempt + 1));
          continue;
        }
        console.error(`[HTTP Error] ${host} ${url}:`, err);
        return null;
      }
    }
    return null;
  }) as Promise<string | null>;
}
