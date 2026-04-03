import { useQuery } from "@tanstack/react-query";

import type { PublicLocale } from "@/i18n/routing";
import type { CmsBlogPreviewData } from "@/lib/cms/previewData";

async function fetchCmsBlogPreviewData(input: {
  pageSlug: string;
  locale: PublicLocale;
  authToken: string;
}): Promise<CmsBlogPreviewData> {
  const searchParams = new URLSearchParams({
    pageSlug: input.pageSlug,
    locale: input.locale,
  });
  const response = await fetch(`/api/cms/preview/data?${searchParams}`, {
    headers: {
      Authorization: `Bearer ${input.authToken}`,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      typeof payload?.error === "string" && payload.error.trim().length > 0
        ? payload.error
        : "Failed to load preview data.";
    throw new Error(message);
  }

  return (await response.json()) as CmsBlogPreviewData;
}

export function useCmsBlogPreviewData(input: {
  pageSlug?: string;
  locale: PublicLocale;
  authToken?: string;
  enabled?: boolean;
}) {
  const enabled =
    (input.enabled ?? true) && Boolean(input.pageSlug && input.authToken);
  const query = useQuery({
    queryKey: ["cms-blog-preview", input.pageSlug, input.locale],
    queryFn: () =>
      fetchCmsBlogPreviewData({
        pageSlug: input.pageSlug!,
        locale: input.locale,
        authToken: input.authToken!,
      }),
    enabled,
    retry: false,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
  };
}
