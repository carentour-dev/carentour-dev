import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { HomeCtaSection } from "@/components/home";

export function HomeCtaBlock({
  block,
  locale = "en",
}: {
  block: BlockInstance<"homeCta">;
  locale?: PublicLocale;
}) {
  return (
    <HomeCtaSection
      content={{
        headingPrefix: block.headingPrefix,
        headingHighlight: block.headingHighlight,
        description: block.description,
        primaryAction: block.primaryAction,
        secondaryAction: block.secondaryAction,
      }}
      locale={locale}
    />
  );
}
