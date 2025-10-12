import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { BlockValue } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";

const backgroundClasses: Record<BlockValue<"callToAction">["background"], string> = {
  muted: "bg-muted/40 text-foreground",
  accent: "bg-primary/10 text-primary",
  dark: "bg-slate-900 text-slate-50",
  image: "relative overflow-hidden text-white",
};

export function CallToActionBlock({ block }: { block: BlockValue<"callToAction"> }) {
  const actions = block.actions ?? [];
  const descriptionClass =
    block.background === "dark" || block.background === "image"
      ? "text-white/80"
      : "text-muted-foreground";
  const sectionContent = (
    <div
      className={cn(
        "container mx-auto px-4 py-16",
        block.background === "dark" ? "text-white" : "",
      )}
    >
      <div
        className={cn(
          "mx-auto grid items-center gap-8",
          block.layout === "split" ? "lg:grid-cols-[2fr_1fr]" : "lg:max-w-4xl",
          block.layout === "centered" ? "text-center" : "text-left",
        )}
      >
        <div className="space-y-4">
          {block.eyebrow ? (
            <span className="text-sm font-semibold uppercase tracking-wide opacity-80">
              {block.eyebrow}
            </span>
          ) : null}
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight">{block.heading}</h2>
          {block.description ? (
            <p className={cn("text-lg md:max-w-3xl", descriptionClass)}>{block.description}</p>
          ) : null}
        </div>
        {actions.length ? (
          <div
            className={cn(
              "flex flex-wrap gap-3",
              block.layout === "centered" ? "justify-center" : "justify-start",
            )}
          >
            {actions.map((action, index) => (
              <Button
                key={`cta-action-${index}`}
                asChild
                variant={action.variant ?? (index === 0 ? "default" : "secondary")}
                size="lg"
                className={cn(block.background === "dark" && index > 0 ? "bg-transparent border border-white/40" : undefined)}
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
    </div>
  );

  if (block.background === "image" && block.image?.src) {
    return (
      <section className="relative">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `url(${block.image.src})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        {block.image.overlay ? (
          <div className="absolute inset-0 bg-black/60" />
        ) : null}
        <div className="relative">
          {sectionContent}
        </div>
      </section>
    );
  }

  return (
    <section className={backgroundClasses[block.background]}>
      {sectionContent}
    </section>
  );
}
