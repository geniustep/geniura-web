import { defineConfig, devices } from "@playwright/test";

// Full-stack tests against a running geniura-api (local, synthetic data only). Not part of the
// public CI: the backend repository is private. Run with:
//   GENIURA_API_URL=http://localhost:8000 pnpm test:integration
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "./tests/integration",
  globalSetup: "./tests/integration/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  timeout: 180_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    launchOptions: { executablePath },
  },
  webServer: {
    command: "pnpm start --port 3000",
    url: "http://localhost:3000/robots.txt",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
