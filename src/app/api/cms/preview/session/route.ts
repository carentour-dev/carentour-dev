import { NextRequest, NextResponse } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";

const PREVIEW_COOKIE_NAME = "cms-preview-access-token";
const PREVIEW_COOKIE_MAX_AGE_SECONDS = 60 * 5;
const CMS_READ_ACCESS = {
  allPermissions: ["cms.read"],
} as const;

export const POST = adminRoute(async (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 },
    );
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return NextResponse.json(
      { error: "Missing access token" },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: PREVIEW_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: PREVIEW_COOKIE_MAX_AGE_SECONDS,
    path: "/cms/preview",
  });

  return response;
}, CMS_READ_ACCESS);
