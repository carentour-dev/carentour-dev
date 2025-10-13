import type { BlockInstance, BlockValue } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { BlockSurface } from "./BlockSurface";
import { getFirstDefinedResponsiveValue } from "./styleUtils";
import { resolveIcon } from "./utils";

export function FeatureGridBlock({
  block,
}: {
  block: BlockInstance<"featureGrid">;
}) {
  const hasHeader = block.eyebrow || block.heading || block.description;
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
    <BlockSurface
      block={block}
      defaultPadding={{ top: "5rem", bottom: "5rem" }}
      contentClassName="space-y-12"
    >
      {() => (
        <>
          {hasHeader ? (
            <div className={cn("mb-4 max-w-3xl space-y-3", headerAlignClass)}>
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
          ) : null}

          <div
            className={cn(
              "grid gap-6",
              block.columns === 1 && "md:grid-cols-1",
              block.columns === 2 && "md:grid-cols-2",
              block.columns === 3 && "md:grid-cols-2 lg:grid-cols-3",
              block.columns >= 4 && "md:grid-cols-2 lg:grid-cols-4",
            )}
          >
            {block.items.map((item, index) => {
              const Icon = resolveIcon(item.icon);
              return (
                <div
                  key={`feature-${index}`}
                  className={cn(
                    "h-full rounded-2xl border border-border/50 p-6 text-left transition hover:shadow-card-hover",
                    block.variant === "cards" ? "bg-card" : "bg-background",
                  )}
                >
                  {item.tag ? (
                    <span className="mb-3 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {item.tag}
                    </span>
                  ) : null}
                  {Icon ? (
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon size={22} strokeWidth={1.75} />
                    </div>
                  ) : null}
                  <h3 className="text-xl font-semibold text-foreground">
                    {item.title}
                  </h3>
                  {item.description ? (
                    <p className="mt-3 text-base text-muted-foreground">
                      {item.description}
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
