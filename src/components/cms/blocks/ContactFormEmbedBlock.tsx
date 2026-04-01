import { getLocale } from "next-intl/server";
import { type PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { ContactFormEmbedBlockContent } from "./ContactFormEmbedBlockContent";

export async function ContactFormEmbedBlock({
  block,
}: {
  block: BlockInstance<"contactFormEmbed">;
}) {
  const locale = (await getLocale()) as PublicLocale;

  return <ContactFormEmbedBlockContent block={block} locale={locale} />;
}
