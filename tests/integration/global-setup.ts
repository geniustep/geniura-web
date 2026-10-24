import fs from "node:fs";
import path from "node:path";

import { runSeedScript } from "./integration-wsl";

const DEFAULT_API = "http://127.0.0.1:8000";
const RUN_ENV_FILE = path.join(__dirname, "cv-run-env.json");

function assertLocalApi(baseUrl: string) {
  const url = new URL(baseUrl);
  if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
    throw new Error(
      `Refusing integration setup: GENIURA_API_URL must point at localhost (got ${baseUrl}).`,
    );
  }
}

async function assertApiReachable(baseUrl: string) {
  const health = await fetch(`${baseUrl.replace(/\/$/, "")}/health/live`).catch(() => null);
  if (!health?.ok) {
    throw new Error(
      `geniura-api is not reachable at ${baseUrl}. Start Django locally before pnpm test:integration.`,
    );
  }
}

export default async function globalSetup() {
  const api = process.env.GENIURA_API_URL ?? DEFAULT_API;
  assertLocalApi(api);
  await assertApiReachable(api);

  const prefix = process.env.GENIURA_USER_PREFIX ?? `cv-int-${Date.now()}`;
  fs.writeFileSync(RUN_ENV_FILE, JSON.stringify({ prefix }), "utf8");
  process.env.GENIURA_USER_PREFIX = prefix;
  if (process.env.GENIURA_SKIP_SEED === "1") {
    console.warn("GENIURA_SKIP_SEED=1: skipping synthetic user seed.");
    return;
  }
  runSeedScript(16, "inherit");
}
