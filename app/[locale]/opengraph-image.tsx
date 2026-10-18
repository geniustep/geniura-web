import { ImageResponse } from "next/og";

export const alt = "Geniura — Jobs, talent and skills";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Temporary typography-led card until the final visual identity is approved. */
export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const subtitle = locale === "fr" ? "Emploi · Talents · Compétences" : "Jobs · Talent · Skills";

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: "#F9F8F5",
        color: "#143340",
        fontFamily: "sans-serif",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width: 18,
          height: "100%",
          backgroundColor: "#0B6170",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          paddingLeft: 96,
          paddingRight: 96,
        }}
      >
        <div style={{ display: "flex", fontSize: 112, fontWeight: 700, letterSpacing: -4 }}>
          Geniura
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 31,
            marginTop: 18,
            color: "#486572",
          }}
        >
          {subtitle}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: 48,
          left: 96,
          fontSize: 24,
          letterSpacing: 2,
          color: "#0B6170",
        }}
      >
        geniura.com
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 96,
          bottom: 48,
          width: 180,
          height: 6,
          backgroundColor: "#0B6170",
        }}
      />
    </div>,
    size,
  );
}
