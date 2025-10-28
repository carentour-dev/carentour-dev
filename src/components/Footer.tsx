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
  getFallbackNavigationLinks,
  mergeWithFallback,
  selectQuickLinks,
  type NavigationLink,
} from "@/lib/navigation";

const Footer = () => {
  const { resolvedTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [mounted, setMounted] = useState(false);
  const { subscribe, loading } = useNewsletter();
  const [quickLinks, setQuickLinks] = useState<NavigationLink[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isSubscribed = true;
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
  }, []);

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
              Your trusted partner for world-class medical treatments in Egypt.
              Combining excellence in healthcare with exceptional hospitality.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-5 w-5 text-background/60 hover:text-accent cursor-pointer transition-smooth" />
              <Twitter className="h-5 w-5 text-background/60 hover:text-accent cursor-pointer transition-smooth" />
              <Instagram className="h-5 w-5 text-background/60 hover:text-accent cursor-pointer transition-smooth" />
              <Linkedin className="h-5 w-5 text-background/60 hover:text-accent cursor-pointer transition-smooth" />
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
                <span className="text-background/80">+20 100 1741666</span>
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
