"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail, User, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "next-themes";
import {
  fetchNavigationLinks,
  getFallbackNavigationLinks,
  isNavigationVisible,
  mergeWithFallback,
  type NavigationLink,
} from "@/lib/navigation";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { resolvedTheme } = useTheme();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const logoSrc =
    mounted && resolvedTheme === "dark"
      ? "/care-n-tour-logo-light.png"
      : "/care-n-tour-logo-dark.png";

  const [navigationLinks, setNavigationLinks] = useState<NavigationLink[]>([]);
  const [loadingNavigation, setLoadingNavigation] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    const loadNavigation = async () => {
      setLoadingNavigation(true);
      const result = await fetchNavigationLinks();
      if (!isSubscribed) return;
      const merged = mergeWithFallback(result.links);
      setNavigationLinks(merged.filter(isNavigationVisible));
      setLoadingNavigation(false);
    };

    loadNavigation();

    return () => {
      isSubscribed = false;
    };
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top bar with contact info */}
        <div className="hidden md:flex items-center justify-between py-2 text-sm border-b border-border/50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">+20 100 1741666</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">info@carentour.com</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hidden lg:inline hover:text-primary transition-smooth"
                >
                  Welcome, {profile?.displayName || "User"}
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-1" />
                  Sign In
                </Button>
              </Link>
            )}
            <Button variant="accent" size="sm" asChild>
              <Link href="/consultation">Get Free Consultation</Link>
            </Button>
          </div>
        </div>

        {/* Main navigation */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
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
          <nav className="hidden md:flex flex-1 flex-nowrap items-center justify-center gap-3 md:gap-4 lg:gap-6 xl:gap-8 ml-10">
            {(loadingNavigation
              ? getFallbackNavigationLinks()
              : navigationLinks
            ).map((item) => (
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
            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-foreground" />
              ) : (
                <Menu className="h-6 w-6 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm md:hidden overflow-y-auto">
            <div className="flex min-h-dvh flex-col pb-[max(env(safe-area-inset-bottom),1.5rem)]">
              <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3">
                <Link
                  href="/"
                  className="flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Image
                    src={logoSrc}
                    alt="Care N Tour"
                    width={140}
                    height={48}
                    className="h-12 w-auto"
                  />
                </Link>
                <button
                  ref={closeButtonRef}
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Close menu"
                  className="rounded-md p-2 hover:bg-muted transition-smooth"
                >
                  <X className="h-6 w-6 text-foreground" />
                </button>
              </div>
              <div className="flex-1 px-4 py-6 space-y-6">
                <div className="space-y-2">
                  {(loadingNavigation
                    ? getFallbackNavigationLinks()
                    : navigationLinks
                  ).map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="block py-2 text-lg font-medium text-foreground hover:text-primary transition-smooth"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="space-y-3 border-t border-border/50 pt-4">
                  {user ? (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsMenuOpen(false);
                        signOut();
                      }}
                      className="justify-start"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  ) : (
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                        <User className="h-4 w-4 mr-2" />
                        Sign In
                      </Link>
                    </Button>
                  )}
                  <Button variant="accent" className="w-full" asChild>
                    <Link
                      href="/consultation"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Get Free Consultation
                    </Link>
                  </Button>
                </div>
                <div className="space-y-3 border-t border-border/50 pt-4 text-sm text-muted-foreground">
                  <a
                    href="tel:+201001741666"
                    className="flex items-center gap-3 text-foreground hover:text-primary transition-smooth"
                  >
                    <Phone className="h-5 w-5 text-primary" />
                    +20 100 1741666
                  </a>
                  <a
                    href="mailto:info@carentour.com"
                    className="flex items-center gap-3 text-foreground hover:text-primary transition-smooth"
                  >
                    <Mail className="h-5 w-5 text-primary" />
                    info@carentour.com
                  </a>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Theme</span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
