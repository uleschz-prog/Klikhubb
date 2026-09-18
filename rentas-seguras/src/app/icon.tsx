import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
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
          background: "#9a3a22",
          color: "#f7f1e8",
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        R
      </div>
    ),
    size
  );
}
