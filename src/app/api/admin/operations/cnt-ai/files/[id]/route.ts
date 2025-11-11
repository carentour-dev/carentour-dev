export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { z } from "zod";

import { deleteKnowledgeFile } from "@/server/modules/operationsCntAi/knowledge";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";

const CNT_AI_PERMISSIONS = {
  allPermissions: ["operations.access", "operations.shared"],
} as const;

export const DELETE = adminRoute(async (_req, ctx) => {
  const params = ctx.params ?? {};
  const rawId = z
    .string({
      required_error: "Document id is required",
      invalid_type_error: "Document id is required",
    })
    .min(1, "Document id is required")
    .max(256, "Document id is too long")
    .parse(params.id)
    .trim();

  const uuidResult = z.string().uuid().safeParse(rawId);
  const id = uuidResult.success ? uuidResult.data : rawId;

  await deleteKnowledgeFile({
    auth: ctx.auth,
    fileId: id,
  });

  return jsonResponse({ success: true });
}, CNT_AI_PERMISSIONS);
