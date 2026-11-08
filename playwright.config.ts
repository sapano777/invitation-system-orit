import { defineConfig, devices } from "@playwright/test";

// End-to-end tests. They create their own test data (events prefixed "e2e-"
// and a staff user) in the Supabase project from .env.local, and remove it
// afterwards. See README, "End-to-end tests".
//
// Without BASE_URL, Playwright starts the production server on port 3100;
// run `npm run build` first.

const baseURL = process.env.BASE_URL ?? "http://localhost:3100";

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/global-setup.ts",
  globalTeardown: "./tests/global-teardown.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    locale: "he-IL",
    timezoneId: "Asia/Jerusalem",
    trace: "off",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Most guests open the invitation on a phone. Chromium with iPhone metrics,
    // so a single browser is enough.
    { name: "iphone", use: { ...devices["iPhone 13"], browserName: "chromium" } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run start -- -p 3100",
        url: `${baseURL}/api/health`,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
