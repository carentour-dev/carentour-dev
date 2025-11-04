import { NextRequest } from "next/server";
import {
  requireAdmin,
  requireBackofficeAccess,
  type BackofficeAccessOptions,
} from "@/server/auth/requireAdmin";
import { handleRouteError } from "@/server/utils/http";

type ResolvedRouteContext = {
  params?: Record<string, string | string[]>;
  [key: string]: unknown;
};

type IncomingRouteContext = RouteContext<any>;

type RouteHandler = (
  req: NextRequest,
  ctx: ResolvedRouteContext,
) => Promise<Response>;

type WrappedHandler = (
  req: NextRequest,
  ctx: IncomingRouteContext,
) => Promise<Response>;

// Wrap a route handler with shared error handling.
export function adminRoute(
  handler: RouteHandler,
  options: BackofficeAccessOptions = {},
): WrappedHandler {
  return async (req, ctx) => {
    try {
      const requiresCustomPermissions =
        (options.allPermissions?.length ?? 0) > 0 ||
        (options.anyPermissions?.length ?? 0) > 0;

      if (requiresCustomPermissions) {
        await requireBackofficeAccess(options);
      } else {
        await requireAdmin();
      }

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
