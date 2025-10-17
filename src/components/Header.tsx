"use client";

import { useState, useEffect } from "react";
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

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { resolvedTheme } = useTheme();
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
            {/* Mobile menu */}
            <Drawer
              open={isMenuOpen}
              onOpenChange={setIsMenuOpen}
              shouldScaleBackground={false}
            >
              <DrawerTrigger asChild>
                <button className="md:hidden" aria-label="Toggle menu">
                  {isMenuOpen ? (
                    <X className="h-6 w-6 text-foreground" />
                  ) : (
                    <Menu className="h-6 w-6 text-foreground" />
                  )}
                </button>
              </DrawerTrigger>
              <DrawerContent className="md:hidden h-[96vh] max-h-[96vh] overflow-hidden border-t border-border bg-background">
                <div
                  className="flex h-full flex-col pt-6"
                  style={{
                    paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)",
                  }}
                >
                  <div className="flex items-center justify-between px-5 pb-3 pt-5">
                    <DrawerClose asChild>
                      <Link href="/">
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
                        aria-label="Close menu"
                        className="rounded-md p-2 hover:bg-muted transition-smooth"
                      >
                        <X className="h-6 w-6 text-foreground" />
                      </button>
                    </DrawerClose>
                  </div>
                  <div className="flex-1 overflow-y-auto px-5 pb-6">
                    <div className="space-y-2">
                      {(loadingNavigation
                        ? getFallbackNavigationLinks()
                        : navigationLinks
                      ).map((item) => (
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
                    <div className="space-y-3 border-t border-border/50 pt-4 mt-6">
                      {user ? (
                        <DrawerClose asChild>
                          <Button
                            variant="ghost"
                            className="justify-start"
                            onClick={signOut}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
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
                              Sign In
                            </Link>
                          </Button>
                        </DrawerClose>
                      )}
                      <DrawerClose asChild>
                        <Button variant="accent" className="w-full" asChild>
                          <Link href="/consultation">
                            Get Free Consultation
                          </Link>
                        </Button>
                      </DrawerClose>
                    </div>
                    <div className="space-y-3 border-t border-border/50 pt-4 mt-6 text-sm text-muted-foreground">
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
