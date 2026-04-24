"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  fetchNavigationLinks,
  getFallbackNavigationLinks,
  isNavigationVisible,
  mergeWithFallback,
  type NavigationLink,
} from "@/lib/navigation";
import { useInitialNavigationLinks } from "@/components/navigation/NavigationProvider";
import { defaultPublicLocale, type PublicLocale } from "@/i18n/routing";
import {
  formatPhoneNumberForDisplay,
  getPhoneNumberDisplayDirection,
  PUBLIC_CONTACT_EMAIL,
  PUBLIC_CONTACT_EMAIL_HREF,
  PUBLIC_CONTACT_PHONE_DISPLAY,
  PUBLIC_CONTACT_PHONE_HREF,
} from "@/lib/public/contact";
import {
  localizePublicPathname,
  localizePublicPathnameWithFallback,
} from "@/lib/public/routing";
import LanguageSwitcher from "@/components/public/LanguageSwitcher";
import { usePublicShellOwner } from "@/components/public/PublicShellContext";

const HeaderAuthActions = dynamic(
  () => import("@/components/public/HeaderAuthActions"),
  { ssr: false },
);

const SUPABASE_AUTH_STORAGE_KEY_PATTERN = /^sb-[a-z0-9]+-auth-token$/i;

function isSupabaseAuthStorageKey(key: string) {
  return SUPABASE_AUTH_STORAGE_KEY_PATTERN.test(key);
}

function hasStoredSupabaseSession() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !isSupabaseAuthStorageKey(key)) {
        continue;
      }

      const value = window.localStorage.getItem(key);
      if (value && value !== "null") {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

function HeaderLogo({
  width,
  height,
  className,
}: {
  width: number;
  height: number;
  className: string;
}) {
  return (
    <>
      <Image
        src="/carentour-logo-dark.png"
        alt="Care N Tour"
        width={width}
        height={height}
        className={`${className} dark:hidden`}
      />
      <Image
        src="/carentour-logo-light.png"
        alt="Care N Tour"
        width={width}
        height={height}
        className={`${className} hidden dark:block`}
      />
    </>
  );
}

function StaticSignInButton({ mobile }: { mobile: boolean }) {
  const t = useTranslations("Header");
  const button = (
    <Button
      variant="ghost"
      size={mobile ? "default" : "sm"}
      className={mobile ? "justify-start" : undefined}
      asChild
    >
      <Link href="/auth">
        <User className={mobile ? "mr-2 h-4 w-4" : "mr-1 h-4 w-4"} />
        {t("signIn")}
      </Link>
    </Button>
  );

  return mobile ? <DrawerClose asChild>{button}</DrawerClose> : button;
}

const Header = ({ forceRender = false }: { forceRender?: boolean }) => {
  const shellOwned = usePublicShellOwner();
  if (shellOwned && !forceRender) {
    return null;
  }

  return <HeaderContent />;
};

function HeaderContent() {
  const t = useTranslations("Header");
  const locale = useLocale() as PublicLocale;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [renderAuthActions, setRenderAuthActions] = useState(false);
  const phoneNumber = formatPhoneNumberForDisplay(
    PUBLIC_CONTACT_PHONE_DISPLAY,
    locale,
  );
  const phoneNumberDirection = getPhoneNumberDisplayDirection(locale);

  const initialNavigationLinks = useInitialNavigationLinks();
  const visibleInitialNavigationLinks = useMemo(
    () => initialNavigationLinks.filter(isNavigationVisible),
    [initialNavigationLinks],
  );
  const hasPreloadedNavigation = visibleInitialNavigationLinks.length > 0;
  const [navigationLinks, setNavigationLinks] = useState<NavigationLink[]>([]);
  const [loadingNavigation, setLoadingNavigation] = useState(
    () => !hasPreloadedNavigation,
  );

  useEffect(() => {
    const syncAuthActions = () => {
      setRenderAuthActions(hasStoredSupabaseSession());
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || isSupabaseAuthStorageKey(event.key)) {
        syncAuthActions();
      }
    };

    syncAuthActions();
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (hasPreloadedNavigation) {
      setNavigationLinks([]);
      setLoadingNavigation(false);
      return;
    }

    let isSubscribed = true;

    const loadNavigation = async () => {
      setLoadingNavigation(true);
      const result = await fetchNavigationLinks(locale);
      if (!isSubscribed) return;
      const merged =
        locale === defaultPublicLocale
          ? mergeWithFallback(result.links)
          : result.links;
      setNavigationLinks(merged.filter(isNavigationVisible));
      setLoadingNavigation(false);
    };

    loadNavigation();

    return () => {
      isSubscribed = false;
    };
  }, [hasPreloadedNavigation, locale]);

  const displayedNavigationLinks = hasPreloadedNavigation
    ? visibleInitialNavigationLinks
    : navigationLinks.length > 0
      ? navigationLinks
      : loadingNavigation
        ? []
        : locale === defaultPublicLocale
          ? getFallbackNavigationLinks()
          : [];

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top bar with contact info */}
        <div className="hidden md:flex items-center justify-between py-2 text-sm border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span
                dir={phoneNumberDirection}
                className="text-muted-foreground [unicode-bidi:plaintext]"
              >
                {phoneNumber}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <bdi dir="ltr" className="text-muted-foreground">
                {PUBLIC_CONTACT_EMAIL}
              </bdi>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            {renderAuthActions ? (
              <HeaderAuthActions variant="desktop" />
            ) : (
              <StaticSignInButton mobile={false} />
            )}
            <Button variant="premium" size="sm" asChild>
              <Link
                href={localizePublicPathnameWithFallback(
                  "/consultation",
                  locale,
                )}
              >
                {t("consultationCta")}
              </Link>
            </Button>
          </div>
        </div>

        {/* Main navigation */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <Link
              href={localizePublicPathname("/", locale)}
              className="flex items-center"
            >
              <HeaderLogo width={252} height={56} className="h-14 w-[252px]" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden flex-1 flex-nowrap items-center justify-center gap-3 md:flex md:gap-4 lg:gap-6 xl:gap-8 md:[margin-inline-start:2.5rem]">
            {displayedNavigationLinks.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="text-xs md:text-sm lg:text-[15px] font-medium whitespace-nowrap text-foreground hover:text-primary transition-smooth"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <ThemeToggle />
            </div>
            {/* Mobile menu */}
            <Drawer
              open={isMenuOpen}
              onOpenChange={setIsMenuOpen}
              shouldScaleBackground={false}
            >
              <DrawerTrigger asChild>
                <button className="md:hidden" aria-label={t("toggleMenu")}>
                  {isMenuOpen ? (
                    <X className="h-6 w-6 text-foreground" />
                  ) : (
                    <Menu className="h-6 w-6 text-foreground" />
                  )}
                </button>
              </DrawerTrigger>
              <DrawerContent className="md:hidden h-[96vh] max-h-[96vh] overflow-hidden border-t border-border bg-background">
                <DrawerTitle className="sr-only">{t("toggleMenu")}</DrawerTitle>
                <DrawerDescription className="sr-only">
                  {t("consultationCta")}
                </DrawerDescription>
                <div
                  className="flex h-full flex-col"
                  style={{
                    paddingTop: "calc(env(safe-area-inset-top, 0px) + 2rem)",
                  }}
                >
                  <div className="flex items-center justify-between px-5 pb-3 pt-5">
                    <DrawerClose asChild>
                      <Link href={localizePublicPathname("/", locale)}>
                        <HeaderLogo
                          width={216}
                          height={48}
                          className="h-12 w-[216px]"
                        />
                      </Link>
                    </DrawerClose>
                    <DrawerClose asChild>
                      <button
                        aria-label={t("closeMenu")}
                        className="rounded-md p-2 hover:bg-muted transition-smooth"
                      >
                        <X className="h-6 w-6 text-foreground" />
                      </button>
                    </DrawerClose>
                  </div>
                  <div className="flex-1 overflow-y-auto px-5 pb-6">
                    <div className="space-y-2">
                      {displayedNavigationLinks.map((item) => (
                        <DrawerClose asChild key={item.id}>
                          <Link
                            href={item.href}
                            className="block py-3 text-lg font-medium text-foreground hover:text-primary transition-smooth"
                          >
                            {item.label}
                          </Link>
                        </DrawerClose>
                      ))}
                    </div>
                    <div className="mt-6 border-t border-border/50 pt-4">
                      <LanguageSwitcher />
                    </div>
                    <div className="space-y-3 border-t border-border/50 pt-4 mt-6">
                      {renderAuthActions ? (
                        <HeaderAuthActions variant="mobile" />
                      ) : (
                        <StaticSignInButton mobile />
                      )}
                      <DrawerClose asChild>
                        <Button variant="premium" className="w-full" asChild>
                          <Link
                            href={localizePublicPathnameWithFallback(
                              "/consultation",
                              locale,
                            )}
                          >
                            {t("consultationCta")}
                          </Link>
                        </Button>
                      </DrawerClose>
                    </div>
                    <div className="space-y-3 border-t border-border/50 pt-4 mt-6 text-sm text-muted-foreground">
                      <a
                        href={PUBLIC_CONTACT_PHONE_HREF}
                        className="flex items-center gap-3 text-foreground hover:text-primary transition-smooth"
                      >
                        <Phone className="h-5 w-5 text-primary" />
                        <span
                          dir={phoneNumberDirection}
                          className="[unicode-bidi:plaintext]"
                        >
                          {phoneNumber}
                        </span>
                      </a>
                      <a
                        href={PUBLIC_CONTACT_EMAIL_HREF}
                        className="flex items-center gap-3 text-foreground hover:text-primary transition-smooth"
                      >
                        <Mail className="h-5 w-5 text-primary" />
                        <bdi dir="ltr">{PUBLIC_CONTACT_EMAIL}</bdi>
                      </a>
                    </div>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
