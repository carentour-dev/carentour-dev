import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { localizeDigits, localizeOptionalDigits } from "@/lib/public/numbers";
import { BlockSurface } from "./BlockSurface";
import { withBlockStyleDefaults } from "./blockStyleDefaults";
import { resolveIcon } from "./utils";

export function TrustSignalsBlock({
  block,
  locale = "en",
}: {
  block: BlockInstance<"trustSignals">;
  locale?: PublicLocale;
}) {
  const gridClass =
    block.items.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";
  const blockWithStyle = withBlockStyleDefaults(block, {
    background: {
      variant: "solid",
      color: {
        base: "hsl(var(--editorial-ink))",
      },
    },
  });

  return (
    <BlockSurface
      block={blockWithStyle}
      className="border-y border-[hsl(var(--editorial-ink-foreground)/0.08)]"
      defaultPadding={{ top: "6rem", bottom: "6rem" }}
      contentClassName="space-y-12"
    >
      {() => (
        <>
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            {block.eyebrow ? (
              <span className="inline-flex items-center rounded-full border border-[hsl(var(--editorial-ink-foreground)/0.12)] bg-[hsl(var(--editorial-ink-foreground)/0.05)] px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-[hsl(var(--editorial-accent))]">
                {localizeOptionalDigits(block.eyebrow, locale)}
              </span>
            ) : null}
            <h2 className="text-3xl font-semibold text-[hsl(var(--editorial-ink-foreground))] md:text-5xl">
              {localizeOptionalDigits(block.heading, locale)}
            </h2>
            {block.description ? (
              <p className="text-lg leading-8 text-[hsl(var(--editorial-ink-muted))]">
                {localizeOptionalDigits(block.description, locale)}
              </p>
            ) : null}
          </div>

          <div
            className={[
              "grid gap-px overflow-hidden rounded-[2rem] border border-[hsl(var(--editorial-ink-foreground)/0.12)] bg-[hsl(var(--editorial-ink-foreground)/0.06)]",
              gridClass,
            ].join(" ")}
          >
            {block.items.map((item, index) => {
              const Icon = resolveIcon(item.icon);
              return (
                <article
                  key={`${item.title}-${index}`}
                  className="flex h-full flex-col gap-4 bg-[hsl(var(--editorial-ink-soft)/0.92)] px-6 py-7 md:px-8"
                >
                  <div className="flex items-center justify-between gap-4">
                    {item.eyebrow ? (
                      <p className="text-xs font-medium uppercase tracking-[0.22em] text-[hsl(var(--editorial-accent))]">
                        {localizeOptionalDigits(item.eyebrow, locale)}
                      </p>
                    ) : (
                      <span className="text-sm text-[hsl(var(--editorial-ink-muted))]">
                        {localizeDigits(
                          String(index + 1).padStart(2, "0"),
                          locale,
                        )}
                      </span>
                    )}
                    {Icon ? (
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[hsl(var(--editorial-accent)/0.24)] bg-[hsl(var(--editorial-accent)/0.08)] text-[hsl(var(--editorial-accent))]">
                        <Icon size={20} strokeWidth={1.75} />
                      </div>
                    ) : null}
                  </div>
                  <h3 className="text-xl font-semibold text-[hsl(var(--editorial-ink-foreground))]">
                    {localizeOptionalDigits(item.title, locale)}
                  </h3>
                  <p className="text-base leading-7 text-[hsl(var(--editorial-ink-muted))]">
                    {localizeOptionalDigits(item.description, locale)}
                  </p>
                </article>
              );
            })}
          </div>
        </>
      )}
    </BlockSurface>
  );
}
