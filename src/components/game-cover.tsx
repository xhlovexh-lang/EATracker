"use client";

import { useState } from "react";

export function GameCover({
  src,
  alt,
  className = "",
  width,
  height,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  /** When true, skip lazy-loading (above-the-fold / search dropdown). */
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(!src);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-800 text-[11px] text-slate-500 ${className}`}
        role="img"
        aria-label={alt ? `${alt} is unavailable` : "Game image unavailable"}
      >
        No image
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Steam CDN; shared with search UI
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
