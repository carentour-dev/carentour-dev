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
  const usesStepLayout =
    block.variant === "cards" &&
    block.items.length > 1 &&
    block.items.every((item) => /^\d+$/.test(item.tag?.trim() ?? ""));
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
      className={
        usesStepLayout
          ? "bg-background dark:border-y dark:border-slate-200 dark:bg-slate-50"
          : undefined
      }
      defaultPadding={{ top: "5rem", bottom: "5rem" }}
      contentClassName="space-y-12"
    >
      {() => (
        <>
          {hasHeader ? (
            <div className={cn("mb-4 max-w-3xl space-y-3", headerAlignClass)}>
              {block.eyebrow ? (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-wide",
                    usesStepLayout
                      ? "border-border/60 bg-background/70 text-muted-foreground dark:border-slate-200 dark:bg-white dark:text-slate-500"
                      : "text-primary",
                  )}
                >
                  {block.eyebrow}
                </span>
              ) : null}
              {block.heading ? (
                <h2
                  className={cn(
                    "text-3xl font-semibold text-foreground",
                    usesStepLayout && "dark:text-slate-950",
                  )}
                >
                  {block.heading}
                </h2>
              ) : null}
              {block.description ? (
                <p
                  className={cn(
                    "text-lg",
                    "text-muted-foreground",
                    descriptionAlignClass,
                    usesStepLayout && "dark:text-slate-600",
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
              const isStepCard =
                usesStepLayout && /^\d+$/.test(item.tag?.trim() ?? "");
              const stepLabel = isStepCard
                ? String(Number(item.tag?.trim() ?? index + 1))
                : item.tag;

              return (
                <div
                  key={`feature-${index}`}
                  className={cn(
                    "h-full text-left transition",
                    isStepCard
                      ? "group/step relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/90 p-7 shadow-[0_14px_36px_rgba(15,23,42,0.08)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(15,23,42,0.14),0_0_0_1px_rgba(59,130,246,0.08),0_0_26px_rgba(59,130,246,0.16)] dark:border-slate-200 dark:bg-white dark:shadow-[0_14px_36px_rgba(15,23,42,0.08)]"
                      : "group/feature relative overflow-hidden rounded-xl border border-border/60 bg-card px-6 py-8 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(15,23,42,0.14),0_0_0_1px_rgba(59,130,246,0.08),0_0_26px_rgba(59,130,246,0.16)]",
                    !isStepCard &&
                      (block.variant === "cards" ? "bg-card" : "bg-background"),
                  )}
                >
                  {isStepCard ? (
                    <>
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

                      <div className="relative z-10 flex h-full flex-col">
                        <div className="mb-8 flex items-start justify-between gap-5">
                          <div className="flex items-center gap-3">
                            {stepLabel ? (
                              <span className="inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground transition-colors duration-300 group-hover/step:text-foreground dark:text-slate-500 dark:group-hover/step:text-slate-700">
                                <span aria-hidden>Step</span>
                                <span className="text-primary dark:text-cyan-700">
                                  {stepLabel}
                                </span>
                              </span>
                            ) : null}
                          </div>
                          {Icon ? (
                            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background/70 text-primary transition-transform duration-300 ease-out group-hover/step:scale-105 dark:border-slate-200 dark:bg-slate-50 dark:text-cyan-700">
                              <Icon size={21} strokeWidth={1.8} />
                            </div>
                          ) : null}
                        </div>

                        <h3 className="max-w-[19rem] text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-foreground transition-colors duration-300 group-hover/step:text-primary dark:text-slate-950 dark:group-hover/step:text-[hsl(210_85%_45%)]">
                          {item.title}
                        </h3>
                        {item.description ? (
                          <p className="mt-4 max-w-[30rem] text-[1.02rem] leading-8 text-muted-foreground dark:text-slate-600">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <>
                      {(item.tag || Icon) && (
                        <div className="mb-5 flex items-center justify-between gap-4">
                          {item.tag ? (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors duration-300 group-hover/feature:bg-primary/15">
                              {item.tag}
                            </span>
                          ) : (
                            <span />
                          )}
                          {Icon ? (
                            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary transition-transform duration-300 ease-out group-hover/feature:scale-105">
                              <Icon size={22} strokeWidth={1.75} />
                            </div>
                          ) : null}
                        </div>
                      )}
                      <h3 className="text-xl font-semibold text-foreground transition-colors duration-300 group-hover/feature:text-primary">
                        {item.title}
                      </h3>
                      {item.description ? (
                        <p className="mt-3 text-base text-muted-foreground transition-colors duration-300 group-hover/feature:text-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </BlockSurface>
  );
}
