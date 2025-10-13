import type { BlockValue } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { BlockSurface } from "./BlockSurface";
import { getFirstDefinedResponsiveValue } from "./styleUtils";
import { resolveIcon } from "./utils";

export function StatGridBlock({ block }: { block: BlockValue<"statGrid"> }) {
  const IconSize = 28;
  const styleAlignValue = getFirstDefinedResponsiveValue(
    block.style?.layout?.horizontalAlign,
  );
  const headingAlignClass = (() => {
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
  const descriptionAlignClass = headingAlignClass.includes("text-right")
    ? "text-right"
    : headingAlignClass.includes("text-left")
      ? "text-left"
      : "text-center";
  return (
    <BlockSurface block={block} contentClassName="space-y-12">
      {() => (
        <>
          {(block.eyebrow || block.heading || block.description) && (
            <div className={cn("mb-4 max-w-3xl space-y-3", headingAlignClass)}>
              {block.eyebrow ? (
                <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
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

          <div
            className={cn(
              "grid gap-8",
              block.columns === 1 && "sm:grid-cols-1",
              block.columns === 2 && "sm:grid-cols-2",
              block.columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
              block.columns >= 4 && "sm:grid-cols-2 lg:grid-cols-4",
            )}
          >
            {block.items.map((item, index) => {
              const Icon = resolveIcon(item.icon ?? "");
              return (
                <div
                  key={`stat-${index}`}
                  className="relative overflow-hidden rounded-xl border border-border/60 bg-card px-6 py-8 shadow-card-hover"
                >
                  {Icon ? (
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon size={IconSize} strokeWidth={1.75} />
                    </div>
                  ) : null}
                  <p
                    className={cn(
                      "text-3xl font-bold text-foreground",
                      block.emphasizeValue ? "" : "text-muted-foreground",
                    )}
                  >
                    {item.value}
                  </p>
                  <p className="text-muted-foreground">{item.label}</p>
                  {item.helper ? (
                    <p className="mt-2 text-sm text-muted-foreground/80">
                      {item.helper}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      )}
    </BlockSurface>
  );
}
