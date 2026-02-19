import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";

export type CounterpartySyncMode = "dry_run" | "apply";
export type CounterpartySyncSourceType = "service_provider" | "hotel" | "all";

export type CounterpartySyncActor = {
  userId?: string | null;
  profileId?: string | null;
  permissions?: string[] | null;
};

type CounterpartySyncError = {
  sourceType: "service_provider" | "hotel";
  sourceId: string;
  message: string;
};

type CounterpartySyncCounters = {
  created: number;
  updated: number;
  deactivated: number;
  skipped: number;
  errors: number;
};

type ReconcileCounterpartiesInput = {
  mode: CounterpartySyncMode;
  sourceType?: CounterpartySyncSourceType;
  sourceIds?: string[];
  limit?: number | null;
  actor?: CounterpartySyncActor;
};

type SyncResult = {
  mode: CounterpartySyncMode;
  sourceType: CounterpartySyncSourceType;
  counters: CounterpartySyncCounters;
  errors: CounterpartySyncError[];
  startedAt: string;
  finishedAt: string;
};

const SYNCABLE_FIELDS = [
  "name",
  "kind",
  "contact_email",
  "contact_phone",
  "external_code",
  "is_active",
] as const;

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const normalizeText = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizePhone = (value: unknown) => normalizeText(value);

const pickContactValue = (
  contactInfo: unknown,
  keys: string[],
): string | null => {
  const record = toRecord(contactInfo);
  for (const key of keys) {
    const value = record[key];
    const normalized =
      key.toLowerCase().includes("phone") || key === "mobile"
        ? normalizePhone(value)
        : normalizeText(value);
    if (normalized) {
      return normalized;
    }
  }
  return null;
};

const parseProviderKind = (facilityType: unknown) => {
  const value = normalizeText(facilityType)?.toLowerCase();
  if (!value) {
    return "service_provider";
  }
  if (value.includes("hospital")) {
    return "hospital";
  }
  return "service_provider";
};

const sourceSnapshotFromProvider = (row: any) => ({
  source_type: "service_provider",
  source_id: row.id,
  name: normalizeText(row.name),
  kind: parseProviderKind(row.facility_type),
  contact_email: pickContactValue(row.contact_info, [
    "email",
    "contact_email",
    "contactEmail",
    "primary_email",
    "primaryEmail",
  ]),
  contact_phone: pickContactValue(row.contact_info, [
    "phone",
    "contact_phone",
    "contactPhone",
    "mobile",
    "telephone",
  ]),
  external_code: normalizeText(row.slug),
  is_active: typeof row.is_partner === "boolean" ? row.is_partner : true,
  source_updated_at: row.updated_at ?? null,
});

const sourceSnapshotFromHotel = (row: any) => ({
  source_type: "hotel",
  source_id: row.id,
  name: normalizeText(row.name),
  kind: "hotel",
  contact_email: pickContactValue(row.contact_info, [
    "email",
    "contact_email",
    "contactEmail",
    "primary_email",
    "primaryEmail",
  ]),
  contact_phone: pickContactValue(row.contact_info, [
    "phone",
    "contact_phone",
    "contactPhone",
    "mobile",
    "telephone",
  ]),
  external_code: normalizeText(row.slug),
  is_active: typeof row.is_partner === "boolean" ? row.is_partner : true,
  source_updated_at: row.updated_at ?? null,
});

const valuesEqual = (a: unknown, b: unknown) => {
  if (a === b) {
    return true;
  }
  if ((a === null || a === undefined) && (b === null || b === undefined)) {
    return true;
  }
  return false;
};

const computeSafeMergePatch = (existing: any, sourceSnapshot: any) => {
  const previousSnapshot = toRecord(existing.source_snapshot);
  const patch: Record<string, unknown> = {};

  for (const field of SYNCABLE_FIELDS) {
    const currentValue = existing[field] ?? null;
    const sourceValue = sourceSnapshot[field] ?? null;
    const previousSourceValue = previousSnapshot[field] ?? null;
    const isEmpty =
      currentValue === null ||
      currentValue === undefined ||
      (typeof currentValue === "string" && currentValue.trim().length === 0);

    if (isEmpty) {
      if (!valuesEqual(currentValue, sourceValue)) {
        patch[field] = sourceValue;
      }
      continue;
    }

    if (valuesEqual(currentValue, previousSourceValue)) {
      if (!valuesEqual(currentValue, sourceValue)) {
        patch[field] = sourceValue;
      }
      continue;
    }
  }

  const previousSnapshotJson = JSON.stringify(previousSnapshot);
  const nextSnapshotJson = JSON.stringify(sourceSnapshot);
  if (previousSnapshotJson !== nextSnapshotJson) {
    patch.source_snapshot = sourceSnapshot;
  }

  if (Object.keys(patch).length > 0) {
    patch.last_synced_at = new Date().toISOString();
  }

  return patch;
};

const writeSyncAuditEvent = async (input: {
  supabase: any;
  mode: CounterpartySyncMode;
  actor?: CounterpartySyncActor;
  payload: Record<string, unknown>;
}) => {
  const { error } = await input.supabase.from("finance_audit_events").insert({
    entity_type: "finance_counterparty_sync",
    entity_id: null,
    action:
      input.mode === "dry_run"
        ? "counterparty_sync_dry_run"
        : "counterparty_sync_applied",
    actor_user_id: input.actor?.userId ?? null,
    actor_profile_id: input.actor?.profileId ?? null,
    payload: input.payload,
  });

  if (error) {
    throw new ApiError(500, "Failed to record sync audit event", error.message);
  }
};

const upsertCounterpartyFromSource = async (input: {
  supabase: any;
  mode: CounterpartySyncMode;
  sourceType: "service_provider" | "hotel";
  sourceRow: any;
  counters: CounterpartySyncCounters;
}) => {
  const sourceSnapshot =
    input.sourceType === "service_provider"
      ? sourceSnapshotFromProvider(input.sourceRow)
      : sourceSnapshotFromHotel(input.sourceRow);

  const fkField =
    input.sourceType === "service_provider"
      ? "service_provider_id"
      : "hotel_id";

  const { data: existing, error: existingError } = await input.supabase
    .from("finance_counterparties")
    .select("*")
    .eq(fkField, input.sourceRow.id)
    .maybeSingle();

  if (existingError) {
    throw new ApiError(
      500,
      "Failed to resolve linked counterparty",
      existingError.message,
    );
  }

  if (!existing) {
    if (input.mode === "dry_run") {
      input.counters.created += 1;
      return;
    }

    const insertPayload = {
      name: sourceSnapshot.name ?? `Linked ${input.sourceType}`,
      kind: sourceSnapshot.kind,
      service_provider_id:
        input.sourceType === "service_provider" ? input.sourceRow.id : null,
      hotel_id: input.sourceType === "hotel" ? input.sourceRow.id : null,
      external_code: sourceSnapshot.external_code,
      is_active:
        typeof sourceSnapshot.is_active === "boolean"
          ? sourceSnapshot.is_active
          : true,
      contact_email: sourceSnapshot.contact_email,
      contact_phone: sourceSnapshot.contact_phone,
      source_type: input.sourceType,
      source_snapshot: sourceSnapshot,
      last_synced_at: new Date().toISOString(),
      metadata: {
        sync: {
          linked: true,
          source_type: input.sourceType,
        },
      },
    };

    const { error: insertError } = await input.supabase
      .from("finance_counterparties")
      .insert(insertPayload);

    if (insertError) {
      throw new ApiError(
        500,
        "Failed to create linked counterparty",
        insertError.message,
      );
    }

    input.counters.created += 1;
    return;
  }

  const patch = computeSafeMergePatch(existing, sourceSnapshot);
  if (Object.keys(patch).length === 0) {
    input.counters.skipped += 1;
    return;
  }

  if (input.mode === "dry_run") {
    input.counters.updated += 1;
    return;
  }

  const { error: updateError } = await input.supabase
    .from("finance_counterparties")
    .update(patch)
    .eq("id", existing.id);

  if (updateError) {
    throw new ApiError(
      500,
      "Failed to update linked counterparty",
      updateError.message,
    );
  }

  input.counters.updated += 1;
};

const deactivateOrphanedCounterparties = async (input: {
  supabase: any;
  mode: CounterpartySyncMode;
  sourceType: "service_provider" | "hotel";
  sourceIds: Set<string>;
  counters: CounterpartySyncCounters;
}) => {
  const fkField =
    input.sourceType === "service_provider"
      ? "service_provider_id"
      : "hotel_id";

  const { data: linkedRows, error } = await input.supabase
    .from("finance_counterparties")
    .select("id, is_active, source_snapshot, service_provider_id, hotel_id")
    .eq("source_type", input.sourceType)
    .not(fkField, "is", null);

  if (error) {
    throw new ApiError(
      500,
      "Failed to load linked counterparties for orphan scan",
      error.message,
    );
  }

  for (const row of linkedRows ?? []) {
    const linkedSourceId =
      input.sourceType === "service_provider"
        ? row.service_provider_id
        : row.hotel_id;

    if (typeof linkedSourceId !== "string") {
      continue;
    }

    if (input.sourceIds.has(linkedSourceId)) {
      continue;
    }

    const alreadyInactive = row.is_active === false;
    const snapshot = toRecord(row.source_snapshot);
    const alreadyMarkedDeleted = snapshot.deleted === true;

    if (alreadyInactive && alreadyMarkedDeleted) {
      input.counters.skipped += 1;
      continue;
    }

    if (input.mode === "dry_run") {
      input.counters.deactivated += 1;
      continue;
    }

    const nextSnapshot = {
      ...snapshot,
      deleted: true,
      deleted_at: new Date().toISOString(),
    };

    const { error: updateError } = await input.supabase
      .from("finance_counterparties")
      .update({
        is_active: false,
        source_snapshot: nextSnapshot,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (updateError) {
      throw new ApiError(
        500,
        "Failed to deactivate orphaned counterparty",
        updateError.message,
      );
    }

    input.counters.deactivated += 1;
  }
};

const loadSourceRows = async (input: {
  supabase: any;
  sourceType: "service_provider" | "hotel";
  sourceIds?: string[];
  limit?: number | null;
}) => {
  if (input.sourceType === "service_provider") {
    let query = input.supabase
      .from("service_providers")
      .select(
        "id, name, slug, facility_type, contact_info, is_partner, updated_at",
      )
      .order("created_at", { ascending: false });

    if (Array.isArray(input.sourceIds) && input.sourceIds.length > 0) {
      query = query.in("id", input.sourceIds);
    }

    if (typeof input.limit === "number" && input.limit > 0) {
      query = query.limit(input.limit);
    }

    const { data, error } = await query;
    if (error) {
      throw new ApiError(
        500,
        "Failed to load service providers for sync",
        error.message,
      );
    }
    return data ?? [];
  }

  let query = input.supabase
    .from("hotels")
    .select("id, name, slug, contact_info, is_partner, updated_at")
    .order("created_at", { ascending: false });

  if (Array.isArray(input.sourceIds) && input.sourceIds.length > 0) {
    query = query.in("id", input.sourceIds);
  }

  if (typeof input.limit === "number" && input.limit > 0) {
    query = query.limit(input.limit);
  }

  const { data, error } = await query;
  if (error) {
    throw new ApiError(500, "Failed to load hotels for sync", error.message);
  }
  return data ?? [];
};

const shouldRunOrphanScan = (input: {
  sourceIds?: string[];
  limit?: number | null;
}) => {
  const hasScopedIds =
    Array.isArray(input.sourceIds) && input.sourceIds.length > 0;
  const hasLimit = typeof input.limit === "number" && input.limit > 0;
  return !hasScopedIds && !hasLimit;
};

const toUniqueIds = (values?: string[]) =>
  Array.from(
    new Set(
      (values ?? []).filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      ),
    ),
  );

const resolveLinkedCounterpartyIds = async (input: {
  supabase: any;
  sourceType: "service_provider" | "hotel";
  sourceId: string;
  hintIds?: string[];
}) => {
  const hintedIds = toUniqueIds(input.hintIds);
  if (hintedIds.length > 0) {
    return hintedIds;
  }

  const fkField =
    input.sourceType === "service_provider"
      ? "service_provider_id"
      : "hotel_id";
  const selectColumns =
    input.sourceType === "service_provider"
      ? "id,service_provider_id,source_snapshot"
      : "id,hotel_id,source_snapshot";

  const { data, error } = await input.supabase
    .from("finance_counterparties")
    .select(selectColumns)
    .eq("source_type", input.sourceType);

  if (error) {
    throw new ApiError(
      500,
      "Failed to resolve linked counterparties",
      error.message,
    );
  }

  return toUniqueIds(
    (data ?? [])
      .filter((row: any) => {
        const linkedId = normalizeText(row[fkField]);
        const snapshotSourceId = normalizeText(
          toRecord(row.source_snapshot).source_id,
        );
        return (
          linkedId === input.sourceId || snapshotSourceId === input.sourceId
        );
      })
      .map((row: any) => row.id),
  );
};

const deactivateLinkedCounterparties = async (input: {
  supabase: any;
  sourceType: "service_provider" | "hotel";
  sourceId: string;
  counterpartyIds: string[];
}) => {
  const counterpartyIds = toUniqueIds(input.counterpartyIds);
  if (counterpartyIds.length === 0) {
    return 0;
  }

  const now = new Date().toISOString();
  const { error } = await input.supabase
    .from("finance_counterparties")
    .update({
      is_active: false,
      last_synced_at: now,
      source_snapshot: {
        source_type: input.sourceType,
        source_id: input.sourceId,
        deleted: true,
        deleted_at: now,
      },
    })
    .in("id", counterpartyIds);

  if (error) {
    throw new ApiError(
      500,
      "Failed to deactivate linked counterparties",
      error.message,
    );
  }

  return counterpartyIds.length;
};

export const financeCounterpartySync = {
  async syncServiceProviderEvent(serviceProviderId: string) {
    const supabase = getSupabaseAdmin() as any;
    const rows = await loadSourceRows({
      supabase,
      sourceType: "service_provider",
      sourceIds: [serviceProviderId],
    });

    if (rows.length === 0) {
      return { synced: false };
    }

    const counters: CounterpartySyncCounters = {
      created: 0,
      updated: 0,
      deactivated: 0,
      skipped: 0,
      errors: 0,
    };

    await upsertCounterpartyFromSource({
      supabase,
      mode: "apply",
      sourceType: "service_provider",
      sourceRow: rows[0],
      counters,
    });

    return { synced: true, counters };
  },

  async syncHotelEvent(hotelId: string) {
    const supabase = getSupabaseAdmin() as any;
    const rows = await loadSourceRows({
      supabase,
      sourceType: "hotel",
      sourceIds: [hotelId],
    });

    if (rows.length === 0) {
      return { synced: false };
    }

    const counters: CounterpartySyncCounters = {
      created: 0,
      updated: 0,
      deactivated: 0,
      skipped: 0,
      errors: 0,
    };

    await upsertCounterpartyFromSource({
      supabase,
      mode: "apply",
      sourceType: "hotel",
      sourceRow: rows[0],
      counters,
    });

    return { synced: true, counters };
  },

  async captureServiceProviderLinkedCounterparties(serviceProviderId: string) {
    const supabase = getSupabaseAdmin() as any;
    return resolveLinkedCounterpartyIds({
      supabase,
      sourceType: "service_provider",
      sourceId: serviceProviderId,
    });
  },

  async captureHotelLinkedCounterparties(hotelId: string) {
    const supabase = getSupabaseAdmin() as any;
    return resolveLinkedCounterpartyIds({
      supabase,
      sourceType: "hotel",
      sourceId: hotelId,
    });
  },

  async deactivateServiceProviderLink(
    serviceProviderId: string,
    options?: { counterpartyIds?: string[] },
  ) {
    const supabase = getSupabaseAdmin() as any;
    const counterpartyIds = await resolveLinkedCounterpartyIds({
      supabase,
      sourceType: "service_provider",
      sourceId: serviceProviderId,
      hintIds: options?.counterpartyIds,
    });

    const deactivated = await deactivateLinkedCounterparties({
      supabase,
      sourceType: "service_provider",
      sourceId: serviceProviderId,
      counterpartyIds,
    });

    return { deactivated };
  },

  async deactivateHotelLink(
    hotelId: string,
    options?: { counterpartyIds?: string[] },
  ) {
    const supabase = getSupabaseAdmin() as any;
    const counterpartyIds = await resolveLinkedCounterpartyIds({
      supabase,
      sourceType: "hotel",
      sourceId: hotelId,
      hintIds: options?.counterpartyIds,
    });

    const deactivated = await deactivateLinkedCounterparties({
      supabase,
      sourceType: "hotel",
      sourceId: hotelId,
      counterpartyIds,
    });

    return { deactivated };
  },

  async reconcile(input: ReconcileCounterpartiesInput): Promise<SyncResult> {
    const supabase = getSupabaseAdmin() as any;
    const startedAt = new Date().toISOString();
    const mode: CounterpartySyncMode = input.mode;
    const sourceType: CounterpartySyncSourceType = input.sourceType ?? "all";
    const counters: CounterpartySyncCounters = {
      created: 0,
      updated: 0,
      deactivated: 0,
      skipped: 0,
      errors: 0,
    };
    const errors: CounterpartySyncError[] = [];

    const sourceTypes: Array<"service_provider" | "hotel"> =
      sourceType === "all" ? ["service_provider", "hotel"] : [sourceType];

    for (const currentSourceType of sourceTypes) {
      let rows: any[] = [];
      try {
        rows = await loadSourceRows({
          supabase,
          sourceType: currentSourceType,
          sourceIds: input.sourceIds,
          limit: input.limit ?? null,
        });
      } catch (error) {
        counters.errors += 1;
        errors.push({
          sourceType: currentSourceType,
          sourceId: "batch",
          message: error instanceof Error ? error.message : "Unknown error",
        });
        continue;
      }

      for (const row of rows) {
        try {
          await upsertCounterpartyFromSource({
            supabase,
            mode,
            sourceType: currentSourceType,
            sourceRow: row,
            counters,
          });
        } catch (error) {
          counters.errors += 1;
          errors.push({
            sourceType: currentSourceType,
            sourceId: row.id,
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      if (!shouldRunOrphanScan(input)) {
        continue;
      }

      try {
        const sourceIds = new Set<string>(
          rows
            .map((row) => row.id)
            .filter(
              (value: unknown): value is string => typeof value === "string",
            ),
        );
        await deactivateOrphanedCounterparties({
          supabase,
          mode,
          sourceType: currentSourceType,
          sourceIds,
          counters,
        });
      } catch (error) {
        counters.errors += 1;
        errors.push({
          sourceType: currentSourceType,
          sourceId: "orphan_scan",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const finishedAt = new Date().toISOString();
    await writeSyncAuditEvent({
      supabase,
      mode,
      actor: input.actor,
      payload: {
        source_type: sourceType,
        source_ids: input.sourceIds ?? [],
        limit: input.limit ?? null,
        counters,
        errors,
        started_at: startedAt,
        finished_at: finishedAt,
      },
    });

    return {
      mode,
      sourceType,
      counters,
      errors,
      startedAt,
      finishedAt,
    };
  },
};
