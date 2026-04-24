"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Menu, Phone, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { NavigationLink } from "@/lib/navigation";
import type { PublicLocale } from "@/i18n/routing";
import {
  localizePublicPathname,
  localizePublicPathnameWithFallback,
} from "@/lib/public/routing";
import LanguageSwitcher from "@/components/public/LanguageSwitcher";
import PublicHeaderAuthSlot from "@/components/public/PublicHeaderAuthSlot";

type PublicMobileMenuProps = {
  locale: PublicLocale;
  navigationLinks: NavigationLink[];
  phoneNumber: string;
  phoneNumberDirection: "ltr" | "rtl";
  phoneHref: string;
  email: string;
  emailHref: string;
  signInLabel: string;
  consultationCtaLabel: string;
  toggleMenuLabel: string;
  closeMenuLabel: string;
};

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

export default function PublicMobileMenu({
  locale,
  navigationLinks,
  phoneNumber,
  phoneNumberDirection,
  phoneHref,
  email,
  emailHref,
  signInLabel,
  consultationCtaLabel,
  toggleMenuLabel,
  closeMenuLabel,
}: PublicMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, isOpen]);

  const menu =
    isOpen
      ? createPortal(
          <div
            aria-label={toggleMenuLabel}
            aria-modal="true"
            className="fixed inset-0 z-[100] overflow-hidden bg-background text-foreground md:hidden"
            role="dialog"
          >
            <div
              className="flex h-dvh flex-col"
              style={{
                paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)",
              }}
            >
              <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-5">
                <Link
                  href={localizePublicPathname("/", locale)}
                  onClick={closeMenu}
                  className="min-w-0"
                >
                  <HeaderLogo
                    width={216}
                    height={48}
                    className="h-auto w-[min(216px,calc(100vw-6rem))]"
                  />
                </Link>
                <button
                  type="button"
                  aria-label={closeMenuLabel}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-smooth hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={closeMenu}
                >
                  <X className="h-6 w-6 text-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]">
                <div className="space-y-2">
                  {navigationLinks.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="block py-3 text-lg font-medium text-foreground transition-smooth hover:text-primary"
                      onClick={closeMenu}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="mt-6 border-t border-border/50 pt-4">
                  <LanguageSwitcher />
                </div>
                <div className="mt-6 space-y-3 border-t border-border/50 pt-4">
                  <PublicHeaderAuthSlot
                    variant="mobile"
                    signInLabel={signInLabel}
                  />
                  <a
                    href={localizePublicPathnameWithFallback(
                      "/consultation",
                      locale,
                    )}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-premium px-4 text-sm font-semibold tracking-tight text-premium-foreground ring-offset-background transition-all duration-200 ease-smooth hover:bg-premium/90 hover:shadow-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={closeMenu}
                  >
                    {consultationCtaLabel}
                  </a>
                </div>
                <div className="mt-6 space-y-3 border-t border-border/50 pt-4 text-sm text-muted-foreground">
                  <a
                    href={phoneHref}
                    className="flex items-center gap-3 text-foreground transition-smooth hover:text-primary"
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
                    href={emailHref}
                    className="flex items-center gap-3 text-foreground transition-smooth hover:text-primary"
                  >
                    <Mail className="h-5 w-5 text-primary" />
                    <bdi dir="ltr">{email}</bdi>
                  </a>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-smooth hover:bg-muted md:hidden"
        aria-label={toggleMenuLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {menu}
    </>
  );
}
