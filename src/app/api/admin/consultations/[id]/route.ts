"use server";

import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { patientConsultationController } from "@/server/modules/patientConsultations/module";

export const PATCH = adminRoute(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const payload = await req.json();
  const consultation = await patientConsultationController.update(params.id, payload);
  return jsonResponse(consultation);
});

export const DELETE = adminRoute(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const result = await patientConsultationController.delete(params.id);
  return jsonResponse(result);
});
