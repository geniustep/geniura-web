// Fails when class strings use physical left/right utilities, which break in RTL.
// Use logical ones instead: ms-/me-, ps-/pe-, start-/end-, border-s/border-e, rounded-s/rounded-e,
// text-start/text-end.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const roots = ["app", "components", "providers", "features"];
const physical = [
  /^-?(?:ml|mr|pl|pr|left|right|scroll-ml|scroll-mr|scroll-pl|scroll-pr)-/,
  /^border-[lr](?:-|$)/,
  /^rounded-(?:l|r|tl|tr|bl|br)(?:-|$)/,
  /^(?:text|float|clear)-(?:left|right)$/,
];
const stringLiteral = /"([^"\\]*)"|'([^'\\]*)'|`([^`\\]*)`/g;

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (/\.tsx?$/.test(entry.name)) yield path;
  }
}

const problems = [];
for (const root of roots) {
  for await (const file of walk(root)) {
    const lines = (await readFile(file, "utf8")).split("\n");
    lines.forEach((line, index) => {
      for (const match of line.matchAll(stringLiteral)) {
        const value = match[1] ?? match[2] ?? match[3] ?? "";
        for (const token of value.split(/\s+/)) {
          const utility = token.split(":").at(-1) ?? "";
          if (physical.some((pattern) => pattern.test(utility))) {
            problems.push(`${file}:${index + 1}: ${token}`);
          }
        }
      }
    });
  }
}

if (problems.length > 0) {
  console.error("Physical direction utilities found (use logical equivalents):");
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log("Logical CSS check passed.");
