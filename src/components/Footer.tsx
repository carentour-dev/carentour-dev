"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { useTheme } from "next-themes";
import { useNewsletter } from "@/hooks/useNewsletter";

const Footer = () => {
  const { resolvedTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [mounted, setMounted] = useState(false);
  const { subscribe, loading } = useNewsletter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      const result = await subscribe(email, 'footer');
      if (result.success) {
        setEmail('');
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
              src={mounted && resolvedTheme === 'dark' ? "/care-n-tour-logo-dark.png" : "/care-n-tour-logo-light.png"}
              alt="Care N Tour"
              width={160}
              height={48}
              className="h-12 w-auto mb-4"
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
            <h4 className="text-lg font-semibold mb-4 text-accent">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-background/80 hover:text-accent transition-smooth">About Us</Link></li>
              <li><Link href="/treatments" className="text-background/80 hover:text-accent transition-smooth">Treatments</Link></li>
              <li><Link href="/stories" className="text-background/80 hover:text-accent transition-smooth">Patient Stories</Link></li>
              <li><Link href="/plan" className="text-background/80 hover:text-accent transition-smooth">Plan Your Trip</Link></li>
              <li><Link href="/blog" className="text-background/80 hover:text-accent transition-smooth">Blog</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-accent">Contact Info</h4>
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
            <h4 className="text-lg font-semibold mb-4 text-accent">Stay Updated</h4>
            <p className="text-background/80 mb-4">
              Subscribe to our newsletter for the latest medical tourism updates.
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
              <Button 
                type="submit" 
                variant="accent"
                disabled={loading}
              >
                {loading ? 'Subscribing...' : 'Subscribe'}
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