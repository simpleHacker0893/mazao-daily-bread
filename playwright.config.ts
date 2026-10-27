import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Clerk keys and the e2e test user come from the git-ignored .env.
loadEnv({ path: ".env", quiet: true });

// E2E_PORT lets e2e run beside another local server (default 3000).
const port = process.env.E2E_PORT ?? "3000";

// The pilot phone: Android Chrome at 360px.
const phone = {
  ...devices["Desktop Chrome"],
  viewport: { width: 360, height: 800 },
};

// Signed-in browser state written by e2e/global.setup.ts (git-ignored).
export const authFile = "playwright/.clerk/user.json";

// e2e runs against the production build, never `next dev` (blueprint A2).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /global\.setup\.ts/ },
    {
      name: "phone",
      use: phone,
      testIgnore: [/global\.setup\.ts/, /signed-in\.spec\.ts/],
    },
    {
      // Specs that need a Clerk session (sync, from Phase 1 Task 6).
      name: "phone-signed-in",
      use: { ...phone, storageState: authFile },
      testMatch: /signed-in\.spec\.ts/,
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: `pnpm build && pnpm start -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
