"use client";

import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { type PublicLocale } from "@/i18n/routing";
import {
  localizePublicPathname,
  stripPublicLocalePrefix,
} from "@/lib/public/routing";

type LocaleAvailabilityResponse = {
  href?: string;
};

export function LanguageSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const pathname = usePathname();
  const locale = useLocale() as PublicLocale;
  const [arabicHref, setArabicHref] = useState("/ar");

  useEffect(() => {
    let isSubscribed = true;

    const loadArabicHref = async () => {
      const response = await fetch(
        `/api/public/locale-availability?pathname=${encodeURIComponent(pathname)}&locale=ar`,
        { cache: "no-store" },
      );

      if (!response.ok || !isSubscribed) {
        return;
      }

      const payload = (await response.json()) as LocaleAvailabilityResponse;
      if (payload.href) {
        setArabicHref(payload.href);
      }
    };

    loadArabicHref();

    return () => {
      isSubscribed = false;
    };
  }, [pathname]);

  const englishHref = localizePublicPathname(
    stripPublicLocalePrefix(pathname),
    "en",
  );

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-border/70 bg-background/80 p-1"
      aria-label={t("label")}
    >
      <Languages className="mx-1 h-4 w-4 text-muted-foreground" />
      <Button
        asChild
        size="sm"
        variant={locale === "en" ? "secondary" : "ghost"}
        className="h-8 rounded-full px-3 text-xs"
      >
        <a href={englishHref}>{t("en")}</a>
      </Button>
      <Button
        asChild
        size="sm"
        variant={locale === "ar" ? "secondary" : "ghost"}
        className="h-8 rounded-full px-3 text-xs"
      >
        <a href={arabicHref}>{t("ar")}</a>
      </Button>
    </div>
  );
}

export default LanguageSwitcher;
