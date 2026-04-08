import type { BlockInstance } from "@/lib/cms/blocks";
import type { DoctorDirectoryResponse } from "@/lib/doctors";
import type { PublicLocale } from "@/i18n/routing";
import { fetchPublicDoctorDirectory } from "@/server/modules/doctors/public";
import { BlockSurface } from "./BlockSurface";
import { DoctorDirectoryClient } from "./DoctorDirectoryClient";

type DirectoryBlockContext = {
  doctorDirectoryData?: DoctorDirectoryResponse | null;
};

export async function DoctorDirectoryBlock({
  block,
  context,
  locale = "en",
}: {
  block: BlockInstance<"doctorDirectory">;
  context?: DirectoryBlockContext;
  locale?: PublicLocale;
}) {
  const initialData =
    context?.doctorDirectoryData ??
    (await fetchPublicDoctorDirectory({}, locale));

  return (
    <BlockSurface
      block={block}
      className="overflow-visible border-y border-border/50 bg-background"
      defaultPadding={{ top: "5rem", bottom: "5rem" }}
      contentClassName="space-y-10"
    >
      {() => <DoctorDirectoryClient block={block} initialData={initialData} />}
    </BlockSurface>
  );
}
