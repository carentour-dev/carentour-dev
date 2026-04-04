import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { getDoctorsForBlock } from "@/lib/cms/server";

import { DoctorsBlockContent } from "./DoctorsBlockContent";

export async function DoctorsBlock({
  block,
  locale = "en",
}: {
  block: BlockInstance<"doctors">;
  locale?: PublicLocale;
}) {
  const doctors = await getDoctorsForBlock(block);

  if (!doctors.length) {
    return null;
  }

  return (
    <DoctorsBlockContent block={block} doctors={doctors} locale={locale} />
  );
}
