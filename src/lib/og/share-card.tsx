import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const ogImageSize = {
  width: 1200,
  height: 630,
} as const;

export const ogImageContentType = "image/png";

const ACCENT = "#0071e3";

function QlykMark({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="16" fill="#050505" />
      <circle cx="30" cy="30" r="16.2" stroke={ACCENT} strokeWidth="6.2" />
      <path d="M41.2 41.2 L52 52" stroke={ACCENT} strokeWidth="6.2" strokeLinecap="round" />
      <circle cx="30" cy="30" r="12.4" fill="#050505" />
      <path d="M25.2 23.8 L39.4 30 L25.2 36.2 Z" fill={ACCENT} />
    </svg>
  );
}

export function createCourseShareImage(input: {
  title: string;
  creatorName: string;
  priceLabel: string;
}) {
  const host = site.url.replace(/^https?:\/\//, "");
  const title = input.title.length > 72 ? `${input.title.slice(0, 70).trim()}…` : input.title;

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
          <QlykMark size={56} />
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: 4,
            }}
          >
            CURSO EN QLYK
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 1040 }}>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.08,
              color: "#FFFFFF",
            }}
          >
            {title}
          </div>
          <div style={{ display: "flex", fontSize: 32, color: "rgba(255,255,255,0.7)" }}>
            {`Por ${input.creatorName}`}
          </div>
          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                marginTop: 8,
                padding: "12px 22px",
                borderRadius: 999,
                background: ACCENT,
                color: "#050505",
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              {input.priceLabel}
            </div>
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
          <span>{host}/c</span>
          <span>Mira el preview · Compra en un clic</span>
        </div>
      </div>
    ),
    ogImageSize,
  );
}

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
          <QlykMark size={56} />
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: 4,
            }}
          >
            RED SOCIAL · CURSOS · VENTAS
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <QlykMark size={88} />
            <div style={{ display: "flex", alignItems: "baseline", fontSize: 112, fontWeight: 800, lineHeight: 0.95 }}>
              <span style={{ color: ACCENT }}>Q</span>
              <span style={{ color: "#FFFFFF" }}>lyk</span>
            </div>
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
            <span style={{ color: ACCENT }}>Sin salir del feed.</span>
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
