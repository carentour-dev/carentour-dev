import { PublicAuthBoundary } from "@/components/public/PublicInteractiveProviders";
import { type PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { ContactFormEmbedBlockContent } from "./ContactFormEmbedBlockContent";

export function ContactFormEmbedBlock({
  block,
  locale = "en",
}: {
  block: BlockInstance<"contactFormEmbed">;
  locale?: PublicLocale;
}) {
  return (
    <PublicAuthBoundary>
      <ContactFormEmbedBlockContent block={block} locale={locale} />
    </PublicAuthBoundary>
  );
}
