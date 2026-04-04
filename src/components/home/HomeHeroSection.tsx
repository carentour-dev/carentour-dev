import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import type { PublicLocale } from "@/i18n/routing";
import { buildHeroOverlayGradient } from "@/lib/heroOverlay";
import { localizeOptionalDigits } from "@/lib/public/numbers";
import {
  localizePublicPathname,
  localizePublicPathnameWithFallback,
} from "@/lib/public/routing";
import { cn } from "@/lib/utils";
import type { HomeAction, HomeHeroContent } from "./content";

const DEFAULT_HERO_IMAGE_URL =
  "https://cmnwwchipysvwvijqjcu.supabase.co/storage/v1/object/public/media/cms/home-hero/90bc8c9d-bab8-45e6-9975-c7308001f4dd/cnt_hero.png";

type HomeHeroSectionProps = {
  content: HomeHeroContent;
  className?: string;
  containerClassName?: string;
  contentColumnClassName?: string;
  locale?: PublicLocale;
};

function resolveHeroButtonVariant(
  action: HomeAction,
  index: number,
): NonNullable<ButtonProps["variant"]> {
  if (index === 0) {
    return action.variant === "default" ? "premium" : action.variant;
  }

  return action.variant ?? "hero";
}

function resolveLinkRel(target: HomeAction["target"]) {
  return target === "_blank" ? "noopener noreferrer" : undefined;
}

export function HomeHeroSection({
  content,
  className,
  containerClassName,
  contentColumnClassName,
  locale = "en",
}: HomeHeroSectionProps) {
  const resolvedBackgroundImageUrl =
    typeof content.backgroundImageUrl === "string" &&
    content.backgroundImageUrl.trim().length > 0
      ? content.backgroundImageUrl.trim()
      : DEFAULT_HERO_IMAGE_URL;
  const overlayGradient = buildHeroOverlayGradient(content.overlay);
  const highlights = content.highlights ?? [];
  const resolveActionHref = (href: string) => {
    if (!href.startsWith("/")) {
      return href;
    }

    return href === "/start-journey" || href.startsWith("/start-journey?")
      ? localizePublicPathnameWithFallback(href, locale)
      : localizePublicPathname(href, locale);
  };

  return (
    <section
      className={cn(
        "relative flex min-h-[70vh] flex-col overflow-hidden",
        className,
      )}
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${resolvedBackgroundImageUrl})` }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{ backgroundImage: overlayGradient }}
        />
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-between">
        <div
          className={cn(
            "container mx-auto flex flex-1 items-center px-4",
            containerClassName,
          )}
        >
          <div className={cn("w-full py-16 lg:py-20", contentColumnClassName)}>
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-premium" />
                <span className="font-semibold text-premium">
                  {localizeOptionalDigits(content.eyebrow, locale)}
                </span>
              </div>

              <h1 className="text-5xl font-bold leading-tight text-primary-foreground md:text-7xl">
                {localizeOptionalDigits(content.headingPrefix, locale)}
                <span className="block text-premium [text-shadow:0_4px_18px_rgba(0,0,0,0.35)]">
                  {localizeOptionalDigits(content.headingHighlight, locale)}
                </span>
                {localizeOptionalDigits(content.headingSuffix, locale)}
              </h1>

              <p className="max-w-3xl whitespace-pre-line text-xl leading-relaxed text-primary-foreground/90 md:text-2xl">
                {localizeOptionalDigits(content.description, locale)}
              </p>

              <div className="flex flex-col gap-4 pt-2 sm:flex-row">
                <Button
                  size="lg"
                  variant={resolveHeroButtonVariant(content.primaryAction, 0)}
                  className="px-8 py-4 text-lg"
                  asChild
                >
                  <Link
                    href={resolveActionHref(content.primaryAction.href)}
                    target={content.primaryAction.target ?? "_self"}
                    rel={resolveLinkRel(content.primaryAction.target)}
                  >
                    {localizeOptionalDigits(
                      content.primaryAction.label,
                      locale,
                    )}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant={resolveHeroButtonVariant(content.secondaryAction, 1)}
                  className="px-8 py-4 text-lg"
                  asChild
                >
                  <Link
                    href={resolveActionHref(content.secondaryAction.href)}
                    target={content.secondaryAction.target ?? "_self"}
                    rel={resolveLinkRel(content.secondaryAction.target)}
                  >
                    {localizeOptionalDigits(
                      content.secondaryAction.label,
                      locale,
                    )}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {highlights.length > 0 ? (
          <div className="border-t border-[hsl(var(--editorial-ink-foreground)/0.12)] bg-[hsl(var(--editorial-ink)/0.62)] backdrop-blur-sm">
            <div className="container mx-auto grid gap-6 px-4 py-6 md:grid-cols-3">
              {highlights.map((highlight, index) => (
                <div
                  key={`${highlight.kicker}-${highlight.label}-${index}`}
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
        ) : null}
      </div>
    </section>
  );
}
