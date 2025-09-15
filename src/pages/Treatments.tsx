import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Stethoscope, Eye, Smile, Scissors, Activity } from "lucide-react";

const Treatments = () => {
  const treatmentCategories = [
    {
      icon: Heart,
      title: "Cardiac Surgery",
      description: "Advanced heart procedures with world-class specialists",
      procedures: ["Bypass Surgery", "Valve Replacement", "Angioplasty"],
      startingPrice: "$8,500"
    },
    {
      icon: Eye,
      title: "Eye Surgery",
      description: "LASIK and comprehensive eye treatments",
      procedures: ["LASIK", "Cataract Surgery", "Retinal Surgery"],
      startingPrice: "$1,200"
    },
    {
      icon: Smile,
      title: "Dental Care",
      description: "Complete dental treatments and cosmetic procedures",
      procedures: ["Dental Implants", "Veneers", "Root Canal"],
      startingPrice: "$300"
    },
    {
      icon: Scissors,
      title: "Cosmetic Surgery",
      description: "Aesthetic procedures with natural-looking results",
      procedures: ["Rhinoplasty", "Liposuction", "Breast Surgery"],
      startingPrice: "$2,800"
    },
    {
      icon: Stethoscope,
      title: "General Surgery",
      description: "Wide range of surgical procedures",
      procedures: ["Gallbladder", "Hernia Repair", "Appendectomy"],
      startingPrice: "$1,500"
    },
    {
      icon: Activity,
      title: "Orthopedic Surgery",
      description: "Joint replacement and bone treatments",
      procedures: ["Hip Replacement", "Knee Surgery", "Spine Surgery"],
      startingPrice: "$4,200"
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
                          <span className="text-sm text-muted-foreground">Starting from</span>
                          <span className="text-lg font-bold text-primary">{category.startingPrice}</span>
                        </div>
                        <Button className="w-full" variant="outline">
                          Learn More
                        </Button>
                      </div>
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
              Ready to Start Your Treatment Journey?
            </h2>
            <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
              Get a personalized treatment plan and cost estimate from our medical experts
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="accent">
                Get Free Quote
              </Button>
              <Button size="lg" variant="hero">
                Schedule Consultation
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