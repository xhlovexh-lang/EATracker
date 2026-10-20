import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "../../../db";
import { reports } from "../../../db/schema";

const ReportPayloadSchema = z.object({
  appid: z.number().int().positive(),
  kind: z.enum(["external_roadmap", "incorrect_date", "left_ea", "other"]),
  url: z.string().url().optional(),
  message: z.string().min(5).max(2000),
  email: z.string().email().optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ReportPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid submission fields. Please provide a valid Steam AppID and message." },
        { status: 400 }
      );
    }

    // Optional Cloudflare Turnstile verification if TURNSTILE_SECRET_KEY is configured (Spec Section 14)
    if (process.env.TURNSTILE_SECRET_KEY && parsed.data.turnstileToken) {
      const verifyRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: process.env.TURNSTILE_SECRET_KEY,
            response: parsed.data.turnstileToken,
          }),
        }
      );
      const verifyJson = (await verifyRes.json()) as { success?: boolean };
      if (!verifyJson.success) {
        return NextResponse.json(
          { error: "Turnstile verification failed." },
          { status: 403 }
        );
      }
    }

    const db = getDb();
    if (db) {
      await db.insert(reports).values({
        appid: parsed.data.appid,
        kind: parsed.data.kind,
        url: parsed.data.url ?? null,
        message: parsed.data.message,
        email: parsed.data.email ?? null,
        status: "pending",
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to process report request." },
      { status: 500 }
    );
  }
}
