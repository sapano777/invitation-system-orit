import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

// Quick check after deploying: are the env vars set and is the schema in place?
export async function GET() {
  const checks: Record<string, "ok" | "missing" | "error"> = {
    supabase_env: hasSupabaseEnv() ? "ok" : "missing",
    supabase_secret: process.env.SUPABASE_SECRET_KEY ? "ok" : "missing",
    database: "missing",
  };

  if (checks.supabase_env === "ok" && checks.supabase_secret === "ok") {
    try {
      const { error } = await createAdminClient().from("events").select("id", { head: true, count: "exact" });
      checks.database = error ? "error" : "ok";
    } catch {
      checks.database = "error";
    }
  }

  const healthy = Object.values(checks).every((v) => v === "ok");
  return NextResponse.json({ healthy, checks }, { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
