import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { BlockInstance, BlockValue } from "@/lib/cms/blocks";
import { BlockSurface } from "./BlockSurface";
import { getFirstDefinedResponsiveValue } from "./styleUtils";
import { cn } from "@/lib/utils";

function renderColumn(items: BlockValue<"faq">["items"], prefix: string) {
  return (
    <Accordion type="multiple" className="space-y-4">
      {items.map((item, index) => (
        <AccordionItem
          key={`${prefix}-${index}`}
          value={`${prefix}-${index}`}
          className="border border-border/60 rounded-xl px-4"
        >
          <AccordionTrigger className="text-left text-lg font-semibold text-foreground">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function FaqBlock({ block }: { block: BlockInstance<"faq"> }) {
  const mid = Math.ceil(block.items.length / 2);
  const firstColumn = block.items.slice(
    0,
    block.layout === "twoColumn" ? mid : block.items.length,
  );
  const secondColumn =
    block.layout === "twoColumn" ? block.items.slice(mid) : [];
  const styleAlignValue = getFirstDefinedResponsiveValue(
    block.style?.layout?.horizontalAlign,
  );
  const headerAlignClass = (() => {
    switch (styleAlignValue) {
      case "center":
        return "mx-auto text-center";
      case "end":
        return "ml-auto text-right";
      case "start":
        return "mr-auto text-left";
      default:
        return "mx-auto text-center";
    }
  })();
  const descriptionAlignClass = headerAlignClass.includes("text-right")
    ? "text-right"
    : headerAlignClass.includes("text-left")
      ? "text-left"
      : "text-center";

  return (
    <BlockSurface block={block} contentClassName="space-y-12">
      {() => (
        <>
          {(block.eyebrow || block.heading || block.description) && (
            <div className={cn("max-w-3xl space-y-3", headerAlignClass)}>
              {block.eyebrow ? (
                <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-wide text-primary">
                  {block.eyebrow}
                </span>
              ) : null}
              {block.heading ? (
                <h2 className="text-3xl font-semibold text-foreground">
                  {block.heading}
                </h2>
              ) : null}
              {block.description ? (
                <p
                  className={cn(
                    "text-lg text-muted-foreground",
                    descriptionAlignClass,
                  )}
                >
                  {block.description}
                </p>
              ) : null}
            </div>
          )}

          {block.layout === "twoColumn" ? (
            <div className="grid gap-8 lg:grid-cols-2">
              {renderColumn(firstColumn, "faq-left")}
              {renderColumn(secondColumn, "faq-right")}
            </div>
          ) : (
            renderColumn(block.items, "faq")
          )}
        </>
      )}
    </BlockSurface>
  );
}
