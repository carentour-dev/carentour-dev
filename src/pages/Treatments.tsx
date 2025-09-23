import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Stethoscope, Eye, Smile, Scissors, Activity, Users, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useDoctors } from "@/hooks/useDoctors";
import PriceComparison from "@/components/PriceComparison";
import { useState } from "react";

const Treatments = () => {
  const navigate = useNavigate();
  const { doctors } = useDoctors();
  const [expandedComparison, setExpandedComparison] = useState<string | null>(null);
  
  const treatmentCategories = [
    {
      id: "cardiac-surgery",
      icon: Heart,
      title: "Cardiac Surgery",
      description: "Advanced heart procedures with world-class specialists",
      procedures: ["Bypass Surgery", "Valve Replacement", "Angioplasty"],
      startingPrice: "$8,500",
      egyptPrice: 8500,
      internationalPrices: [
        { country: "United States", flag: "🇺🇸", price: 45000, currency: "$" },
        { country: "United Kingdom", flag: "🇬🇧", price: 38000, currency: "£" },
        { country: "Germany", flag: "🇩🇪", price: 35000, currency: "€" },
        { country: "Canada", flag: "🇨🇦", price: 42000, currency: "C$" }
      ],
      averageSavings: 78
    },
    {
      id: "eye-surgery",
      icon: Eye,
      title: "Eye Surgery",
      description: "LASIK and comprehensive eye treatments",
      procedures: ["LASIK", "Cataract Surgery", "Retinal Surgery"],
      startingPrice: "$1,200",
      egyptPrice: 1200,
      internationalPrices: [
        { country: "United States", flag: "🇺🇸", price: 4500, currency: "$" },
        { country: "United Kingdom", flag: "🇬🇧", price: 3800, currency: "£" },
        { country: "Germany", flag: "🇩🇪", price: 3200, currency: "€" },
        { country: "Canada", flag: "🇨🇦", price: 3900, currency: "C$" }
      ],
      averageSavings: 69
    },
    {
      id: "dental-care",
      icon: Smile,
      title: "Dental Care",
      description: "Complete dental treatments and cosmetic procedures",
      procedures: ["Dental Implants", "Veneers", "Root Canal"],
      startingPrice: "$300",
      egyptPrice: 300,
      internationalPrices: [
        { country: "United States", flag: "🇺🇸", price: 2500, currency: "$" },
        { country: "United Kingdom", flag: "🇬🇧", price: 2200, currency: "£" },
        { country: "Germany", flag: "🇩🇪", price: 1800, currency: "€" },
        { country: "Canada", flag: "🇨🇦", price: 2100, currency: "C$" }
      ],
      averageSavings: 86
    },
    {
      id: "cosmetic-surgery",
      icon: Scissors,
      title: "Cosmetic Surgery",
      description: "Aesthetic procedures with natural-looking results",
      procedures: ["Rhinoplasty", "Liposuction", "Breast Surgery"],
      startingPrice: "$2,800",
      egyptPrice: 2800,
      internationalPrices: [
        { country: "United States", flag: "🇺🇸", price: 12000, currency: "$" },
        { country: "United Kingdom", flag: "🇬🇧", price: 10500, currency: "£" },
        { country: "Germany", flag: "🇩🇪", price: 9800, currency: "€" },
        { country: "Canada", flag: "🇨🇦", price: 11200, currency: "C$" }
      ],
      averageSavings: 74
    },
    {
      id: "general-surgery",
      icon: Stethoscope,
      title: "General Surgery",
      description: "Wide range of surgical procedures",
      procedures: ["Gallbladder", "Hernia Repair", "Appendectomy"],
      startingPrice: "$1,500",
      egyptPrice: 1500,
      internationalPrices: [
        { country: "United States", flag: "🇺🇸", price: 8500, currency: "$" },
        { country: "United Kingdom", flag: "🇬🇧", price: 7200, currency: "£" },
        { country: "Germany", flag: "🇩🇪", price: 6800, currency: "€" },
        { country: "Canada", flag: "🇨🇦", price: 7800, currency: "C$" }
      ],
      averageSavings: 80
    },
    {
      id: "orthopedic-surgery",
      icon: Activity,
      title: "Orthopedic Surgery",
      description: "Joint replacement and bone treatments",
      procedures: ["Hip Replacement", "Knee Surgery", "Spine Surgery"],
      startingPrice: "$4,200",
      egyptPrice: 4200,
      internationalPrices: [
        { country: "United States", flag: "🇺🇸", price: 22000, currency: "$" },
        { country: "United Kingdom", flag: "🇬🇧", price: 18500, currency: "£" },
        { country: "Germany", flag: "🇩🇪", price: 17200, currency: "€" },
        { country: "Canada", flag: "🇨🇦", price: 19800, currency: "C$" }
      ],
      averageSavings: 78
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
              <Badge variant="outline" className="mb-6">Medical Treatments</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Comprehensive 
                <span className="block bg-gradient-hero bg-clip-text text-transparent">
                  Medical Services
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Discover our full range of medical treatments performed by certified specialists 
                in state-of-the-art facilities across Egypt.
              </p>
            </div>
          </div>
        </section>

        {/* Treatment Categories */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Our Medical Specialties
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                World-class medical care across multiple specialties with significant cost savings
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {treatmentCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <Card key={index} className="border-border/50 hover:shadow-card-hover transition-spring group">
                    <CardHeader className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-light rounded-full mb-4 mx-auto group-hover:bg-primary group-hover:text-background transition-smooth">
                        <Icon className="h-8 w-8 text-primary group-hover:text-background" />
                      </div>
                      <CardTitle className="text-xl">{category.title}</CardTitle>
                      <p className="text-muted-foreground">{category.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Common Procedures:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {category.procedures.map((procedure, idx) => (
                              <li key={idx} className="flex items-center">
                                <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                                {procedure}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div>
                            <span className="text-sm text-muted-foreground">Starting from</span>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-primary">{category.startingPrice}</span>
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <TrendingDown className="h-3 w-3 mr-1" />
                                Save {category.averageSavings}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Button 
                            className="w-full" 
                            onClick={() => navigate(`/start-journey?treatment=${category.id}`)}
                          >
                            Start Your Journey
                          </Button>
                          
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => navigate(`/treatments/${category.id}`)}
                          >
                            Learn More
                          </Button>
                          
                          <Button 
                            className="w-full" 
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedComparison(
                              expandedComparison === category.id ? null : category.id
                            )}
                          >
                            {expandedComparison === category.id ? (
                              <>Hide Price Comparison <ChevronUp className="ml-2 h-4 w-4" /></>
                            ) : (
                              <>View Savings <ChevronDown className="ml-2 h-4 w-4" /></>
                            )}
                          </Button>
                        </div>
                        
                        {expandedComparison === category.id && (
                          <div className="mt-4">
                            <PriceComparison
                              treatment={category.title}
                              egyptPrice={category.egyptPrice}
                              internationalPrices={category.internationalPrices}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Price Comparison Overview */}
        <section className="py-20 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Choose Egypt for Your Medical Treatment?
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Experience world-class healthcare at a fraction of international costs. Our patients save an average of 70-85% compared to Western countries.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <PriceComparison
                treatment="Heart Surgery"
                egyptPrice={8500}
                internationalPrices={treatmentCategories[0].internationalPrices}
              />
              <PriceComparison
                treatment="Dental Implants"
                egyptPrice={300}
                internationalPrices={treatmentCategories[2].internationalPrices}
              />
            </div>
            
            <div className="text-center mt-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="p-6 bg-background rounded-lg border border-border/50 shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-2">75%</div>
                  <div className="text-foreground font-semibold mb-1">Average Savings</div>
                  <div className="text-sm text-muted-foreground">Compared to US prices</div>
                </div>
                <div className="p-6 bg-background rounded-lg border border-border/50 shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-2">$15K+</div>
                  <div className="text-foreground font-semibold mb-1">Money Saved</div>
                  <div className="text-sm text-muted-foreground">Average per procedure</div>
                </div>
                <div className="p-6 bg-background rounded-lg border border-border/50 shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-2">5000+</div>
                  <div className="text-foreground font-semibold mb-1">Happy Patients</div>
                  <div className="text-sm text-muted-foreground">From around the world</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Doctor Access */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Meet Our Specialists
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Connect with our experienced doctors who specialize in your treatment area
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span>{doctors.length} Specialist Doctors Available</span>
              </div>
              <Link to="/doctors">
                <Button size="lg" variant="outline">
                  Browse All Doctors
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
              Ready to Start Your Treatment Journey?
            </h2>
            <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
              Get a personalized treatment plan and cost estimate from our medical experts
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="accent">
                Get Free Quote
              </Button>
              <Button size="lg" variant="hero" asChild>
                <Link to="/start-journey">Start Your Journey</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Treatments;