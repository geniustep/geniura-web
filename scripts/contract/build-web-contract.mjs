// Builds contracts/openapi.web.v1.yaml from the private geniura-api OpenAPI file.
//
//   node scripts/contract/build-web-contract.mjs <path/to/geniura-api/docs/openapi/openapi.yaml> <api-commit>
//
// 1. Drops the internal staff/audit surface (contracts/overrides.json → excludedPathPrefixes).
// 2. Applies documented corrections for verified server behaviour (pagination envelopes, errors).
// 3. Prunes component schemas no longer referenced.
// 4. Writes the contract plus contracts/source.json (provenance and checksums).
// The private repository is never fetched by CI: the output is committed and reviewed by a human.
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { parse, stringify } from "yaml";

const [inputPath, sourceCommit] = process.argv.slice(2);
if (!inputPath || !sourceCommit) {
  console.error("Usage: build-web-contract.mjs <openapi.yaml> <geniura-api commit>");
  process.exit(1);
}

const root = new URL("../../", import.meta.url);
const raw = await readFile(inputPath, "utf8");
const spec = parse(raw);
const overrides = JSON.parse(await readFile(new URL("contracts/overrides.json", root), "utf8"));
const methods = ["get", "put", "post", "patch", "delete"];
const applied = [];

// 1. Exclude internal paths AND individual staff-tagged operations on otherwise public paths.
// Sensitive endpoints may sit outside /staff/ (e.g. signed verification-document downloads).
for (const [path, pathItem] of Object.entries(spec.paths)) {
  if (overrides.excludedPathPrefixes.prefixes.some((prefix) => path.startsWith(prefix))) {
    delete spec.paths[path];
    continue;
  }
  for (const method of methods) {
    const operation = pathItem[method];
    if (operation?.tags?.some((tag) => /\(staff\)/i.test(tag))) {
      delete pathItem[method];
    }
  }
  if (!methods.some((method) => pathItem[method])) {
    delete spec.paths[path];
  }
}
// Refuse to publish any remaining staff/audit operations when new tags are introduced.
for (const [path, item] of Object.entries(spec.paths)) {
  if (path.startsWith("/api/v1/staff/")) {
    throw new Error(`Sensitive staff route in web contract: ${path}`);
  }
  for (const method of methods) {
    if (item[method]?.tags?.some((tag) => /\(staff\)/i.test(tag))) {
      throw new Error(`Sensitive staff operation in web contract: ${method} ${path}`);
    }
  }
}

const schemas = spec.components.schemas;

function listSchemaOf(path) {
  const operation = spec.paths[path]?.get;
  const content = operation?.responses?.["200"]?.content?.["application/json"];
  if (!content) throw new Error(`No GET 200 JSON response for ${path}`);
  if (content.schema?.type !== "array") {
    throw new Error(`${path} is no longer declared as an array: remove its override.`);
  }
  return { content, itemRef: content.schema.items };
}

function itemName(itemRef) {
  return itemRef.$ref?.split("/").at(-1) ?? "Item";
}

// 2a. Paginated lists.
for (const path of overrides.paginatedLists.paths) {
  const { content, itemRef } = listSchemaOf(path);
  const extra = overrides.paginatedLists.extraProperties[path] ?? {};
  const name = `Paginated${itemName(itemRef)}Page${Object.keys(extra).length ? "WithMeta" : ""}`;
  schemas[name] ??= {
    type: "object",
    required: ["count", "next", "previous", "results"],
    properties: {
      count: { type: "integer" },
      next: { type: "string", format: "uri", nullable: true },
      previous: { type: "string", format: "uri", nullable: true },
      results: { type: "array", items: itemRef },
      ...extra,
    },
  };
  content.schema = { $ref: `#/components/schemas/${name}` };
  applied.push(`paginated: ${path}`);
}

// 2b. Vocabulary lists.
for (const path of overrides.vocabularyLists.paths) {
  const { content, itemRef } = listSchemaOf(path);
  const name = `${itemName(itemRef)}VocabularyList`;
  schemas[name] ??= {
    type: "object",
    required: ["count", "results", "locale"],
    properties: {
      count: { type: "integer" },
      results: { type: "array", items: itemRef },
      locale: { type: "string" },
    },
  };
  content.schema = { $ref: `#/components/schemas/${name}` };
  applied.push(`vocabulary: ${path}`);
}

// 2c. Error envelope.
schemas.ErrorResponse = {
  type: "object",
  required: ["code", "message", "details", "request_id"],
  properties: {
    code: { type: "string", description: "Stable machine code; translated by the web app." },
    message: { type: "string", description: "Server message (not shown verbatim to users)." },
    details: { type: "object", additionalProperties: {} },
    request_id: { type: "string" },
  },
};
for (const item of Object.values(spec.paths)) {
  for (const method of methods) {
    const operation = item[method];
    if (!operation) continue;
    operation.responses.default ??= {
      description: "Error envelope",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
    };
  }
}
applied.push("error envelope: ErrorResponse + default response on every operation");

// 3. Prune unreferenced schemas (transitively from the remaining paths).
const reachable = new Set();
function visit(node) {
  if (Array.isArray(node)) return node.forEach(visit);
  if (!node || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node)) {
    if (key === "$ref" && typeof value === "string" && value.startsWith("#/components/schemas/")) {
      const name = value.split("/").at(-1);
      if (!reachable.has(name)) {
        reachable.add(name);
        visit(schemas[name]);
      }
    } else {
      visit(value);
    }
  }
}
visit(spec.paths);
const before = Object.keys(schemas).length;
for (const name of Object.keys(schemas)) {
  if (!reachable.has(name)) delete schemas[name];
}

spec.info.description = `${spec.info.description}\n\nWeb copy: staff/audit paths removed and verified corrections applied (see contracts/overrides.json). Source: geniura-api@${sourceCommit}.`;

const output = stringify(spec, { lineWidth: 0, sortMapEntries: false });
await writeFile(new URL("contracts/openapi.web.v1.yaml", root), output);

const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const source = {
  sourceRepository: "geniustep/geniura-api (private)",
  sourceFile: "docs/openapi/openapi.yaml",
  sourceCommit,
  sourceSha256: sha256(raw),
  outputSha256: sha256(output),
  operations: Object.values(spec.paths).reduce(
    (total, item) => total + methods.filter((method) => item[method]).length,
    0,
  ),
  paths: Object.keys(spec.paths).length,
  schemasKept: Object.keys(schemas).length,
  schemasPruned: before - Object.keys(schemas).length,
  corrections: applied,
};
await writeFile(new URL("contracts/source.json", root), `${JSON.stringify(source, null, 2)}\n`);
console.log(JSON.stringify({ ...source, corrections: applied.length }, null, 2));
