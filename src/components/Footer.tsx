import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import logoLight from "@/assets/care-n-tour-logo-light.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <img 
              src={logoLight} 
              alt="Care N Tour" 
              className="h-12 mb-4"
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
              <li><Link to="/about" className="text-background/80 hover:text-accent transition-smooth">About Us</Link></li>
              <li><Link to="/treatments" className="text-background/80 hover:text-accent transition-smooth">Treatments</Link></li>
              <li><Link to="/stories" className="text-background/80 hover:text-accent transition-smooth">Patient Stories</Link></li>
              <li><Link to="/plan" className="text-background/80 hover:text-accent transition-smooth">Plan Your Trip</Link></li>
              <li><Link to="/blog" className="text-background/80 hover:text-accent transition-smooth">Blog</Link></li>
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
            <div className="flex space-x-2">
              <Input 
                placeholder="Your email" 
                className="bg-background/10 border-background/20 text-background placeholder:text-background/60"
              />
              <Button variant="accent">Subscribe</Button>
            </div>
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