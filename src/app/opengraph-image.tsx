import { ImageResponse } from "next/og";

export const alt = "Creamice — Nigerian streetwear";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A typographic brand card, so links have a real preview even before the owner
// supplies a logo or campaign photo. No gradients, no invented product imagery.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0b0b",
          color: "#f5f2eb",
          padding: "64px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "24px",
            letterSpacing: "0.18em",
            color: "#c6a15b",
          }}
        >
          <div style={{ width: "14px", height: "14px", background: "#c6a15b" }} />
          NIGERIAN STREETWEAR
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: "112px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              lineHeight: 1,
            }}
          >
            CREAMICE.
          </div>
          <div style={{ marginTop: "26px", fontSize: "32px", color: "#b8b2a7" }}>
            Simple pieces, honest prices.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid #3a3a3a",
            paddingTop: "24px",
            fontSize: "22px",
            color: "#b8b2a7",
          }}
        >
          <span>Delivered across Nigeria</span>
          <span style={{ color: "#c6a15b" }}>Secure payment by Flutterwave</span>
        </div>
      </div>
    ),
    size
  );
}
