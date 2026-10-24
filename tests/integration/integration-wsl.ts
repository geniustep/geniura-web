import { execSync } from "node:child_process";
import path from "node:path";

export function toWslPath(winPath: string) {
  const normalized = winPath.replace(/\\/g, "/");
  const match = /^([A-Za-z]):\/(.*)$/.exec(normalized);
  if (!match?.[1] || match[2] === undefined) return normalized;
  return `/mnt/${match[1].toLowerCase()}/${match[2]}`;
}

export function runSeedScript(args: string, stdio: "inherit" | "pipe" = "inherit") {
  const wslScript = toWslPath(path.join(__dirname, "seed-local-users.py"));
  const apiRoot = process.env.GENIURA_API_ROOT ?? "/home/geniura/work/geniura-partial-dates-impl";
  const venv =
    process.env.GENIURA_API_VENV ?? "/home/geniura/work/geniura-cv-local/.venv/bin/activate";
  const prefix = process.env.GENIURA_USER_PREFIX;
  const cmd = [
    `cd ${apiRoot}`,
    `source ${venv}`,
    "set -a && source .env && set +a",
    "export GENIURA_INTEGRATION_SEED=allow",
    prefix ? `export GENIURA_USER_PREFIX=${prefix}` : "",
    `python ${wslScript} ${args}`,
  ]
    .filter(Boolean)
    .join(" && ");
  execSync(`wsl -e bash -lc ${JSON.stringify(cmd)}`, { stdio });
}

/** Clears Django throttle cache on local geniura-api (WSL). No-op when GENIURA_SKIP_SEED=1. */
export function clearLocalThrottleCache() {
  if (process.env.GENIURA_SKIP_SEED === "1") return;
  runSeedScript("--clear-throttle --count 0", "pipe");
}
