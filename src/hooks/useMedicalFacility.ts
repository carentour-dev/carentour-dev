"use client";

import { useQuery } from "@tanstack/react-query";
import type { MedicalFacilityDetail } from "@/lib/medical-facilities";

type FetchError = Error & { status?: number };

const fetchMedicalFacility = async (
  slug: string,
): Promise<MedicalFacilityDetail> => {
  const response = await fetch(`/api/medical-facilities/${slug}`);

  if (response.status === 404) {
    const error: FetchError = new Error("Medical facility not found");
    error.status = 404;
    throw error;
  }

  if (!response.ok) {
    throw new Error("Failed to load medical facility");
  }

  const payload = (await response.json()) as
    | { data?: MedicalFacilityDetail }
    | MedicalFacilityDetail;

  if ("data" in payload && payload.data) {
    return payload.data;
  }

  return payload as MedicalFacilityDetail;
};

export const useMedicalFacility = (
  slug: string,
  initialData?: MedicalFacilityDetail,
) => {
  const query = useQuery({
    queryKey: ["medical-facility", slug],
    queryFn: () => fetchMedicalFacility(slug),
    enabled: Boolean(slug),
    initialData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return query;
};
