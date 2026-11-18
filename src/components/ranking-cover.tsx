/**
 * Server-friendly cover for ranking tables.
 * Avoids a client boundary per row (GameCover) so image URLs are not
 * duplicated into RSC flight data on large leaderboards.
 */
export function RankingCover({
  src,
  className = "",
  width = 92,
  height = 43,
  priority = false,
}: {
  src: string;
  className?: string;
  width?: number;
  height?: number;
  /** First viewport rows can opt into eager load; default is lazy. */
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-800 text-[11px] text-slate-500 ${className}`}
        role="img"
        aria-label="Game image unavailable"
      >
        No image
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Steam CDN URLs; next/image not configured for this host in ranking tables
    <img
      src={src}
      alt=""
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={className}
    />
  );
}
