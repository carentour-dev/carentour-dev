"use client";

import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { type PublicLocale } from "@/i18n/routing";

type LocaleAvailabilityResponse = {
  href?: string;
};

export function LanguageSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const pathname = usePathname();
  const locale = useLocale() as PublicLocale;
  const [hrefs, setHrefs] = useState({ english: "/", arabic: "/ar" });

  useEffect(() => {
    let isSubscribed = true;

    const loadLocalizedHrefs = async () => {
      const [englishResponse, arabicResponse] = await Promise.all([
        fetch(
          `/api/public/locale-availability?pathname=${encodeURIComponent(pathname)}&locale=en`,
          { cache: "no-store" },
        ),
        fetch(
          `/api/public/locale-availability?pathname=${encodeURIComponent(pathname)}&locale=ar`,
          { cache: "no-store" },
        ),
      ]);

      if (!isSubscribed) {
        return;
      }

      const nextHrefs = { english: "/", arabic: "/ar" };

      if (englishResponse.ok) {
        const payload =
          (await englishResponse.json()) as LocaleAvailabilityResponse;
        if (payload.href) {
          nextHrefs.english = payload.href;
        }
      }

      if (arabicResponse.ok) {
        const payload =
          (await arabicResponse.json()) as LocaleAvailabilityResponse;
        if (payload.href) {
          nextHrefs.arabic = payload.href;
        }
      }

      setHrefs(nextHrefs);
    };

    loadLocalizedHrefs();

    return () => {
      isSubscribed = false;
    };
  }, [pathname]);

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
        <a href={hrefs.english}>{t("en")}</a>
      </Button>
      <Button
        asChild
        size="sm"
        variant={locale === "ar" ? "secondary" : "ghost"}
        className="h-8 rounded-full px-3 text-xs"
      >
        <a href={hrefs.arabic}>{t("ar")}</a>
      </Button>
    </div>
  );
}

export default LanguageSwitcher;
