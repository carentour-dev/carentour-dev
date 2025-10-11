import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Calendar, Plane, Heart, Home, CheckCircle } from "lucide-react";

const ProcessSection = () => {
  const steps = [
    {
      icon: MessageCircle,
      title: "Free Consultation",
      description: "Connect with our medical coordinators for personalized treatment planning"
    },
    {
      icon: Calendar,
      title: "Schedule Treatment",
      description: "Book your procedure with our partner hospitals and specialist doctors"
    },
    {
      icon: Plane,
      title: "Travel Arrangements",
      description: "We handle visa, flights, accommodation, and airport transfers"
    },
    {
      icon: Heart,
      title: "Medical Treatment",
      description: "Receive world-class care from state-of-the-art medical service providers"
    },
    {
      icon: Home,
      title: "Recovery Support",
      description: "Comfortable recovery with 24/7 medical support and concierge services"
    },
    {
      icon: CheckCircle,
      title: "Follow-up Care",
      description: "Continued monitoring and support even after you return home"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Your Journey to <span className="bg-gradient-hero bg-clip-text text-transparent">Better Health</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A seamless, step-by-step process designed to make your medical tourism experience stress-free
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="relative group hover:shadow-card-hover transition-spring border-border/50">
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-hero rounded-full flex items-center justify-center text-background font-bold text-sm z-10">
                  {index + 1}
                </div>

                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-light rounded-full mb-6 group-hover:scale-110 transition-spring">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default ProcessSection;
