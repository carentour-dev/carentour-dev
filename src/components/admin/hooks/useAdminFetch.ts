"use client";

import { QueryKey, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_ADMIN_FETCH_TIMEOUT_MS = 15000;

type AdminFetchInit = RequestInit & {
  timeoutMs?: number;
};

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

// Centralised helpers keep admin data fetching consistent across pages.
export function useAdminInvalidate() {
  const queryClient = useQueryClient();

  const invalidate = (key: QueryKey) => {
    void queryClient.invalidateQueries({ queryKey: key });
  };

  return invalidate;
}

export async function adminFetch<T>(
  input: RequestInfo,
  init?: AdminFetchInit,
): Promise<T> {
  const {
    timeoutMs = DEFAULT_ADMIN_FETCH_TIMEOUT_MS,
    signal,
    ...requestInit
  } = init ?? {};

  let {
    data: { session },
  } = await withTimeout(
    supabase.auth.getSession(),
    timeoutMs,
    "Timed out while restoring the admin session. Refresh the page and sign in again if this continues.",
  );

  if (!session) {
    const { data, error } = await withTimeout(
      supabase.auth.refreshSession(),
      timeoutMs,
      "Timed out while refreshing the admin session. Please sign in again.",
    );

    if (error || !data.session) {
      throw new Error("Please sign in again to access admin tools.");
    }
    session = data.session;
  }

  const authHeaders = session.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  const isFormData =
    typeof FormData !== "undefined" && requestInit.body instanceof FormData;

  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId =
    controller && timeoutMs > 0
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null;

  const abortFromCaller = () => controller?.abort(signal?.reason);

  if (signal?.aborted) {
    abortFromCaller();
  } else {
    signal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  let response: Response;

  try {
    response = await fetch(input, {
      ...requestInit,
      signal: controller?.signal ?? signal,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...authHeaders,
        ...(requestInit.headers ?? {}),
      },
    });
  } catch (error) {
    if (controller?.signal.aborted && !signal?.aborted) {
      throw new Error(
        "Admin request timed out. Retry the request or refresh the page.",
      );
    }

    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    signal?.removeEventListener("abort", abortFromCaller);
  }

  if (!response.ok) {
    // Bubble up readable errors so UI components can show toasts/messages.
    const rawBody = await response.text();
    let payload: any = null;

    try {
      payload = rawBody ? JSON.parse(rawBody) : null;
    } catch (parseError) {
      console.error("Admin request failed:", response.status, rawBody);
    }

    const message = payload?.error ?? `Request failed (${response.status})`;
    const details =
      typeof payload?.details === "string"
        ? payload.details
        : typeof payload?.details?.message === "string"
          ? payload.details.message
          : null;

    throw new Error(details ? `${message}: ${details}` : message);
  }

  const json = (await response.json()) as { data: T };
  return json.data;
}
