import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { ApiError } from "@/server/utils/errors";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

const STATUS_VALUES = ["pending", "in_progress", "done"] as const;

export const OPERATIONS_TASK_STATUSES = STATUS_VALUES;

const statusSchema = z.enum(STATUS_VALUES);

const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  description: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional(),
  status: statusSchema.optional(),
});

const updateTaskSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title cannot exceed 200 characters")
      .optional(),
    description: z
      .union([
        z.string().max(2000, "Description cannot exceed 2000 characters"),
        z.null(),
      ])
      .optional(),
    status: statusSchema.optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.description !== undefined ||
      value.status !== undefined,
    { message: "No fields provided for update" },
  );

type OperationsTaskRow =
  Database["public"]["Tables"]["operations_tasks"]["Row"];
type OperationsTaskInsert =
  Database["public"]["Tables"]["operations_tasks"]["Insert"];
type OperationsTaskUpdate =
  Database["public"]["Tables"]["operations_tasks"]["Update"];
export type OperationsTaskStatus =
  Database["public"]["Enums"]["operations_task_status"];

type TaskOwnerContext = {
  userId: string;
  profileId?: string | null;
};

const trim = (value: string) => value.trim();

const normalizeTitle = (value: string) => {
  const trimmed = trim(value);
  if (!trimmed) {
    throw new ApiError(422, "Task title cannot be empty");
  }
  return trimmed;
};

const normalizeDescription = (value?: string | null) => {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getClient = () => getSupabaseAdmin();

async function ensureOwner(owner?: TaskOwnerContext) {
  if (!owner?.userId) {
    throw new ApiError(401, "Operation requires an authenticated team member");
  }
  return owner;
}

export const operationsTaskController = {
  async list(ownerUserId: string): Promise<OperationsTaskRow[]> {
    const supabase = getClient();

    const { data, error } = await supabase
      .from("operations_tasks")
      .select("*")
      .eq("owner_user_id", ownerUserId)
      .order("status", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      throw new ApiError(500, "Failed to load tasks", error.message);
    }

    return data ?? [];
  },

  async create(
    payload: unknown,
    ownerContext?: TaskOwnerContext,
  ): Promise<OperationsTaskRow> {
    const owner = await ensureOwner(ownerContext);
    const supabase = getClient();

    const parsed = createTaskSchema.parse(payload);
    const title = normalizeTitle(parsed.title);
    const description = normalizeDescription(parsed.description);
    const status: OperationsTaskStatus = parsed.status ?? "pending";

    const insertPayload: OperationsTaskInsert = {
      owner_user_id: owner.userId,
      owner_profile_id: owner.profileId ?? null,
      title,
      description,
      status,
    };

    const { data, error } = await supabase
      .from("operations_tasks")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error || !data) {
      throw new ApiError(500, "Failed to create task", error?.message);
    }

    return data;
  },

  async update(
    taskId: unknown,
    payload: unknown,
    ownerContext?: TaskOwnerContext,
  ): Promise<OperationsTaskRow> {
    const owner = await ensureOwner(ownerContext);
    const supabase = getClient();

    const id = z.string().uuid("Invalid task id").parse(taskId);
    const parsed = updateTaskSchema.parse(payload);

    const updatePayload: OperationsTaskUpdate = {};

    if (parsed.title !== undefined) {
      updatePayload.title = normalizeTitle(parsed.title);
    }

    if (parsed.description !== undefined) {
      updatePayload.description = normalizeDescription(parsed.description);
    }

    if (parsed.status !== undefined) {
      updatePayload.status = parsed.status;
    }

    const { data, error } = await supabase
      .from("operations_tasks")
      .update(updatePayload)
      .eq("id", id)
      .eq("owner_user_id", owner.userId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new ApiError(500, "Failed to update task", error.message);
    }

    if (!data) {
      throw new ApiError(404, "Task not found");
    }

    return data;
  },

  async remove(
    taskId: unknown,
    ownerContext?: TaskOwnerContext,
  ): Promise<void> {
    const owner = await ensureOwner(ownerContext);
    const supabase = getClient();

    const id = z.string().uuid("Invalid task id").parse(taskId);

    const { error, data } = await supabase
      .from("operations_tasks")
      .delete()
      .eq("id", id)
      .eq("owner_user_id", owner.userId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new ApiError(500, "Failed to delete task", error.message);
    }

    if (!data) {
      throw new ApiError(404, "Task not found");
    }
  },
};
