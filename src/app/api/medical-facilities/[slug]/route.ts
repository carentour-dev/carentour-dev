import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchPublicServiceProviderBySlug } from "@/server/modules/serviceProviders/public";
import { handleRouteError, jsonResponse } from "@/server/utils/http";

const paramsSchema = z.object({
  slug: z.string().min(1),
});

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) => {
  try {
    const { slug } = paramsSchema.parse(await params);
    const detail = await fetchPublicServiceProviderBySlug(slug);

    if (!detail) {
      return NextResponse.json(
        { error: "Medical facility not found" },
        { status: 404 },
      );
    }

    return jsonResponse(detail);
  } catch (error) {
    return handleRouteError(error);
  }
};
