import { ImageResponse } from "next/og";
import { brand, site } from "@/config/site";

export const ogImageSize = {
  width: 1200,
  height: 630,
} as const;

export const ogImageContentType = "image/png";

export function createShareImage() {
  const host = site.url.replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(145deg, #050505 0%, #081018 52%, #050505 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 18,
              background: brand.colors.cyan,
              color: "#050505",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            Q
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: 4,
            }}
          >
            RED SOCIAL · ACADEMIA · VENTAS
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", fontSize: 112, fontWeight: 800, lineHeight: 0.95 }}>
            <span style={{ color: brand.colors.cyan }}>Q</span>
            <span style={{ color: "#FFFFFF" }}>lyk</span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 46,
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#FFFFFF",
              maxWidth: 980,
            }}
          >
            <span>Del video al pago.</span>
            <span style={{ color: brand.colors.green }}>Sin salir del feed.</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              lineHeight: 1.45,
              color: "rgba(255,255,255,0.68)",
              maxWidth: 920,
            }}
          >
            {site.share.description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 24,
            color: "rgba(255,255,255,0.45)",
          }}
        >
          <span>{host}</span>
          <span>Cuenta gratis · Registro directo</span>
        </div>
      </div>
    ),
    ogImageSize,
  );
}
