import type { BlockValue } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { resolveIcon } from "./utils";

export function FeatureGridBlock({ block }: { block: BlockValue<"featureGrid"> }) {
  const hasHeader = block.eyebrow || block.heading || block.description;

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        {hasHeader ? (
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
            {block.eyebrow ? (
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-wide text-primary">
                {block.eyebrow}
              </span>
            ) : null}
            {block.heading ? <h2 className="text-3xl font-semibold text-foreground">{block.heading}</h2> : null}
            {block.description ? (
              <p className="text-muted-foreground text-lg">{block.description}</p>
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
                <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                {item.description ? (
                  <p className="mt-3 text-base text-muted-foreground">{item.description}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
