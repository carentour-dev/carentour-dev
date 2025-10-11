import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/requireAdmin";
import { handleRouteError } from "@/server/utils/http";

type ResolvedRouteContext = {
  params?: Record<string, string | string[]>;
  [key: string]: unknown;
};

type IncomingRouteContext = RouteContext<any>;

type RouteHandler = (req: NextRequest, ctx: ResolvedRouteContext) => Promise<Response>;

type WrappedHandler = (req: NextRequest, ctx: IncomingRouteContext) => Promise<Response>;

// Wrap a route handler with shared error handling.
export function adminRoute(handler: RouteHandler): WrappedHandler {
  return async (req, ctx) => {
    try {
      await requireAdmin();

      const resolvedCtx: ResolvedRouteContext =
        ctx && typeof ctx === "object"
          ? {
              ...ctx,
              params: "params" in ctx ? await ctx.params : undefined,
            }
          : {};

      return await handler(req, resolvedCtx);
    } catch (error) {
      return handleRouteError(error);
    }
  };
}
