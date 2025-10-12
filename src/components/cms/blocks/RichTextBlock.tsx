import MarkdownRenderer from "@/components/MarkdownRenderer";
import type { BlockValue } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";

const widthMap: Record<BlockValue<"richText">["width"], string> = {
  prose: "prose prose-lg dark:prose-invert",
  narrow: "max-w-2xl",
  full: "max-w-none",
};

const alignMap: Record<BlockValue<"richText">["align"], string> = {
  start: "text-left",
  center: "text-center mx-auto",
};

export function RichTextBlock({ block }: { block: BlockValue<"richText"> }) {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className={cn("mx-auto", widthMap[block.width], alignMap[block.align])}>
          <MarkdownRenderer content={block.markdown} className="space-y-4" />
        </div>
      </div>
    </section>
  );
}
