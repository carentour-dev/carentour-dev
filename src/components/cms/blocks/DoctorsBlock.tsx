import type { BlockInstance } from "@/lib/cms/blocks";
import { getDoctorsForBlock } from "@/lib/cms/server";

import { DoctorsBlockContent } from "./DoctorsBlockContent";

export async function DoctorsBlock({
  block,
}: {
  block: BlockInstance<"doctors">;
}) {
  const doctors = await getDoctorsForBlock(block);

  if (!doctors.length) {
    return null;
  }

  return <DoctorsBlockContent block={block} doctors={doctors} />;
}
