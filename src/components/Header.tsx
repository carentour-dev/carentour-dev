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

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Treatments", href: "/treatments" },
    { name: "Our Doctors", href: "/doctors" },
    { name: "Patient Stories", href: "/stories" },
    { name: "Plan Your Trip", href: "/plan" },
    { name: "Travel Info", href: "/travel-info" },
    { name: "Concierge", href: "/concierge" },
    { name: "Blog", href: "/blog" },
    { name: "FAQ", href: "/faq" },
    { name: "Contact", href: "/contact" },
  ];

  const authenticatedNavigation = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Treatments", href: "/treatments" },
    { name: "Our Doctors", href: "/doctors" },
    { name: "Patient Stories", href: "/stories" },
    { name: "Plan Your Trip", href: "/plan" },
    { name: "Travel Info", href: "/travel-info" },
    { name: "Concierge", href: "/concierge" },
    { name: "Blog", href: "/blog" },
    { name: "FAQ", href: "/faq" },
    { name: "Contact", href: "/contact" },
  ];

  const currentNavigation = user ? authenticatedNavigation : navigation;

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top bar with contact info */}
        <div className="flex items-center justify-between py-2 text-sm border-b border-border/50">
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
                  className="text-sm text-muted-foreground hidden sm:inline hover:text-primary transition-smooth"
                >
                  Welcome, {profile?.displayName || 'User'}
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
              <Link href="/contact">Get Free Consultation</Link>
            </Button>
          </div>
        </div>

        {/* Main navigation */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src={mounted && resolvedTheme === 'dark' ? "/care-n-tour-logo-light.png" : "/care-n-tour-logo-dark.png"}
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
            {currentNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-xs md:text-sm lg:text-[15px] font-medium whitespace-nowrap text-foreground hover:text-primary transition-smooth"
              >
                {item.name}
              </Link>
            ))}
          </nav>

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

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
            {currentNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-foreground hover:text-primary transition-smooth font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {user ? (
                <Button variant="ghost" onClick={signOut} className="mt-4">
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              ) : (
                <Link href="/auth">
                  <Button variant="ghost" className="mt-4">
                    <User className="h-4 w-4 mr-1" />
                    Sign In
                  </Button>
                </Link>
              )}
              <Button variant="accent" className="mt-2" asChild>
                <Link href="/contact">Get Free Consultation</Link>
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
