import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <svg width="180" height="180" viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="16" fill="#F0EDE6" />
        <path d="M34 16 L20 48 L15 82 L50 82 L53 70 L28 70 L46 29 L34 16 Z" fill="#0D0D0D" />
        <polygon points="56,26 68,20 68,28 56,34" fill="#0D0D0D" />
        <rect x="56" y="38" width="12" height="44" fill="#0D0D0D" />
      </svg>
    ),
    { ...size },
  );
}
