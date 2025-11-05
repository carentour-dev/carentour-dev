import { NextRequest } from "next/server";
import { operationsTaskController } from "@/server/modules/operationsTasks/module";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { ApiError } from "@/server/utils/errors";

const TASKS_PERMISSIONS = {
  allPermissions: ["operations.access", "operations.shared"],
} as const;

export const PATCH = adminRoute(async (req: NextRequest, ctx) => {
  const userId = ctx.auth?.user.id;

  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const taskId = ctx.params?.id;
  const payload = await req.json();

  const updatedTask = await operationsTaskController.update(taskId, payload, {
    userId,
    profileId: ctx.auth?.profileId ?? null,
  });

  return jsonResponse(updatedTask);
}, TASKS_PERMISSIONS);

export const DELETE = adminRoute(async (_req, ctx) => {
  const userId = ctx.auth?.user.id;

  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const taskId = ctx.params?.id;

  await operationsTaskController.remove(taskId, {
    userId,
    profileId: ctx.auth?.profileId ?? null,
  });

  return jsonResponse({ success: true });
}, TASKS_PERMISSIONS);
