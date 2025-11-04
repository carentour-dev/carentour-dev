import { z } from "zod";
import { startJourneySubmissionController } from "@/server/modules/startJourneySubmissions/module";
import type { StartJourneySubmissionStatus } from "@/server/modules/startJourneySubmissions/module";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";

const START_JOURNEY_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.start_journey"],
} as const;

const assignedToSchema = z.string().uuid();

export const GET = adminRoute(async (req, ctx) => {
  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") ?? undefined) as
    | StartJourneySubmissionStatus
    | undefined;
  const assignedToParam = searchParams.get("assignedTo");

  const filters: {
    status?: StartJourneySubmissionStatus;
    assignedTo?: string | null;
  } = {};

  if (status) {
    filters.status = status;
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
          // ignore invalid UUID inputs
        }
      }
    }
  }

  const submissions = await startJourneySubmissionController.list(filters);

  return jsonResponse(submissions);
}, START_JOURNEY_PERMISSIONS);
