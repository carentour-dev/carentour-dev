import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { DifferentiatorsSection } from "@/components/home";

export function DifferentiatorsBlock({
  block,
  locale = "en",
}: {
  block: BlockInstance<"differentiators">;
  locale?: PublicLocale;
}) {
  const items = block.items.map((item) => ({
    title: item.title ?? "",
    description: item.description ?? "",
    highlight: item.highlight ?? "",
    icon: item.icon ?? "",
  }));

  return (
    <DifferentiatorsSection
      eyebrow={block.eyebrow}
      title={block.title}
      highlight={block.highlight}
      description={block.description}
      items={items}
      locale={locale}
    />
  );
}
