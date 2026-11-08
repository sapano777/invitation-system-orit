import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runDueReminders } from "@/lib/reminders";
import { getSiteUrl } from "@/lib/site";

// Called by Vercel Cron (see vercel.json). Vercel sends
// "Authorization: Bearer $CRON_SECRET" when the CRON_SECRET env var is set.
export const maxDuration = 60;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 500 });
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const processed = await runDueReminders(await getSiteUrl());
    return NextResponse.json({ ok: true, processed }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("cron reminders failed", e);
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}
