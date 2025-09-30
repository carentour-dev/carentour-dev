import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      country: "United States",
      treatment: "Cardiac Surgery",
      rating: 5,
      content: "The level of care I received was exceptional. The doctors were highly skilled, and the facilities were world-class. I saved 60% compared to US prices while receiving superior treatment.",
      image: "/placeholder.svg"
    },
    {
      name: "Marco Rodriguez",
      country: "Spain", 
      treatment: "Dental Implants",
      rating: 5,
      content: "From consultation to recovery, everything was perfectly organized. The medical team spoke excellent English, and Cairo&apos;s hospitality made the experience memorable.",
      image: "/placeholder.svg"
    },
    {
      name: "Emily Chen",
      country: "Canada",
      treatment: "LASIK Surgery", 
      rating: 5,
      content: "I was amazed by the modern technology and personalized care. The results exceeded my expectations, and the cost savings allowed me to extend my stay and explore Egypt.",
      image: "/placeholder.svg"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            What Our <span className="bg-gradient-hero bg-clip-text text-transparent">Patients Say</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real stories from patients who trusted us with their health and wellness journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="group hover:shadow-elegant transition-spring border-border/50 overflow-hidden">
              <CardContent className="p-8">
                {/* Quote Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-12 h-12 bg-accent-light rounded-full flex items-center justify-center">
                    <Quote className="h-6 w-6 text-accent" />
                  </div>
                </div>

                {/* Rating */}
                <div className="flex justify-center space-x-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-accent fill-current" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-muted-foreground text-center mb-8 leading-relaxed italic">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                {/* Patient Info */}
                <div className="text-center border-t border-border pt-6">
                  <h4 className="font-semibold text-foreground text-lg">{testimonial.name}</h4>
                  <p className="text-muted-foreground text-sm">{testimonial.country}</p>
                  <p className="text-primary text-sm font-medium">{testimonial.treatment}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;