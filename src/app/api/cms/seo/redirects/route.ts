import { NextRequest, NextResponse } from "next/server";
import {
  createRouteRedirect,
  getRouteRedirectById,
  listRouteRedirects,
  normalizePath,
  revalidateSeoPaths,
  routeRedirectCreateSchema,
  routeRedirectUpdateSchema,
  updateRouteRedirect,
} from "@/lib/seo";
import { requirePermission } from "@/server/auth/requireAdmin";
import { ApiError } from "@/server/utils/errors";

export async function GET() {
  try {
    await requirePermission("cms.read");
    const redirects = await listRouteRedirects();
    return NextResponse.json({ redirects });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          error:
            error.status >= 500 ? "Failed to load redirects" : error.message,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Failed to load redirects" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requirePermission("cms.write");
    const body = await request.json().catch((error) => {
      if (error instanceof SyntaxError) {
        throw new ApiError(400, "Invalid JSON payload");
      }
      throw error;
    });
    const parsed = routeRedirectCreateSchema.parse(body);

    const redirect = await createRouteRedirect({
      fromPath: parsed.fromPath,
      toPath: parsed.toPath,
      code: parsed.code,
      isActive: parsed.isActive,
      source: parsed.source ?? "cms.manual",
      sourceMetadata: parsed.sourceMetadata,
      createdBy: context.user.id,
      mode: "create",
    });

    revalidateSeoPaths([
      normalizePath(parsed.fromPath),
      normalizePath(parsed.toPath),
    ]);

    return NextResponse.json({ redirect }, { status: 201 });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          error:
            error.status >= 500 ? "Failed to create redirect" : error.message,
        },
        { status: error.status },
      );
    }

    if (error?.issues) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create redirect" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requirePermission("cms.write");
    const body = await request.json().catch((error) => {
      if (error instanceof SyntaxError) {
        throw new ApiError(400, "Invalid JSON payload");
      }
      throw error;
    });
    const parsed = routeRedirectUpdateSchema.parse(body);
    const previous = await getRouteRedirectById(parsed.id);

    if (!previous) {
      throw new ApiError(404, "Redirect not found");
    }

    const redirect = await updateRouteRedirect({
      id: parsed.id,
      fromPath: parsed.fromPath,
      toPath: parsed.toPath,
      code: parsed.code,
      isActive: parsed.isActive,
      source: parsed.source,
      sourceMetadata: parsed.sourceMetadata,
    });

    revalidateSeoPaths([
      previous.from_path,
      previous.to_path,
      parsed.fromPath ? normalizePath(parsed.fromPath) : redirect.from_path,
      parsed.toPath ? normalizePath(parsed.toPath) : redirect.to_path,
    ]);

    return NextResponse.json({ redirect });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          error:
            error.status >= 500 ? "Failed to update redirect" : error.message,
        },
        { status: error.status },
      );
    }

    if (error?.issues) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update redirect" },
      { status: 500 },
    );
  }
}
