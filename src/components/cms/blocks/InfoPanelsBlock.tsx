import { Badge } from "@/components/ui/badge";
import type { BlockInstance } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { BlockSurface } from "./BlockSurface";

export function InfoPanelsBlock({
  block,
}: {
  block: BlockInstance<"infoPanels">;
}) {
  return (
    <BlockSurface
      block={block}
      className="border-y border-border/40 bg-background"
      defaultPadding={{ top: "5rem", bottom: "5rem" }}
      contentClassName="space-y-10"
    >
      {() => (
        <>
          {(block.eyebrow || block.heading || block.description) && (
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              {block.eyebrow ? (
                <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-primary">
                  {block.eyebrow}
                </span>
              ) : null}
              {block.heading ? (
                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
                  {block.heading}
                </h2>
              ) : null}
              {block.description ? (
                <p className="text-base leading-8 text-muted-foreground md:text-lg">
                  {block.description}
                </p>
              ) : null}
            </div>
          )}

          <div className="grid gap-x-12 gap-y-8 border-t border-border/50 pt-8 md:grid-cols-2">
            {block.panels.map((panel, index) => (
              <article
                key={`${panel.title}-${index}`}
                className={cn(
                  "space-y-4 border-border/40 pt-1",
                  index >= 2 && "md:border-t md:pt-8",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-foreground">
                    {panel.title}
                  </h3>
                  {panel.badge ? (
                    <Badge variant="outline" className="text-xs">
                      {panel.badge}
                    </Badge>
                  ) : null}
                </div>

                {panel.description ? (
                  <p className="max-w-xl text-sm leading-7 text-muted-foreground">
                    {panel.description}
                  </p>
                ) : null}

                {(panel.items ?? []).length ? (
                  <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
                    {(panel.items ?? []).map((item, itemIndex) => (
                      <li
                        key={`${panel.title}-${itemIndex}`}
                        className="flex items-start gap-3"
                      >
                        <span
                          aria-hidden
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </>
      )}
    </BlockSurface>
  );
}
