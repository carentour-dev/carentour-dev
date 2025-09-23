import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Eye, Smile, Scissors, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import consultationImage from "@/assets/consultation.webp";
import surgeryImage from "@/assets/surgery-suite.webp";

const FeaturedTreatments = () => {
  const navigate = useNavigate();
  const treatments = [
    {
      id: "cardiac-surgery",
      icon: Heart,
      title: "Cardiology",
      description: "Advanced heart procedures with world-class cardiac surgeons",
      price: "From $8,500",
      duration: "5-7 days",
      image: surgeryImage,
      popular: true
    },
    {
      id: "eye-surgery",
      icon: Eye,
      title: "Ophthalmology", 
      description: "LASIK, cataract surgery, and comprehensive eye care",
      price: "From $1,200",
      duration: "2-3 days",
      image: consultationImage,
      popular: false
    },
    {
      id: "dental-care",
      icon: Smile,
      title: "Dental Care",
      description: "Complete dental makeovers, implants, and cosmetic dentistry",
      price: "From $800",
      duration: "3-5 days",
      image: surgeryImage,
      popular: true
    },
    {
      id: "cosmetic-surgery",
      icon: Scissors,
      title: "Cosmetic Surgery",
      description: "Aesthetic procedures with renowned plastic surgeons",
      price: "From $3,200",
      duration: "7-10 days",
      image: consultationImage,
      popular: false
    }
  ];

  return (
    <section className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Featured <span className="bg-gradient-hero bg-clip-text text-transparent">Treatments</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover our most popular medical procedures, performed by internationally certified specialists
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {treatments.map((treatment, index) => {
            const Icon = treatment.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-elegant transition-spring cursor-pointer border-border/50 overflow-hidden"
                onClick={() => navigate(`/treatments/${treatment.id}`)}
              >
                {treatment.popular && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge variant="secondary" className="bg-accent text-accent-foreground text-center">
                      Popular
                    </Badge>
                  </div>
                )}
                
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={treatment.image} 
                    alt={treatment.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-spring"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <Icon className="h-8 w-8 text-accent" />
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="text-xl group-hover:text-primary transition-smooth">
                    {treatment.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {treatment.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-2xl font-bold text-primary">{treatment.price}</p>
                      <p className="text-sm text-muted-foreground">{treatment.duration}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/contact");
                      }}
                    >
                      Start Your Journey
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-smooth"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/treatments/${treatment.id}`);
                      }}
                    >
                      Learn More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button 
            size="lg" 
            variant="default"
            onClick={() => navigate("/treatments")}
          >
            View All Treatments
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedTreatments;