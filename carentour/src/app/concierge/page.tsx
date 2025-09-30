"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Phone, 
  Calendar, 
  Car, 
  Utensils,
  ShoppingBag, 
  MapPin, 
  Clock, 
  Users, 
  Heart,
  Plane,
  Hotel,
  FileText,
  Globe,
  Headphones,
  Shield,
  Star,
  CheckCircle,
  ArrowRight
} from "lucide-react";

export default function ConciergeServices() {
  const services = [
    {
      category: "Medical Coordination",
      icon: Heart,
      description: "Complete medical journey management from consultation to recovery",
      services: [
        "Pre-arrival medical consultation scheduling",
        "Medical records translation and transfer", 
        "Appointment coordination with specialists",
        "Real-time updates to family members",
        "Post-treatment follow-up arrangements",
        "Medical insurance claim assistance"
      ],
      availability: "24/7 during treatment period",
      languages: ["English", "Arabic", "French", "German", "Spanish", "Italian"]
    },
    {
      category: "Travel & Transportation",
      icon: Car,
      description: "Seamless transportation services throughout your medical journey",
      services: [
        "Airport pickup and drop-off service",
        "Daily transportation to medical appointments",
        "Private driver for sightseeing tours",
        "Emergency transportation availability",
        "Family member transport coordination",
        "Wheelchair accessible vehicles when needed"
      ],
      availability: "24/7 on-call service",
      languages: ["English", "Arabic", "German", "Russian"]
    },
    {
      category: "Accommodation Services",
      icon: Hotel,
      description: "Comfortable lodging arrangements tailored to medical tourists",
      services: [
        "Hotel booking and confirmation",
        "Room upgrades and special requests",
        "Extended stay arrangements",
        "Family accommodation coordination",
        "Recovery-friendly room setups",
        "Housekeeping and meal arrangements"
      ],
      availability: "Business hours with emergency support",
      languages: ["English", "Arabic", "French", "Spanish"]
    },
    {
      category: "Personal Assistant",
      icon: Users,
      description: "Dedicated personal support for all your non-medical needs",
      services: [
        "Shopping assistance for personal items",
        "Pharmacy visits and medication pickup",
        "Banking and currency exchange help",
        "Local SIM card and communication setup",
        "Cultural orientation and etiquette guidance",
        "Emergency contact coordination"
      ],
      availability: "9 AM - 6 PM daily",
      languages: ["English", "Arabic", "Italian", "Portuguese"]
    },
    {
      category: "Family Support",
      icon: Shield,
      description: "Comprehensive support services for accompanying family members",
      services: [
        "Separate accommodation arrangements",
        "Tourist activities and sightseeing tours",
        "Childcare services coordination",
        "Restaurant reservations and dining recommendations",
        "Shopping and entertainment guidance",
        "Regular updates about patient progress"
      ],
      availability: "9 AM - 8 PM daily",
      languages: ["English", "Arabic", "French", "German"]
    },
    {
      category: "Cultural & Tourism",
      icon: MapPin,
      description: "Explore Egypt's rich heritage during your recovery period",
      services: [
        "Guided tours to pyramids and historical sites",
        "Nile River cruise arrangements",
        "Cultural experience planning",
        "Photography services at landmarks",
        "Souvenir shopping assistance",
        "Traditional Egyptian cuisine experiences"
      ],
      availability: "Daily tours based on recovery schedule",
      languages: ["English", "Arabic", "French", "German", "Spanish"]
    }
  ];

  const packages = [
    {
      name: "Essential Care Package",
      price: "$200",
      duration: "Per week",
      description: "Basic concierge services for independent travelers",
      features: [
        "Airport transfers",
        "Medical appointment coordination",
        "Basic translation services",
        "Emergency contact support",
        "Local orientation session"
      ],
      recommended: false
    },
    {
      name: "Complete Care Package",
      price: "$350", 
      duration: "Per week",
      description: "Comprehensive support for the full medical tourism experience",
      features: [
        "All Essential Care services",
        "Daily transportation service",
        "Personal shopping assistance",
        "Family coordination services",
        "Cultural tour arrangements",
        "24/7 emergency support",
        "Medication management help"
      ],
      recommended: true
    },
    {
      name: "VIP Premium Package",
      price: "$500",
      duration: "Per week", 
      description: "Luxury concierge services with dedicated personal assistant",
      features: [
        "All Complete Care services",
        "Dedicated personal assistant",
        "Private driver and luxury vehicle",
        "Fine dining reservations",
        "Private guided tours",
        "Luxury spa and wellness services",
        "Premium accommodation upgrades",
        "Express medical services"
      ],
      recommended: false
    }
  ];

  const testimonials = [
    {
      name: "James Wilson",
      country: "United Kingdom",
      service: "Complete Care Package",
      rating: 5,
      text: "The concierge team made my cardiac surgery trip seamless. From airport pickup to daily check-ins, everything was perfectly organized. My wife and I felt completely supported throughout our 3-week stay."
    },
    {
      name: "Marie Dubois",
      country: "France",
      service: "VIP Premium Package", 
      rating: 5,
      text: "Exceptional service! Our personal assistant spoke perfect French and arranged everything beautifully. While I recovered from my cosmetic surgery, my husband enjoyed private tours of the pyramids."
    },
    {
      name: "Carlos Rodriguez", 
      country: "Spain",
      service: "Essential Care Package",
      rating: 5,
      text: "Great value for money. The basic package covered all our essential needs during my dental treatment. The Spanish-speaking coordinator was very helpful and professional."
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
              <Badge variant="outline" className="mb-6">Concierge Services</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Premium Concierge Services for
                <span className="block bg-gradient-hero bg-clip-text text-transparent">
                  Medical Tourists
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Dedicated personal assistance ensuring your comfort, convenience, and peace of mind 
                throughout your entire medical tourism journey in Egypt.
              </p>
            </div>
          </div>
        </section>

        {/* Overview Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  Your Personal Support Team in Egypt
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  Our professional concierge team understands the unique needs of medical tourists. 
                  We provide comprehensive support services that go beyond medical care, ensuring 
                  your stay in Egypt is comfortable, stress-free, and memorable.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">24/7</div>
                    <div className="text-sm text-muted-foreground">Support Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">12+</div>
                    <div className="text-sm text-muted-foreground">Languages Spoken</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">500+</div>
                    <div className="text-sm text-muted-foreground">Satisfied Families</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">99%</div>
                    <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
                  </div>
                </div>
                <div className="text-center">
                  <Button size="lg" asChild>
                    <Link href="/contact">
                      <Phone className="h-4 w-4 mr-2" />
                      Contact Concierge Team
                    </Link>
                  </Button>
                </div>
              </div>
              <div>
                <img
                  src="/concierge-services.jpg"
                  alt="Professional concierge services for medical tourists in Egypt"
                  className="w-full h-96 object-cover rounded-lg shadow-elegant"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Comprehensive Concierge Services
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                From medical coordination to cultural experiences, we handle every detail of your journey
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <Card key={index} className="border-border/50 hover:shadow-card-hover transition-spring h-full">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{service.category}</CardTitle>
                          <Badge variant="outline" className="text-xs mt-1">{service.availability}</Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm">{service.description}</p>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-3">Included Services:</h4>
                        <ul className="space-y-2 mb-4">
                          {service.services.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Languages Available:</p>
                        <div className="flex flex-wrap gap-1">
                          {service.languages.map((language, langIdx) => (
                            <Badge key={langIdx} variant="secondary" className="text-xs">
                              {language}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Service Packages */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Concierge Service Packages
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Choose the package that best fits your needs and budget
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {packages.map((pkg, index) => (
                <Card key={index} className={`border-border/50 hover:shadow-card-hover transition-spring relative ${
                  pkg.recommended ? 'ring-2 ring-primary' : ''
                }`}>
                  {pkg.recommended && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{pkg.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-primary">{pkg.price}</span>
                      <span className="text-muted-foreground">/{pkg.duration}</span>
                    </div>
                    <p className="text-muted-foreground text-sm mt-2">{pkg.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full mt-6" 
                      variant={pkg.recommended ? "default" : "outline"}
                    >
                      {pkg.recommended ? "Get Started" : "Choose Package"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">What Our Clients Say</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Real experiences from families who used our concierge services
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    
                    <p className="text-muted-foreground italic leading-relaxed mb-4">
                      "{testimonial.text}"
                    </p>

                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-foreground">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.country}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {testimonial.service}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
              Ready for Premium Support?
            </h2>
            <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
              Let our experienced concierge team take care of every detail while you focus on your health and recovery
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="accent" asChild>
                <Link href="/contact" className="text-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Get Free Consultation
                </Link>
              </Button>
              <Button size="lg" variant="hero">
                <FileText className="h-4 w-4 mr-2" />
                Download Service Guide
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

