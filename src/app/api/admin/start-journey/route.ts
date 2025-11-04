import { startJourneySubmissionController } from "@/server/modules/startJourneySubmissions/module";
import type { StartJourneySubmissionStatus } from "@/server/modules/startJourneySubmissions/module";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";

const START_JOURNEY_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.start_journey"],
} as const;

export const GET = adminRoute(async (req) => {
  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") ?? undefined) as
    | StartJourneySubmissionStatus
    | undefined;

  const submissions = await startJourneySubmissionController.list({
    status,
  });

  return jsonResponse(submissions);
}, START_JOURNEY_PERMISSIONS);
