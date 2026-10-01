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
          background: "#bfe3c6",
          borderRadius: 96,
        }}
      >
        <svg width="300" height="300" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2.5c1 2.5-1.5 3.5-1.5 6 0 1.4 1 2.3 2.2 2.3.9 0 1.6-.6 1.8-1.4 1.6 1.4 2.5 3.3 2.5 5.1a5 5 0 0 1-10 0c0-4 2.5-6.5 5-12Z"
            fill="#a4593a"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
