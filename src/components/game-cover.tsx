"use client";

import { useEffect, useState } from "react";

export function GameCover({
  src,
  alt,
  className = "",
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!src) {
      setFailed(true);
      return;
    }
    setFailed(false);
    const probe = new Image();
    const markBroken = () => setFailed(true);
    probe.addEventListener("error", markBroken);
    probe.addEventListener("load", () => {
      if (probe.naturalWidth === 0) markBroken();
    });
    probe.src = src;
    return () => {
      probe.removeEventListener("error", markBroken);
    };
  }, [src]);

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
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
