import { defineConfig } from "orval";

// Generated code lives in lib/api/generated and is never edited by hand.
// Regenerate with `pnpm api:generate` after updating contracts/openapi.web.v1.yaml.
export default defineConfig({
  geniura: {
    input: { target: "./contracts/openapi.web.v1.yaml" },
    output: {
      mode: "tags-split",
      target: "./lib/api/generated/endpoints",
      schemas: "./lib/api/generated/model",
      client: "react-query",
      httpClient: "fetch",
      clean: true,
      formatter: "prettier",
      override: {
        mutator: { path: "./lib/api/fetcher.ts", name: "apiFetch" },
        query: { signal: true },
        fetch: { includeHttpResponseReturnType: false },
      },
    },
  },
  geniuraZod: {
    input: { target: "./contracts/openapi.web.v1.yaml" },
    output: {
      mode: "tags-split",
      target: "./lib/api/generated/zod",
      client: "zod",
      fileExtension: ".zod.ts",
      clean: true,
      formatter: "prettier",
    },
  },
});
