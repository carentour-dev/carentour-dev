export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { ApiError } from "@/server/utils/errors";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import {
  listKnowledgeFiles,
  uploadKnowledgeFile,
} from "@/server/modules/operationsCntAi/knowledge";

const CNT_AI_PERMISSIONS = {
  allPermissions: ["operations.access", "operations.shared"],
} as const;

export const GET = adminRoute(async (_req, ctx) => {
  const files = await listKnowledgeFiles(ctx.auth);
  return jsonResponse(files);
}, CNT_AI_PERMISSIONS);

export const POST = adminRoute(async (req, ctx) => {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new ApiError(400, "File is required");
  }

  const uploaded = await uploadKnowledgeFile({
    auth: ctx.auth,
    file,
  });

  return jsonResponse(uploaded, 201);
}, CNT_AI_PERMISSIONS);
