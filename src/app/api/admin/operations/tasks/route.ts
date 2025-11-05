export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { operationsTaskController } from "@/server/modules/operationsTasks/module";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { ApiError } from "@/server/utils/errors";

const TASKS_PERMISSIONS = {
  allPermissions: ["operations.access", "operations.shared"],
} as const;

export const GET = adminRoute(async (_req, ctx) => {
  const userId = ctx.auth?.user.id;

  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const tasks = await operationsTaskController.list(userId);
  return jsonResponse(tasks);
}, TASKS_PERMISSIONS);

export const POST = adminRoute(async (req: NextRequest, ctx) => {
  const userId = ctx.auth?.user.id;

  if (!userId) {
    throw new ApiError(401, "Missing authenticated user");
  }

  const ownerContext = {
    userId,
    profileId: ctx.auth?.profileId ?? null,
  };

  const payload = await req.json();
  const task = await operationsTaskController.create(payload, ownerContext);

  return jsonResponse(task, 201);
}, TASKS_PERMISSIONS);
