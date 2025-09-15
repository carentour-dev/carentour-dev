import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Shield, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-medical-facility.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl">
          <div className="flex items-center space-x-2 mb-6">
            <Shield className="h-6 w-6 text-accent" />
            <span className="text-accent font-semibold">Certified Excellence in Medical Tourism</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-background mb-6 leading-tight">
            World-Class 
            <span className="block bg-gradient-accent bg-clip-text text-transparent">
              Medical Care
            </span>
            in Egypt
          </h1>
          
          <p className="text-xl md:text-2xl text-background/90 mb-8 max-w-2xl leading-relaxed">
            Experience premium healthcare treatments with luxury accommodations, 
            professional care, and significant cost savings in Egypt's top medical facilities.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button size="lg" variant="accent" className="text-lg px-8 py-4">
              Get Free Consultation
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="hero" className="text-lg px-8 py-4" asChild>
              <Link to="/treatments">View Treatments</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                <Star className="h-5 w-5 text-accent fill-current" />
                <Star className="h-5 w-5 text-accent fill-current" />
                <Star className="h-5 w-5 text-accent fill-current" />
                <Star className="h-5 w-5 text-accent fill-current" />
                <Star className="h-5 w-5 text-accent fill-current" />
              </div>
              <p className="text-3xl font-bold text-background">5000+</p>
              <p className="text-background/80">Successful Procedures</p>
            </div>
            
            <div className="text-center md:text-left">
              <Globe className="h-8 w-8 text-accent mx-auto md:mx-0 mb-2" />
              <p className="text-3xl font-bold text-background">50+</p>
              <p className="text-background/80">Countries Served</p>
            </div>
            
            <div className="text-center md:text-left">
              <Shield className="h-8 w-8 text-accent mx-auto md:mx-0 mb-2" />
              <p className="text-3xl font-bold text-background">98%</p>
              <p className="text-background/80">Patient Satisfaction</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute bottom-10 right-10 hidden lg:block">
        <div className="bg-background/10 backdrop-blur-sm rounded-lg p-4 border border-background/20">
          <p className="text-background/90 text-sm mb-2">Starting from</p>
          <p className="text-accent text-2xl font-bold">$2,500</p>
          <p className="text-background/70 text-xs">All-inclusive packages</p>
        </div>
      </div>
    </section>
  );
};

export default Hero;