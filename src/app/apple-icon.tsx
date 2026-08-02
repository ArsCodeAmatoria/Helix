import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — Lucide DNA */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2f6bff",
          borderRadius: 36,
        }}
      >
        <svg
          width="110"
          height="110"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m10 16 1.5 1.5" />
          <path d="m14 8-1.5-1.5" />
          <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
          <path d="m16.5 10.5 1 1" />
          <path d="m17 6-2.891-2.891" />
          <path d="M2 15c6.667-6 13.333 0 20-6" />
          <path d="m20 9 .891.891" />
          <path d="M3.109 14.109 4 15" />
          <path d="m6.5 12.5 1 1" />
          <path d="m7 18 2.891 2.891" />
          <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
