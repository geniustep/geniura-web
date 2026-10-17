import localFont from "next/font/local";

// Self-hosted from @fontsource (no request to a third-party font CDN at build or runtime).
// IBM Plex Sans Arabic carries Arabic + Latin glyphs, so mixed-language strings stay consistent.
// PROVISIONAL brand choice: replace once the visual identity is approved.
// preload is off for both families because only one of them is primary per locale; revisit with
// field data in PHASE 3 (performance budget: ≤ 2 families, ≤ 120 KB of font files).

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
      path: "../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff2",
      weight: "700",
    },
  ],
});
