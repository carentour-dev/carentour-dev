import { NextRequest } from "next/server";
import {
  requireAdmin,
  requireBackofficeAccess,
  type AuthorizationContext,
  type BackofficeAccessOptions,
} from "@/server/auth/requireAdmin";
import { handleRouteError } from "@/server/utils/http";

type ResolvedRouteContext = {
  params?: Record<string, string | string[]>;
  [key: string]: unknown;
};

type IncomingRouteContext = RouteContext<any>;

type ResolvedHandlerContext = ResolvedRouteContext & {
  auth?: AuthorizationContext;
};

type RouteHandler = (
  req: NextRequest,
  ctx: ResolvedHandlerContext,
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

      const authContext = requiresCustomPermissions
        ? await requireBackofficeAccess(options)
        : await requireAdmin();

      const resolvedCtx: ResolvedRouteContext =
        ctx && typeof ctx === "object"
          ? {
              ...ctx,
              params: "params" in ctx ? await ctx.params : undefined,
            }
          : {};

      return await handler(req, { ...resolvedCtx, auth: authContext });
    } catch (error) {
      return handleRouteError(error);
    }
  };
}
