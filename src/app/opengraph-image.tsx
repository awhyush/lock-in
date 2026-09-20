import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 28,
          padding: "0 90px",
          background: "#15171c",
          color: "#eae7e0",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#9a9da6",
          }}
        >
          Daily reset tracker
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 128,
            fontWeight: 800,
            lineHeight: 0.95,
            color: "#eae7e0",
          }}
        >
          THE LOCK-IN
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#9a9da6", maxWidth: 900 }}>{SITE_DESCRIPTION}</div>
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          {["Exercise", "Study", "Applications", "Build", "Movement"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                fontSize: 22,
                padding: "8px 20px",
                borderRadius: 999,
                border: "2px solid #ff7a45",
                color: "#ff7a45",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
