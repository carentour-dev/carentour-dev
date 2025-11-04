export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
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

const assignedToSchema = z.string().uuid();

export const GET = adminRoute(
  async (req: NextRequest, ctx) => {
    const searchParams = req.nextUrl.searchParams;
    const statusParam = searchParams.get("status");
    const requestTypeParam = searchParams.get("requestType");
    const assignedToParam = searchParams.get("assignedTo");

    const filters: {
      status?: ContactRequestStatus;
      requestType?: string;
      assignedTo?: string | null;
    } = {};

    if (isValidStatus(statusParam)) {
      filters.status = statusParam;
    }

    if (
      requestTypeParam &&
      requestTypeParam.trim().length > 0 &&
      requestTypeParam !== "all"
    ) {
      filters.requestType = requestTypeParam.trim();
    }

    if (assignedToParam) {
      if (assignedToParam === "me") {
        const currentProfileId = ctx.auth?.profileId ?? null;
        if (currentProfileId) {
          filters.assignedTo = currentProfileId;
        }
      } else if (assignedToParam === "unassigned") {
        filters.assignedTo = null;
      } else {
        const normalized = assignedToParam.trim();
        if (normalized.length > 0) {
          try {
            filters.assignedTo = assignedToSchema.parse(normalized);
          } catch {
            // ignore invalid UUID filters to avoid breaking existing clients
          }
        }
      }
    }

    const requests = await contactRequestController.list(filters);
    return jsonResponse(requests);
  },
  { allPermissions: ["operations.shared", "operations.requests"] },
);
