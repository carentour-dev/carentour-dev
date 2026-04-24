import Image from "next/image";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { NavigationLink } from "@/lib/navigation";
import type { PublicLocale } from "@/i18n/routing";
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
import PublicHeaderAuthSlot from "@/components/public/PublicHeaderAuthSlot";
import PublicMobileMenu from "@/components/public/PublicMobileMenu";
import PublicThemeToggle from "@/components/public/PublicThemeToggle";

type PublicHeaderProps = {
  locale: PublicLocale;
  navigationLinks: NavigationLink[];
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
        priority
      />
      <Image
        src="/carentour-logo-light.png"
        alt="Care N Tour"
        width={width}
        height={height}
        className={`${className} hidden dark:block`}
        priority
      />
    </>
  );
}

export default async function PublicHeader({
  locale,
  navigationLinks,
}: PublicHeaderProps) {
  const t = await getTranslations({ locale, namespace: "Header" });
  const phoneNumber = formatPhoneNumberForDisplay(
    PUBLIC_CONTACT_PHONE_DISPLAY,
    locale,
  );
  const phoneNumberDirection = getPhoneNumberDisplayDirection(locale);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="hidden items-center justify-between border-b border-border/50 py-2 text-sm md:flex">
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
            <PublicThemeToggle />
            <PublicHeaderAuthSlot variant="desktop" signInLabel={t("signIn")} />
            <a
              href={localizePublicPathnameWithFallback("/consultation", locale)}
              className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-premium px-3 text-sm font-semibold tracking-tight text-premium-foreground ring-offset-background transition-all duration-200 ease-smooth hover:bg-premium/90 hover:shadow-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {t("consultationCta")}
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4 py-4 sm:justify-between">
          <div className="flex min-w-0 items-center">
            <Link
              href={localizePublicPathname("/", locale)}
              className="flex min-w-0 items-center"
            >
              <HeaderLogo
                width={252}
                height={56}
                className="h-auto w-[min(216px,calc(100vw-7.5rem))] md:h-14 md:w-[252px]"
              />
            </Link>
          </div>

          <nav className="hidden flex-1 flex-nowrap items-center justify-center gap-3 md:flex md:gap-4 md:[margin-inline-start:2.5rem] lg:gap-6 xl:gap-8">
            {navigationLinks.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="whitespace-nowrap text-xs font-medium text-foreground transition-smooth hover:text-primary md:text-sm lg:text-[15px]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <div className="md:hidden">
              <PublicThemeToggle />
            </div>
            <PublicMobileMenu
              locale={locale}
              navigationLinks={navigationLinks}
              phoneNumber={phoneNumber}
              phoneNumberDirection={phoneNumberDirection}
              phoneHref={PUBLIC_CONTACT_PHONE_HREF}
              email={PUBLIC_CONTACT_EMAIL}
              emailHref={PUBLIC_CONTACT_EMAIL_HREF}
              signInLabel={t("signIn")}
              consultationCtaLabel={t("consultationCta")}
              toggleMenuLabel={t("toggleMenu")}
              closeMenuLabel={t("closeMenu")}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
