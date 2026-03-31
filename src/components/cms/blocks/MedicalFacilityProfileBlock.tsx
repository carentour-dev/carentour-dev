import type { BlockInstance } from "@/lib/cms/blocks";
import type { MedicalFacilityDetail } from "@/lib/medical-facilities";
import { fetchPublicServiceProviderBySlug } from "@/server/modules/serviceProviders/public";
import { BlockSurface } from "./BlockSurface";
import { MedicalFacilityProfileClient } from "./MedicalFacilityProfileClient";

type ProfileBlockContext = {
  medicalFacility?: MedicalFacilityDetail | null;
  medicalFacilitySlug?: string;
};

export async function MedicalFacilityProfileBlock({
  block,
  context,
}: {
  block: BlockInstance<"medicalFacilityProfile">;
  context?: ProfileBlockContext;
}) {
  const slug =
    context?.medicalFacilitySlug ?? context?.medicalFacility?.provider.slug;
  const detail =
    context?.medicalFacility ??
    (slug ? await fetchPublicServiceProviderBySlug(slug) : null);

  if (!detail || !slug) {
    return (
      <BlockSurface
        block={block}
        container={false}
        className="overflow-visible bg-background"
        defaultPadding={{ top: "0rem", bottom: "0rem" }}
      >
        {() => null}
      </BlockSurface>
    );
  }

  return (
    <BlockSurface
      block={block}
      container={false}
      className="overflow-visible bg-background"
      defaultPadding={{ top: "0rem", bottom: "0rem" }}
    >
      {() => (
        <MedicalFacilityProfileClient
          block={block}
          slug={slug}
          initialData={detail}
        />
      )}
    </BlockSurface>
  );
}
