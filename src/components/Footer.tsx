"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useNewsletter } from "@/hooks/useNewsletter";
import {
  fetchNavigationLinks,
  mergeWithFallback,
  selectQuickLinks,
  type NavigationLink,
} from "@/lib/navigation";
import { useInitialNavigationLinks } from "@/components/navigation/NavigationProvider";
import { type PublicLocale } from "@/i18n/routing";
import {
  formatPhoneNumberForDisplay,
  getPhoneNumberDisplayDirection,
  getPublicContactAddressDisplay,
  PUBLIC_CONTACT_EMAIL,
  PUBLIC_CONTACT_PHONE_DISPLAY,
} from "@/lib/public/contact";
import { usePublicShellOwner } from "@/components/public/PublicShellContext";

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

const Footer = ({ forceRender = false }: { forceRender?: boolean }) => {
  const shellOwned = usePublicShellOwner();
  const t = useTranslations("Footer");
  const locale = useLocale() as PublicLocale;
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const { subscribe, loading } = useNewsletter();
  const initialNavigationLinks = useInitialNavigationLinks();
  const [quickLinks, setQuickLinks] = useState<NavigationLink[]>(() =>
    selectQuickLinks(initialNavigationLinks),
  );
  const currentYear = new Date().getFullYear();
  const phoneNumber = formatPhoneNumberForDisplay(
    PUBLIC_CONTACT_PHONE_DISPLAY,
    locale,
  );
  const phoneNumberDirection = getPhoneNumberDisplayDirection(locale);
  const address = getPublicContactAddressDisplay(locale);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    setQuickLinks(selectQuickLinks(initialNavigationLinks));
  }, [initialNavigationLinks]);

  useEffect(() => {
    let isSubscribed = true;
    if (initialNavigationLinks.length > 0) {
      return () => {
        isSubscribed = false;
      };
    }
    const loadNavigation = async () => {
      const result = await fetchNavigationLinks(locale);
      if (!isSubscribed) return;
      const merged = mergeWithFallback(result.links);
      setQuickLinks(selectQuickLinks(merged));
    };

    loadNavigation();

    return () => {
      isSubscribed = false;
    };
  }, [initialNavigationLinks, locale]);

  if (shellOwned && !forceRender) {
    return null;
  }

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      const result = await subscribe(email, "footer");
      if (result.success) {
        setEmail("");
      }
    }
  };

  return (
    <footer className="border-t border-border bg-background text-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <Image
              src={
                mounted && resolvedTheme === "dark"
                  ? "/carentour-logo-light.png"
                  : "/carentour-logo-dark.png"
              }
              alt="Care N Tour"
              width={260}
              height={94}
              className="mb-4 h-[72px] w-auto max-w-[280px] object-contain"
            />
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

          {/* Quick Links */}
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

          {/* Contact Info */}
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

          {/* Newsletter */}
          <div>
            <h4 className="mb-4 text-lg font-semibold text-foreground">
              {t("newsletterTitle")}
            </h4>
            <p className="mb-4 text-muted-foreground">
              {t("newsletterDescription")}
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder={t("newsletterPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background text-foreground"
                required
              />
              <Button type="submit" variant="premium" disabled={loading}>
                {loading ? t("newsletterSubmitting") : t("newsletterSubscribe")}
              </Button>
            </form>
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
};

export default Footer;
