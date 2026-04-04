import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { PublicLocale } from "@/i18n/routing";
import { localizeOptionalDigits } from "@/lib/public/numbers";
import {
  localizePublicPathname,
  localizePublicPathnameWithFallback,
} from "@/lib/public/routing";
import type { HomeCtaContent } from "./content";

export function HomeCtaSection({
  content,
  locale = "en",
}: {
  content: HomeCtaContent;
  locale?: PublicLocale;
}) {
  const resolveActionHref = (href: string) => {
    if (!href.startsWith("/")) {
      return href;
    }

    return href === "/start-journey" || href.startsWith("/start-journey?")
      ? localizePublicPathnameWithFallback(href, locale)
      : localizePublicPathname(href, locale);
  };

  return (
    <section className="bg-surface-subtle py-20">
      <div className="container mx-auto px-4 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-4xl font-bold text-foreground md:text-5xl">
            {localizeOptionalDigits(content.headingPrefix, locale)}{" "}
            <span className="text-primary">
              {localizeOptionalDigits(content.headingHighlight, locale)}
            </span>
          </h2>
          <p className="mb-8 text-xl leading-relaxed text-muted-foreground">
            {localizeOptionalDigits(content.description, locale)}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href={resolveActionHref(content.primaryAction.href)}>
                {localizeOptionalDigits(content.primaryAction.label, locale)}
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href={resolveActionHref(content.secondaryAction.href)}>
                {localizeOptionalDigits(content.secondaryAction.label, locale)}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
