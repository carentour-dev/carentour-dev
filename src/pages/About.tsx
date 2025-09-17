import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Award, Users, Globe, Shield, Clock } from "lucide-react";
import consultationImage from "@/assets/consultation.webp";

const About = () => {
  const stats = [
    { icon: Heart, label: "Successful Procedures", value: "5000+" },
    { icon: Users, label: "Medical Specialists", value: "200+" },
    { icon: Globe, label: "Countries Served", value: "50+" },
    { icon: Award, label: "Years of Experience", value: "10+" }
  ];

  const values = [
    {
      icon: Shield,
      title: "Safety First",
      description: "We maintain the highest safety standards with internationally accredited facilities and certified medical professionals."
    },
    {
      icon: Heart,
      title: "Patient-Centered Care",
      description: "Every treatment plan is personalized to meet your specific needs, ensuring optimal outcomes and comfort."
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Our dedicated team provides round-the-clock assistance throughout your entire medical journey."
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-card">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6">About Care N Tour</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Transforming Lives Through 
                <span className="block bg-gradient-hero bg-clip-text text-transparent">
                  World-Class Healthcare
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                For over a decade, we've been connecting patients from around the world with Egypt's finest medical facilities, 
                delivering exceptional healthcare experiences that combine clinical excellence with warm hospitality.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-light rounded-full mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-muted-foreground">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Our Story
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Founded in 2014, Care N Tour emerged from a simple vision: to make world-class medical care 
                    accessible to everyone, regardless of geographical boundaries. What started as a small initiative 
                    has grown into Egypt's premier medical tourism facilitator.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Our founders, having witnessed firsthand the challenges patients face when seeking quality healthcare 
                    abroad, were determined to create a seamless bridge between international patients and Egypt's 
                    exceptional medical infrastructure.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Today, we partner with over 50 accredited hospitals and clinics across Egypt, working with more than 
                    200 certified specialists to provide comprehensive medical tourism services that have transformed 
                    thousands of lives.
                  </p>
                </div>
                <Button size="lg" className="mt-8">
                  Learn About Our Team
                </Button>
              </div>
              <div className="relative">
                <img 
                  src={consultationImage} 
                  alt="Medical consultation" 
                  className="rounded-lg shadow-elegant w-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Our Core Values
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The principles that guide everything we do in delivering exceptional medical tourism experiences
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card key={index} className="text-center border-border/50 hover:shadow-card-hover transition-spring">
                    <CardHeader>
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-light rounded-full mb-4 mx-auto">
                        <Icon className="h-8 w-8 text-secondary" />
                      </div>
                      <CardTitle className="text-xl">{value.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
              Ready to Begin Your Journey?
            </h2>
            <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied patients who have trusted us with their healthcare journey
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="accent">
                Get Free Consultation
              </Button>
              <Button size="lg" variant="hero">
                Contact Us Today
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;