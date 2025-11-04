"use server";

import { NextRequest } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import {
  consultationStatusValues,
  patientConsultationController,
} from "@/server/modules/patientConsultations/module";

const CONSULTATION_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.consultations"],
} as const;

const assignedToSchema = z.string().uuid();

const isValidStatus = (
  value: string | null,
): value is (typeof consultationStatusValues)[number] => {
  if (!value) return false;
  return consultationStatusValues.includes(
    value as (typeof consultationStatusValues)[number],
  );
};

export const GET = adminRoute(async (req: NextRequest, ctx) => {
  const params = req.nextUrl.searchParams;

  const filters: {
    status?: (typeof consultationStatusValues)[number];
    patientId?: string;
    contactRequestId?: string;
    upcomingOnly?: boolean;
    coordinatorId?: string | null;
  } = {};

  const statusParam = params.get("status");
  const patientId = params.get("patientId");
  const contactRequestId = params.get("contactRequestId");
  const upcomingOnly = params.get("upcomingOnly");
  const assignedToParam = params.get("assignedTo");

  if (isValidStatus(statusParam)) {
    filters.status = statusParam;
  }

  if (patientId && patientId.trim().length > 0) {
    filters.patientId = patientId.trim();
  }

  if (contactRequestId && contactRequestId.trim().length > 0) {
    filters.contactRequestId = contactRequestId.trim();
  }

  if (upcomingOnly !== null) {
    filters.upcomingOnly = upcomingOnly === "true";
  }

  if (assignedToParam) {
    if (assignedToParam === "me") {
      const currentProfileId = ctx.auth?.profileId ?? null;
      if (currentProfileId) {
        filters.coordinatorId = currentProfileId;
      }
    } else if (assignedToParam === "unassigned") {
      filters.coordinatorId = null;
    } else {
      const normalized = assignedToParam.trim();
      if (normalized.length > 0) {
        try {
          filters.coordinatorId = assignedToSchema.parse(normalized);
        } catch {
          // ignore invalid UUID inputs
        }
      }
    }
  }

  const consultations = await patientConsultationController.list(filters);
  return jsonResponse(consultations);
}, CONSULTATION_PERMISSIONS);

export const POST = adminRoute(async (req: NextRequest) => {
  const payload = await req.json();
  const consultation = await patientConsultationController.create(payload);
  return jsonResponse(consultation);
}, CONSULTATION_PERMISSIONS);
