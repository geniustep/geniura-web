import localFont from "next/font/local";

// Self-hosted from @fontsource (no request to a third-party font CDN at build or runtime).
// Visual direction "A — Nuit" (approved 2026-10-18):
// - body: IBM Plex Sans Arabic (Arabic) + IBM Plex Sans (Latin);
// - display (headings, salaries, figures): Readex Pro (Arabic) + Bricolage Grotesque (Latin).
// preload is off: only one face per script is used on a page, and display faces load after text.

export const fontArabic = localFont({
  variable: "--font-arabic",
  display: "swap",
  preload: false,
  src: [
    {
      path: "../node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-500-normal.woff2",
      weight: "500",
    },
    {
      path: "../node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-600-normal.woff2",
      weight: "600",
    },
    {
      path: "../node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-700-normal.woff2",
      weight: "700",
    },
  ],
});

export const fontLatin = localFont({
  variable: "--font-latin",
  display: "swap",
  preload: false,
  src: [
    {
      path: "../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2",
      weight: "500",
    },
    {
      path: "../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2",
      weight: "600",
    },
    {
      path: "../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff2",
      weight: "700",
    },
  ],
});

export const fontDisplayArabic = localFont({
  variable: "--font-display-arabic",
  display: "swap",
  preload: false,
  src: [
    {
      path: "../node_modules/@fontsource/readex-pro/files/readex-pro-arabic-600-normal.woff2",
      weight: "600",
    },
    {
      path: "../node_modules/@fontsource/readex-pro/files/readex-pro-arabic-700-normal.woff2",
      weight: "700",
    },
  ],
});

export const fontDisplayLatin = localFont({
  variable: "--font-display-latin",
  display: "swap",
  preload: false,
  src: [
    {
      path: "../node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-600-normal.woff2",
      weight: "600",
    },
    {
      path: "../node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff2",
      weight: "700",
    },
  ],
});

// Latin glyphs (digits, brand names) set inside Arabic display text, so figures stay in Readex Pro.
export const fontDisplayArabicLatin = localFont({
  variable: "--font-display-arabic-latin",
  display: "swap",
  preload: false,
  src: [
    {
      path: "../node_modules/@fontsource/readex-pro/files/readex-pro-latin-600-normal.woff2",
      weight: "600",
    },
    {
      path: "../node_modules/@fontsource/readex-pro/files/readex-pro-latin-700-normal.woff2",
      weight: "700",
    },
  ],
});
