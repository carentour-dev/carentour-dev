import type { BlockInstance } from "@/lib/cms/blocks";
import type { MedicalFacilitiesDirectoryResponse } from "@/lib/medical-facilities";
import { fetchPublicMedicalFacilitiesDirectory } from "@/server/modules/serviceProviders/public";
import { BlockSurface } from "./BlockSurface";
import { MedicalFacilitiesDirectoryClient } from "./MedicalFacilitiesDirectoryClient";

type DirectoryBlockContext = {
  medicalFacilitiesDirectoryData?: MedicalFacilitiesDirectoryResponse | null;
};

export async function MedicalFacilitiesDirectoryBlock({
  block,
  context,
}: {
  block: BlockInstance<"medicalFacilitiesDirectory">;
  context?: DirectoryBlockContext;
}) {
  const initialData =
    context?.medicalFacilitiesDirectoryData ??
    (await fetchPublicMedicalFacilitiesDirectory());

  return (
    <BlockSurface
      block={block}
      className="overflow-visible border-y border-border/50 bg-background"
      defaultPadding={{ top: "5rem", bottom: "5rem" }}
      contentClassName="space-y-10"
    >
      {() => (
        <MedicalFacilitiesDirectoryClient
          block={block}
          initialData={initialData}
        />
      )}
    </BlockSurface>
  );
}
