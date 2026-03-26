import type { BlockInstance } from "@/lib/cms/blocks";
import { DifferentiatorsSection } from "@/components/home";

export function DifferentiatorsBlock({
  block,
}: {
  block: BlockInstance<"differentiators">;
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
    />
  );
}
