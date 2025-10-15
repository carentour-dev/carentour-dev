import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { BlockInstance, BlockValue } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { BlockSurface } from "./BlockSurface";
import { getFirstDefinedResponsiveValue } from "./styleUtils";
import { resolveIcon } from "./utils";

export function ImageFeatureBlock({
  block,
}: {
  block: BlockInstance<"imageFeature">;
}) {
  const isImageLeft = block.layout === "imageLeft";
  const actions = (block.actions ?? []).filter(
    (action) => typeof action.href === "string" && action.href.length > 0,
  );
  const hasItems = (block.items?.length ?? 0) > 0;
  const styleAlignValue = getFirstDefinedResponsiveValue(
    block.style?.layout?.horizontalAlign,
  );
  const textAlignClass =
    styleAlignValue === "center"
      ? "text-center"
      : styleAlignValue === "end"
        ? "text-right"
        : "text-left";
  const actionsJustifyClass =
    styleAlignValue === "center"
      ? "justify-center"
      : styleAlignValue === "end"
        ? "justify-end"
        : "justify-start";
  const imageSrc = block.image?.src;
  const imageAlt = block.image?.alt ?? "";
  const imageRounded = block.image?.rounded ?? true;
  const styleBackgroundVariant = block.style?.background?.variant;
  const useDefaultBackgroundClass =
    styleBackgroundVariant === undefined || styleBackgroundVariant === "none";

  return (
    <BlockSurface
      block={block}
      className={useDefaultBackgroundClass ? "bg-muted/20" : undefined}
      defaultPadding={{ top: "5rem", bottom: "5rem" }}
      contentClassName={cn(
        "grid items-center gap-12 lg:grid-cols-2",
        isImageLeft ? "lg:grid-flow-col" : "lg:grid-flow-col-dense",
      )}
    >
      {() => (
        <>
          <div
            className={cn(
              "order-2 lg:order-1",
              isImageLeft ? "lg:order-1" : "lg:order-2",
            )}
          >
            {(block.eyebrow || block.heading || block.body) && (
              <div className={cn("space-y-4", textAlignClass)}>
                {block.eyebrow ? (
                  <span className="text-sm font-semibold uppercase tracking-wider text-primary">
                    {block.eyebrow}
                  </span>
                ) : null}
                <h2 className="text-3xl font-semibold text-foreground">
                  {block.heading}
                </h2>
                {block.body ? (
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    {block.body}
                  </p>
                ) : null}
              </div>
            )}

            {hasItems ? (
              <div className={cn("mt-8 space-y-4", textAlignClass)}>
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
                        <h3 className="text-lg font-semibold text-foreground">
                          {item.title}
                        </h3>
                        {item.description ? (
                          <p className="text-base text-muted-foreground">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {actions.length ? (
              <div
                className={cn("mt-8 flex flex-wrap gap-3", actionsJustifyClass)}
              >
                {actions.map((action, index) => (
                  <Button
                    key={`image-feature-action-${index}`}
                    asChild
                    variant={
                      action.variant ?? (index === 0 ? "default" : "secondary")
                    }
                  >
                    <Link
                      href={action.href}
                      target={action.target ?? "_self"}
                      rel={
                        action.target === "_blank"
                          ? "noopener noreferrer"
                          : undefined
                      }
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
            {imageSrc ? (
              <div className="relative overflow-hidden rounded-2xl shadow-elegant">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  width={1200}
                  height={900}
                  className={cn(
                    "h-full w-full object-cover",
                    imageRounded ? "rounded-2xl" : "",
                  )}
                  priority={false}
                  unoptimized={imageSrc.startsWith("http")}
                />
              </div>
            ) : null}
          </div>
        </>
      )}
    </BlockSurface>
  );
}
