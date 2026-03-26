import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { normalizePath } from "@/lib/seo";

export const runtime = "edge";

const IMAGE_SIZE = {
  width: 1200,
  height: 630,
};

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.trim() || "Care N Tour";
  const path = normalizePath(searchParams.get("path") ?? "/");

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "linear-gradient(135deg, #083344 0%, #0f766e 40%, #34d399 100%)",
          color: "#f8fafc",
          padding: "64px",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: 2,
            opacity: 0.9,
          }}
        >
          Care N Tour
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            maxWidth: "88%",
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.08,
              textWrap: "balance",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 28,
              opacity: 0.95,
            }}
          >
            {path}
          </div>
        </div>
      </div>
    ),
    {
      ...IMAGE_SIZE,
    },
  );
}
