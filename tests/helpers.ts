import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";

export const STATE_FILE = "tests/.e2e-state.json";
export const STAFF_EMAIL = "e2e-staff@example.com";
export const SLUG_PREFIX = "e2e-";

export type E2EState = { staffPassword: string; events: Record<string, string> };

export function loadEnv() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
}

export function adminClient() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("E2E tests need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (.env.local).");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function state(): E2EState {
  return JSON.parse(readFileSync(STATE_FILE, "utf8"));
}

// A fresh Israeli mobile number per test, so tests don't collide.
export function randomPhone() {
  return `05${Math.floor(Math.random() * 10)}${String(Math.floor(Math.random() * 1e7)).padStart(7, "0")}`;
}

export function toInternational(local: string) {
  return `972${local.replace(/\D/g, "").slice(1)}`;
}

// The registration form is rate limited per IP; give each test its own.
export async function useRandomIp(page: Page) {
  const ip = `10.${[0, 0, 0].map(() => Math.floor(Math.random() * 250) + 1).join(".")}`;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": ip });
}

export async function login(page: Page) {
  await page.goto("/login");
  await page.fill("#email", STAFF_EMAIL);
  await page.fill("#password", state().staffPassword);
  await page.getByRole("button", { name: "כניסה" }).click();
  await page.waitForURL("**/admin");
}
