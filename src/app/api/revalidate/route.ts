import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * On-demand ISR revalidation endpoint triggered by `/crawler` when a game's
 * status or lastActivityAt changes (Spec Section 6.6 & 14).
 */
export async function POST(req: Request) {
  const secret = req.headers.get("x-revalidate-secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { appid?: number; slug?: string };
    if (body.slug) {
      revalidatePath(`/game/${body.slug}`);
    }
    revalidatePath("/");
    revalidatePath("/abandoned-early-access-games");
    revalidatePath("/recently-updated-early-access-games");
    revalidatePath("/left-early-access");

    return NextResponse.json({
      revalidated: true,
      slug: body.slug ?? null,
      appid: body.appid ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
}
