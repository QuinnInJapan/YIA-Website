import { defineConfig } from "@playwright/test";

const isCI = Boolean(process.env.CI);
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  (isCI ? "http://127.0.0.1:3000" : "http://127.0.0.1:4306");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  // Local agents use Project Control's managed service. CI owns an isolated runner and may
  // start its own server because no workstation coordinator exists there.
  webServer: isCI
    ? {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : undefined,
});
