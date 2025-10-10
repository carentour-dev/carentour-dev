export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import {
  CONTACT_REQUEST_STATUSES,
  contactRequestController,
  type ContactRequestStatus,
} from "@/server/modules/contactRequests/module";

const isValidStatus = (value: string | null): value is ContactRequestStatus => {
  if (!value) return false;
  return CONTACT_REQUEST_STATUSES.includes(value as ContactRequestStatus);
};

export const GET = adminRoute(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const statusParam = searchParams.get("status");
  const requestTypeParam = searchParams.get("requestType");

  const filters: { status?: ContactRequestStatus; requestType?: string } = {};

  if (isValidStatus(statusParam)) {
    filters.status = statusParam;
  }

  if (requestTypeParam && requestTypeParam.trim().length > 0 && requestTypeParam !== "all") {
    filters.requestType = requestTypeParam.trim();
  }

  const requests = await contactRequestController.list(filters);
  return jsonResponse(requests);
});
