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
  channel: z.enum(["email", "whatsapp", "sms"]).optional(),
  language: z
    .string()
    .min(2, "Language must be at least 2 characters")
    .max(40, "Language is too long")
    .optional(),
  guidance: z.string().max(600, "Guidance is too long").optional(),
  checklist: z
    .array(
      z
        .string()
        .min(2, "Checklist entry is too short")
        .max(400, "Checklist entry is too long"),
    )
    .max(6, "Too many checklist entries")
    .optional(),
  mode: z.enum(["draft", "rewrite", "insights"]).optional(),
  previousDraft: z.string().max(4000, "Previous draft is too long").optional(),
  rewriteStyle: z
    .string()
    .max(400, "Rewrite instructions are too long")
    .optional(),
});

export const POST = adminRoute(async (req: NextRequest) => {
  const rawPayload = await req.json();
  const payload = requestSchema.parse(rawPayload) as GenerateCntAiReplyInput;

  const result = await generateCntAiReply(payload);
  return jsonResponse(result);
}, CNT_AI_PERMISSIONS);
