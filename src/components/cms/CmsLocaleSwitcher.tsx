"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import type { PublicLocale } from "@/i18n/routing";
import { buildAdminLocaleHref } from "@/lib/public/adminLocale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CmsLocaleSwitcherProps = {
  locale: PublicLocale;
  className?: string;
  title?: string;
  description?: string;
};

export function CmsLocaleSwitcher({
  locale,
  className,
  title = "Editing locale",
  description = "English edits the base record. Arabic edits the translation row for the same public URL.",
}: CmsLocaleSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Languages className="h-3.5 w-3.5" />
            {title}
          </Badge>
          <span className="text-sm font-medium text-foreground">
            {locale === "ar" ? "Arabic" : "English"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          asChild
          size="sm"
          variant={locale === "en" ? "default" : "outline"}
        >
          <Link href={buildAdminLocaleHref(pathname, "en", searchParams)}>
            English
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          variant={locale === "ar" ? "default" : "outline"}
        >
          <Link href={buildAdminLocaleHref(pathname, "ar", searchParams)}>
            Arabic
          </Link>
        </Button>
      </div>
    </div>
  );
}
