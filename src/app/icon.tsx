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
          background: "#171e19",
          borderRadius: 96,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 300,
            fontWeight: 900,
            color: "#ff3b4e",
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
