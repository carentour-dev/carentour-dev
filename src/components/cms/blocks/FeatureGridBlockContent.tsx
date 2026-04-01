import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { localizeOptionalDigits } from "@/lib/public/numbers";
import { cn } from "@/lib/utils";
import { BlockSurface } from "./BlockSurface";
import {
  getFirstDefinedResponsiveValue,
  resolveLogicalAlignmentStyle,
  resolveLogicalTextAlign,
} from "./styleUtils";
import { resolveIcon } from "./utils";

type FeatureGridBlockContentProps = {
  block: BlockInstance<"featureGrid">;
  locale: PublicLocale;
};

export function FeatureGridBlockContent({
  block,
  locale,
}: FeatureGridBlockContentProps) {
  const usesStepLayout =
    block.variant === "cards" &&
    block.items.length > 1 &&
    block.items.every((item) => /^\d+$/.test(item.tag?.trim() ?? ""));
  const hasHeader = block.eyebrow || block.heading || block.description;
  const styleAlignValue = getFirstDefinedResponsiveValue(
    block.style?.layout?.horizontalAlign,
  );
  const resolvedAlign = styleAlignValue ?? "center";
  const headerAlignStyle = resolveLogicalAlignmentStyle(resolvedAlign);
  const cardTextStyle = { textAlign: resolveLogicalTextAlign("start") };
  const localizedStepLabel = locale === "ar" ? "الخطوة" : "Step";

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
            <div className="mb-4 max-w-3xl space-y-3" style={headerAlignStyle}>
              {block.eyebrow ? (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-wide",
                    usesStepLayout
                      ? "border-border/60 bg-background/70 text-muted-foreground dark:border-slate-200 dark:bg-white dark:text-slate-500"
                      : "text-primary",
                  )}
                >
                  {localizeOptionalDigits(block.eyebrow, locale)}
                </span>
              ) : null}
              {block.heading ? (
                <h2
                  className={cn(
                    "text-3xl font-semibold text-foreground",
                    usesStepLayout && "dark:text-slate-950",
                  )}
                >
                  {localizeOptionalDigits(block.heading, locale)}
                </h2>
              ) : null}
              {block.description ? (
                <p
                  className={cn(
                    "text-lg",
                    "text-muted-foreground",
                    usesStepLayout && "dark:text-slate-600",
                  )}
                >
                  {localizeOptionalDigits(block.description, locale)}
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
                    "h-full transition",
                    isStepCard
                      ? "group/step relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/90 p-7 shadow-[0_14px_36px_rgba(15,23,42,0.08)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(15,23,42,0.14),0_0_0_1px_rgba(59,130,246,0.08),0_0_26px_rgba(59,130,246,0.16)] dark:border-slate-200 dark:bg-white dark:shadow-[0_14px_36px_rgba(15,23,42,0.08)]"
                      : "group/feature relative overflow-hidden rounded-xl border border-border/60 bg-card px-6 py-8 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(15,23,42,0.14),0_0_0_1px_rgba(59,130,246,0.08),0_0_26px_rgba(59,130,246,0.16)]",
                    !isStepCard &&
                      (block.variant === "cards" ? "bg-card" : "bg-background"),
                  )}
                  style={cardTextStyle}
                >
                  {isStepCard ? (
                    <>
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

                      <div className="relative z-10 flex h-full flex-col">
                        <div className="mb-8 flex items-start justify-between gap-5">
                          <div className="flex items-center gap-3">
                            {stepLabel ? (
                              <span className="inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground transition-colors duration-300 group-hover/step:text-foreground dark:text-slate-500 dark:group-hover/step:text-slate-700">
                                <span>{localizedStepLabel}</span>
                                <span className="text-primary dark:text-cyan-700">
                                  {localizeOptionalDigits(stepLabel, locale)}
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
                          {localizeOptionalDigits(item.title, locale)}
                        </h3>
                        {item.description ? (
                          <p className="mt-4 max-w-[30rem] text-[1.02rem] leading-8 text-muted-foreground dark:text-slate-600">
                            {localizeOptionalDigits(item.description, locale)}
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
                              {localizeOptionalDigits(item.tag, locale)}
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
                        {localizeOptionalDigits(item.title, locale)}
                      </h3>
                      {item.description ? (
                        <p className="mt-3 text-base text-muted-foreground transition-colors duration-300 group-hover/feature:text-foreground">
                          {localizeOptionalDigits(item.description, locale)}
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

export function FeatureGridBlockPreview({
  block,
  locale = "en",
}: {
  block: BlockInstance<"featureGrid">;
  locale?: PublicLocale;
}) {
  return <FeatureGridBlockContent block={block} locale={locale} />;
}
