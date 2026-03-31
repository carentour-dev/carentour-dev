import { NextRequest } from "next/server";
import { z } from "zod";
import { fetchPublicMedicalFacilitiesDirectory } from "@/server/modules/serviceProviders/public";
import { handleRouteError, jsonResponse } from "@/server/utils/http";

const querySchema = z.object({
  country: z.string().optional(),
  city: z.string().optional(),
  specialty: z.string().optional(),
  procedureId: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const GET = async (req: NextRequest) => {
  try {
    const searchParams = new URL(req.url).searchParams;
    const parsed = querySchema.parse({
      country: searchParams.get("country") ?? undefined,
      city: searchParams.get("city") ?? undefined,
      specialty: searchParams.get("specialty") ?? undefined,
      procedureId: searchParams.get("procedureId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    const data = await fetchPublicMedicalFacilitiesDirectory(parsed);

    return jsonResponse(data);
  } catch (error) {
    return handleRouteError(error);
  }
};
