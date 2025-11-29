import { Card, CardContent } from "@/components/ui/card";
import {
  MessageCircle,
  Calendar,
  Plane,
  Heart,
  Home,
  CheckCircle,
} from "lucide-react";

const ProcessSection = () => {
  const steps = [
    {
      icon: MessageCircle,
      title: "Explore Your Options",
      description:
        "Review treatments through our platform, and speak directly with a care manager. You receive tailored recommendations based on your medical needs, goals, and preferences.",
    },
    {
      icon: Calendar,
      title: "Receive a Personalized Treatment Plan",
      description:
        "Once your medical information is reviewed, we prepare a clear plan that outlines procedures, timelines, expected results, and associated costs. This gives you full clarity before making any decision.",
    },
    {
      icon: Plane,
      title: "Prepare for Your Trip",
      description:
        "We assist with visa requirements, documentation, and travel planning. You also receive guidance on what to bring, how to prepare, and what to expect upon arrival.",
    },
    {
      icon: Heart,
      title: "Arrive with Confidence",
      description:
        "Our team arranges airport pickup, transportation, and accommodation. We ensure you feel settled and comfortable before your consultations and treatment begin.",
    },
    {
      icon: Home,
      title: "Undergo Treatment with Full Support",
      description:
        "Your chosen specialist and medical facility will guide you through the procedure and follow-up visits. Your care manager remains available to support communication and logistics.",
    },
    {
      icon: CheckCircle,
      title: "Recover Safely and Comfortably",
      description:
        "We provide personalized aftercare instructions, follow-up appointments, and check-ins. Even after you return home, our team helps you stay connected with your doctor for ongoing support.",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Your Journey to{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Better Health
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A seamless, step-by-step process designed to make your medical
            tourism experience stress-free
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={index}
                className="relative group overflow-visible hover:shadow-card-hover transition-spring border-border/50"
              >
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
