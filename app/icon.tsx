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
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "112px",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 240,
            fontWeight: 800,
            fontFamily: "sans-serif",
            letterSpacing: "-12px",
            marginRight: "-12px",
            lineHeight: 1,
          }}
        >
          IV
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [], // skip font loading (fixes Windows path bug in Next.js 14)
    }
  );
}
