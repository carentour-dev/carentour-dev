"use server";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import {
  consultationStatusValues,
  patientConsultationController,
} from "@/server/modules/patientConsultations/module";

const isValidStatus = (
  value: string | null,
): value is (typeof consultationStatusValues)[number] => {
  if (!value) return false;
  return consultationStatusValues.includes(
    value as (typeof consultationStatusValues)[number],
  );
};

export const GET = adminRoute(async (req: NextRequest) => {
  const params = req.nextUrl.searchParams;

  const filters: {
    status?: (typeof consultationStatusValues)[number];
    patientId?: string;
    contactRequestId?: string;
    upcomingOnly?: boolean;
  } = {};

  const statusParam = params.get("status");
  const patientId = params.get("patientId");
  const contactRequestId = params.get("contactRequestId");
  const upcomingOnly = params.get("upcomingOnly");

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

  const consultations = await patientConsultationController.list(filters);
  return jsonResponse(consultations);
});

export const POST = adminRoute(async (req: NextRequest) => {
  const payload = await req.json();
  const consultation = await patientConsultationController.create(payload);
  return jsonResponse(consultation);
});
