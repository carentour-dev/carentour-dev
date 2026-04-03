"use client";

import type { BlockInstance } from "@/lib/cms/blocks";
import type { MedicalFacilityDetail } from "@/lib/medical-facilities";
import { useMedicalFacility } from "@/hooks/useMedicalFacility";
import { MedicalFacilityProfileContent } from "./MedicalFacilityProfileContent";

type Props = {
  block: BlockInstance<"medicalFacilityProfile">;
  slug: string;
  initialData: MedicalFacilityDetail;
  disableLiveFetch?: boolean;
};

export function MedicalFacilityProfileClient({
  block,
  slug,
  initialData,
  disableLiveFetch = false,
}: Props) {
  const { data, isLoading, isFetching, error } = useMedicalFacility(
    slug,
    initialData,
    { enabled: !disableLiveFetch && Boolean(slug) },
  );

  return (
    <MedicalFacilityProfileContent
      block={block}
      detail={data ?? initialData}
      isLoading={isLoading}
      isFetching={isFetching}
      errorStatus={(error as { status?: number } | null)?.status}
    />
  );
}
