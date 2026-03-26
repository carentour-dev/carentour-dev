import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HomeHeroContent } from "./content";

const DEFAULT_HERO_IMAGE_URL = "/hero-medical-facility.webp";

export function HomeHeroSection({ content }: { content: HomeHeroContent }) {
  const resolvedBackgroundImageUrl =
    typeof content.backgroundImageUrl === "string" &&
    content.backgroundImageUrl.trim().length > 0
      ? content.backgroundImageUrl.trim()
      : DEFAULT_HERO_IMAGE_URL;

  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${resolvedBackgroundImageUrl})` }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/10 md:to-transparent dark:from-background/95 dark:via-background/85 dark:to-background/30" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-5xl">
          <div className="mb-6 flex items-center space-x-2">
            <Shield className="h-6 w-6 text-premium" />
            <span className="font-semibold text-premium">
              {content.eyebrow}
            </span>
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight text-primary-foreground md:text-7xl">
            {content.headingPrefix}
            <span className="block text-premium [text-shadow:0_4px_18px_rgba(0,0,0,0.35)]">
              {content.headingHighlight}
            </span>
            {content.headingSuffix}
          </h1>

          <p className="mb-8 max-w-3xl whitespace-pre-line text-xl leading-relaxed text-primary-foreground/90 md:text-2xl">
            {content.description}
          </p>

          <div className="mb-12 flex flex-col gap-4 sm:flex-row">
            <Button
              size="lg"
              variant="premium"
              className="px-8 py-4 text-lg"
              asChild
            >
              <Link href={content.primaryAction.href}>
                {content.primaryAction.label}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="hero"
              className="px-8 py-4 text-lg"
              asChild
            >
              <Link href={content.secondaryAction.href}>
                {content.secondaryAction.label}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
