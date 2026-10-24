import { execFileSync } from "node:child_process";
import path from "node:path";

export function toWslPath(winPath: string) {
  const normalized = winPath.replace(/\\/g, "/");
  const match = /^([A-Za-z]):\/(.*)$/.exec(normalized);
  if (!match?.[1] || match[2] === undefined) return normalized;
  return `/mnt/${match[1].toLowerCase()}/${match[2]}`;
}

function shellQuote(value: string) {
  if (!value || /[\r\n\0]/.test(value)) {
    throw new Error("Refusing an empty or multiline WSL argument.");
  }
  return "'" + value.replace(/'/g, "'\\''") + "'";
}

/**
 * Seed local synthetic accounts only; never clear the Django cache.
 * Local-only guards also execute inside seed-local-users.py.
 */
export function runSeedScript(count = 16, stdio: "inherit" | "pipe" = "inherit") {
  if (!Number.isInteger(count) || count < 0 || count > 20) {
    throw new Error("Integration test seed count must be in 0..20.");
  }
  const wslScript = toWslPath(path.join(__dirname, "seed-local-users.py"));
  const apiRoot = process.env.GENIURA_API_ROOT ?? "/home/geniura/work/geniura-partial-dates-impl";
  const venv =
    process.env.GENIURA_API_VENV ?? "/home/geniura/work/geniura-cv-local/.venv/bin/activate";
  const prefix = process.env.GENIURA_USER_PREFIX;
  const cmd = [
    `cd ${shellQuote(apiRoot)}`,
    `source ${shellQuote(venv)}`,
    "set -a && source .env && set +a",
    "export GENIURA_INTEGRATION_SEED=allow",
    `export GENIURA_API_ROOT=${shellQuote(apiRoot)}`,
    prefix ? `export GENIURA_USER_PREFIX=${shellQuote(prefix)}` : "",
    `python ${shellQuote(wslScript)} --count ${count}`,
  ]
    .filter(Boolean)
    .join(" && ");

  // Use argument-vector execution instead of interpolating into a Windows shell.
  execFileSync("wsl", ["-e", "bash", "-lc", cmd], { stdio });
}
