import type { NextRequest } from "next/server";
import { middleware as rootMiddleware } from "../middleware";

export function middleware(request: NextRequest) {
  return rootMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
