import Image from "next/image";
import Link from "next/link";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { NavigationLink } from "@/lib/navigation";
import { selectQuickLinks } from "@/lib/navigation";
import type { PublicLocale } from "@/i18n/routing";
import {
  formatPhoneNumberForDisplay,
  getPhoneNumberDisplayDirection,
  getPublicContactAddressDisplay,
  PUBLIC_CONTACT_EMAIL,
  PUBLIC_CONTACT_PHONE_DISPLAY,
} from "@/lib/public/contact";
import PublicNewsletterForm from "@/components/public/PublicNewsletterForm";

type PublicFooterProps = {
  locale: PublicLocale;
  navigationLinks: NavigationLink[];
};

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/carentour",
    Icon: Facebook,
  },
  { label: "X (Twitter)", href: "https://x.com/carentour", Icon: Twitter },
  {
    label: "Instagram",
    href: "https://www.instagram.com/carentoureg",
    Icon: Instagram,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/carentour",
    Icon: Linkedin,
  },
];

function FooterLogo() {
  return (
    <>
      <Image
        src="/carentour-logo-dark.png"
        alt="Care N Tour"
        width={280}
        height={62}
        className="mb-4 max-w-full object-contain dark:hidden"
      />
      <Image
        src="/carentour-logo-light.png"
        alt="Care N Tour"
        width={280}
        height={62}
        className="mb-4 hidden max-w-full object-contain dark:block"
      />
    </>
  );
}

export default async function PublicFooter({
  locale,
  navigationLinks,
}: PublicFooterProps) {
  const t = await getTranslations({ locale, namespace: "Footer" });
  const quickLinks = selectQuickLinks(navigationLinks);
  const currentYear = new Date().getFullYear();
  const phoneNumber = formatPhoneNumberForDisplay(
    PUBLIC_CONTACT_PHONE_DISPLAY,
    locale,
  );
  const phoneNumberDirection = getPhoneNumberDisplayDirection(locale);
  const address = getPublicContactAddressDisplay(locale);

  return (
    <footer className="border-t border-border bg-background text-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <FooterLogo />
            <p className="mb-6 text-muted-foreground">{t("description")}</p>
            <div className="flex gap-4">
              {socialLinks.map(({ label, href, Icon }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={t("visitSocial", { label })}
                  className="text-muted-foreground transition-smooth hover:text-foreground"
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold text-foreground">
              {t("quickLinks")}
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-smooth hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold text-foreground">
              {t("contactInfo")}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span
                  dir={phoneNumberDirection}
                  className="text-muted-foreground [unicode-bidi:plaintext]"
                >
                  {phoneNumber}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <bdi dir="ltr" className="text-muted-foreground">
                  {PUBLIC_CONTACT_EMAIL}
                </bdi>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">{address}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold text-foreground">
              {t("newsletterTitle")}
            </h4>
            <p className="mb-4 text-muted-foreground">
              {t("newsletterDescription")}
            </p>
            <PublicNewsletterForm
              placeholder={t("newsletterPlaceholder")}
              submittingLabel={t("newsletterSubmitting")}
              submitLabel={t("newsletterSubscribe")}
            />
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-muted-foreground">
            {t("copyright", { year: currentYear })}
          </p>
        </div>
      </div>
    </footer>
  );
}
