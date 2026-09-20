import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#15171c",
          borderRadius: 96,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 300,
            fontWeight: 800,
            color: "#ff7a45",
            fontFamily: "sans-serif",
          }}
        >
          L
        </div>
      </div>
    ),
    { ...size },
  );
}
