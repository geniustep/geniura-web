import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettier,
  {
    rules: {
      // Raw <a> for internal routes would bypass locale-aware navigation.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/link",
              message: "Use Link from '@/lib/i18n/navigation' so the locale prefix is kept.",
            },
            {
              name: "next/navigation",
              importNames: ["useRouter", "usePathname", "redirect"],
              message: "Use the locale-aware helpers from '@/lib/i18n/navigation'.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["lib/i18n/navigation.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
];

export default config;
