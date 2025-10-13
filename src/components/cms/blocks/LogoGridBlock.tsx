import Image from "next/image";
import Link from "next/link";
import type { BlockInstance, BlockValue } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { BlockSurface } from "./BlockSurface";
import { getFirstDefinedResponsiveValue } from "./styleUtils";

const columnClasses: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
  5: "grid-cols-3 md:grid-cols-5",
  6: "grid-cols-3 md:grid-cols-6",
};

export function LogoGridBlock({ block }: { block: BlockInstance<"logoGrid"> }) {
  const gridClass = columnClasses[block.columns] ?? columnClasses[5];
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
    <BlockSurface block={block} contentClassName="space-y-10">
      {() => (
        <>
          {(block.eyebrow || block.heading || block.description) && (
            <div className={cn("max-w-3xl space-y-3", headerAlignClass)}>
              {block.eyebrow ? (
                <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
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
          )}

          <div
            className={cn(
              "grid items-center justify-items-center gap-6 text-muted-foreground",
              gridClass,
            )}
          >
            {block.logos.map((logo, index) => {
              const image = (
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={180}
                  height={80}
                  className="h-12 w-auto object-contain mix-blend-multiply"
                />
              );
              return (
                <div
                  key={`${logo.name}-${index}`}
                  className="flex h-16 w-40 items-center justify-center"
                >
                  {logo.href ? (
                    <Link
                      href={logo.href}
                      className="inline-flex items-center justify-center"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {image}
                    </Link>
                  ) : (
                    image
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
