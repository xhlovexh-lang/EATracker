import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLegacyGoneSlug } from "./lib/legacy-slugs";

/**
 * Fake SEED_GAMES demo slugs are permanently removed.
 * Next.js App Router has no first-class `gone()` yet, so this proxy returns
 * a real HTTP 410 (preferred over a 301-to-home for invented titles).
 */
export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/game\/([^/]+)\/?$/);
  if (!match) return NextResponse.next();

  const slug = match[1]!;
  if (!isLegacyGoneSlug(slug)) return NextResponse.next();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="robots" content="noindex, nofollow" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>410 Gone · EA Trackers</title>
  <style>
    body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: #020617; color: #e2e8f0; }
    main { max-width: 36rem; margin: 0 auto; padding: 4rem 1.25rem; text-align: center; }
    h1 { font-size: 1.5rem; margin: 0 0 0.75rem; }
    p { color: #94a3b8; line-height: 1.5; margin: 0 0 1.5rem; }
    a { color: #34d399; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <main>
    <h1>410 Gone</h1>
    <p>This demo game page was removed. It was never a real catalog entry.</p>
    <p><a href="/">Back to EA Trackers</a></p>
  </main>
</body>
</html>`;

  return new NextResponse(html, {
    status: 410,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

export const config = {
  matcher: ["/game/:slug*"],
};
