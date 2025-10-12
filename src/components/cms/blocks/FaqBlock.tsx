import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { BlockValue } from "@/lib/cms/blocks";

function renderColumn(items: BlockValue<"faq">["items"], prefix: string) {
  return (
    <Accordion type="multiple" className="space-y-4">
      {items.map((item, index) => (
        <AccordionItem key={`${prefix}-${index}`} value={`${prefix}-${index}`} className="border border-border/60 rounded-xl px-4">
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

export function FaqBlock({ block }: { block: BlockValue<"faq"> }) {
  const mid = Math.ceil(block.items.length / 2);
  const firstColumn = block.items.slice(0, block.layout === "twoColumn" ? mid : block.items.length);
  const secondColumn = block.layout === "twoColumn" ? block.items.slice(mid) : [];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {(block.eyebrow || block.heading || block.description) && (
          <div className="mx-auto mb-12 max-w-3xl text-center space-y-3">
            {block.eyebrow ? (
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-wide text-primary">
                {block.eyebrow}
              </span>
            ) : null}
            {block.heading ? <h2 className="text-3xl font-semibold text-foreground">{block.heading}</h2> : null}
            {block.description ? (
              <p className="text-lg text-muted-foreground">{block.description}</p>
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
      </div>
    </section>
  );
}
