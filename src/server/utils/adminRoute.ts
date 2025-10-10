import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/requireAdmin";
import { handleRouteError } from "@/server/utils/http";

type RouteContext = {
  params?: Record<string, string | string[]>;
};

type RouteHandler = (req: NextRequest, ctx: RouteContext) => Promise<Response>;

type WrappedHandler = (req: NextRequest, ctx: RouteContext) => Promise<Response>;

// Wrap a route handler with shared error handling.
export function adminRoute(handler: RouteHandler): WrappedHandler {
  return async (req, ctx) => {
    try {
      await requireAdmin();
      return await handler(req, ctx);
    } catch (error) {
      return handleRouteError(error);
    }
  };
}
