"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail, User, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "next-themes";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
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

const Header = ({ forceRender = false }: { forceRender?: boolean }) => {
  const shellOwned = usePublicShellOwner();
  const t = useTranslations("Header");
  const locale = useLocale() as PublicLocale;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { resolvedTheme } = useTheme();
  const logoSrc =
    mounted && resolvedTheme === "dark"
      ? "/carentour-logo-light.png"
      : "/carentour-logo-dark.png";
  const phoneNumber = formatPhoneNumberForDisplay(
    PUBLIC_CONTACT_PHONE_DISPLAY,
    locale,
  );

  const initialNavigationLinks = useInitialNavigationLinks();
  const visibleInitialNavigationLinks =
    initialNavigationLinks.filter(isNavigationVisible);
  const [navigationLinks, setNavigationLinks] = useState<NavigationLink[]>(
    () => visibleInitialNavigationLinks,
  );
  const [loadingNavigation, setLoadingNavigation] = useState(
    () => visibleInitialNavigationLinks.length === 0,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    const nextNavigationLinks =
      initialNavigationLinks.filter(isNavigationVisible);
    setNavigationLinks(nextNavigationLinks);
    setLoadingNavigation(nextNavigationLinks.length === 0);
  }, [initialNavigationLinks]);

  useEffect(() => {
    let isSubscribed = true;
    const hasInitialNavigation = visibleInitialNavigationLinks.length > 0;
    const loadNavigation = async () => {
      if (!hasInitialNavigation) {
        setLoadingNavigation(true);
      }
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
  }, [locale, visibleInitialNavigationLinks.length]);

  const displayedNavigationLinks =
    navigationLinks.length > 0
      ? navigationLinks
      : loadingNavigation
        ? []
        : locale === defaultPublicLocale
          ? getFallbackNavigationLinks()
          : [];

  if (shellOwned && !forceRender) {
    return null;
  }

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top bar with contact info */}
        <div className="hidden md:flex items-center justify-between py-2 text-sm border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <bdi dir="ltr" className="text-muted-foreground">
                {phoneNumber}
              </bdi>
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
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hidden lg:inline hover:text-primary transition-smooth"
                >
                  {t("dashboardGreeting", {
                    name: profile?.displayName || t("userFallback"),
                  })}
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-1" />
                  {t("signOut")}
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-1" />
                  {t("signIn")}
                </Button>
              </Link>
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
              <Image
                src={logoSrc}
                alt="Care N Tour"
                width={160}
                height={56}
                className="h-14 w-auto"
                priority
              />
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
                <div
                  className="flex h-full flex-col"
                  style={{
                    paddingTop: "calc(env(safe-area-inset-top, 0px) + 2rem)",
                  }}
                >
                  <div className="flex items-center justify-between px-5 pb-3 pt-5">
                    <DrawerClose asChild>
                      <Link href={localizePublicPathname("/", locale)}>
                        <Image
                          src={logoSrc}
                          alt="Care N Tour"
                          width={140}
                          height={48}
                          className="h-12 w-auto"
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
                      {user ? (
                        <DrawerClose asChild>
                          <Button
                            variant="ghost"
                            className="justify-start"
                            onClick={signOut}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            {t("signOut")}
                          </Button>
                        </DrawerClose>
                      ) : (
                        <DrawerClose asChild>
                          <Button
                            variant="ghost"
                            className="justify-start"
                            asChild
                          >
                            <Link href="/auth">
                              <User className="h-4 w-4 mr-2" />
                              {t("signIn")}
                            </Link>
                          </Button>
                        </DrawerClose>
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
                        <bdi dir="ltr">{phoneNumber}</bdi>
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
};

export default Header;
