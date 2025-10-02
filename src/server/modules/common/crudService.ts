import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

// Generic wrapper around Supabase CRUD so feature modules stay concise.
export class CrudService<TableName extends keyof Tables> {
  constructor(
    private readonly table: TableName,
    private readonly entityLabel: string,
    private readonly selectColumns: string = "*",
  ) {}

  async list() {
    const { data, error } = await getSupabaseAdmin()
      .from(this.table as string)
      .select(this.selectColumns)
      .order("created_at", { ascending: false });

    if (error) {
      throw new ApiError(500, `Failed to fetch ${this.entityLabel} list`, error.message);
    }

    return data as Tables[TableName]["Row"][];
  }

  async getById(id: string) {
    const { data, error } = await getSupabaseAdmin()
      .from(this.table as string)
      .select(this.selectColumns)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new ApiError(500, `Failed to load ${this.entityLabel}`, error.message);
    }

    if (!data) {
      throw new ApiError(404, `${this.entityLabel} not found`);
    }

    return data as Tables[TableName]["Row"];
  }

  async create(input: Tables[TableName]["Insert"]) {
    const { data, error } = await getSupabaseAdmin()
      .from(this.table as string)
      .insert(input)
      .select(this.selectColumns)
      .single();

    if (error) {
      throw new ApiError(500, `Failed to create ${this.entityLabel}`, error.message);
    }

    return data as Tables[TableName]["Row"];
  }

  async update(id: string, input: Tables[TableName]["Update"]) {
    const { data, error } = await getSupabaseAdmin()
      .from(this.table as string)
      .update(input)
      .eq("id", id)
      .select(this.selectColumns)
      .maybeSingle();

    if (error) {
      throw new ApiError(500, `Failed to update ${this.entityLabel}`, error.message);
    }

    if (!data) {
      throw new ApiError(404, `${this.entityLabel} not found`);
    }

    return data as Tables[TableName]["Row"];
  }

  async remove(id: string) {
    const { data, error } = await getSupabaseAdmin()
      .from(this.table as string)
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
