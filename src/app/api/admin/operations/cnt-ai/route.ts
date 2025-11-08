export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import {
  generateCntAiReply,
  type GenerateCntAiReplyInput,
} from "@/server/modules/operationsCntAi/module";

const CNT_AI_PERMISSIONS = {
  allPermissions: ["operations.access", "operations.shared"],
} as const;

const requestSchema = z.object({
  message: z
    .string()
    .min(1, "Message is required")
    .max(4000, "Message is too long"),
  tone: z
    .string()
    .min(2, "Tone must be at least 2 characters")
    .max(50, "Tone is too long")
    .optional(),
});

export const POST = adminRoute(async (req: NextRequest) => {
  const rawPayload = await req.json();
  const payload = requestSchema.parse(rawPayload) as GenerateCntAiReplyInput;

  const result = await generateCntAiReply(payload);
  return jsonResponse(result);
}, CNT_AI_PERMISSIONS);
