export const dynamic = "force-dynamic";

import { z } from "zod";

import {
  answerKnowledgeQuestion,
  type AnswerKnowledgeQuestionInput,
} from "@/server/modules/operationsCntAi/knowledge";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";

const CNT_AI_PERMISSIONS = {
  allPermissions: ["operations.access", "operations.shared"],
} as const;

const querySchema = z.object({
  question: z
    .string()
    .min(3, "Question must contain at least 3 characters")
    .max(2000, "Question is too long"),
  fileIds: z
    .array(z.string().uuid("Each document id must be a valid UUID"))
    .min(1, "Select at least one document")
    .max(6, "Too many documents selected"),
});

export const POST = adminRoute(async (req, ctx) => {
  const raw = await req.json();
  const payload = querySchema.parse(raw) as AnswerKnowledgeQuestionInput;

  const result = await answerKnowledgeQuestion({
    auth: ctx.auth,
    question: payload.question,
    fileIds: payload.fileIds,
  });

  return jsonResponse(result);
}, CNT_AI_PERMISSIONS);
