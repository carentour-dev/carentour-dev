import Image from "next/image";
import Link from "next/link";
import type { PublicLocale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import type { BlockInstance } from "@/lib/cms/blocks";
import { buildHeroOverlayGradient } from "@/lib/heroOverlay";
import { getLocalizedSafeManagedHref } from "@/lib/managedHrefs";
import { localizeOptionalDigits } from "@/lib/public/numbers";
import { BlockSurface } from "./BlockSurface";
import { withBlockStyleDefaults } from "./blockStyleDefaults";

const HERO_MIN_HEIGHT_CLASS = "min-h-[calc(100svh-4.5rem)]";

export function AboutHeroBlock({
  block,
  locale = "en",
}: {
  block: BlockInstance<"aboutHero">;
  locale?: PublicLocale;
}) {
  const blockWithStyle = withBlockStyleDefaults(block, {
    background: {
      variant: "solid",
      color: {
        base: "hsl(var(--editorial-ink))",
      },
    },
    typography: {
      textColor: {
        base: "hsl(var(--editorial-ink-foreground))",
      },
    },
  });
  const actions = [block.primaryAction, block.secondaryAction].filter(Boolean);
  const overlayGradient = buildHeroOverlayGradient(block.overlay);

  return (
    <BlockSurface
      block={blockWithStyle}
      container={false}
      defaultPadding={{ top: "0rem", bottom: "0rem" }}
    >
      {() => (
        <div className={["relative", HERO_MIN_HEIGHT_CLASS].join(" ")}>
          <Image
            src={block.backgroundImageUrl}
            alt={block.heading}
            fill
            priority
            className="object-cover"
            sizes="100vw"
            unoptimized={block.backgroundImageUrl.startsWith("http")}
          />
          <div
            className="absolute inset-0"
            style={{ backgroundImage: overlayGradient }}
          />

          <div
            className={[
              "relative z-10 flex flex-col justify-between",
              HERO_MIN_HEIGHT_CLASS,
            ].join(" ")}
          >
            <div className="container mx-auto flex flex-1 items-center px-4">
              <div className="w-full max-w-3xl py-16 lg:py-20">
                <div className="space-y-6">
                  {block.eyebrow ? (
                    <span className="inline-flex items-center rounded-full border border-[hsl(var(--editorial-ink-foreground)/0.2)] bg-[hsl(var(--editorial-ink-foreground)/0.08)] px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-[hsl(var(--editorial-accent))]">
                      {localizeOptionalDigits(block.eyebrow, locale)}
                    </span>
                  ) : null}

                  <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white md:text-6xl md:leading-[1.02]">
                    {localizeOptionalDigits(block.heading, locale)}
                  </h1>

                  {block.description ? (
                    <p className="max-w-2xl text-base leading-7 text-[hsl(var(--editorial-ink-muted))] md:text-lg">
                      {localizeOptionalDigits(block.description, locale)}
                    </p>
                  ) : null}

                  {actions.length > 0 ? (
                    <div className="flex flex-wrap gap-3 pt-2">
                      {actions.map((action, index) => {
                        const resolvedVariant =
                          index === 0
                            ? (action?.variant ?? "default")
                            : !action?.variant ||
                                action.variant === "default" ||
                                action.variant === "secondary"
                              ? "hero"
                              : action.variant;

                        return (
                          <Button
                            key={`${action?.href}-${index}`}
                            asChild
                            size="lg"
                            variant={resolvedVariant}
                            className={
                              index === 0
                                ? "shadow-[0_24px_80px_rgba(34,211,238,0.2)]"
                                : undefined
                            }
                          >
                            <Link
                              href={getLocalizedSafeManagedHref(
                                action?.href,
                                locale,
                                "/contact",
                              )}
                              target={action?.target ?? "_self"}
                              rel={
                                action?.target === "_blank"
                                  ? "noopener noreferrer"
                                  : undefined
                              }
                            >
                              {localizeOptionalDigits(action?.label, locale)}
                            </Link>
                          </Button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="border-t border-[hsl(var(--editorial-ink-foreground)/0.12)] bg-[hsl(var(--editorial-ink)/0.62)] backdrop-blur-sm">
              <div className="container mx-auto grid gap-6 px-4 py-6 md:grid-cols-3">
                {block.highlights.map((highlight, index) => (
                  <div
                    key={`${highlight.label}-${index}`}
                    className="space-y-2 border-l border-[hsl(var(--editorial-accent)/0.28)] pl-4"
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-[hsl(var(--editorial-accent))]">
                      {localizeOptionalDigits(highlight.kicker, locale)}
                    </p>
                    <p className="text-sm leading-6 text-[hsl(var(--editorial-ink-foreground))] md:text-base">
                      {localizeOptionalDigits(highlight.label, locale)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </BlockSurface>
  );
}
