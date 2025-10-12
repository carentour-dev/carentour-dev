import Image from "next/image";
import type { BlockValue } from "@/lib/cms/blocks";

export function QuoteBlock({ block }: { block: BlockValue<"quote"> }) {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl rounded-3xl bg-card p-10 shadow-card-hover">
          {block.eyebrow ? (
            <span className="text-sm uppercase tracking-wide text-primary">{block.eyebrow}</span>
          ) : null}
          <blockquote className="mt-4 text-2xl font-medium leading-relaxed text-foreground">
            “{block.quote}”
          </blockquote>
          {block.highlight ? (
            <p className="mt-6 text-lg font-semibold text-primary">{block.highlight}</p>
          ) : null}
          <div className="mt-8 flex items-center gap-4">
            {block.avatar?.src ? (
              <div className="relative h-14 w-14 overflow-hidden rounded-full">
                <Image
                  src={block.avatar.src}
                  alt={block.avatar.alt ?? block.attribution ?? "Avatar"}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
            ) : null}
            <div>
              {block.attribution ? (
                <p className="text-base font-semibold text-foreground">{block.attribution}</p>
              ) : null}
              {block.role ? (
                <p className="text-sm text-muted-foreground">{block.role}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
