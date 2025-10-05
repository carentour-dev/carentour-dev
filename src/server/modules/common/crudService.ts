import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

const MAX_SCHEMA_RETRIES = 3;

const extractMissingColumn = (message?: string): string | null => {
  if (!message) return null;

  const match = message.match(/Could not find the '([^']+)' column/);
  return match?.[1] ?? null;
};

const omitColumns = <T extends Record<string, unknown>>(input: T, columns: Set<string>): T => {
  if (columns.size === 0) {
    return input;
  }

  const clone: Record<string, unknown> = { ...input };
  for (const column of columns) {
    if (column in clone) {
      delete clone[column];
    }
  }

  return clone as T;
};

// Generic wrapper around Supabase CRUD so feature modules stay concise.
export class CrudService<TableName extends keyof Tables> {
  constructor(
    private readonly table: TableName,
    private readonly entityLabel: string,
    private readonly selectColumns: string = "*",
  ) {}

  async list() {
    const supabase = getSupabaseAdmin() as any;
    const { data, error } = await supabase
      .from(this.table)
      .select(this.selectColumns)
      .order("created_at", { ascending: false });

    if (error) {
      throw new ApiError(500, `Failed to fetch ${this.entityLabel} list`, error.message);
    }

    return data as unknown as Tables[TableName]["Row"][];
  }

  async getById(id: string) {
    const supabase = getSupabaseAdmin() as any;
    const { data, error } = await supabase
      .from(this.table)
      .select(this.selectColumns)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new ApiError(500, `Failed to load ${this.entityLabel}`, error.message);
    }

    if (!data) {
      throw new ApiError(404, `${this.entityLabel} not found`);
    }

    return data as unknown as Tables[TableName]["Row"];
  }

  async create(input: Tables[TableName]["Insert"]) {
    const supabase = getSupabaseAdmin() as any;
    const missingColumns = new Set<string>();

    for (let attempt = 0; attempt < MAX_SCHEMA_RETRIES; attempt++) {
      const sanitizedInput = omitColumns(input as Record<string, unknown>, missingColumns) as Tables[
        TableName
      ]["Insert"];

      const { data, error } = await supabase
        .from(this.table)
        .insert(sanitizedInput)
        .select(this.selectColumns)
        .single();

      if (!error) {
        return data as unknown as Tables[TableName]["Row"];
      }

      const missingColumn = extractMissingColumn(error.message);

      if (!missingColumn) {
        throw new ApiError(500, `Failed to create ${this.entityLabel}`, error.message);
      }

      missingColumns.add(missingColumn);
    }

    throw new ApiError(
      500,
      `Failed to create ${this.entityLabel}`,
      "Missing columns in Supabase schema prevented saving the record.",
    );
  }

  async update(id: string, input: Tables[TableName]["Update"]) {
    const supabase = getSupabaseAdmin() as any;
    const missingColumns = new Set<string>();

    for (let attempt = 0; attempt < MAX_SCHEMA_RETRIES; attempt++) {
      const sanitizedInput = omitColumns(input as Record<string, unknown>, missingColumns) as Tables[
        TableName
      ]["Update"];

      const { data, error } = await supabase
        .from(this.table)
        .update(sanitizedInput)
        .eq("id", id)
        .select(this.selectColumns)
        .maybeSingle();

      if (!error) {
        if (!data) {
          throw new ApiError(404, `${this.entityLabel} not found`);
        }

        return data as unknown as Tables[TableName]["Row"];
      }

      const missingColumn = extractMissingColumn(error.message);

      if (!missingColumn) {
        throw new ApiError(500, `Failed to update ${this.entityLabel}`, error.message);
      }

      missingColumns.add(missingColumn);
    }

    throw new ApiError(
      500,
      `Failed to update ${this.entityLabel}`,
      "Missing columns in Supabase schema prevented saving the record.",
    );
  }

  async remove(id: string) {
    const supabase = getSupabaseAdmin() as any;
    const { data, error } = await supabase
      .from(this.table)
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new ApiError(500, `Failed to delete ${this.entityLabel}`, error.message);
    }

    if (!data) {
      throw new ApiError(404, `${this.entityLabel} not found`);
    }

    return { success: true };
  }
}
