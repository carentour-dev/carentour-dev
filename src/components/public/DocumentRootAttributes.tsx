"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { defaultPublicLocale, type PublicLocale } from "@/i18n/routing";
import { getPublicDirection } from "@/lib/public/routing";

function resolveDocumentLocale(pathname: string | null): PublicLocale {
  return pathname === "/ar" || pathname?.startsWith("/ar/")
    ? "ar"
    : defaultPublicLocale;
}

export default function DocumentRootAttributes() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const locale = resolveDocumentLocale(pathname);
    const root = document.documentElement;

    root.lang = locale;
    root.dir = getPublicDirection(locale);
  }, [pathname]);

  return null;
}
