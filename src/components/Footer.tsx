"use client";

import { useEffect, useState } from "react";
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

const Footer = () => {
  const { resolvedTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [mounted, setMounted] = useState(false);
  const { subscribe, loading } = useNewsletter();
  const initialNavigationLinks = useInitialNavigationLinks();
  const [quickLinks, setQuickLinks] = useState<NavigationLink[]>(() =>
    selectQuickLinks(initialNavigationLinks),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    if (initialNavigationLinks.length > 0) {
      setQuickLinks(selectQuickLinks(initialNavigationLinks));
      return () => {
        isSubscribed = false;
      };
    }
    const loadNavigation = async () => {
      const result = await fetchNavigationLinks();
      if (!isSubscribed) return;
      const merged = mergeWithFallback(result.links);
      setQuickLinks(selectQuickLinks(merged));
    };

    loadNavigation();

    return () => {
      isSubscribed = false;
    };
  }, [initialNavigationLinks]);

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
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <Image
              src={
                mounted && resolvedTheme === "dark"
                  ? "/carentour-logo-dark.png"
                  : "/carentour-logo-light.png"
              }
              alt="Care N Tour"
              width={260}
              height={94}
              className="mb-4 h-[72px] w-auto max-w-[280px] object-contain"
            />
            <p className="text-background/80 mb-6">
              Your trusted partner for premium medical care in Egypt. Combining
              excellence in healthcare with exceptional hospitality.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map(({ label, href, Icon }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`Visit our ${label}`}
                  className="text-background/60 hover:text-accent transition-smooth"
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-accent">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    className="text-background/80 hover:text-accent transition-smooth"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-accent">
              Contact Info
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-accent" />
                <span className="text-background/80">+20 122 9503333</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-accent" />
                <span className="text-background/80">info@carentour.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-accent" />
                <span className="text-background/80">Cairo, Egypt</span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-accent">
              Stay Updated
            </h4>
            <p className="text-background/80 mb-4">
              Subscribe to our newsletter for the latest medical tourism
              updates.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex space-x-2">
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/10 border-background/20 text-background placeholder:text-background/60"
                required
              />
              <Button type="submit" variant="accent" disabled={loading}>
                {loading ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-background/20 mt-12 pt-8 text-center">
          <p className="text-background/60">
            © 2025 Care N Tour. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
