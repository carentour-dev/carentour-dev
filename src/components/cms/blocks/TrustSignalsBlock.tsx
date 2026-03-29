import type { BlockInstance } from "@/lib/cms/blocks";
import { BlockSurface } from "./BlockSurface";
import { withBlockStyleDefaults } from "./blockStyleDefaults";
import { resolveIcon } from "./utils";

export function TrustSignalsBlock({
  block,
}: {
  block: BlockInstance<"trustSignals">;
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
                {block.eyebrow}
              </span>
            ) : null}
            <h2 className="text-3xl font-semibold text-[hsl(var(--editorial-ink-foreground))] md:text-5xl">
              {block.heading}
            </h2>
            {block.description ? (
              <p className="text-lg leading-8 text-[hsl(var(--editorial-ink-muted))]">
                {block.description}
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
                        {item.eyebrow}
                      </p>
                    ) : (
                      <span className="text-sm text-[hsl(var(--editorial-ink-muted))]">
                        0{index + 1}
                      </span>
                    )}
                    {Icon ? (
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[hsl(var(--editorial-accent)/0.24)] bg-[hsl(var(--editorial-accent)/0.08)] text-[hsl(var(--editorial-accent))]">
                        <Icon size={20} strokeWidth={1.75} />
                      </div>
                    ) : null}
                  </div>
                  <h3 className="text-xl font-semibold text-[hsl(var(--editorial-ink-foreground))]">
                    {item.title}
                  </h3>
                  <p className="text-base leading-7 text-[hsl(var(--editorial-ink-muted))]">
                    {item.description}
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
