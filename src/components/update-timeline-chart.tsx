import type { MonthlyActivityBin } from "../lib/catalog";

export function UpdateTimelineChart({
  bins,
  gameName,
}: {
  bins: MonthlyActivityBin[];
  gameName: string;
}) {
  const maxVal = Math.max(
    4,
    ...bins.map((b) => b.patches + b.posts)
  );

  const totalPatches36m = bins.reduce((acc, b) => acc + b.patches, 0);
  const totalPosts36m = bins.reduce((acc, b) => acc + b.posts, 0);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            36-Month Update Cadence Timeline
          </h2>
          <p className="text-xs text-slate-400">
            Monthly shipped patches vs. developer community posts for {gameName} (UTC)
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-400" />
            Patches ({totalPatches36m})
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-xs bg-sky-400" />
            Dev Posts ({totalPosts36m})
          </span>
        </div>
      </div>

      <div
        className="grid grid-cols-36 items-end gap-1 h-36 pt-4 pb-1 border-b border-slate-800"
        style={{ gridTemplateColumns: `repeat(${bins.length}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`36-month update cadence chart for ${gameName}`}
      >
        {bins.map((b) => {
          const patchHeight = Math.round((b.patches / maxVal) * 100);
          const postHeight = Math.round((b.posts / maxVal) * 100);
          const isEmpty = b.patches === 0 && b.posts === 0;

          return (
            <div
              key={b.month}
              className="group relative flex flex-col justify-end items-center h-full"
            >
              <div className="w-full flex flex-col justify-end h-full gap-0.5">
                {b.posts > 0 && (
                  <div
                    style={{ height: `${Math.max(10, postHeight)}%` }}
                    className="w-full rounded-t-xs bg-sky-400/85 group-hover:bg-sky-300 transition-colors"
                  />
                )}
                {b.patches > 0 && (
                  <div
                    style={{ height: `${Math.max(12, patchHeight)}%` }}
                    className="w-full rounded-t-xs bg-emerald-400 group-hover:bg-emerald-300 transition-colors"
                  />
                )}
                {isEmpty && (
                  <div className="w-full h-1 rounded-xs bg-slate-800/80" />
                )}
              </div>

              <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:flex whitespace-nowrap rounded bg-slate-950 border border-slate-700 px-2 py-1 text-[11px] text-slate-200 shadow-lg z-20">
                {b.label}: {b.patches} patch{b.patches === 1 ? "" : "es"}, {b.posts} post{b.posts === 1 ? "" : "s"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-mono">
        <span>{bins[0]?.label}</span>
        <span>{bins[Math.floor(bins.length / 3)]?.label}</span>
        <span>{bins[Math.floor((bins.length * 2) / 3)]?.label}</span>
        <span>{bins[bins.length - 1]?.label}</span>
      </div>
    </div>
  );
}
