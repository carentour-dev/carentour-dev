"use client";

import type { ReactNode } from "react";
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
  actions?: ReactNode;
};

export function CmsLocaleSwitcher({
  locale,
  className,
  title = "Editing locale",
  description = "English edits the base record. Arabic edits the translation row for the same public URL.",
  actions,
}: CmsLocaleSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 xl:flex-row xl:items-center xl:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1 xl:flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Languages className="h-3.5 w-3.5" />
            {title}
          </Badge>
          <span className="text-sm font-medium text-foreground">
            {locale === "ar" ? "Arabic" : "English"}
          </span>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 xl:justify-end">
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
        {actions}
      </div>
    </div>
  );
}
