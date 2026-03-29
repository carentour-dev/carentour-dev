import type { BlockInstance, BlockValue } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { BlockSurface } from "./BlockSurface";
import { withBlockStyleDefaults } from "./blockStyleDefaults";
import { getFirstDefinedResponsiveValue } from "./styleUtils";
import { resolveIcon } from "./utils";

export function StatGridBlock({ block }: { block: BlockInstance<"statGrid"> }) {
  const IconSize = 28;
  const blockWithStyle = withBlockStyleDefaults(block, {
    background: {
      variant: "solid",
      color: {
        base: "hsl(var(--home-section-band))",
      },
    },
  });
  const styleAlignValue = getFirstDefinedResponsiveValue(
    blockWithStyle.style?.layout?.horizontalAlign,
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
    <BlockSurface
      block={blockWithStyle}
      className="border-y border-border/50"
      contentClassName="space-y-12"
    >
      {() => (
        <>
          {(blockWithStyle.heading ||
            blockWithStyle.eyebrow ||
            blockWithStyle.description) && (
            <div className={cn("mb-4 max-w-3xl space-y-3", headingAlignClass)}>
              {blockWithStyle.eyebrow ? (
                <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {blockWithStyle.eyebrow}
                </span>
              ) : null}
              {blockWithStyle.heading ? (
                <h2 className="text-3xl font-semibold text-foreground">
                  {blockWithStyle.heading}
                </h2>
              ) : null}
              {blockWithStyle.description ? (
                <p
                  className={cn(
                    "text-lg text-muted-foreground",
                    descriptionAlignClass,
                  )}
                >
                  {blockWithStyle.description}
                </p>
              ) : null}
            </div>
          )}

          <div
            className={cn(
              "grid gap-8",
              blockWithStyle.columns === 1 && "sm:grid-cols-1",
              blockWithStyle.columns === 2 && "sm:grid-cols-2",
              blockWithStyle.columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
              blockWithStyle.columns >= 4 && "sm:grid-cols-2 lg:grid-cols-4",
            )}
          >
            {blockWithStyle.items.map((item, index) => {
              const Icon = resolveIcon(item.icon ?? "");
              return (
                <div
                  key={`stat-${index}`}
                  className="group/stat relative flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card px-6 py-8 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(15,23,42,0.14),0_0_0_1px_rgba(59,130,246,0.08),0_0_26px_rgba(59,130,246,0.16)]"
                >
                  {Icon ? (
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 ease-out group-hover/stat:scale-105">
                      <Icon size={IconSize} strokeWidth={1.75} />
                    </div>
                  ) : null}
                  <p
                    className={cn(
                      "text-3xl font-bold text-foreground transition-colors duration-300 group-hover/stat:text-primary",
                      blockWithStyle.emphasizeValue
                        ? ""
                        : "text-muted-foreground",
                    )}
                  >
                    {item.value}
                  </p>
                  <p className="text-muted-foreground transition-colors duration-300 group-hover/stat:text-foreground">
                    {item.label}
                  </p>
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
