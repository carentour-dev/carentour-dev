import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Plane, Hotel, Car, Globe, Shield, Clock, Users, Phone, Wand2 } from "lucide-react";
import TripPlanningWizard from "@/components/TripPlanningWizard";

const PlanTrip = () => {
  const services = [
    {
      icon: Plane,
      title: "Airport Transfers",
      description: "Complimentary pickup and drop-off services",
      features: ["Private luxury vehicles", "English-speaking drivers", "24/7 availability"]
    },
    {
      icon: Hotel,
      title: "Accommodation",
      description: "Carefully selected hotels near medical facilities",
      features: ["4-5 star hotels", "Special medical rates", "Recovery-friendly rooms"]
    },
    {
      icon: Car,
      title: "Transportation",
      description: "Reliable transport for all medical appointments",
      features: ["Doctor visits", "Pharmacy trips", "Sightseeing tours"]
    },
    {
      icon: Users,
      title: "Translation Services",
      description: "Professional medical interpreters",
      features: ["Medical terminology experts", "Available during procedures", "Cultural guidance"]
    }
  ];

  const steps = [
    {
      step: "1",
      title: "Initial Consultation",
      description: "Free consultation with our medical coordinator to understand your needs and provide preliminary cost estimates."
    },
    {
      step: "2",
      title: "Medical Evaluation",
      description: "Virtual consultation with Egyptian specialists and review of your medical records to create a treatment plan."
    },
    {
      step: "3",
      title: "Travel Planning",
      description: "We handle visa assistance, flight booking, accommodation, and all logistics for your medical journey."
    },
    {
      step: "4",
      title: "Arrival & Treatment",
      description: "Meet your dedicated coordinator, settle into accommodation, and begin your treatment with full support."
    },
    {
      step: "5",
      title: "Recovery & Follow-up",
      description: "Comfortable recovery period with continued care and follow-up consultations even after returning home."
    }
  ];

  const visaInfo = [
    {
      country: "United States",
      requirement: "Visa on Arrival",
      duration: "30 days",
      cost: "$25 USD"
    },
    {
      country: "European Union",
      requirement: "Visa on Arrival",
      duration: "30 days", 
      cost: "$25 USD"
    },
    {
      country: "Canada",
      requirement: "Visa on Arrival",
      duration: "30 days",
      cost: "$25 USD"
    },
    {
      country: "Australia",
      requirement: "Visa on Arrival",
      duration: "30 days",
      cost: "$25 USD"
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
              <Badge variant="outline" className="mb-6">Plan Your Trip</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Your Complete 
                <span className="block bg-gradient-hero bg-clip-text text-transparent">
                  Medical Journey
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                From consultation to recovery, we handle every detail of your medical tourism 
                experience so you can focus on what matters most - your health.
              </p>
              
              {/* Quick Start Options */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <a href="#trip-planner">
                    <Wand2 className="w-4 h-4 mr-2" />
                    Start Interactive Planner
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#process-overview">Learn About Our Process</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Trip Planning Section */}
        <section id="trip-planner" className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <Tabs defaultValue="wizard" className="w-full">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Plan Your Medical Journey
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                  Choose how you'd like to plan your trip - use our interactive wizard for a personalized experience, 
                  or learn about our comprehensive process first.
                </p>
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                  <TabsTrigger value="wizard">Interactive Planner</TabsTrigger>
                  <TabsTrigger value="overview">Process Overview</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="wizard" className="space-y-8">
                <TripPlanningWizard />
              </TabsContent>

              <TabsContent value="overview" className="space-y-20">
                {/* Process Steps */}
                <div id="process-overview">
                  <div className="text-center mb-16">
                    <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                      Your Journey, Step by Step
                    </h3>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                      A seamless process designed to make your medical tourism experience stress-free
                    </p>
                  </div>

                  <div className="max-w-4xl mx-auto">
                    {steps.map((step, index) => (
                      <div key={index} className="flex items-start space-x-6 mb-12">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-background font-bold text-lg">
                            {step.step}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-foreground mb-2">
                            {step.title}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Concierge Services */}
                <div className="py-20 bg-muted/30">
                  <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                      <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Concierge Services
                      </h3>
                      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Comprehensive support services to ensure your comfort throughout your stay
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {services.map((service, index) => {
                        const Icon = service.icon;
                        return (
                          <Card key={index} className="border-border/50 hover:shadow-card-hover transition-spring text-center">
                            <CardHeader>
                              <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-light rounded-full mb-4 mx-auto">
                                <Icon className="h-8 w-8 text-secondary" />
                              </div>
                              <CardTitle className="text-lg">{service.title}</CardTitle>
                              <p className="text-muted-foreground text-sm">{service.description}</p>
                            </CardHeader>
                            <CardContent>
                              <ul className="text-sm text-muted-foreground space-y-2">
                                {service.features.map((feature, idx) => (
                                  <li key={idx} className="flex items-center justify-center">
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Visa Information */}
                <div className="py-20 bg-background">
                  <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                      <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Visa Requirements
                      </h3>
                      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Simple visa process for most countries - we'll guide you through every step
                      </p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {visaInfo.map((visa, index) => (
                          <Card key={index} className="border-border/50">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-foreground">{visa.country}</h4>
                                <Badge variant="secondary">{visa.requirement}</Badge>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Duration:</span>
                                  <span className="font-medium">{visa.duration}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Cost:</span>
                                  <span className="font-medium">{visa.cost}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      <div className="mt-8 text-center">
                        <Card className="bg-primary/5 border-primary/20">
                          <CardContent className="p-6">
                            <Globe className="h-8 w-8 text-primary mx-auto mb-4" />
                            <h4 className="font-semibold text-foreground mb-2">Need Visa Assistance?</h4>
                            <p className="text-muted-foreground mb-4">
                              Our team will help you with the visa application process and provide all necessary documentation.
                            </p>
                            <Button>Get Visa Support</Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Emergency Contact */}
        <section className="py-16 bg-gradient-hero">
          <div className="container mx-auto px-4">
            <Card className="max-w-3xl mx-auto bg-background/10 backdrop-blur-sm border-background/20">
              <CardContent className="p-8 text-center">
                <Phone className="h-12 w-12 text-accent mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-background mb-2">24/7 Emergency Support</h3>
                <p className="text-background/90 mb-4">
                  Our medical coordinators are available around the clock for any urgent needs during your stay
                </p>
                <p className="text-accent font-semibold text-xl">
                  Emergency Hotline: +20 100 1741666
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Plan Your Medical Journey?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Let our experienced team handle all the details while you focus on your recovery
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/start-journey">Start Planning Today</Link>
              </Button>
              <Button size="lg" variant="outline">
                Download Travel Guide
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PlanTrip;