// Every locale must define exactly the same message keys as the default locale.
import { readFile, readdir } from "node:fs/promises";

const dir = new URL("../messages/", import.meta.url);
const files = (await readdir(dir)).filter((name) => name.endsWith(".json"));

function keys(value, prefix = "") {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keys(child, prefix ? `${prefix}.${key}` : key),
  );
}

const catalogs = Object.fromEntries(
  await Promise.all(
    files.map(async (name) => [
      name,
      new Set(keys(JSON.parse(await readFile(new URL(name, dir), "utf8")))),
    ]),
  ),
);

const reference = catalogs["ar.json"];
let failed = false;
for (const [name, set] of Object.entries(catalogs)) {
  const missing = [...reference].filter((key) => !set.has(key));
  const extra = [...set].filter((key) => !reference.has(key));
  if (missing.length || extra.length) {
    failed = true;
    console.error(`${name}: missing ${JSON.stringify(missing)} extra ${JSON.stringify(extra)}`);
  }
}

if (failed) process.exit(1);
console.log(`Message catalogs aligned (${files.join(", ")}).`);
