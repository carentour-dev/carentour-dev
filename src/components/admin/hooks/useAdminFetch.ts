"use client";

import { QueryKey, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  init?: RequestInit,
): Promise<T> {
  let {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      throw new Error("Please sign in again to access admin tools.");
    }
    session = data.session;
  }

  const authHeaders = session.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  const response = await fetch(input, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...authHeaders,
      ...(init?.headers ?? {}),
    },
  });

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
