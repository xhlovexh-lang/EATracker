import { runCrawlJob, syncSingleApp, type CrawlJobName } from "./jobs";

async function main() {
  const [, , command, arg] = process.argv;

  if (command === "app" && arg) {
    const appid = Number.parseInt(arg, 10);
    console.log(`[Crawler] Syncing single appid=${appid}...`);
    await syncSingleApp(appid);
    console.log(`[Crawler] Done syncing appid=${appid}.`);
    return;
  }

  const job = (command || "refresh-store") as CrawlJobName;
  const allowed: CrawlJobName[] = [
    "discover",
    "refresh-hot",
    "refresh-store",
    "refresh-news",
    "refresh-players",
    "rescore",
    "seed-migrate",
  ];
  if (!allowed.includes(job)) {
    console.error(`[Crawler] Unknown job "${command}". Allowed: ${allowed.join(", ")}`);
    process.exit(1);
  }

  if (job === "seed-migrate") {
    const { ensureSchema } = await import("../src/db/migrate");
    const { seedFromImportedJson } = await import("../src/db/seed");
    const migrated = await ensureSchema();
    if (!migrated.ok) {
      console.error("[Crawler] migrate failed:", migrated.error);
      process.exit(1);
    }
    const seeded = await seedFromImportedJson();
    console.log("[Crawler] seed-migrate:", seeded);
    return;
  }

  const result = await runCrawlJob(job);
  console.log("[Crawler] result:", result);
  const total = result.ok + result.failed;
  if (total > 10 && result.failed / total > 0.1) {
    console.error(
      `[Crawler Alert] Failure rate exceeded 10% (${result.failed}/${total})`
    );
    process.exit(1);
  }
}

if (require.main === module || process.argv[1]?.endsWith("crawler/index.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
