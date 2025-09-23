import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Award, 
  Shield, 
  Heart, 
  DollarSign, 
  Clock, 
  Globe,
  CheckCircle,
  Star,
  Users,
  Plane
} from "lucide-react";

const USPSection = () => {
  const usps = [
    {
      icon: Award,
      title: "JCI Accredited Hospitals",
      description: "All our partner hospitals are internationally accredited by Joint Commission International, ensuring world-class standards.",
      highlight: "100% Accredited",
      color: "text-primary"
    },
    {
      icon: Shield,
      title: "Board-Certified Surgeons",
      description: "Our specialists are internationally trained with decades of experience and board certifications from leading medical institutions.",
      highlight: "200+ Specialists",
      color: "text-secondary"
    },
    {
      icon: DollarSign,
      title: "All-Inclusive Packages",
      description: "Transparent pricing with no hidden costs. Includes medical care, accommodation, transfers, and 24/7 support.",
      highlight: "Up to 70% Savings",
      color: "text-accent"
    },
    {
      icon: Clock,
      title: "Fast-Track Treatment",
      description: "No waiting lists. Get your treatment scheduled within 2-3 weeks of confirmation with priority booking.",
      highlight: "2-3 Weeks",
      color: "text-primary"
    },
    {
      icon: Globe,
      title: "Multilingual Support",
      description: "Dedicated coordinators speaking 15+ languages ensure seamless communication throughout your journey.",
      highlight: "15+ Languages",
      color: "text-secondary"
    },
    {
      icon: Plane,
      title: "Complete Travel Support",
      description: "From visa assistance to luxury accommodations and cultural tours - we handle every detail of your stay.",
      highlight: "End-to-End Care",
      color: "text-accent"
    }
  ];

  const achievements = [
    {
      icon: CheckCircle,
      value: "98%",
      label: "Success Rate",
      description: "Across all procedures"
    },
    {
      icon: Star,
      value: "4.9/5",
      label: "Patient Rating",
      description: "Average satisfaction score"
    },
    {
      icon: Users,
      value: "5000+",
      label: "Happy Patients",
      description: "From 50+ countries"
    },
    {
      icon: Award,
      value: "50+",
      label: "Hospital Partners",
      description: "All JCI accredited"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-6 text-center">Why Choose Care N Tour</Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            What Makes Us <span className="bg-gradient-hero bg-clip-text text-transparent">Different</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the perfect blend of world-class medical care, cost savings, and Egyptian hospitality 
            with our comprehensive medical tourism services
          </p>
        </div>

        {/* USP Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {usps.map((usp, index) => {
            const Icon = usp.icon;
            return (
              <Card key={index} className="group hover:shadow-elegant transition-spring border-border/50 overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center">
                        <Icon className="h-6 w-6 text-background" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{usp.title}</h3>
                        <Badge variant="secondary" className="text-xs text-center">
                          {usp.highlight}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {usp.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Achievements Bar */}
        <div className="bg-gradient-hero rounded-xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-background mb-2">
              Proven Excellence in Medical Tourism
            </h3>
            <p className="text-background/90">
              Numbers that speak to our commitment to exceptional patient care
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <div key={index} className="text-center text-background">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-background/20 rounded-full mb-4">
                    <Icon className="h-8 w-8" />
                  </div>
                  <p className="text-3xl md:text-4xl font-bold mb-1">{achievement.value}</p>
                  <p className="font-semibold mb-1">{achievement.label}</p>
                  <p className="text-sm opacity-90">{achievement.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Ready to Experience the Care N Tour Difference?
          </h3>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of patients who have chosen us for their medical journey. 
            Get your free consultation and personalized treatment plan today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/contact">Get Free Consultation</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/start-journey">Start Your Journey</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default USPSection;