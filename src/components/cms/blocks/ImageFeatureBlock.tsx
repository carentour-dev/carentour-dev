import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { BlockValue } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { resolveIcon } from "./utils";

export function ImageFeatureBlock({ block }: { block: BlockValue<"imageFeature"> }) {
  const isImageLeft = block.layout === "imageLeft";
  const actions = block.actions ?? [];
  const hasItems = (block.items?.length ?? 0) > 0;

  return (
    <section className="py-20 bg-muted/20">
      <div className="container mx-auto px-4">
        <div
          className={cn(
            "grid items-center gap-12",
            "lg:grid-cols-2",
            isImageLeft ? "lg:grid-flow-col" : "lg:grid-flow-col-dense",
          )}
        >
          <div
            className={cn("order-2 lg:order-1", isImageLeft ? "lg:order-1" : "lg:order-2")}
          >
            {(block.eyebrow || block.heading || block.body) && (
              <div className="space-y-4">
                {block.eyebrow ? (
                  <span className="text-sm font-semibold uppercase tracking-wider text-primary">
                    {block.eyebrow}
                  </span>
                ) : null}
                <h2 className="text-3xl font-semibold text-foreground">
                  {block.heading}
                </h2>
                {block.body ? (
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {block.body}
                  </p>
                ) : null}
              </div>
            )}

            {hasItems ? (
              <div className="mt-8 space-y-4">
                {block.items?.map((item, index) => {
                  const Icon = resolveIcon(item.icon);
                  return (
                    <div key={`feature-item-${index}`} className="flex gap-4">
                      {Icon ? (
                        <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                          <Icon size={20} />
                        </div>
                      ) : null}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                        {item.description ? (
                          <p className="text-muted-foreground text-base">{item.description}</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {actions.length ? (
              <div className="mt-8 flex flex-wrap gap-3">
                {actions.map((action, index) => (
                  <Button
                    key={`image-feature-action-${index}`}
                    asChild
                    variant={action.variant ?? (index === 0 ? "default" : "secondary")}
                  >
                    <Link
                      href={action.href}
                      target={action.target ?? "_self"}
                      rel={action.target === "_blank" ? "noopener noreferrer" : undefined}
                    >
                      {action.label}
                    </Link>
                  </Button>
                ))}
              </div>
            ) : null}
          </div>

          <div
            className={cn("order-1", isImageLeft ? "lg:order-2" : "lg:order-1")}
          >
            <div className="relative overflow-hidden rounded-2xl shadow-elegant">
              <Image
                src={block.image.src}
                alt={block.image.alt ?? ""}
                width={1200}
                height={900}
                className={cn(
                  "h-full w-full object-cover",
                  block.image.rounded ? "rounded-2xl" : "",
                )}
                priority={false}
                unoptimized={block.image.src.startsWith("http")}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
