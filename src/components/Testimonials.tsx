"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote, Loader2, ExternalLink } from "lucide-react";
import { usePatientReviews } from "@/hooks/useTestimonials";

const MAX_TESTIMONIALS = 3;

const Testimonials = () => {
  const { reviews, loading, error } = usePatientReviews(undefined, {
    highlightOnly: true,
    limit: MAX_TESTIMONIALS,
  });

  const testimonials = reviews.slice(0, MAX_TESTIMONIALS);

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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="group hover:shadow-elegant transition-spring border-border/50 overflow-hidden">
                <CardContent className="p-8">
                  {/* Quote Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-accent-light rounded-full flex items-center justify-center">
                      <Quote className="h-6 w-6 text-accent" />
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex justify-center space-x-1 mb-6">
                    {[...Array(Math.round(testimonial.rating))].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-accent fill-current" />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-muted-foreground text-center mb-8 leading-relaxed italic">
                    &ldquo;{testimonial.review_text}&rdquo;
                  </p>

                  {/* Patient Info */}
                  <div className="text-center border-t border-border pt-6">
                    <h4 className="font-semibold text-foreground text-lg">{testimonial.patient_name}</h4>
                    <p className="text-muted-foreground text-sm">
                      {testimonial.patient_country ?? "International Patient"}
                    </p>
                    {testimonial.treatment_slug && (
                      <p className="text-primary text-sm font-medium capitalize">{testimonial.treatment_slug.replace(/-/g, ' ')}</p>
                    )}
                    {testimonial.patient_id && (
                      <Link
                        href={`/patients/${testimonial.patient_id}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                      >
                        View full journey
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-sm text-destructive">Failed to load testimonials.</div>
        ) : (
          <div className="text-center text-muted-foreground">Testimonials will appear here soon.</div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
