import { startJourneySubmissionController } from "@/server/modules/startJourneySubmissions/module";
import type { StartJourneySubmissionStatus } from "@/server/modules/startJourneySubmissions/module";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";

export const GET = adminRoute(async (req) => {
  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") ?? undefined) as
    | StartJourneySubmissionStatus
    | undefined;

  const submissions = await startJourneySubmissionController.list({
    status,
  });

  return jsonResponse(submissions);
});
