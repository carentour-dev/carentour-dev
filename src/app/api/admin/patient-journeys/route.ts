export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { patientJourneyController } from "@/server/modules/patientJourneys/module";
import type { PatientJourneyStatus } from "@/server/modules/patientJourneys/module";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";

const JOURNEY_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.patient_journeys.read"],
} as const;

const statusValues = ["active", "completed", "cancelled"] as const;
const uuidSchema = z.string().uuid();

const parseStatus = (value: string | null): PatientJourneyStatus | undefined =>
  value && statusValues.includes(value as PatientJourneyStatus)
    ? (value as PatientJourneyStatus)
    : undefined;

const parseUuidQuery = (value: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }
  const result = uuidSchema.safeParse(value);
  return result.success ? result.data : undefined;
};

const parseAssignedQuery = (
  value: string | null,
  currentProfileId: string | null | undefined,
): string | null | undefined => {
  if (!value) {
    return undefined;
  }
  if (value === "me") {
    return currentProfileId ?? undefined;
  }
  if (value === "unassigned") {
    return null;
  }
  return parseUuidQuery(value);
};

export const GET = adminRoute(async (req: NextRequest, ctx) => {
  const assignedParam = req.nextUrl.searchParams.get("assignedTo");

  if (assignedParam === "me" && !ctx.auth?.profileId) {
    return jsonResponse([]);
  }

  const journeys = await patientJourneyController.list(
    {
      status: parseStatus(req.nextUrl.searchParams.get("status")),
      patientId: parseUuidQuery(req.nextUrl.searchParams.get("patientId")),
      assignedTo: parseAssignedQuery(assignedParam, ctx.auth?.profileId),
    },
    ctx.auth,
  );

  return jsonResponse(journeys);
}, JOURNEY_PERMISSIONS);
